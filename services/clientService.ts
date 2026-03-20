import { supabase } from './supabase';
import { Client, PurchaseHistoryItem, ClientProfileStats, FrequencyStatus, Venda, ServiceOrder } from '../types';
import { salesService } from './salesService';
import { orderService } from './orderService';

export const clientService = {
  // --- DATABASE OPERATIONS ---
  async getAllClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data;
  },

  async getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching client by id:', error);
      return null;
    }
    return data;
  },

  async createClient(client: Partial<Client>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return null;
    }
    return data;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return null;
    }
    return data;
  },

  async deleteClient(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return false;
    }
    return true;
  },

  // --- BUSINESS LOGIC & MERGE ---
  
  // Finds all past purchases across PDV and OS
  async getClientPurchaseHistory(client: Client): Promise<PurchaseHistoryItem[]> {
    const history: PurchaseHistoryItem[] = [];
    
    // We match by CPF or exact Name/Phone if no CPF is provided, 
    // but typically CPF is the strong link.
    const hasCpf = client.cpf && client.cpf.trim() !== '';
    const hasPhone = client.telefone && client.telefone.trim() !== '';

    if (!hasCpf && !hasPhone) return []; // Cannot strongly match

    try {
      // 1. Fetch Sales (PDV)
      // Since salesService has getAll() running on local storage or supabase
      const allSales = await salesService.getAll();
      const clientSales = allSales.filter(sale => {
         const matchCpf = hasCpf && sale.cliente_cpf === client.cpf;
         const matchPhone = hasPhone && sale.cliente_telefone === client.telefone;
         return matchCpf || matchPhone;
      });

      clientSales.forEach(sale => {
        history.push({
          id: sale.id || sale.numero_venda || '',
          type: 'PDV',
          date: sale.created_at || new Date().toISOString(),
          total: sale.total,
          itemsDescription: sale.itens?.map(i => `${i.quantidade}x ${i.item_nome}`).join(', ') || 'Venda PDV',
          status: sale.status || 'concluida'
        });
      });

      // 2. Fetch Service Orders (OS)
      const allOrders = await orderService.getAll();
      const clientOrders = allOrders.filter(order => {
        const matchCpf = hasCpf && order.client.cpf === client.cpf;
        const matchPhone = hasPhone && order.client.phone === client.telefone;
        return matchCpf || matchPhone;
      });

      clientOrders.forEach(order => {
         history.push({
           id: order.id || order.osNumber,
           type: 'OS',
           date: order.entryDate || new Date().toISOString(),
           total: order.priceTotal || 0,
           itemsDescription: `OS ${order.osNumber} - ${order.services || 'Serviço'}`,
           status: order.status
         });
      });

      // Sort by newest first
      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } catch (e) {
      console.error('Error getting combined purchase history:', e);
      return history;
    }
  },

  // Generates the CRM Analytics for a client profile
  async calculateClientStats(client: Client, history: PurchaseHistoryItem[]): Promise<ClientProfileStats> {
    const completedPurchases = history.filter(h => h.status !== 'cancelada' && h.status !== 'reembolsada');
    
    const totalSpent = completedPurchases.reduce((acc, curr) => acc + curr.total, 0);
    const orderCount = completedPurchases.length;
    
    // VIP Rule (> R$ 1000 spend OR manually set)
    const isVip = client.is_vip_manual || totalSpent > 1000;

    let frequencyStatus: FrequencyStatus = 'Novo';
    let avgDays: number | null = null;
    let lastPurchaseDate: string | null = null;
    let estimatedNextPurchaseDate: string | null = null;

    if (orderCount > 0) {
      // Sort oldest to newest for chronological calculation
      const chronoPurchases = [...completedPurchases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      lastPurchaseDate = chronoPurchases[chronoPurchases.length - 1].date;
      
      const daysSinceLastPurchase = Math.floor((new Date().getTime() - new Date(lastPurchaseDate).getTime()) / (1000 * 3600 * 24));

      // Calculate Average Days Between Purchases (if more than 1 purchase)
      if (orderCount > 1) {
        let totalDaysBetween = 0;
        for (let i = 1; i < chronoPurchases.length; i++) {
          const d1 = new Date(chronoPurchases[i-1].date).getTime();
          const d2 = new Date(chronoPurchases[i].date).getTime();
          totalDaysBetween += (d2 - d1) / (1000 * 3600 * 24);
        }
        avgDays = Math.round(totalDaysBetween / (orderCount - 1));
        
        // Predict next purchase
        const nextDate = new Date(lastPurchaseDate);
        nextDate.setDate(nextDate.getDate() + avgDays);
        estimatedNextPurchaseDate = nextDate.toISOString();
      }

      // Determine Category Status
      if (daysSinceLastPurchase <= 30) {
        frequencyStatus = 'Ativo';
      } else if (daysSinceLastPurchase <= 90) {
        frequencyStatus = 'Regular';
      } else if (daysSinceLastPurchase <= 180) {
        frequencyStatus = 'Em Risco';
      } else {
        frequencyStatus = 'Inativo';
      }
    }

    return {
      totalSpent,
      orderCount,
      averageDaysBetweenPurchases: avgDays,
      frequencyStatus,
      lastPurchaseDate,
      estimatedNextPurchaseDate,
      isVip
    };
  }
};
