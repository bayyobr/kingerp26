import { supabase } from './supabase';
import { Product } from '../types';

export const productService = {
    async getAll(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }

        return data.map(mapToProduct);
    },

    async create(product: Omit<Product, 'id'>): Promise<Product> {
        const dbProduct = mapToDbProduct(product);
        const { data, error } = await supabase
            .from('products')
            .insert(dbProduct)
            .select()
            .single();

        if (error) {
            console.error('Error creating product:', error);
            throw error;
        }

        const newProduct = mapToProduct(data);
        
        // Log initial stock if > 0
        if (newProduct.variations && newProduct.variations.length > 0) {
            for (const v of newProduct.variations) {
                if (v.stock > 0) {
                    await this.logInternalMovement(newProduct, v.stock, v, 'Estoque Inicial');
                }
            }
        } else if (newProduct.stockQuantity > 0) {
            await this.logInternalMovement(newProduct, newProduct.stockQuantity, null, 'Estoque Inicial');
        }

        return newProduct;
    },

    async update(product: Product): Promise<Product> {
        // 1. Fetch current version to detect changes
        const { data: oldData } = await supabase.from('products').select('*').eq('id', product.id).single();
        const oldProduct = oldData ? mapToProduct(oldData) : null;

        // 2. Perform update
        const dbProduct = mapToDbProduct(product);
        const { data, error } = await supabase
            .from('products')
            .update(dbProduct)
            .eq('id', product.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            throw error;
        }

        const updatedProduct = mapToProduct(data);

        // 3. Detect and log stock changes
        if (oldProduct) {
            if (product.type !== 'variation') {
                const diff = updatedProduct.stockQuantity - oldProduct.stockQuantity;
                if (diff !== 0) {
                    await this.logInternalMovement(updatedProduct, diff, null, 'Ajuste Manual (Edição)');
                }
            } else {
                const oldVars = oldProduct.variations || [];
                const newVars = updatedProduct.variations || [];

                // Track existing and new variations
                for (const newVar of newVars) {
                    const oldVar = oldVars.find(v => v.id === newVar.id || v.name.toLowerCase() === newVar.name.toLowerCase());
                    const oldStock = oldVar ? oldVar.stock : 0;
                    const diff = newVar.stock - oldStock;
                    if (diff !== 0) {
                        await this.logInternalMovement(updatedProduct, diff, newVar, 'Ajuste Manual (Variação)');
                    }
                }

                // Track removed variations
                for (const oldVar of oldVars) {
                    const exists = newVars.find(v => v.id === oldVar.id || v.name.toLowerCase() === oldVar.name.toLowerCase());
                    if (!exists && oldVar.stock > 0) {
                        // It was deleted, so we lost that stock
                        await this.logInternalMovement(updatedProduct, -oldVar.stock, oldVar, 'Variação Excluída');
                    }
                }
            }
        }

        return updatedProduct;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    async updateVariationStock(productId: string, variationId: string, newStock: number): Promise<Product> {
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;

        const variations = product.variations || [];
        const index = variations.findIndex((v: any) => v.id === variationId);
        if (index === -1) throw new Error('Variation not found');

        // Store old stock BEFORE mutating the array
        const oldStock = variations[index].stock || 0;

        variations[index].stock = newStock;

        // Recalculate total stock
        const totalStock = variations.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);

        const { data: dbData, error: updateError } = await supabase
            .from('products')
            .update({
                variations,
                stock_quantity: totalStock
            })
            .eq('id', productId)
            .select()
            .single();

        if (updateError) throw updateError;
        const updated = mapToProduct(dbData);

        // LOG MOVEMENT
        const diff = newStock - oldStock;
        if (diff !== 0) {
            const vObj = updated.variations?.find(v => v.id === variationId);
            await this.logInternalMovement(updated, diff, vObj || null, 'Ajuste Rápido');
        }

        return updated;
    },

    async updateProductStock(productId: string, newStock: number): Promise<Product> {
        // Fetch old for logging
        const { data: oldData } = await supabase.from('products').select('stock_quantity').eq('id', productId).single();
        const oldStock = oldData?.stock_quantity || 0;

        const { data, error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', productId)
            .select()
            .single();

        if (updateError) throw updateError;
        const updated = mapToProduct(data);

        // LOG MOVEMENT
        const diff = newStock - oldStock;
        if (diff !== 0) {
            await this.logInternalMovement(updated, diff, null, 'Ajuste Rápido');
        }

        return updated;
    },

    // Helper for internal logging to avoid circular dependency
    async logInternalMovement(product: Product, diff: number, variation: any | null, reason: string): Promise<void> {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('stock_movements').insert({
            product_id: product.id,
            variation_id: variation?.id,
            product_name: product.name + (variation ? ` (${variation.name})` : ''),
            type: diff > 0 ? 'entrada' : 'saida',
            quantity: Math.abs(diff),
            reason: reason,
            user_id: userData?.user?.id,
            user_name: 'Sistema',
            cost_price: product.costPrice,
            sale_price: variation?.price || product.salePrice
        });
    }
};

function mapToProduct(data: any): Product {
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        sku: data.sku,
        type: data.type,
        category: data.category,
        costPrice: data.cost_price,
        salePrice: data.sale_price,
        stockQuantity: data.stock_quantity,
        imageUrl: data.image_url,
        minStock: data.min_stock,
        variations: data.variations || [],
        shopee_fee_brl: data.shopee_fee_brl,
    };
}

function mapToDbProduct(product: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = product;

    return {
        name: product.name,
        description: product.description,
        sku: product.sku,
        type: product.type,
        category: product.category,
        cost_price: product.costPrice,
        sale_price: product.salePrice,
        stock_quantity: product.stockQuantity,
        image_url: product.imageUrl,
        min_stock: product.minStock,
        variations: product.variations || [],
        shopee_fee_brl: product.shopee_fee_brl,
    };
}
