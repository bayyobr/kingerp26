import React from 'react';
import { DashboardActivity } from '../../services/dashboardService';

interface ActivityFeedProps {
    activities: DashboardActivity[];
    loading?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, loading }) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'venda': return 'shopping_cart';
            case 'os': return 'build';
            case 'cliente': return 'person_add';
            case 'estoque': return 'inventory';
            default: return 'bolt';
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'venda': return 'bg-emerald-500/10 text-emerald-500';
            case 'os': return 'bg-blue-500/10 text-blue-500';
            case 'cliente': return 'bg-purple-500/10 text-purple-500';
            case 'estoque': return 'bg-amber-500/10 text-amber-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    return (
        <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Atividade Recente
                </h3>
                <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider">Ver Log Completo</button>
            </div>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-800"></div>

                <div className="space-y-6 relative">
                    {activities.map((act) => (
                        <div key={act.id} className="flex gap-4 group">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${getIconBg(act.type)}`}>
                                <span className="material-symbols-outlined text-[20px]">
                                    {getIcon(act.type)}
                                </span>
                            </div>
                            
                            <div className="flex-1 pt-0.5">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                        {act.title}
                                    </h4>
                                    <span className="text-[10px] font-medium text-slate-500">{act.time}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{act.description}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center">
                                        <span className="text-[8px] font-black text-slate-400">{act.user.charAt(0)}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{act.user}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
