import { supabase } from './supabase';
import { Vendedor } from '../types';

export const vendedorService = {
    async getAll(): Promise<Vendedor[]> {
        const { data, error } = await supabase
            .from('vendedores')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Error fetching vendedors:', error);
            throw error;
        }

        return data;
    },

    async create(vendedor: Omit<Vendedor, 'id'>): Promise<Vendedor> {
        const { data, error } = await supabase
            .from('vendedores')
            .insert(vendedor)
            .select()
            .single();

        if (error) {
            console.error('Error creating vendedor:', error);
            throw error;
        }

        return data;
    },

    async update(vendedor: Vendedor): Promise<Vendedor> {
        const { data, error } = await supabase
            .from('vendedores')
            .update(vendedor)
            .eq('id', vendedor.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating vendedor:', error);
            throw error;
        }

        return data;
    },

    async delete(id: string): Promise<'deleted' | 'deactivated'> {
        const { error } = await supabase
            .from('vendedores')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
                const { error: updateError } = await supabase
                    .from('vendedores')
                    .update({ ativo: false })
                    .eq('id', id);
                if (updateError) {
                    console.error('Error deactivating vendedor:', updateError);
                    throw updateError;
                }
                return 'deactivated';
            }
            console.error('Error deleting vendedor:', error);
            throw error;
        }
        return 'deleted';
    },

    async uploadPhoto(file: File, path: string): Promise<string | null> {
        const { error } = await supabase.storage
            .from('avatars')
            .upload(path, file);

        if (error) {
            console.error('Error uploading photo:', error);
            return null;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        return data.publicUrl;
    }
};
