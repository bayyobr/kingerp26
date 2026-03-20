import { supabase } from './supabase';
import { Embalagem, EmbalagemMovimentacao } from '../types';

export const embalagemService = {
  async getAll(): Promise<Embalagem[]> {
    const { data, error } = await supabase
      .from('embalagens')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Embalagem> {
    const { data, error } = await supabase
      .from('embalagens')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(embalagem: Omit<Embalagem, 'id' | 'estoque_atual'>): Promise<Embalagem> {
    const { data, error } = await supabase
      .from('embalagens')
      .insert({ ...embalagem, estoque_atual: 0 })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Embalagem>): Promise<Embalagem> {
    const { data, error } = await supabase
      .from('embalagens')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addMovement(movement: Omit<EmbalagemMovimentacao, 'id'>): Promise<EmbalagemMovimentacao> {
    // 1. Insert movement
    const { data, error } = await supabase
      .from('embalagens_movimentacoes')
      .insert(movement)
      .select()
      .single();

    if (error) throw error;

    // 2. Update stock_atual in embalagens
    const { data: embalagem } = await supabase
      .from('embalagens')
      .select('estoque_atual')
      .eq('id', movement.embalagem_id)
      .single();

    const currentStock = embalagem?.estoque_atual || 0;
    const newStock = movement.tipo_movimentacao === 'entrada' 
      ? currentStock + movement.quantidade 
      : currentStock - movement.quantidade;

    await supabase
      .from('embalagens')
      .update({ estoque_atual: newStock })
      .eq('id', movement.embalagem_id);

    return data;
  },

  async getMovements(embalagemId: string): Promise<EmbalagemMovimentacao[]> {
    const { data, error } = await supabase
      .from('embalagens_movimentacoes')
      .select('*')
      .eq('embalagem_id', embalagemId)
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
