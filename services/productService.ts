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

        return mapToProduct(data);
    },

    async update(product: Product): Promise<Product> {
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

        return mapToProduct(data);
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

        variations[index].stock = newStock;

        // Recalculate total stock
        const totalStock = variations.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);

        const { data: updated, error: updateError } = await supabase
            .from('products')
            .update({
                variations,
                stock_quantity: totalStock
            })
            .eq('id', productId)
            .select()
            .single();

        if (updateError) throw updateError;
        return mapToProduct(updated);
    },

    async updateProductStock(productId: string, newStock: number): Promise<Product> {
        const { data: updated, error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', productId)
            .select()
            .single();

        if (updateError) throw updateError;
        return mapToProduct(updated);
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
    };
}
