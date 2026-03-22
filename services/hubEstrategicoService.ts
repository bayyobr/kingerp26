import { supabase } from './supabase';
import { 
  StrategicGoal, 
  StrategicIdea, 
  StrategicAction, 
  StrategicEvent, 
  StrategicNote, 
  Competitor 
} from '../types';

export const hubEstrategicoService = {
  // --- GOALS (METAS) ---
  async getGoals(): Promise<StrategicGoal[]> {
    const { data, error } = await supabase.from('estrategico_metas').select('*').order('prazo', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async upsertGoal(goal: Partial<StrategicGoal>) {
    const { data, error } = await supabase.from('estrategico_metas').upsert(goal).select().single();
    if (error) throw error;
    return data;
  },
  async deleteGoal(id: string) {
    const { error } = await supabase.from('estrategico_metas').delete().eq('id', id);
    if (error) throw error;
  },

  // --- IDEAS ---
  async getIdeas(): Promise<StrategicIdea[]> {
    const { data, error } = await supabase.from('estrategico_ideias').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async upsertIdea(idea: Partial<StrategicIdea>) {
    const { data, error } = await supabase.from('estrategico_ideias').upsert(idea).select().single();
    if (error) throw error;
    return data;
  },

  // --- ACTIONS (PLANO DE AÇÃO) ---
  async getActions(): Promise<StrategicAction[]> {
    const { data, error } = await supabase.from('estrategico_acoes').select('*').order('prazo', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async upsertAction(action: Partial<StrategicAction>) {
    const { data, error } = await supabase.from('estrategico_acoes').upsert(action).select().single();
    if (error) throw error;
    return data;
  },

  // --- EVENTS (CALENDÁRIO) ---
  async getEvents(): Promise<StrategicEvent[]> {
    const { data, error } = await supabase.from('estrategico_eventos').select('*').order('data', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async upsertEvent(event: Partial<StrategicEvent>) {
    const { data, error } = await supabase.from('estrategico_eventos').upsert(event).select().single();
    if (error) throw error;
    return data;
  },
  async deleteEvent(id: string) {
    const { error } = await supabase.from('estrategico_eventos').delete().eq('id', id);
    if (error) throw error;
  },

  // --- NOTES (ANOTAÇÕES) ---
  async getNotes(): Promise<StrategicNote[]> {
    const { data, error } = await supabase.from('estrategico_anotacoes').select('*').order('is_pinned', { ascending: false }).order('data', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async upsertNote(note: Partial<StrategicNote>) {
    const { data, error } = await supabase.from('estrategico_anotacoes').upsert(note).select().single();
    if (error) throw error;
    return data;
  },

  // --- COMPETITORS (RADAR) ---
  async getCompetitors(): Promise<Competitor[]> {
    const { data, error } = await supabase.from('estrategico_concorrentes').select('*').order('nome', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async upsertCompetitor(competitor: Partial<Competitor>) {
    const { data, error } = await supabase.from('estrategico_concorrentes').upsert({ ...competitor, ultima_atualizacao: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data;
  },

  // --- INTELLIGENCE & KPIs ---
  async getStrategicKPIs() {
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const prevMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevMonthLast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    // Fetch current and previous month sales
    const [currSales, prevSales] = await Promise.all([
        supabase.from('vendas').select('total_pago').gte('data_venda', firstDayMonth).lte('data_venda', lastDayMonth),
        supabase.from('vendas').select('total_pago').gte('data_venda', prevMonthFirst).lte('data_venda', prevMonthLast)
    ]);

    const calcStats = (data: any[]) => {
        const total = data?.reduce((acc, v) => acc + (v.total_pago || 0), 0) || 0;
        const count = data?.length || 0;
        const avg = count > 0 ? total / count : 0;
        return { total, count, avg };
    };

    const current = calcStats(currSales.data || []);
    const previous = calcStats(prevSales.data || []);

    return {
        revenue: { current: current.total, previous: previous.total },
        orders: { current: current.count, previous: previous.count },
        ticket: { current: current.avg, previous: previous.avg }
    };
  },

  async getTrends() {
    // Last 12 months revenue
    const { data, error } = await supabase.rpc('get_monthly_revenue_trends'); // Should create this RPC or just manual fetch
    if (error) {
        // Fallback for manual fetch if RPC is not ready
        const { data: fallbackData } = await supabase.from('vendas').select('total_pago, data_venda').order('data_venda', { ascending: true });
        // Process manually...
        return fallbackData;
    }
    return data;
  }
};
