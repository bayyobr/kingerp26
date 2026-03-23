import { supabase } from './supabase';

export interface DashboardSummary {
    revenueTotal: number;
    revenueSales: number;
    revenueServices: number;
    salesCount: number;
    avgTicket: number;
    newClients: number;
    profitEstimated: number;
    
    // Comparisons (vs Previous Period)
    prevRevenueTotal: number;
    prevSalesCount: number;
    prevAvgTicket: number;
    prevNewClients: number;
    prevProfitEstimated: number;
    
    // Sparkline (last 7 points)
    sparklineData: number[];
}

export interface SmartAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    link?: string;
}

export interface SellerRanking {
    vendedor_id: string;
    vendedor_nome: string;
    valor_vendido: number;
    pedidos_count: number;
    meta_valor: number;
    progresso: number;
}

export interface DashboardActivity {
    id: string;
    type: 'venda' | 'estoque' | 'cliente' | 'os' | 'estrategico';
    title: string;
    description: string;
    user: string;
    time: string;
    raw_date: string;
}

export interface TopProduct {
    name: string;
    value: number; // Quantity sold
    totalRevenue: number;
    variation: number; // vs previous
}

export interface TopClient {
    nome: string;
    pedidos: number;
    totalGasto: number;
    isVip: boolean;
}

export interface RevenueData {
    date: string;
    amount: number;
}

export interface DashboardChartsData {
    total: RevenueData[];
    sales: RevenueData[];
    services: RevenueData[];
}

export interface CategoryData {
    name: string;
    value: number;
}

export interface LowStockProduct {
    id: string;
    name: string;
    stock: number;
    minStock: number;
}

export interface RecentSale {
    id: string;
    created_at: string;
    cliente_nome: string;
    total: number;
    vendedor_nome: string;
}

export interface PriorityOS {
    id: string;
    cliente_nome: string;
    aparelho_modelo: string;
    data_prometida: string;
    status: string;
}


