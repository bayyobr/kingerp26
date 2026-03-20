import { Link } from 'react-router-dom';
import { RecentSale } from '../../services/dashboardService';

interface RecentSalesProps {
    sales: RecentSale[];
}

export const RecentSales: React.FC<RecentSalesProps> = ({ sales }) => {
    return (
        <div className="bg-surface-dark p-6 rounded-2xl border border-slate-800 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">receipt_long</span>
                    <h3 className="text-lg font-bold text-white">Últimas Vendas Lançadas</h3>
                </div>
                <Link to="/vendas/pedidos" className="text-xs text-primary font-bold hover:underline">Ver histórico completo</Link>
            </div>

            <div className="flex flex-col gap-4">
                {sales.length === 0 ? (
                    <div className="text-slate-500 text-sm text-center py-4">Nenhuma venda recente.</div>
                ) : (
                    sales.map((sale) => (
                        <div key={sale.id} className="flex items-center p-4 bg-[#161b22] rounded-xl hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
                            {/* Avatar */}
                            <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs mr-4 shrink-0">
                                {sale.cliente_nome ? sale.cliente_nome.substring(0, 1).toUpperCase() : 'C'}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-bold truncate">{sale.cliente_nome || 'Consumidor Final'}</h4>
                                <p className="text-slate-500 text-xs truncate">{sale.vendedor_nome || 'Venda de produtos'}</p>
                            </div>

                            {/* Value & Time */}
                            <div className="text-right ml-4">
                                <p className="text-white text-sm font-bold">R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-slate-500 text-xs mt-0.5">
                                    {new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
