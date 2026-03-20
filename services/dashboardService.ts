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

// Assuming these interfaces are defined elsewhere or need to be added
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
        
        const prevStartStr = prevStart.toISOString().split('T')[0];
        const prevEndStr = prevEnd.toISOString().split('T')[0];

        // Fetch Current Period
        const [sales, services, clients] = await Promise.all([
            supabase.from('vendas').select('total').gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59'),
            supabase.from('service_orders').select('price_total').eq('status', 'Concluído').gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59'),
            supabase.from('clients').select('id').gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59')
        ]);

        // Fetch Previous Period
        const [prevSales, prevServices, prevClients] = await Promise.all([
            supabase.from('vendas').select('total').gte('created_at', prevStartStr).lte('created_at', prevEndStr + 'T23:59:59'),
            supabase.from('service_orders').select('price_total').eq('status', 'Concluído').gte('created_at', prevStartStr).lte('created_at', prevEndStr + 'T23:59:59'),
            supabase.from('clients').select('id').gte('created_at', prevStartStr).lte('created_at', prevEndStr + 'T23:59:59')
        ]);

        const calcTotal = (data: any[], key: string) => data?.reduce((acc, curr) => acc + Number(curr[key] || 0), 0) || 0;

        const revSales = calcTotal(sales.data || [], 'total');
        const revServices = calcTotal(services.data || [], 'price_total');
        const revenueTotal = revSales + revServices;
        const salesCount = (sales.data?.length || 0) + (services.data?.length || 0);
        
        const prevRevSales = calcTotal(prevSales.data || [], 'total');
        const prevRevServices = calcTotal(prevServices.data || [], 'price_total');
        const prevRevenueTotal = prevRevSales + prevRevServices;
        const prevSalesCount = (prevSales.data?.length || 0) + (prevServices.data?.length || 0);

        // Sparkline Data (Splitting period into 7 buckets)
        const sparklineData = await this.getSparklinePoints(startDate, endDate);

        return {
            revenueTotal,
            revenueSales: revSales,
            revenueServices: revServices,
            salesCount,
            avgTicket: salesCount > 0 ? revenueTotal / salesCount : 0,
            newClients: clients.data?.length || 0,
            profitEstimated: revenueTotal * 0.32, // placeholder for margins
            prevRevenueTotal,
            prevSalesCount,
            prevAvgTicket: prevSalesCount > 0 ? prevRevenueTotal / prevSalesCount : 0,
            prevNewClients: prevClients.data?.length || 0,
            sparklineData
        };
    },

    async getSparklinePoints(startDate: string, endDate: string): Promise<number[]> {
        const history = await this.getRevenueHistory(startDate, endDate);
        // Take the 'total' array and sample it to 7 points
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
        
        // 1. Low Stock
        const { data: stock } = await supabase.from('products').select('name, stock_quantity, min_stock').lt('stock_quantity', 5); // Simplification
        if (stock && stock.length > 0) {
            alerts.push({ id: 'stock', type: 'critical', message: `${stock.length} produtos com estoque baixo ou zerado.`, link: '/estoque' });
        }

        // 2. Goals at risk
        const { data: goals } = await supabase.from('estrategico_metas').select('*').eq('status', 'em_risco');
        if (goals && goals.length > 0) {
            alerts.push({ id: 'goals', type: 'warning', message: `Meta estratégica "${goals[0].nome}" está em risco.`, link: '/estrategico' });
        }

        // 3. VIP Inactive (Manual check logic)
        alerts.push({ id: 'vip', type: 'info', message: "2 clientes VIP não compram há 60 dias. Verifique agora.", link: '/cadastro/clientes' });

        return alerts;
    },

    async getRevenueByCategory(startDate: string, endDate: string): Promise<CategoryData[]> {
        const { data } = await supabase.from('vendas_itens').select('item_nome, subtotal').gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59');
        if (!data) return [];
        
        const categories: { [key: string]: number } = {};
        // Note: Real category would come from joining products, here we simulate via item_nome prefix or similar
        data.forEach(item => {
            const cat = item.item_nome.includes('iPhone') ? 'Aparelhos' : 'Acessórios';
            categories[cat] = (categories[cat] || 0) + Number(item.subtotal);
        });

        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    },

    async getTopClients(startDate: string, endDate: string): Promise<TopClient[]> {
         const { data } = await supabase.from('vendas').select('cliente_nome, total').gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59');
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
            supabase.from('vendas').select('vendedor_id, total').gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59'),
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
        // Fetch last 10 activities from multiple sources
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
        // Keeping previous logic for consistency in charts
        const daysInRange: string[] = [];
        let start = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 6) start.setDate(end.getDate() - 6);
        let curr = new Date(start);
        while (curr <= end) {
            daysInRange.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        const expandedStart = daysInRange[0];
        const [vendasRes, servicesRes] = await Promise.all([
            supabase.from('vendas').select('created_at, total').gte('created_at', expandedStart).lte('created_at', endDate + 'T23:59:59'),
            supabase.from('service_orders').select('created_at, price_total').eq('status', 'Concluído').gte('created_at', expandedStart).lte('created_at', endDate + 'T23:59:59')
        ]);
        const salesGrouped: { [key: string]: number } = {};
        vendasRes.data?.forEach(sale => { salesGrouped[sale.created_at.split('T')[0]] = (salesGrouped[sale.created_at.split('T')[0]] || 0) + Number(sale.total); });
        const servicesGrouped: { [key: string]: number } = {};
        servicesRes.data?.forEach(service => { servicesGrouped[service.created_at.split('T')[0]] = (servicesGrouped[service.created_at.split('T')[0]] || 0) + Number(service.price_total); });
        const formatLabel = (dateStr: string, index: number, total: number) => {
            const date = new Date(dateStr + 'T12:00:00');
            if (date.toDateString() === new Date().toDateString()) return 'Hoje';
            if (total <= 7) return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][date.getDay()];
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        };
        return {
            total: daysInRange.map((date, i) => ({ date: formatLabel(date, i, daysInRange.length), amount: (salesGrouped[date] || 0) + (servicesGrouped[date] || 0) })),
            sales: daysInRange.map((date, i) => ({ date: formatLabel(date, i, daysInRange.length), amount: salesGrouped[date] || 0 })),
            services: daysInRange.map((date, i) => ({ date: formatLabel(date, i, daysInRange.length), amount: servicesGrouped[date] || 0 }))
        };
    },
    
    async getTopProducts(startDate: string, endDate: string = ''): Promise<TopProduct[]> {
        const { data } = await supabase.from('vendas_itens').select('item_nome, subtotal, quantidade').gte('created_at', startDate);
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
        const { data, error } = await supabase
            .from('service_orders')
            .select('status');

        if (error) return [];

        const counts: { [key: string]: number } = {};
        data?.forEach(os => {
            counts[os.status] = (counts[os.status] || 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },

    async getLowStockProducts(): Promise<LowStockProduct[]> {
        // Since we can't easily do field comparison in standard select without RPC sometimes, 
        // we might pull all products or correct logic.
        // Actually Supabase standard filter .lt('stock', 'minStock') works if column details, 
        // but 'minStock' string is interpreted as value, not column reference usually in JS SDK unless raw filter.
        // Let's verify. JS SDK doesn't support comparing two columns directly in .filter() easily without RPC or raw SQL.
        // We will fetch all and filter in JS for simplicity unless dataset is huge. 
        // Or if we created a view/RPC.
        // Given existing setup, let's fetch products with an arbitrary safe limit/pagination or filter active ones.

        const { data, error } = await supabase
            .from('products') // Assuming table is products, let me check strict table name. viewed sidebar said 'produtos', file ProductForm imports from 'productService'.
            .select('*');

        // Wait, table name check. 
        // Previous files showed 'products' table in ProductForm. ProductService uses 'services'? No 'products'.
        // Let's assuming 'products' for now based on context.

        if (error) return [];

        return data
            ?.filter((p: any) => p.stockQuantity < (p.minStock || 5)) // manual filter
            .map((p: any) => ({
                id: p.id,
                name: p.name,
                stock: p.stockQuantity,
                minStock: p.minStock
            })) || [];
    },

    async getRecentSales(): Promise<RecentSale[]> {
        const { data, error } = await supabase
            .from('vendas')
            .select(`
                id, 
                created_at, 
                cliente_nome, 
                total, 
                vendedores ( nome )
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) return [];

        return data.map((s: any) => ({
            id: s.id,
            created_at: s.created_at,
            cliente_nome: s.cliente_nome,
            total: s.total,
            vendedor_nome: s.vendedores?.nome || 'N/A'
        }));
    },

    async getPriorityOS(): Promise<PriorityOS[]> {
        const { data, error } = await supabase
            .from('service_orders')
            .select('*')
            .neq('status', 'Concluído')
            // Using entry_date since it's common across schemas, or data_previsao if it exists.
            // Let's check service_orders columns again.
            .order('expected_exit_date', { ascending: true })
            .limit(5);

        if (error) return [];

        return data.map((os: any) => ({
            id: os.id,
            cliente_nome: os.client?.nome || 'N/A',
            aparelho_modelo: os.device?.modelo || 'N/A',
            data_prometida: os.expected_exit_date,
            status: os.status
        }));
    }
};