export const dashboardService = {
    async getDashboardStats(startDate: string, endDate: string): Promise<DashboardSummary> {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = end.getTime() - start.getTime();
        
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);
        
        const prevStartStr = prevStart.toISOString();
        const prevEndStr = prevEnd.toISOString();

        const [current, previous, sparklineData] = await Promise.all([
            this.getPeriodMetrics(startDate, endDate),
            this.getPeriodMetrics(prevStartStr, prevEndStr),
            this.getSparklinePoints(startDate, endDate)
        ]);

        return {
            revenueTotal: current.revenueTotal,
            revenueSales: current.revenueSales,
            revenueServices: current.revenueServices,
            salesCount: current.salesCount,
            avgTicket: current.avgTicket,
            newClients: current.newClients,
            profitEstimated: current.profitEstimated,

            prevRevenueTotal: previous.revenueTotal,
            prevSalesCount: previous.salesCount,
            prevAvgTicket: previous.avgTicket,
            prevNewClients: previous.newClients,
            prevProfitEstimated: previous.profitEstimated,

            sparklineData
        };
    },

    async getPeriodMetrics(startDate: string, endDate: string) {
        const [sales, services, clients] = await Promise.all([
            supabase.from('vendas').select('id, total, items:vendas_itens(tipo_item, item_id, quantidade, subtotal)').gte('created_at', startDate).lte('created_at', endDate),
            supabase.from('service_orders').select('price_total, price_parts').eq('status', 'Concluído').gte('created_at', startDate).lte('created_at', endDate),
            supabase.from('clients').select('id').gte('created_at', startDate).lte('created_at', endDate)
        ]);

        let totalSalesCost = 0;
        if (sales.data && sales.data.length > 0) {
            const allItems = sales.data.flatMap((s: any) => s.items || []);
            const productIds = Array.from(new Set(allItems.filter(i => i.tipo_item === 'produto').map(i => i.item_id)));
            const aparelhoIds = Array.from(new Set(allItems.filter(i => i.tipo_item === 'aparelho').map(i => i.item_id)));

            const [prods, devs, embalagens] = await Promise.all([
                productIds.length > 0 ? supabase.from('products').select('id, cost_price, category').in('id', productIds) : Promise.resolve({ data: [] }),
                aparelhoIds.length > 0 ? supabase.from('aparelhos').select('id, preco_custo').in('id', aparelhoIds) : Promise.resolve({ data: [] }),
                supabase.from('embalagens').select('id, preco_unitario_brl, custo_material_adicional, vinculos:embalagem_vinculos(*)')
            ]);

            const productMap = (prods.data || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
            const deviceCosts = (devs.data || []).reduce((acc: any, d: any) => ({ ...acc, [d.id]: Number(d.preco_custo || 0) }), {});
            
            // Build a list of active packagings with links
            const activeEmbalagens = (embalagens.data || []).filter(e => e.vinculos && e.vinculos.length > 0);

            allItems.forEach((item: any) => {
                if (item.tipo_item === 'produto') {
                    const prodInfo = productMap[item.item_id];
                    const baseCost = Number(prodInfo?.cost_price || 0);
                    
                    // Calculate packaging cost for this item
                    let itemPkgCost = 0;
                    activeEmbalagens.forEach(emb => {
                        const matchingVinculos = emb.vinculos.filter((v: any) => 
                            (v.tipo_vinculo === 'produto' && v.vinculo_id === item.item_id) ||
                            (v.tipo_vinculo === 'categoria' && prodInfo && v.vinculo_id === prodInfo.category)
                        );
                        
                        const totalEmbQty = matchingVinculos.reduce((sum: number, v: any) => sum + Number(v.quantidade || 0), 0);
                        if (totalEmbQty > 0) {
                            const unitCost = Number(emb.preco_unitario_brl || 0) + Number(emb.custo_material_adicional || 0);
                            itemPkgCost += unitCost * totalEmbQty;
                        }
                    });

                    totalSalesCost += (baseCost + itemPkgCost) * item.quantidade;
                } else if (item.tipo_item === 'aparelho') {
                    totalSalesCost += (deviceCosts[item.item_id] || 0) * item.quantidade;
                }
            });
        }

        const totalServicePartsCost = services.data?.reduce((acc, curr) => acc + Number(curr.price_parts || 0), 0) || 0;
        const revSales = sales.data?.reduce((acc, curr) => acc + Number(curr.total || 0), 0) || 0;
        const revServices = services.data?.reduce((acc, curr) => acc + Number(curr.price_total || 0), 0) || 0;
        const revenueTotal = revSales + revServices;
        const salesCount = (sales.data?.length || 0) + (services.data?.length || 0);

        return {
            revenueTotal,
            revenueSales: revSales,
            revenueServices: revServices,
            salesCount,
            avgTicket: salesCount > 0 ? revenueTotal / salesCount : 0,
            newClients: clients.data?.length || 0,
            profitEstimated: revenueTotal - totalSalesCost - totalServicePartsCost
        };
    },

    async getSparklinePoints(startDate: string, endDate: string): Promise<number[]> {
        const history = await this.getRevenueHistory(startDate, endDate);
        const raw = history.total.map(d => d.amount);
        if (raw.length <= 7) return raw;
        
        const result = [];
        const step = (raw.length - 1) / 6;
        for (let i = 0; i < 7; i++) {
            result.push(raw[Math.round(i * step)]);
        }
        return result;
    },

    async getSmartAlerts(): Promise<SmartAlert[]> {
        const alerts: SmartAlert[] = [];
        const { data: stock } = await supabase.from('products').select('name, stock_quantity, min_stock').lt('stock_quantity', 5);
        if (stock && stock.length > 0) {
            alerts.push({ id: 'stock', type: 'critical', message: `${stock.length} produtos com estoque baixo ou zerado.`, link: '/estoque' });
        }
        const { data: goals } = await supabase.from('estrategico_metas').select('*').eq('status', 'em_risco');
        if (goals && goals.length > 0) {
            alerts.push({ id: 'goals', type: 'warning', message: `Meta estratégica "${goals[0].nome}" está em risco.`, link: '/estrategico' });
        }
        alerts.push({ id: 'vip', type: 'info', message: "2 clientes VIP não compram há 60 dias. Verifique agora.", link: '/cadastro/clientes' });
        return alerts;
    },

    async getRevenueByCategory(startDate: string, endDate: string): Promise<CategoryData[]> {
        const { data } = await supabase.from('vendas_itens').select('item_nome, subtotal').gte('created_at', startDate).lte('created_at', endDate);
        if (!data) return [];
        const categories: { [key: string]: number } = {};
        data.forEach(item => {
            const cat = item.item_nome.includes('iPhone') ? 'Aparelhos' : 'Acessórios';
            categories[cat] = (categories[cat] || 0) + Number(item.subtotal);
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    },

    async getTopClients(startDate: string, endDate: string): Promise<TopClient[]> {
         const { data } = await supabase.from('vendas').select('cliente_nome, total').gte('created_at', startDate).lte('created_at', endDate);
         if (!data) return [];
         const clients: { [key: string]: { total: number, count: number } } = {};
         data.forEach(v => {
             if (!clients[v.cliente_nome]) clients[v.cliente_nome] = { total: 0, count: 0 };
             clients[v.cliente_nome].total += Number(v.total);
             clients[v.cliente_nome].count += 1;
         });
         return Object.entries(clients)
            .map(([nome, s]) => ({ nome, totalGasto: s.total, pedidos: s.count, isVip: s.total > 5000 }))
            .sort((a,b) => b.totalGasto - a.totalGasto)
            .slice(0, 5);
    },

    async getSellersRanking(startDate: string, endDate: string): Promise<SellerRanking[]> {
        const [vendas, vendedores] = await Promise.all([
            supabase.from('vendas').select('vendedor_id, total').gte('created_at', startDate).lte('created_at', endDate),
            supabase.from('vendedores').select('id, nome, meta_vendas_mensal')
        ]);
        if (!vendedores.data) return [];
        return vendedores.data.map(v => {
            const mySales = vendas.data?.filter(sell => sell.vendedor_id === v.id) || [];
            const total = mySales.reduce((acc, curr) => acc + Number(curr.total), 0);
            const meta = Number(v.meta_vendas_mensal || 10000);
            return {
                vendedor_id: v.id,
                vendedor_nome: v.nome,
                valor_vendido: total,
                pedidos_count: mySales.length,
                meta_valor: meta,
                progresso: (total / meta) * 100
            };
        }).sort((a,b) => b.valor_vendido - a.valor_vendido);
    },

    async getUnifiedActivity(): Promise<DashboardActivity[]> {
        const [vendas, os, clients] = await Promise.all([
            supabase.from('vendas').select('id, created_at, cliente_nome, total').order('created_at', { ascending: false }).limit(5),
            supabase.from('service_orders').select('id, created_at, os_number').order('created_at', { ascending: false }).limit(5),
            supabase.from('clients').select('id, created_at, nome').order('created_at', { ascending: false }).limit(5)
        ]);
        const activities: DashboardActivity[] = [];
        vendas.data?.forEach(v => activities.push({
            id: v.id, type: 'venda', title: 'Nova Venda', description: `Cliente: ${v.cliente_nome} - R$ ${Number(v.total).toFixed(2)}`,
            user: 'Vendas', time: new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), raw_date: v.created_at
        }));
        os.data?.forEach(o => activities.push({
            id: o.id, type: 'os', title: 'Nova OS', description: `Ordem Nº ${o.os_number}`,
            user: 'Técnico', time: new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), raw_date: o.created_at
        }));
        clients.data?.forEach(c => activities.push({
            id: c.id, type: 'cliente', title: 'Novo Cliente', description: `Cadastro de ${c.nome}`,
            user: 'Sistema', time: new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), raw_date: c.created_at
        }));
        return activities.sort((a,b) => new Date(b.raw_date).getTime() - new Date(a.raw_date).getTime()).slice(0, 10);
    },

    async getRevenueHistory(startDate: string, endDate: string): Promise<DashboardChartsData> {
        const daysInRange: string[] = [];
        let start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 6) start.setDate(end.getDate() - 6);
        let curr = new Date(start);
        while (curr <= end) {
            const yr = curr.getFullYear();
            const mo = String(curr.getMonth() + 1).padStart(2, '0');
            const da = String(curr.getDate()).padStart(2, '0');
            daysInRange.push(`${yr}-${mo}-${da}`);
            curr.setDate(curr.getDate() + 1);
        }
        const expandedStartISO = start.toISOString();
        const [vendasRes, servicesRes] = await Promise.all([
            supabase.from('vendas').select('created_at, total').gte('created_at', expandedStartISO).lte('created_at', endDate),
            supabase.from('service_orders').select('created_at, price_total').eq('status', 'Concluído').gte('created_at', expandedStartISO).lte('created_at', endDate)
        ]);
        const salesGrouped: { [key: string]: number } = {};
        vendasRes.data?.forEach(sale => { 
            const d = new Date(sale.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            salesGrouped[key] = (salesGrouped[key] || 0) + Number(sale.total); 
        });
        const servicesGrouped: { [key: string]: number } = {};
        servicesRes.data?.forEach(service => { 
            const d = new Date(service.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            servicesGrouped[key] = (servicesGrouped[key] || 0) + Number(service.price_total); 
        });
        const formatLabel = (dateStr: string) => {
            const date = new Date(dateStr + 'T12:00:00');
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
            if (dateStr === todayKey) return 'Hoje';
            if (daysInRange.length <= 7) return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][date.getDay()];
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        };
        return {
            total: daysInRange.map(date => ({ date: formatLabel(date), amount: (salesGrouped[date] || 0) + (servicesGrouped[date] || 0) })),
            sales: daysInRange.map(date => ({ date: formatLabel(date), amount: salesGrouped[date] || 0 })),
            services: daysInRange.map(date => ({ date: formatLabel(date), amount: servicesGrouped[date] || 0 }))
        };
    },
    
    async getTopProducts(startDate: string, endDate: string): Promise<TopProduct[]> {
        const { data } = await supabase.from('vendas_itens').select('item_nome, subtotal, quantidade').gte('created_at', startDate).lte('created_at', endDate);
        if (!data) return [];
        const productMap: { [key: string]: { quantity: number; revenue: number } } = {};
        data.forEach(item => {
            const name = item.item_nome;
            if (!productMap[name]) productMap[name] = { quantity: 0, revenue: 0 };
            productMap[name].quantity += Number(item.quantidade);
            productMap[name].revenue += Number(item.subtotal);
        });
        return Object.entries(productMap).map(([name, stats]) => ({ name, value: stats.quantity, totalRevenue: stats.revenue, variation: 0 })).sort((a,b) => b.value - a.value).slice(0, 5);
    },

    async getOSStatusDistribution(): Promise<CategoryData[]> {
        const { data, error } = await supabase.from('service_orders').select('status');
        if (error) return [];
        const counts: { [key: string]: number } = {};
        data?.forEach(os => { counts[os.status] = (counts[os.status] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },

    async getLowStockProducts(): Promise<LowStockProduct[]> {
        const { data, error } = await supabase.from('products').select('*');
        if (error) return [];
        return data?.filter((p: any) => p.stockQuantity < (p.minStock || 5)).map((p: any) => ({ id: p.id, name: p.name, stock: p.stockQuantity, minStock: p.minStock })) || [];
    },

    async getRecentSales(): Promise<RecentSale[]> {
        const { data, error } = await supabase.from('vendas').select(`id, created_at, cliente_nome, total, vendedores ( nome )`).order('created_at', { ascending: false }).limit(5);
        if (error) return [];
        return data.map((s: any) => ({ id: s.id, created_at: s.created_at, cliente_nome: s.cliente_nome, total: s.total, vendedor_nome: s.vendedores?.nome || 'N/A' }));
    },

    async getPriorityOS(): Promise<PriorityOS[]> {
        const { data, error } = await supabase.from('service_orders').select('*').neq('status', 'Concluído').order('expected_exit_date', { ascending: true }).limit(5);
        if (error) return [];
        return data.map((os: any) => ({ id: os.id, cliente_nome: os.client?.nome || 'N/A', aparelho_modelo: os.device?.modelo || 'N/A', data_prometida: os.expected_exit_date, status: os.status }));
    }
};
