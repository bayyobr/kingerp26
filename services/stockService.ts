import { StockMovement, Product, PurchaseOrder } from '../types';
import { supabase } from './supabase';
import { salesService } from './salesService';
import { productService } from './productService';

const STORAGE_KEY = 'stock_movements';

export const stockService = {
    // Add a manual movement
    async addMovement(movement: Omit<StockMovement, 'id' | 'date'>): Promise<void> {
        // 1. Create the movement record
        const newMovement: StockMovement = {
            ...movement,
            id: `mov_${Date.now()}`,
            date: new Date().toISOString(),
            userId: 'admin', // Mock user for now
            userName: 'Admin'
        };

        // 2. Save to Local Storage (Simulating backend table)
        const stored = localStorage.getItem(STORAGE_KEY);
        const movements: StockMovement[] = stored ? JSON.parse(stored) : [];
        movements.push(newMovement);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));

        // 3. Update Real Stock in Supabase
        // We need to fetch current stock to ensure we are applying delta correctly, 
        // OR rely on the UI passing the correct 'quantity' to add/subtract.
        // For 'entrada', we add. For 'saida', we subtract.

        try {
            // First fetch the product to get current stock (optional but safer)
            // But we can just use RPC if we want atomicity, or simple update.
            // Using productService for consistency.

            // We need to know if it's a simple product or variation.
            // For MVP simplicity in this Manual Form, we'll assume matching by ID.
            // If the UI passes a productId that is actually a variationId, we need to handle that.
            // For now, let's assume the UI handles Product IDs (Simple) only or we implement logic.
            // Let's assume we are updating the main product stockQuantity for now.
            // If we want to support Variations, the UI needs to let us select the variation.

            const products = await productService.getAll();
            const product = products.find(p => p.id === movement.productId);

            if (product) {
                let newStock = product.stockQuantity;
                if (movement.type === 'entrada') {
                    newStock += movement.quantity;
                } else {
                    newStock = Math.max(0, newStock - movement.quantity);
                }

                // Update via Supabase direct to save fields
                const updateData: any = { stock_quantity: newStock };
                
                if (movement.type === 'entrada') {
                    if (movement.costPrice !== undefined) updateData.cost_price = movement.costPrice;
                    if (movement.salePrice !== undefined) updateData.sale_price = movement.salePrice;
                }

                const { error } = await supabase
                    .from('products')
                    .update(updateData)
                    .eq('id', movement.productId);

                if (error) throw error;
            } else {
                // Check if it's a variation? 
                // Complexity: productService.getAll() returns mapped products.
                // We'd have to search inside them.
                // Ideally, the Movement should store productId AND variationId if applicable.
                // For MVP V1: Simple Products Only.
            }

        } catch (error) {
            console.error("Failed to update stock in Supabase:", error);
            // We still keep the movement log locally? Or revert?
            // For now, proceed.
        }
    },

    // Get all movements (Sales + Manual)
    async getFullHistory(): Promise<StockMovement[]> {
        // 1. Get Manual Movements
        const stored = localStorage.getItem(STORAGE_KEY);
        const manualMovements: StockMovement[] = stored ? JSON.parse(stored) : [];

        // 2. Get Sales and convert to Movements
        let salesData: StockMovement[] = [];
        try {
            const sales = await salesService.getAll();

            sales.forEach(sale => {
                if (sale.itens) {
                    sale.itens.forEach(item => {
                        // Only count products as stock movements (services/devices might count too but logic differs)
                        // Devices: 'saida'. Products: 'saida'.
                        if (item.tipo_item === 'produto' || item.tipo_item === 'aparelho') {
                            salesData.push({
                                id: `sale_item_${item.id || Math.random()}`, // Unique ID
                                productId: item.item_id, // or variation_id?
                                productName: item.item_nome + (item.variacao_nome ? ` (${item.variacao_nome})` : ''),
                                type: 'saida',
                                quantity: item.quantidade,
                                reason: `Venda ${sale.numero_venda || ''}`,
                                date: sale.created_at || new Date().toISOString(),
                                userId: sale.vendedor_id,
                                userName: 'Sistema' // Or fetch winner
                            });
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Error fetching sales history:", error);
        }

        // 3. Merge and Sort
        const allMovements = [...manualMovements, ...salesData];
        return allMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    async getManualMovements(): Promise<StockMovement[]> {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
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

        // 2. Process each product in the order
        for (const product of order.products) {
            // Log as movement
            const movement: StockMovement = {
                id: `mov_po_${Date.now()}_${product.id}`,
                productId: product.productId || `new_${Date.now()}`,
                productName: product.productName,
                type: 'entrada',
                quantity: product.quantity,
                reason: `Entrada Avançada: ${order.supplier}`,
                date: order.date,
                userId: 'admin',
                userName: 'Admin',
                costPrice: product.finalUnitCostBrl // We track the final calculated BRL cost
            };

            const storedMovements = localStorage.getItem(STORAGE_KEY);
            const movements: StockMovement[] = storedMovements ? JSON.parse(storedMovements) : [];
            movements.push(movement);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));

            // Only update DB if it's an existing product (has valid productId from DB)
            if (product.productId) {
                try {
                    // Fetch current to calculate stock delta safely
                    const { data: currentProduct, error: fetchErr } = await supabase
                        .from('products')
                        .select('stock_quantity')
                        .eq('id', product.productId)
                        .single();

                    if (!fetchErr && currentProduct) {
                        const newStock = currentProduct.stock_quantity + product.quantity;
                        
                        await supabase
                            .from('products')
                            .update({ 
                                stock_quantity: newStock,
                                cost_price: product.finalUnitCostBrl
                            })
                            .eq('id', product.productId);
                    }
                } catch (err) {
                    console.error('Error updating existing product stock/price:', err);
                }
            }
        }
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
