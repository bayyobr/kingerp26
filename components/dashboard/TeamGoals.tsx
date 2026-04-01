import React from 'react';
import { SellerRanking } from '../../services/dashboardService';

interface TeamGoalsProps {
    sellers: SellerRanking[];
    loading?: boolean;
}

export const TeamGoals: React.FC<TeamGoalsProps> = ({ sellers, loading }) => {
    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Seller Rankings */}
            <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">military_tech</span>
                        Ranking de Vendedores
                    </h3>
                    <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider">Metas Detalhadas</button>
                </div>

                <div className="space-y-6">
                    {sellers.slice(0, 4).map((s, i) => (
                        <div key={s.vendedor_id}>
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                                        {i+1}
                                    </div>
                                    <span className="text-sm font-bold text-white">{s.vendedor_nome}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-white">R$ {s.valor_vendido.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 ml-2">({s.pedidos_count} pedidos)</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${
                                        s.progresso >= 100 ? 'bg-emerald-500' : s.progresso >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(s.progresso, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-slate-500 uppercase font-black">Progresso da Meta</span>
                                <span className={`text-[10px] font-black ${s.progresso >= 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {s.progresso.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
