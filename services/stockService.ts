import { StockMovement, Product, PurchaseOrder } from '../types';
import { supabase } from './supabase';
import { productService } from './productService';

const STORAGE_KEY = 'stock_movements';

export const stockService = {
    // Add a manual movement
    async addMovement(movement: Omit<StockMovement, 'id' | 'date'>, skipStockUpdate: boolean = false): Promise<void> {
        // 1. Create the movement record in Supabase
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        const { error: moveError } = await supabase
            .from('stock_movements')
            .insert({
                product_id: movement.productId,
                variation_id: movement.variationId,
                aparelho_id: movement.aparelhoId,
                product_name: movement.productName,
                type: movement.type,
                quantity: movement.quantity,
                reason: movement.reason,
                user_id: userId,
                user_name: movement.userName || 'Admin',
                cost_price: movement.costPrice,
                sale_price: movement.salePrice
            });

        if (moveError) {
            console.error("Failed to record movement in Supabase:", moveError);
            throw moveError;
        }

        if (skipStockUpdate) return;

        // 2. Update Real Stock in Supabase
        try {
            if (movement.productId) {
                const { data: prod, error: fetchErr } = await supabase
                    .from('products')
                    .select('stock_quantity, variations')
                    .eq('id', movement.productId)
                    .single();

                if (!fetchErr && prod) {
                    if (movement.variationId) {
                        // Update variation stock
                        const variations = prod.variations || [];
                        const index = variations.findIndex((v: any) => v.id === movement.variationId);
                        if (index !== -1) {
                            if (movement.type === 'entrada') {
                                variations[index].stock += movement.quantity;
                            } else {
                                variations[index].stock = Math.max(0, variations[index].stock - movement.quantity);
                            }
                            // Total stock is sum of variations
                            const totalStock = variations.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
                            await supabase.from('products').update({ variations, stock_quantity: totalStock }).eq('id', movement.productId);
                        }
                    } else {
                        // Update simple product stock
                        let newStock = prod.stock_quantity;
                        if (movement.type === 'entrada') {
                            newStock += movement.quantity;
                        } else {
                            newStock = Math.max(0, newStock - movement.quantity);
                        }

                        const updateData: any = { stock_quantity: newStock };
                        if (movement.type === 'entrada') {
                            if (movement.costPrice !== undefined) updateData.cost_price = movement.costPrice;
                            if (movement.salePrice !== undefined) updateData.sale_price = movement.salePrice;
                        }

                        await supabase.from('products').update(updateData).eq('id', movement.productId);
                    }
                }
            } else if (movement.aparelhoId) {
                // Update device stock/status
                const { data: dev } = await supabase.from('aparelhos').select('estoque').eq('id', movement.aparelhoId).single();
                if (dev) {
                    let newStock = dev.estoque;
                    let newStatus = 'Disponível';
                    if (movement.type === 'entrada') {
                        newStock += movement.quantity;
                    } else {
                        newStock = Math.max(0, newStock - movement.quantity);
                        if (newStock === 0) newStatus = 'Vendido';
                    }
                    await supabase.from('aparelhos').update({ estoque: newStock, status: newStatus }).eq('id', movement.aparelhoId);
                }
            }

        } catch (error) {
            console.error("Failed to update stock in Supabase after movement:", error);
        }
    },

    // Get all movements (Sales + Manual)
    async getFullHistory(): Promise<StockMovement[]> {
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching full history:", error);
            return [];
        }

        return data.map(m => ({
            id: m.id,
            productId: m.product_id,
            variationId: m.variation_id,
            aparelhoId: m.aparelho_id,
            productName: m.product_name,
            type: m.type as 'entrada' | 'saida',
            quantity: m.quantity,
            reason: m.reason,
            date: m.created_at,
            userId: m.user_id,
            userName: m.user_name,
            costPrice: m.cost_price,
            salePrice: m.sale_price
        }));
    },

    async getManualMovements(): Promise<StockMovement[]> {
        // Now everything is in the same history, we just filter by reason if needed
        // Or just return the same as getFullHistory for compatibility
        return this.getFullHistory();
    },

    // Add Advanced Purchase Order
    async registerPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status'>): Promise<void> {
        const { error } = await supabase.from('purchase_orders').insert({
            date: order.date,
            supplier: order.supplier,
            usd_quote: order.usdQuote,
            shipping_usd: order.shippingUsd,
            package_count: order.packageCount,
            packages: order.packages || [],
            factory_fee_usd: order.factoryFeeUsd,
            products: order.products || [],
            total_products_usd: order.totalProductsUsd,
            total_order_usd: order.totalOrderUsd,
            status: 'Concluído'
        });

        if (error) throw error;
    },

    async getPurchaseOrders(): Promise<PurchaseOrder[]> {
        // Auto-migration for existing local storage orders
        try {
            const localOrders = localStorage.getItem('purchase_orders');
            if (localOrders) {
                const parsed: PurchaseOrder[] = JSON.parse(localOrders);
                if (parsed.length > 0) {
                    console.log(`Migrating ${parsed.length} local orders to Supabase...`);
                    for (const order of parsed) {
                        await supabase.from('purchase_orders').insert({
                            date: order.date,
                            supplier: order.supplier,
                            usd_quote: order.usdQuote,
                            shipping_usd: order.shippingUsd,
                            package_count: order.packageCount,
                            packages: order.packages || [],
                            factory_fee_usd: order.factoryFeeUsd,
                            products: order.products || [],
                            total_products_usd: order.totalProductsUsd,
                            total_order_usd: order.totalOrderUsd,
                            status: order.status || 'Concluído',
                            created_at: order.createdAt
                        });
                    }
                    localStorage.removeItem('purchase_orders');
                }
            }
        } catch (e) {
            console.error('Error during local orders migration:', e);
        }

        const { data, error } = await supabase
            .from('purchase_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch purchase orders', error);
            return [];
        }

        return (data || []).map(o => ({
            id: o.id,
            date: o.date,
            supplier: o.supplier,
            usdQuote: Number(o.usd_quote),
            shippingUsd: Number(o.shipping_usd),
            packageCount: Number(o.package_count),
            packages: o.packages,
            factoryFeeUsd: Number(o.factory_fee_usd),
            products: o.products,
            total_products_usd: Number(o.total_products_usd),
            totalPriceUsd: Number(o.total_order_usd), // Temporary fallback or keep it consistent
            totalOrderUsd: Number(o.total_order_usd),
            status: o.status,
            createdAt: o.created_at
        }));
    },

    async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            date: data.date,
            supplier: data.supplier,
            usdQuote: Number(data.usd_quote),
            shippingUsd: Number(data.shipping_usd),
            packageCount: Number(data.package_count),
            packages: data.packages,
            factoryFeeUsd: Number(data.factory_fee_usd),
            products: data.products,
            totalProductsUsd: Number(data.total_products_usd),
            totalOrderUsd: Number(data.total_order_usd),
            status: data.status,
            createdAt: data.created_at
        };
    },

    async updatePurchaseOrder(id: string, order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status'>): Promise<void> {
        const { error } = await supabase
            .from('purchase_orders')
            .update({
                date: order.date,
                supplier: order.supplier,
                usd_quote: order.usdQuote,
                shipping_usd: order.shippingUsd,
                package_count: order.packageCount,
                packages: order.packages || [],
                factory_fee_usd: order.factoryFeeUsd,
                products: order.products || [],
                total_products_usd: order.totalProductsUsd,
                total_order_usd: order.totalOrderUsd
            })
            .eq('id', id);

        if (error) throw error;
    }
};
