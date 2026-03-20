
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ServiceOrder, OSStatus } from '../types';
import { STATUS_COLORS } from '../constants';

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | '30days' | 'year' | 'custom';

interface OSListProps {
  orders: ServiceOrder[];
  onDelete: (id: string) => void;
  onRefresh: (startDate?: string, endDate?: string) => Promise<void>;
}

const OSList: React.FC<OSListProps> = ({ orders, onDelete, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Todas' | 'Abertas' | 'Concluidas' | 'Canceladas'>('Todas');

  // Date Filter State
  const [preset, setPreset] = useState<DatePreset>('month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const end = new Date();
    const start = new Date();

    switch (newPreset) {
      case 'today': break;
      case 'yesterday':
        start.setDate(end.getDate() - 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - end.getDay());
        break;
      case 'month':
        start.setDate(1);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      case 'custom':
        return;
    }

    const s = start.toISOString().split('T')[0];
    const e = end.toISOString().split('T')[0];
    setStartDate(s);
    setEndDate(e);
    onRefresh(s, e);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.osNumber?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.client?.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.device?.model?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.device?.imei?.toLowerCase() || '').includes(search.toLowerCase());

    if (activeTab === 'Todas') return matchesSearch;
    if (activeTab === 'Abertas') {
      return matchesSearch && [OSStatus.ABERTO, OSStatus.EM_ANALISE, OSStatus.AGUARDANDO_PECAS].includes(order.status);
    }
    if (activeTab === 'Concluidas') {
      return matchesSearch && [OSStatus.PRONTO, OSStatus.CONCLUIDO].includes(order.status);
    }
    if (activeTab === 'Canceladas') {
      return matchesSearch && order.status === OSStatus.CANCELADO;
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Ordens de Serviço</h1>
          <p className="text-slate-500 dark:text-[#a2aab4] text-sm md:text-base">Gerencie e acompanhe todos os chamados técnicos.</p>
        </div>
        <Link to="/vendas/ordens/nova" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95">
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Nova OS</span>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 overflow-x-auto custom-scrollbar">
        {(['Todas', 'Abertas', 'Concluidas', 'Canceladas'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/50">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-50 dark:bg-surface-darker text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary sm:text-sm"
            placeholder="Buscar por nº OS, Cliente ou IMEI..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 bg-slate-50 dark:bg-surface-darker p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
            className="bg-white dark:bg-surface-dark text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none min-w-[140px]"
          >
            <option value="today">Dia Atual</option>
            <option value="yesterday">Ontem</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="30days">Últimos 30 Dias</option>
            <option value="year">Este Ano</option>
            <option value="custom">Selecionar Período</option>
          </select>

          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  onRefresh(e.target.value, endDate);
                }}
                className="bg-white dark:bg-surface-dark text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-slate-500">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  onRefresh(startDate, e.target.value);
                }}
                className="bg-white dark:bg-surface-dark text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <button
            onClick={() => onRefresh(startDate, endDate)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-bold text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Atualizar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-3">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <div className="col-span-2">Dados da OS</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-3">Aparelho</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Data</div>
          <div className="col-span-1 text-right">Ação</div>
        </div>

        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <div key={order.id} className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:px-6 md:py-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/50 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all items-center">
            {/* Order Info */}
            <div className="col-span-2 flex flex-row md:flex-col justify-between items-center md:items-start w-full">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${order.status === OSStatus.EM_ANALISE ? 'bg-primary animate-pulse' : 'bg-slate-400'}`}></div>
                <Link to={`/vendas/ordens/editar/${order.id}`} className="text-primary font-bold text-sm md:text-base hover:underline">
                  {order.osNumber}
                </Link>
              </div>
            </div>

            {/* Client */}
            <div className="col-span-3 flex items-center gap-3 w-full border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0 mt-3 md:mt-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('https://picsum.photos/seed/${order.client?.name || 'cliente'}/200')` }}></div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{order.client?.name || 'Cliente Sem Nome'}</p>
                <p className="text-xs text-slate-500 dark:text-[#a2aab4] truncate">{order.client?.phone || 'Sem telefone'}</p>
              </div>
            </div>

            {/* Device */}
            <div className="col-span-3 flex items-center gap-3 w-full border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0 mt-3 md:mt-0">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-surface-darker text-slate-500 shrink-0">
                <span className="material-symbols-outlined text-[20px]">smartphone</span>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.device?.model || 'Aparelho Desconhecido'}</p>
                <p className="text-xs text-slate-500 dark:text-[#a2aab4] font-mono truncate">IMEI: ...{order.device?.imei?.slice(-5) || '---'}</p>
              </div>
            </div>

            {/* Status */}
            <div className="col-span-2 w-full pt-3 md:pt-0 mt-3 md:mt-0 flex md:block justify-between items-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${order.status === OSStatus.PRONTO ? 'bg-emerald-500' : 'bg-current'}`}></span>
                {order.status}
              </span>
            </div>

            {/* Date */}
            <div className="col-span-1 w-full pt-1 md:pt-0 flex md:block justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-slate-300">{new Date(order.entryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                <span className="text-[10px] text-slate-400">Entrada</span>
              </div>
            </div>

            {/* Action */}
            <div className="col-span-1 flex justify-end gap-2 w-full pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 mt-2 md:mt-0">
              <Link to={`/vendas/ordens/editar/${order.id}`} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-surface-darker rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </Link>
              <button
                onClick={() => onDelete(order.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center bg-white dark:bg-surface-dark rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inbox</span>
            <p className="text-slate-500">Nenhuma ordem de serviço encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OSList;
