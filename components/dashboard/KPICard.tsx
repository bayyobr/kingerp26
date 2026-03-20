import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface KPICardProps {
    title: string;
    value: string | number;
    variation: number;
    sparklineData: number[];
    icon: string;
    loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, variation, sparklineData, icon, loading }) => {
    const isPositive = variation >= 0;
    
    if (loading) {
        return (
            <div className="bg-surface-dark border border-slate-800 p-6 rounded-2xl animate-pulse">
                <div className="h-4 w-24 bg-slate-700 rounded mb-4"></div>
                <div className="h-8 w-32 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-16 bg-slate-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-surface-dark border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all group overflow-hidden relative">
            {/* Background Icon Glow */}
            <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-7xl text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                {icon}
            </span>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
                    
                    <div className="flex items-center gap-1.5">
                        <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                            <span className="material-symbols-outlined text-[14px]">
                                {isPositive ? 'trending_up' : 'trending_down'}
                            </span>
                            {Math.abs(variation).toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">vs período anterior</span>
                    </div>
                </div>

                <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData.map((val, i) => ({ val, i }))}>
                            <Line 
                                type="monotone" 
                                dataKey="val" 
                                stroke={isPositive ? '#10b981' : '#f43f5e'} 
                                strokeWidth={2} 
                                dot={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
