import { supabase } from './supabase';
import { Aparelho } from '../types';

export const deviceService = {
  async getAll(filters?: { status?: string; search?: string }) {
    let query = supabase
      .from('aparelhos')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`modelo.ilike.%${filters.search}%,imei.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Aparelho[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('aparelhos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Aparelho;
  },

  async create(device: Partial<Aparelho>) {
    // Check for existing IMEI
    const { data: existing } = await supabase
      .from('aparelhos')
      .select('id')
      .eq('imei', device.imei)
      .maybeSingle();

    if (existing) {
      throw new Error('Já existe um aparelho com este IMEI.');
    }

    const { data, error } = await supabase
      .from('aparelhos')
      .insert({
        ...device,
        estoque: 1 // Default for now
      })
      .select()
      .single();

    if (error) throw error;
    return data as Aparelho;
  },

  async update(id: string, device: Partial<Aparelho>) {
    const { data, error } = await supabase
      .from('aparelhos')
      .update(device)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Aparelho;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('aparelhos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
