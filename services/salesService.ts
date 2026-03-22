import { supabase } from './supabase';
import { Venda, VendaItem, Product, Aparelho, Vendedor } from '../types';

export const salesService = {
    // Get all sales
    async getAll(startDate?: string, endDate?: string): Promise<Venda[]> {
        let query = supabase
            .from('vendas')
            .select('*, items:vendas_itens(*)')
            .order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    // Create a new sale
    async create(venda: Venda, itens: VendaItem[]): Promise<Venda> {
        // 1. Generate Sale Number (Simple random for now, or fetch count)
        // Needs to be unique. Using Timestamp + Random for simple client-side generation
        // Ideally use a database trigger or sequence.
        const numero_venda = `#${new Date().getFullYear()}${Math.floor(Math.random() * 90000) + 10000}`;

        // 2. Insert Sale Header
        const { data: saleData, error: saleError } = await supabase
            .from('vendas')
            .insert({
                numero_venda,
                vendedor_id: venda.vendedor_id,
                cliente_nome: venda.cliente_nome,
                cliente_telefone: venda.cliente_telefone,
                cliente_cpf: venda.cliente_cpf,
                subtotal: venda.subtotal,
                desconto: venda.desconto,
                total: venda.total,
                forma_pagamento: venda.forma_pagamento,
                payment_details: venda.payment_details,
                sale_type: venda.sale_type,
                delivery_fee: venda.delivery_fee,
                status: 'Concluída',
                created_at: venda.created_at || new Date().toISOString()
            })
            .select()
            .single();

        if (saleError) throw saleError;
        if (!saleData) throw new Error('Falha ao obter dados da venda após inserção. Verifique permissões RLS.');
        const saleId = saleData.id;

        // 3. Insert Items
        const itemsToInsert = itens.map(item => ({
            venda_id: saleId,
            tipo_item: item.tipo_item,
            item_id: item.item_id,
            item_nome: item.item_nome,
            variacao_id: item.variacao_id,
            variacao_nome: item.variacao_nome,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            created_at: saleData.created_at // Use the same timestamp for items
        }));

        const { error: itemsError } = await supabase
            .from('vendas_itens')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // 4. Deduct Stock (Client-side loop - Not Atomic but functional for MVP)
        // Ideally use RPC for atomicity
        // await this.deductStock(itens); // Replaced by the more specific logic below

        // Decrease stock for products and variations, and update device status
        for (const item of itens) {
            if (item.tipo_item === 'produto') {
                if (item.variacao_id) {
                    const { error: rpcError } = await supabase.rpc('decrement_variation_stock', {
                        v_id: item.variacao_id,
                        qty: item.quantidade
                    });
                    if (rpcError) console.error('Erro ao baixar estoque da variação:', rpcError);
                } else {
                    const { error: rpcError } = await supabase.rpc('decrement_product_stock', {
                        p_id: item.item_id,
                        qty: item.quantidade
                    });
                    if (rpcError) console.error('Erro ao baixar estoque do produto:', rpcError);
                }
            } else if (item.tipo_item === 'aparelho') {
                // Mark device as Sold and ensure stock is 0
                const { error: devError } = await supabase
                    .from('aparelhos')
                    .update({
                        status: 'Vendido',
                        estoque: 0,
                        data_venda: saleData.created_at.split('T')[0]
                    })
                    .eq('id', item.item_id);

                if (devError) {
                    console.error('Erro ao atualizar status do aparelho:', devError);
                    throw new Error(`Erro ao atualizar aparelho: ${devError.message}`);
                }
            }
        }

        return saleData;
    },

    async deductStock(itens: VendaItem[]) {
        for (const item of itens) {
            if (item.tipo_item === 'produto') {
                if (item.variacao_id) {
                    // Deduct from Variation
                    await this.deductVariationStock(item.item_id, item.variacao_id, item.quantidade);
                } else {
                    // Deduct from Product
                    await this.deductProductStock(item.item_id, item.quantidade);
                }
            } else if (item.tipo_item === 'aparelho') {
                // Deduct from Device
                await this.deductDeviceStock(item.item_id, item.quantidade);
            }
        }
    },

    async deductProductStock(productId: string, qty: number) {
        // Fetch current first to valid or just decrement
        // Supabase supports `stock - qty` syntax if we use RPC, but `update` takes direct value.
        // We need to fetch current.
        const { data: prod } = await supabase.from('products').select('stockQuantity').eq('id', productId).single();
        if (prod) {
            const newStock = Math.max(0, prod.stockQuantity - qty);
            await supabase.from('products').update({ stockQuantity: newStock }).eq('id', productId);
        }
    },

    async deductVariationStock(productId: string, variationId: string, qty: number) {
        // Need to fetch product, find variation, update JSON, save back.
        // OR create a `variations` table. Current schema uses JSONB for variations in `products`.
        // This is tricky without RPC.

        const { data: prod } = await supabase.from('products').select('variations').eq('id', productId).single();
        if (prod && prod.variations) {
            // Only typescript sees this as any[] or specific type depending on generation
            // We'll treat as array
            const variations: any[] = prod.variations;
            const index = variations.findIndex((v: any) => v.id === variationId);
            if (index >= 0) {
                variations[index].stock = Math.max(0, variations[index].stock - qty);
                await supabase.from('products').update({ variations }).eq('id', productId);
            }
        }
    },

    async deductDeviceStock(deviceId: string, qty: number) {
        const { data: dev } = await supabase.from('aparelhos').select('estoque').eq('id', deviceId).single();
        if (dev) {
            const newStock = Math.max(0, dev.estoque - qty);
            await supabase.from('aparelhos').update({ estoque: newStock }).eq('id', deviceId);
        }
    },

    async getAparelhos(): Promise<Aparelho[]> {
        const { data, error } = await supabase.from('aparelhos').select('*').gt('estoque', 0);
        if (error) throw error;
        return data;
    },

    async getSaleByItemId(itemId: string): Promise<{ venda: Venda; vendedor: Vendedor } | null> {
        // Find the venda_item first
        const { data: itemData, error: itemError } = await supabase
            .from('vendas_itens')
            .select('venda_id')
            .eq('item_id', itemId)
            .single();

        if (itemError || !itemData) return null;

        // Fetch the Venda and join with Vendedor (manually or via select)
        const { data: vendaData, error: vendaError } = await supabase
            .from('vendas')
            .select('*')
            .eq('id', itemData.venda_id)
            .single();

        if (vendaError || !vendaData) return null;

        const { data: vendedorData, error: vendedorError } = await supabase
            .from('vendedores')
            .select('*')
            .eq('id', vendaData.vendedor_id)
            .single();

        return {
            venda: vendaData as Venda,
            vendedor: vendedorData as Vendedor
        };
    },

    async deleteSale(id: string, options: { returnStock: boolean }): Promise<void> {
        if (options.returnStock) {
            // 1. Get items for this sale
            const { data: items, error: itemsError } = await supabase
                .from('vendas_itens')
                .select('*')
                .eq('venda_id', id);

            if (itemsError) throw itemsError;

            // 2. Return each item to stock
            for (const item of (items || [])) {
                if (item.tipo_item === 'produto') {
                    if (item.variacao_id) {
                        const { error: rpcError } = await supabase.rpc('increment_variation_stock', {
                            v_id: item.variacao_id,
                            qty: item.quantidade
                        });
                        if (rpcError) console.error('Erro ao retornar estoque da variação:', rpcError);
                    } else {
                        const { error: rpcError } = await supabase.rpc('increment_product_stock', {
                            p_id: item.item_id,
                            qty: item.quantidade
                        });
                        if (rpcError) console.error('Erro ao retornar estoque do produto:', rpcError);
                    }
                } else if (item.tipo_item === 'aparelho') {
                    const { error: devError } = await supabase
                        .from('aparelhos')
                        .update({
                            status: 'Disponível',
                            estoque: 1,
                            data_venda: null
                        })
                        .eq('id', item.item_id);

                    if (devError) console.error('Erro ao retornar aparelho ao estoque:', devError);
                }
            }
        }

        // 3. Delete items first to avoid foreign key violation
        const { error: itemsDeleteError } = await supabase
            .from('vendas_itens')
            .delete()
            .eq('venda_id', id);

        if (itemsDeleteError) throw itemsDeleteError;

        // 4. Delete or Update Status
        // The user said "Excluir", but in ERPs usually we update status to 'Cancelada' for history.
        // If we strictly DELETE, we do:
        const { error: deleteError } = await supabase
            .from('vendas')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;
    },

    async refundSale(id: string, reason: string, options: { returnStock: boolean }): Promise<void> {
        // 1. Atualizar o status da venda e motivo
        const { error: updateError } = await supabase
            .from('vendas')
            .update({ 
                status: 'Reembolsada',
                refund_reason: reason
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // 2. Retornar itens ao estoque se solicitado
        if (options.returnStock) {
            const { data: items, error: itemsError } = await supabase
                .from('vendas_itens')
                .select('*')
                .eq('venda_id', id);

            if (itemsError) throw itemsError;

            for (const item of (items || [])) {
                if (item.tipo_item === 'produto') {
                    if (item.variacao_id) {
                        const { error: rpcError } = await supabase.rpc('increment_variation_stock', {
                            v_id: item.variacao_id,
                            qty: item.quantidade
                        });
                        if (rpcError) console.error('Erro ao retornar estoque da variação:', rpcError);
                    } else {
                        const { error: rpcError } = await supabase.rpc('increment_product_stock', {
                            p_id: item.item_id,
                            qty: item.quantidade
                        });
                        if (rpcError) console.error('Erro ao retornar estoque do produto:', rpcError);
                    }
                } else if (item.tipo_item === 'aparelho') {
                    const { error: devError } = await supabase
                        .from('aparelhos')
                        .update({
                            status: 'Disponível',
                            estoque: 1,
                            data_venda: null
                        })
                        .eq('id', item.item_id);

                    if (devError) console.error('Erro ao retornar aparelho ao estoque:', devError);
                }
            }
        }
    }
};


