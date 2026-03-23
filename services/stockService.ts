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
        const newOrder: PurchaseOrder = {
            ...order,
            id: `po_${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'Concluído'
        };

        // 1. Save the full order to local storage (MVP DB for orders)
        const ORDERS_KEY = 'purchase_orders';
        const storedOrders = localStorage.getItem(ORDERS_KEY);
        const orders: PurchaseOrder[] = storedOrders ? JSON.parse(storedOrders) : [];
        orders.push(newOrder);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

        // 2. Process each product in the order - Skipping live stock/price updates as requested
        // Advanced Purchase Orders are now purely for historical records and receipt generation.
        // No stock_movements are created and no product stock/price is updated automatically.
    },

    async getPurchaseOrders(): Promise<PurchaseOrder[]> {
        const ORDERS_KEY = 'purchase_orders';
        const storedOrders = localStorage.getItem(ORDERS_KEY);
        try {
            const orders = storedOrders ? JSON.parse(storedOrders) : [];
            // Sort by createdAt descending
            return orders.sort((a: PurchaseOrder, b: PurchaseOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (e) {
            console.error('Failed to parse purchase orders', e);
            return [];
        }
    }
};
