import React from 'react';
import { PriorityOS, LowStockProduct, RecentSale } from '../../services/dashboardService';
import { Link } from 'react-router-dom';

interface ListsProps {
    priorityOS: PriorityOS[];
    lowStock: LowStockProduct[];
    recentSales: RecentSale[];
}

export const DashboardLists: React.FC<ListsProps> = ({ priorityOS, lowStock, recentSales }) => {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Priority OS */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-border-dark flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">OS Prioritárias</h3>
                    <Link to="/vendas/ordens" className="text-sm text-primary hover:text-primary-dark font-medium">Ver todas</Link>
                </div>
                <div className="flex-1 overflow-auto">
                    {priorityOS.length === 0 ? (
                        <p className="text-slate-500 text-sm">Nenhuma OS pendente.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {priorityOS.map(os => (
                                <div key={os.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-surface-darker rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{os.aparelho_modelo}</p>
                                        <p className="text-xs text-slate-500 truncate">{os.cliente_nome}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${new Date(os.data_prometida) < new Date() ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {new Date(os.data_prometida).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-border-dark flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Estoque Baixo
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{lowStock.length}</span>
                    </h3>
                    <Link to="/cadastro/produtos" className="text-sm text-primary hover:text-primary-dark font-medium">Gerenciar</Link>
                </div>
                <div className="flex-1 overflow-auto">
                    {lowStock.length === 0 ? (
                        <p className="text-slate-500 text-sm text-green-600">Estoque saudável.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {lowStock.slice(0, 5).map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                                        <p className="text-xs text-red-500 font-medium">Mín: {item.minStock}</p>
                                    </div>
                                    <div className="text-red-600 font-bold text-lg">
                                        {item.stock}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-border-dark flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimas Vendas</h3>
                    <Link to="/vendas/pedidos" className="text-sm text-primary hover:text-primary-dark font-medium">Histórico</Link>
                </div>
                <div className="flex-1 overflow-auto">
                    {recentSales.length === 0 ? (
                        <p className="text-slate-500 text-sm">Nenhuma venda recente.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recentSales.map(sale => (
                                <Link to={`/vendas`} key={sale.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-surface-darker rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                                            <span className="material-symbols-outlined text-sm">attach_money</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">R$ {Number(sale.total).toFixed(2)}</p>
                                            <p className="text-xs text-slate-500 truncate">{sale.cliente_nome}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{new Date(sale.created_at).toLocaleTimeString().slice(0, 5)}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{sale.vendedor_nome}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
