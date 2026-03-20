import { supabase } from './supabase';

export interface Service {
    id: string;
    name: string;
    description?: string;
    price: number;
}

export const serviceService = {
    async getAll() {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('name');

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price)
        })) as Service[];
    },

    async create(service: Omit<Service, 'id'>) {
        const { data, error } = await supabase
            .from('services')
            .insert([{
                name: service.name,
                description: service.description,
                price: service.price
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, service: Partial<Omit<Service, 'id'>>) {
        const { data, error } = await supabase
            .from('services')
            .update({
                name: service.name,
                description: service.description,
                price: service.price
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

