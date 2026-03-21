import React, { useEffect, useState } from 'react';
import { 
    dashboardService, 
    DashboardSummary, 
    DashboardChartsData, 
    SmartAlert, 
    TopProduct, 
    TopClient,
    SellerRanking,
    DashboardActivity,
    CategoryData
} from '../../services/dashboardService';
import { KPICard } from './KPICard';
import { DashboardAlerts } from './DashboardAlerts';
import { RevenueChart } from './RevenueChart';
import { RankingLists } from './RankingLists';
import { TeamGoals } from './TeamGoals';
import { ActivityFeed } from './ActivityFeed';
import { QuickActions } from './QuickActions';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | '30days' | 'year' | 'custom';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [revenueData, setRevenueData] = useState<DashboardChartsData>({ total: [], sales: [], services: [] });
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [topClients, setTopClients] = useState<TopClient[]>([]);
    const [sellers, setSellers] = useState<SellerRanking[]>([]);
    const [activities, setActivities] = useState<DashboardActivity[]>([]);
    const { rate: usdRate } = useExchangeRate();

    // Date Filter State
    const [preset, setPreset] = useState<DatePreset>(() => {
        return (localStorage.getItem('dashboard_preset') as DatePreset) || 'month';
    });

    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTimezoneOffsetString = () => {
        const tzo = -new Date().getTimezoneOffset();
        const dif = tzo >= 0 ? '+' : '-';
        const pad = (num: number) => String(Math.floor(Math.abs(num))).padStart(2, '0');
        return dif + pad(tzo / 60) + ':' + pad(tzo % 60);
    };

    const [startDate, setStartDate] = useState(() => {
        const saved = localStorage.getItem('dashboard_startDate');
        if (saved) return saved;
        const d = new Date();
        d.setDate(1);
        return getLocalDateString(d);
    });
    const [endDate, setEndDate] = useState(() => {
        const saved = localStorage.getItem('dashboard_endDate');
        if (saved) return saved;
        return getLocalDateString(new Date());
    });

    const handlePresetChange = (newPreset: DatePreset) => {
        setPreset(newPreset);
        const end = new Date();
        const start = new Date();

        switch (newPreset) {
            case 'today': break;
            case 'yesterday':
                start.setDate(end.getDate() - 1);
                end.setDate(end.getDate() - 1);
                break;
            case 'week':
                start.setDate(end.getDate() - end.getDay());
                break;
            case 'month':
                start.setDate(1);
                break;
            case '30days':
                start.setDate(end.getDate() - 30);
                break;
            case 'year':
                start.setMonth(0, 1);
                break;
            case 'custom': return;
        }

        setStartDate(getLocalDateString(start));
        setEndDate(getLocalDateString(end));
    };

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem('dashboard_preset', preset);
        localStorage.setItem('dashboard_startDate', startDate);
        localStorage.setItem('dashboard_endDate', endDate);
    }, [preset, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const tz = getTimezoneOffsetString();
            const startISO = `${startDate}T00:00:00${tz}`;
            const endISO = `${endDate}T23:59:59${tz}`;

            const [summaryData, chartsData, categories, alertsData, products, clients, ranking, activity] = await Promise.all([
                dashboardService.getDashboardStats(startISO, endISO),
                dashboardService.getRevenueHistory(startISO, endISO),
                dashboardService.getRevenueByCategory(startISO, endISO),
                dashboardService.getSmartAlerts(),
                dashboardService.getTopProducts(startISO, endISO),
                dashboardService.getTopClients(startISO, endISO),
                dashboardService.getSellersRanking(startISO, endISO),
                dashboardService.getUnifiedActivity()
            ]);

            setSummary(summaryData);
            setRevenueData(chartsData);
            setCategoryData(categories);
            setAlerts(alertsData);
            setTopProducts(products);
            setTopClients(clients);
            setSellers(ranking);
            setActivities(activity);
        } catch (err) {
            console.error("Error fetching dashboard data", err);
            setError("Erro ao carregar os dados do painel.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    const calculateVariation = (current: number, previousValue: number) => {
        if (!previousValue) return current > 0 ? 100 : 0;
        return ((current - previousValue) / previousValue) * 100;
    };

    return (
        <div className="p-4 md:p-8 flex flex-col gap-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">
            
            {/* STICKY FILTER BAR */}
            <div className="sticky top-0 z-30 bg-[#0f172a]/80 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8 py-4 border-b border-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter">Command Center</h1>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Gestão em Tempo Real • {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Live USD Quote Badge */}
                <div className="hidden lg:flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-full px-4 py-1.5 shadow-xl animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-400 text-[20px]">attach_money</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Câmbio Comercial</span>
                            <span className="text-sm font-black text-white">USD <span className="text-blue-400">R$ {usdRate?.toFixed(2) || '---'}</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-2xl">
                    <select
                        value={preset}
                        onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
                        className="bg-transparent text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                        <option value="today">Hoje</option>
                        <option value="yesterday">Ontem</option>
                        <option value="week">7 Dias</option>
                        <option value="month">Este Mês</option>
                        <option value="30days">30 Dias</option>
                        <option value="year">Este Ano</option>
                        <option value="custom">Personalizado</option>
                    </select>

                    {preset === 'custom' && (
                        <div className="flex items-center gap-1 px-2 border-l border-slate-800">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-white text-[10px] font-bold outline-none"
                            />
                            <span className="text-slate-600 text-[10px]">/</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-white text-[10px] font-bold outline-none"
                            />
                        </div>
                    )}

                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
                    </button>
                </div>
            </div>

            {/* ROW 1: MAIN KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <KPICard 
                    title="Faturamento" 
                    value={`R$ ${summary?.revenueTotal.toLocaleString() || '0'}`} 
                    variation={summary ? calculateVariation(summary.revenueTotal, summary.prevRevenueTotal) : 0}
                    sparklineData={summary?.sparklineData || []}
                    icon="payments"
                    loading={loading && !summary}
                />
                <KPICard 
                    title="Pedidos" 
                    value={summary?.salesCount || 0} 
                    variation={summary ? calculateVariation(summary.salesCount, summary.prevSalesCount) : 0}
                    sparklineData={[4, 6, 5, 8, 7, 9, 10]} // Static example for missing data points
                    icon="shopping_basket"
                    loading={loading && !summary}
                />
                <KPICard 
                    title="Ticket Médio" 
                    value={`R$ ${summary?.avgTicket.toFixed(2) || '0'}`} 
                    variation={summary ? calculateVariation(summary.avgTicket, summary.prevAvgTicket) : 0}
                    sparklineData={[150, 160, 145, 170, 155, 165, 160]}
                    icon="receipt_long"
                    loading={loading && !summary}
                />
                <KPICard 
                    title="Lucro Est." 
                    value={`R$ ${summary?.profitEstimated.toLocaleString() || '0'}`} 
                    variation={summary ? calculateVariation(summary.profitEstimated, summary.prevProfitEstimated) : 0}
                    sparklineData={[10, 12, 11, 14, 13, 15, 16]}
                    icon="analytics"
                    loading={loading && !summary}
                />
                <KPICard 
                    title="Novos Clientes" 
                    value={summary?.newClients || 0} 
                    variation={summary ? calculateVariation(summary.newClients, summary.prevNewClients) : 0}
                    sparklineData={[2, 3, 2, 5, 4, 6, 5]}
                    icon="person_add"
                    loading={loading && !summary}
                />
            </div>

            {/* ROW 2: SMART ALERTS */}
            <DashboardAlerts alerts={alerts} />

            {/* ROW 3: CHARTS */}
            <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
                <div className="xl:col-span-7 bg-surface-dark border border-slate-800 rounded-2xl p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">monitoring</span>
                            Fluxo de Receita
                        </h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                                <span className="w-2 h-2 rounded-full bg-primary"></span> Total
                            </span>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <RevenueChart data={revenueData} minimal />
                    </div>
                </div>

                <div className="xl:col-span-3 bg-surface-dark border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-pink-500">pie_chart</span>
                        Categorias
                    </h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData as any[]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-500 font-bold uppercase">Total</span>
                            <span className="text-xl font-black text-white">100%</span>
                        </div>
                    </div>
                    <div className="mt-6 space-y-2">
                        {categoryData.slice(0, 3).map((cat, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                                    <span className="text-xs text-slate-400 font-medium">{cat.name}</span>
                                </div>
                                <span className="text-xs font-bold text-white">R$ {cat.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ROW 4: RANKINGS */}
            <RankingLists products={topProducts} clients={topClients} loading={loading} />

            {/* ROW 5: TEAM & GOALS */}
            <TeamGoals sellers={sellers} loading={loading} />

            {/* ROW 6: ACTIVITY FEED */}
            <ActivityFeed activities={activities} loading={loading} />

            {/* ROW 7: QUICK ACTIONS */}
            <QuickActions />

            <div className="text-center py-8 opacity-20 hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">King ERP • Engine v4.0.2 • Powered by Antigravity</p>
            </div>
        </div>
    );
};

export default Dashboard;
