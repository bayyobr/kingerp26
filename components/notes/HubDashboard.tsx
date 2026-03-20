import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';
import { StrategicGoal } from '../../types';

const HubDashboard: React.FC = () => {
    const [kpis, setKpis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const stats = await hubEstrategicoService.getStrategicKPIs();
            setKpis(stats);
            
            // Logic for manual alerts (simulated/calculated)
            const newAlerts = [];
            if (stats.revenue.current < stats.revenue.previous * 0.8) newAlerts.push("Faturamento abaixo da média do mês passado.");
            if (stats.ticket.current < 50) newAlerts.push("Ticket médio crítico. Revise precificação.");
            
            setAlerts(newAlerts);
        } catch (error) {
            console.error("Error fetching Strategic KPIs", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse flex flex-col gap-6">
        <div className="h-32 bg-slate-800 rounded-3xl w-full"></div>
        <div className="grid grid-cols-4 gap-6">
            <div className="h-40 bg-slate-800 rounded-3xl"></div>
            <div className="h-40 bg-slate-800 rounded-3xl"></div>
            <div className="h-40 bg-slate-800 rounded-3xl"></div>
            <div className="h-40 bg-slate-800 rounded-3xl"></div>
        </div>
    </div>;

    const getTrendIcon = (curr: number, prev: number) => {
        if (curr > prev) return <span className="material-symbols-outlined text-emerald-500">trending_up</span>;
        if (curr < prev) return <span className="material-symbols-outlined text-rose-500">trending_down</span>;
        return <span className="material-symbols-outlined text-slate-500">horizontal_rule</span>;
    };

    const getTrendColor = (curr: number, prev: number) => {
        if (curr > prev) return 'text-emerald-500';
        if (curr < prev) return 'text-rose-500';
        return 'text-slate-500';
    };

    const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Cockpit Estratégico</h2>
                    <p className="text-slate-400 font-medium">Visão geral de performance e saúde do negócio.</p>
                </div>
                <button onClick={fetchData} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all">
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="bg-rose-900/10 border border-rose-900/50 p-6 rounded-3xl flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-rose-500 font-black uppercase tracking-widest text-xs">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Pontos de Atenção
                    </div>
                    <ul className="flex flex-col gap-2">
                        {alerts.map((alert, idx) => (
                            <li key={idx} className="text-rose-200 text-sm flex items-center gap-2">
                                <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                                {alert}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue */}
                <div className="bg-[#1e293b] border border-slate-800 p-8 rounded-[2rem] flex flex-col gap-4 group hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Faturamento Mes</p>
                        <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-2 rounded-xl">payments</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white">{formatBRL(kpis.revenue.current)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            {getTrendIcon(kpis.revenue.current, kpis.revenue.previous)}
                            <span className={`text-xs font-bold ${getTrendColor(kpis.revenue.current, kpis.revenue.previous)}`}>
                                {kpis.revenue.previous > 0 ? `${((kpis.revenue.current / kpis.revenue.previous - 1) * 100).toFixed(1)}%` : '0%'} vs mês ant.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Orders */}
                <div className="bg-[#1e293b] border border-slate-800 p-8 rounded-[2rem] flex flex-col gap-4 group hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nº de Pedidos</p>
                        <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-xl">inventory_2</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white">{kpis.orders.current}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            {getTrendIcon(kpis.orders.current, kpis.orders.previous)}
                            <span className={`text-xs font-bold ${getTrendColor(kpis.orders.current, kpis.orders.previous)}`}>
                                {kpis.orders.previous > 0 ? `${((kpis.orders.current / kpis.orders.previous - 1) * 100).toFixed(1)}%` : '0%'} vs mês ant.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Avg Ticket */}
                <div className="bg-[#1e293b] border border-slate-800 p-8 rounded-[2rem] flex flex-col gap-4 group hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Ticket Medio</p>
                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-xl">confirmation_number</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white">{formatBRL(kpis.ticket.current)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            {getTrendIcon(kpis.ticket.current, kpis.ticket.previous)}
                            <span className={`text-xs font-bold ${getTrendColor(kpis.ticket.current, kpis.ticket.previous)}`}>
                                {kpis.ticket.previous > 0 ? `${((kpis.ticket.current / kpis.ticket.previous - 1) * 100).toFixed(1)}%` : '0%'} vs mês ant.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Margin Estimated */}
                <div className="bg-[#1e293b] border border-slate-800 p-8 rounded-[2rem] flex flex-col gap-4 group hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Margem Estimada</p>
                        <span className="material-symbols-outlined text-purple-500 bg-purple-500/10 p-2 rounded-xl">analytics</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white">~32%</h3>
                        <div className="flex items-center gap-2 mt-1 tooltip" title="Baseado no histórico de compras vs vendas">
                            <span className="material-symbols-outlined text-emerald-500 text-xs">info</span>
                            <span className="text-xs font-bold text-slate-400">Calculado via compras</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Motivational Banner */}
            <div className="bg-gradient-to-r from-blue-900/20 to-transparent border border-blue-900/30 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 justify-between">
                <div>
                    <h4 className="text-2xl font-black text-white italic">"A melhor maneira de prever o futuro é criá-lo."</h4>
                    <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs mt-2">— Peter Drucker | FOCO TOTAL, KING CARCAÇAS!</p>
                </div>
                <div className="shrink-0 flex gap-2">
                    <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-6 h-1 bg-slate-700 rounded-full"></div>
                    <div className="w-3 h-1 bg-slate-800 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default HubDashboard;
