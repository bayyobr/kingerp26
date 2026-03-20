import React from 'react';
import { SellerRanking } from '../../services/dashboardService';

interface TeamGoalsProps {
    sellers: SellerRanking[];
    loading?: boolean;
}

export const TeamGoals: React.FC<TeamGoalsProps> = ({ sellers, loading }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Strategic Goals - Simplified for Dashboard */}
            <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">target</span>
                        Metas da Loja
                    </h3>
                    <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider">Abrir Hub</button>
                </div>

                <div className="flex flex-col gap-8 justify-center h-[calc(100%-80px)]">
                    <div className="text-center">
                        <div className="relative inline-flex items-center justify-center">
                            <svg className="w-32 h-32">
                                <circle className="text-slate-800" strokeWidth="10" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                <circle className="text-primary" strokeWidth="10" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * 0.68)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-2xl font-black text-white">68%</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Geral</span>
                            </div>
                        </div>
                        <p className="mt-4 text-sm font-bold text-white">Faturamento Mensal</p>
                        <p className="text-xs text-slate-400">Tempo restante: 11 dias</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <span className="material-symbols-outlined text-amber-500 text-xl">trending_up</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white uppercase tracking-tight">Novos Clientes</p>
                                <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <span className="text-xs font-black text-slate-400">45%</span>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <span className="material-symbols-outlined text-emerald-500 text-xl">shopping_cart</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white uppercase tracking-tight">Quantidade de Vendas</p>
                                <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: '92%' }}></div>
                                </div>
                            </div>
                            <span className="text-xs font-black text-slate-400">92%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
