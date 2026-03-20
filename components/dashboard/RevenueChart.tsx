import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RevenueData, DashboardChartsData } from '../../services/dashboardService';

interface RevenueChartProps {
    data: DashboardChartsData;
    minimal?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#13191f] border border-slate-700 p-3 rounded-lg shadow-xl ring-1 ring-white/10">
                <p className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">{label}</p>
                <p className="text-blue-400 font-black text-lg">
                    R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, minimal }) => {
    const [activeTab, setActiveTab] = React.useState<'total' | 'sales' | 'services'>('total');

    const chartData = data[activeTab] || [];

    if (minimal) {
        return (
            <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValueMin" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#1e242b" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            hide={chartData.length > 10}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValueMin)"
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return (
        <div className="bg-[#13191f] p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Análise Dinâmica de Faturamento</h3>
                    <p className="text-sm text-slate-500 font-medium">
                        {chartData.length <= 1 ? 'Dados do dia selecionado' :
                            chartData.length <= 7 ? 'Comparativo temporal da última semana' :
                                `Análise dos últimos ${chartData.length} dias`}
                    </p>
                </div>

                <div className="flex bg-[#0d1117] rounded-2xl p-1.5 border border-slate-800 shadow-inner">
                    <button
                        onClick={() => setActiveTab('total')}
                        className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'total' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Faturamento
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Vendas
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'services' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Serviços
                    </button>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#1e242b" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                            dy={10}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                            tickFormatter={(value) => value === 0 ? '0' : value.toString()}
                            domain={[0, 'auto']}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '5 5' }} />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#2563eb"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
