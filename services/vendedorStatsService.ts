import { supabase } from './supabase';
import { VendedorStats, Venda, TopProduct } from '../types';

export const vendedorStatsService = {
  async getVendedorStats(vendedorId: string, days: number | 'custom', customRange?: { start: string, end: string }): Promise<VendedorStats> {
    let startDate: Date;
    let endDate: Date = new Date();
    
    if (days === 'custom' && customRange) {
      startDate = new Date(customRange.start);
      endDate = new Date(customRange.end);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days as number));
    }

    const prevStartDate = new Date(startDate);
    const duration = endDate.getTime() - startDate.getTime();
    prevStartDate.setTime(startDate.getTime() - duration);
    const prevEndDate = new Date(startDate);

    // Fetch current period sales
    const { data: currentSales } = await supabase
      .from('vendas')
      .select('*, itens(*)')
      .eq('vendedor_id', vendedorId)
      .eq('status', 'Concluída')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Fetch previous period sales for comparison
    const { data: prevSales } = await supabase
      .from('vendas')
      .select('total')
      .eq('vendedor_id', vendedorId)
      .eq('status', 'Concluída')
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString());

    const { data: vendedor } = await supabase
      .from('vendedores')
      .select('comissao_percentual')
      .eq('id', vendedorId)
      .single();

    const commissionRate = (vendedor?.comissao_percentual || 0) / 100;

    const currentData = this.calculateMetrics(currentSales || [], commissionRate);
    const prevData = this.calculateMetrics(prevSales || [], commissionRate);

    // Calculate Diffs
    const calculateDiff = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // Top Products Calculation
    const productMap = new Map<string, { qty: number, total: number }>();
    let totalValue = 0;

    (currentSales || []).forEach((sale: any) => {
      (sale.itens || []).forEach((item: any) => {
        const existing = productMap.get(item.item_nome) || { qty: 0, total: 0 };
        productMap.set(item.item_nome, {
          qty: existing.qty + item.quantidade,
          total: existing.total + item.subtotal
        });
        totalValue += item.subtotal;
      });
    });

    const topProducts: TopProduct[] = Array.from(productMap.entries())
      .map(([name, stats]) => ({
        name,
        quantity: stats.qty,
        totalGenerated: stats.total,
        percentOfTotal: totalValue > 0 ? (stats.total / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.totalGenerated - a.totalGenerated)
      .slice(0, 5);

    // Sales Evolution (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: evolutionData } = await supabase
      .from('vendas')
      .select('total, created_at')
      .eq('vendedor_id', vendedorId)
      .eq('status', 'Concluída')
      .gte('created_at', sixMonthsAgo.toISOString());

    const evolution = this.formatEvolution(evolutionData || []);

    return {
      totalSold: currentData.total,
      orderCount: currentData.count,
      averageTicket: currentData.ticket,
      totalCommission: currentData.commission,
      totalSoldDiff: calculateDiff(currentData.total, prevData.total),
      orderCountDiff: calculateDiff(currentData.count, prevData.count),
      averageTicketDiff: calculateDiff(currentData.ticket, prevData.ticket),
      totalCommissionDiff: calculateDiff(currentData.commission, prevData.commission),
      salesEvolution: evolution,
      topProducts
    };
  },

  calculateMetrics(sales: any[], commissionRate: number) {
    const total = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const count = sales.length;
    const ticket = count > 0 ? total / count : 0;
    const commission = total * commissionRate;
    return { total, count, ticket, commission };
  },

  formatEvolution(sales: any[]) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const map = new Map<string, number>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
      map.set(label, 0);
    }

    sales.forEach(s => {
      const d = new Date(s.created_at);
      const label = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
      if (map.has(label)) {
        map.set(label, (map.get(label) || 0) + s.total);
      }
    });

    return Array.from(map.entries()).map(([month, value]) => ({ month, value }));
  }
};
