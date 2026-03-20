import React from 'react';
import { TopProduct, TopClient } from '../../services/dashboardService';

interface RankingListsProps {
    products: TopProduct[];
    clients: TopClient[];
    loading?: boolean;
}

export const RankingLists: React.FC<RankingListsProps> = ({ products, clients, loading }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">inventory_2</span>
                        Top 5 Produtos
                    </h3>
                    <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider">Ver Detalhes</button>
                </div>

                <div className="space-y-4">
                    {products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-4">#{i+1}</span>
                                <div>
                                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{p.name}</p>
                                    <p className="text-xs text-slate-400">{p.value} unidades vendidas</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">R$ {p.totalRevenue.toLocaleString()}</p>
                                <span className="text-[10px] text-emerald-500 font-bold">+12%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Clients */}
            <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-500">groups</span>
                        Top 5 Clientes
                    </h3>
                    <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider">Ver Detalhes</button>
                </div>

                <div className="space-y-4">
                    {clients.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-300">{c.nome.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        {c.nome}
                                        {c.isVip && <span className="bg-amber-500/20 text-amber-500 text-[9px] px-1 rounded uppercase font-black">VIP</span>}
                                    </p>
                                    <p className="text-xs text-slate-400">{c.pedidos} pedidos realizados</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">R$ {c.totalGasto.toLocaleString()}</p>
                                <span className="text-[10px] text-slate-500 font-medium">Gasto Total</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
