import React, { useState, useEffect } from 'react';
import { Vendedor, VendedorStats } from '../../types';
import { vendedorStatsService } from '../../services/vendedorStatsService';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface VendedorProfileProps {
  vendedor: Vendedor;
  onBack: () => void;
}

const VendedorProfile: React.FC<VendedorProfileProps> = ({ vendedor, onBack }) => {
  const [stats, setStats] = useState<VendedorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number | 'custom'>(30);
  
  useEffect(() => {
    loadStats();
  }, [vendedor.id, period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await vendedorStatsService.getVendedorStats(vendedor.id, period);
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current: number, goal: number) => {
    if (!goal || goal === 0) return 100;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-emerald-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200 dark:border-border-dark">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 transition-colors">
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </button>
          
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl overflow-hidden shadow-inner">
            {vendedor.foto_url ? (
              <img src={vendedor.foto_url} alt={vendedor.nome} className="w-full h-full object-cover" />
            ) : (
              vendedor.nome.charAt(0).toUpperCase()
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{vendedor.nome}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                {vendedor.cargo}
              </span>
              <span className="text-slate-500 text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Entrou em {new Date(vendedor.data_entrada || vendedor.data_admissao || '').toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Período de Análise</label>
          <select 
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value) as any)}
            className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 font-medium text-slate-700 dark:text-slate-100 min-w-[180px]"
          >
            <option value={1}>Hoje</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {stats && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Vendas Totais" 
              value={formatCurrency(stats.totalSold)} 
              diff={stats.totalSoldDiff} 
              icon="monetization_on"
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <KPICard 
              title="Pedidos Fechados" 
              value={stats.orderCount.toString()} 
              diff={stats.orderCountDiff} 
              icon="shopping_basket"
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <KPICard 
              title="Ticket Médio" 
              value={formatCurrency(stats.averageTicket)} 
              diff={stats.averageTicketDiff} 
              icon="trending_up"
              color="text-amber-500"
              bg="bg-amber-500/10"
            />
            <KPICard 
              title="Comissão Prevista" 
              value={formatCurrency(stats.totalCommission)} 
              diff={stats.totalCommissionDiff} 
              icon="workspace_premium"
              color="text-purple-500"
              bg="bg-purple-500/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metas & Goals */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">flag</span>
                Metas do Período
              </h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Volume Financeiro</p>
                      <p className="text-xl font-bold dark:text-white">
                        {formatCurrency(stats.totalSold)} <span className="text-sm font-normal text-slate-400">/ {formatCurrency(vendedor.meta_vendas_mensal || 0)}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {Math.round(calculateProgress(stats.totalSold, vendedor.meta_vendas_mensal || 0))}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getProgressColor(calculateProgress(stats.totalSold, vendedor.meta_vendas_mensal || 0))}`}
                      style={{ width: `${calculateProgress(stats.totalSold, vendedor.meta_vendas_mensal || 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Quantidade de Pedidos</p>
                      <p className="text-xl font-bold dark:text-white">
                        {stats.orderCount} <span className="text-sm font-normal text-slate-400">/ {vendedor.meta_pedidos_mensal || 0}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {Math.round(calculateProgress(stats.orderCount, vendedor.meta_pedidos_mensal || 0))}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getProgressColor(calculateProgress(stats.orderCount, vendedor.meta_pedidos_mensal || 0))}`}
                      style={{ width: `${calculateProgress(stats.orderCount, vendedor.meta_pedidos_mensal || 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center gap-3">
                 <span className={`material-symbols-outlined ${calculateProgress(stats.totalSold, vendedor.meta_vendas_mensal || 0) >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    info
                 </span>
                 <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                    {calculateProgress(stats.totalSold, vendedor.meta_vendas_mensal || 0) >= 100 
                      ? 'Parabéns! Meta de faturamento atingida.' 
                      : `Ainda faltam ${formatCurrency((vendedor.meta_vendas_mensal || 0) - stats.totalSold)} para bater a meta.`
                    }
                 </p>
              </div>
            </div>

            {/* Performance Over Time */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">leaderboard</span>
                Evolução Semestral
              </h3>
              
              <div className="h-[250px] flex items-end justify-between gap-4 mt-4">
                 {stats.salesEvolution.map((item, idx) => {
                   const maxVal = Math.max(...stats.salesEvolution.map(e => e.value), 100);
                   const hPerc = (item.value / maxVal) * 100;
                   return (
                     <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="relative w-full flex justify-center h-full items-end">
                            <div 
                              className="w-full max-w-[40px] bg-primary/20 hover:bg-primary rounded-t-lg transition-all duration-500 flex flex-col justify-end overflow-hidden"
                              style={{ height: `${Math.max(hPerc, 2)}%` }}
                            >
                                <div className="p-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-bold text-white text-center">
                                  {item.value > 1000 ? `${(item.value/1000).toFixed(1)}k` : Math.round(item.value)}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.month}</span>
                     </div>
                   )
                 })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  Top 5 Mais Vendidos
                </h3>
                
                <div className="space-y-4">
                   {stats.topProducts.map((prod, idx) => (
                     <div key={idx} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <div className="flex justify-between items-center mb-1">
                             <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate pr-4">{prod.name}</p>
                             <p className="text-xs font-bold text-primary">{Math.round(prod.percentOfTotal)}%</p>
                           </div>
                           <div className="flex justify-between items-center text-xs text-slate-500">
                             <span>{prod.quantity} unidades</span>
                             <span>Gera {formatCurrency(prod.totalGenerated)}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                   {stats.topProducts.length === 0 && (
                     <p className="text-slate-500 text-center py-8">Sem dados de itens no período.</p>
                   )}
                </div>
            </div>

            {/* Recent Sales / Table */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-100 dark:border-border-dark">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Cálculo de Comissões</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-surface-darker text-slate-500 uppercase">
                       <tr>
                         <th className="p-3">Data</th>
                         <th className="p-3">Valor</th>
                         <th className="p-3 text-right">Comissão ({vendedor.comissao_percentual || 0}%)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                       {/* This would normally load a fresh slice of sales, for now we can show summary or mock */}
                       <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="p-3 font-medium text-slate-400" colSpan={3}>
                             No resumo total deste período, este vendedor gerou:
                          </td>
                       </tr>
                       <tr>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">Resumo Consolidado</td>
                          <td className="p-4 font-bold text-emerald-500">{formatCurrency(stats.totalSold)}</td>
                          <td className="p-4 text-right font-bold text-primary">{formatCurrency(stats.totalCommission)}</td>
                       </tr>
                    </tbody>
                 </table>
               </div>
               <div className="p-4 bg-primary/5 mt-auto flex justify-between items-center">
                  <span className="text-xs font-bold text-primary uppercase">Status Pagamento</span>
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-500 rounded text-[10px] font-bold">AGUARDANDO FECHAMENTO</span>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  diff: number;
  icon: string;
  color: string;
  bg: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, diff, icon, color, bg }) => {
  const isPositive = diff >= 0;
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm group hover:border-primary/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center ${color}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          <span className="material-symbols-outlined text-sm">{isPositive ? 'trending_up' : 'trending_down'}</span>
          {isPositive ? '+' : ''}{diff.toFixed(1)}%
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
};

export default VendedorProfile;
