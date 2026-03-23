import { supabase } from './supabase';
import { Embalagem, EmbalagemMovimentacao } from '../types';

export const embalagemService = {
  async getAll(): Promise<Embalagem[]> {
    const { data, error } = await supabase
      .from('embalagens')
      .select('*, vinculos:embalagem_vinculos(*)')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Embalagem> {
    const { data, error } = await supabase
      .from('embalagens')
      .select('*, vinculos:embalagem_vinculos(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(embalagem: Omit<Embalagem, 'id' | 'estoque_atual'>): Promise<Embalagem> {
    const { vinculos, ...header } = embalagem as any;
    
    const { data: saleData, error: saleError } = await supabase
      .from('embalagens')
      .insert({ ...header, estoque_atual: 0 })
      .select()
      .single();

    if (saleError) throw saleError;
    
    if (vinculos && vinculos.length > 0) {
      const links = vinculos.map((v: any) => ({
        embalagem_id: saleData.id,
        tipo_vinculo: v.tipo_vinculo,
        vinculo_id: v.vinculo_id,
        quantidade: v.quantidade
      }));
      const { error: linksError } = await supabase.from('embalagem_vinculos').insert(links);
      if (linksError) throw linksError;
    }

    return { ...saleData, vinculos: vinculos || [] };
  },

  async update(id: string, updates: Partial<Embalagem>): Promise<Embalagem> {
    const { vinculos, ...header } = updates as any;

    const { data: saleData, error: saleError } = await supabase
      .from('embalagens')
      .update(header)
      .eq('id', id)
      .select()
      .single();

    if (saleError) throw saleError;

    if (vinculos !== undefined) {
      // Refresh links: Delete old and insert new (simple pattern)
      await supabase.from('embalagem_vinculos').delete().eq('embalagem_id', id);
      
      if (vinculos.length > 0) {
        const links = vinculos.map((v: any) => ({
          embalagem_id: id,
          tipo_vinculo: v.tipo_vinculo,
          vinculo_id: v.vinculo_id,
          quantidade: v.quantidade
        }));
        const { error: linksError } = await supabase.from('embalagem_vinculos').insert(links);
        if (linksError) throw linksError;
      }
    }

    return { ...saleData, vinculos: vinculos || [] };
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
