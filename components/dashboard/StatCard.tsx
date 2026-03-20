import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    showProgressBar?: boolean;
    progressBarValue?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtext,
    trend,
    trendValue,
    showProgressBar,
    progressBarValue = 0
}) => {
    return (
        <div className="p-6 rounded-2xl bg-surface-dark border border-slate-800 flex flex-col justify-between h-full hover:border-slate-700 transition-colors">
            <div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
                <div className="text-3xl font-bold text-white mb-2">
                    {value}
                </div>
            </div>

            <div>
                {trend ? (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
                            trend === 'down' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                        <span className="material-symbols-outlined text-[14px]">
                            {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove'}
                        </span>
                        {trendValue} {subtext}
                    </div>
                ) : (
                    subtext && <p className="text-slate-500 text-sm">{subtext}</p>
                )}

                {showProgressBar && (
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, progressBarValue))}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
};
