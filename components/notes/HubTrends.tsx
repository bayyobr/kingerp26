import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';

const HubTrends: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        fetchTrends();
    }, []);

    const fetchTrends = async () => {
        setLoading(true);
        try {
            // Simulated 12-month data as RPC might not be ready yet
            const mockData = [
                { month: 'Abr', revenue: 45000, orders: 120 },
                { month: 'Mai', revenue: 52000, orders: 145 },
                { month: 'Jun', revenue: 48000, orders: 130 },
                { month: 'Jul', revenue: 61000, orders: 180 },
                { month: 'Ago', revenue: 55000, orders: 160 },
                { month: 'Set', revenue: 67000, orders: 195 },
                { month: 'Out', revenue: 72000, orders: 210 },
                { month: 'Nov', revenue: 85000, orders: 250 },
                { month: 'Dez', revenue: 110000, orders: 320 },
                { month: 'Jan', revenue: 65000, orders: 190 },
                { month: 'Fev', revenue: 58000, orders: 170 },
                { month: 'Mar', revenue: 75000, orders: 220 },
            ];
            setData(mockData);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="h-96 bg-slate-800 animate-pulse rounded-[2.5rem]"></div>;

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const minRevenue = Math.min(...data.map(d => d.revenue));

    return (
        <div className="flex flex-col gap-8 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Análise de Tendências</h2>
                <p className="text-slate-400 font-medium">Comportamento histórico e projeções de sazonalidade.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Revenue Evolution */}
                <div className="xl:col-span-2 bg-[#1e293b] border border-slate-800 p-8 rounded-[2.5rem] flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Evolução de Faturamento (12 Meses)</h4>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                ALTA TEMPORADA
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-80 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#475569" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', color: '#fff' }}
                                    itemStyle={{ color: '#60a5fa', fontWeight: 900 }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sazonalidade & Highlights */}
                <div className="flex flex-col gap-6">
                    <div className="bg-emerald-900/10 border border-emerald-900/40 p-8 rounded-[2.5rem] flex flex-col gap-4">
                        <span className="material-symbols-outlined text-emerald-500 text-3xl">star</span>
                        <div>
                            <h4 className="text-white font-black text-lg">Pico Histórico</h4>
                            <p className="text-emerald-200/70 text-sm mt-1">Dezembro registrou o melhor desempenho do ano com faturamento de R$ 110.000.</p>
                        </div>
                    </div>

                    <div className="bg-rose-900/10 border border-rose-900/40 p-8 rounded-[2.5rem] flex flex-col gap-4">
                        <span className="material-symbols-outlined text-rose-500 text-3xl">trending_down</span>
                        <div>
                            <h4 className="text-white font-black text-lg">Baixa Sazonal</h4>
                            <p className="text-rose-200/70 text-sm mt-1">Abril e Fevereiro apresentam as menores médias históricas. Sugestão: Campanhas agressivas nestes meses.</p>
                        </div>
                    </div>

                    <div className="bg-[#1e293b] border border-slate-800 p-8 rounded-[2.5rem] flex-1 flex flex-col justify-center items-center text-center gap-4">
                        <div className="relative">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - 0.72)} className="text-blue-500" strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-white font-black">72%</span>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nível de Crescimento</p>
                            <p className="text-white font-bold text-lg">Ano sobre Ano</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HubTrends;
