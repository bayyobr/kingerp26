import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/salesService';
import { Venda, Vendedor } from '../../types';
import { generateSalePDF, generateSalesReportPDF } from '../../services/pdfService';
import { vendedorService } from '../../services/vendedorService';

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | '30days' | 'year' | 'custom';

const SaleList: React.FC = () => {
    const [sales, setSales] = useState<Venda[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState<string>('');
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
    const [showSellerFilter, setShowSellerFilter] = useState<boolean>(false);
    const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
    const [bulkDeleteModal, setBulkDeleteModal] = useState<{ isOpen: boolean; returnStock: boolean }>({
        isOpen: false,
        returnStock: true
    });

    // Date Filter State (Dashboard Style)
    const [preset, setPreset] = useState<DatePreset>('month');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // Default to this month
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadSales();
    }, [startDate, endDate]);

    useEffect(() => {
        loadVendedores();
    }, []);

    const loadVendedores = async () => {
        try {
            const list = await vendedorService.getAll();
            setVendedores(list);
        } catch (error) {
            console.error('Error loading vendedores:', error);
        }
    };

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

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const loadSales = async () => {
        try {
            setLoading(true);
            const data = await salesService.getAll(startDate, endDate);
            setSales(data);
        } catch (error) {
            console.error('Error loading sales:', error);
            alert('Erro ao carregar vendas.');
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale => {
        const matchesStatus = filter === 'all' || sale.status === filter;
        
        // Filter by selected sellers (if any selected)
        const matchesSeller = selectedSellers.length === 0 || selectedSellers.includes(sale.vendedor_id);
        
        const searchLower = search.toLowerCase();
        const matchesSearch = 
            (sale.numero_venda?.toLowerCase() || '').includes(searchLower) ||
            (sale.cliente_nome?.toLowerCase() || '').includes(searchLower) ||
            (sale.vendedor?.nome?.toLowerCase() || '').includes(searchLower) ||
            (sale.forma_pagamento?.toLowerCase() || '').includes(searchLower);

        return matchesStatus && matchesSeller && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Concluída': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Pendente': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Reembolsada': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'Cancelada': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'Em Aberto': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; saleId: string | null; returnStock: boolean }>({
        isOpen: false,
        saleId: null,
        returnStock: true
    });

    const [refundModal, setRefundModal] = useState<{ isOpen: boolean; saleId: string | null; reason: string; returnStock: boolean }>({
        isOpen: false,
        saleId: null,
        reason: 'Desistência',
        returnStock: true
    });


    const handleDelete = async () => {
        if (!deleteModal.saleId) return;

        try {
            setLoading(true);
            await salesService.deleteSale(deleteModal.saleId, { returnStock: deleteModal.returnStock });
            setDeleteModal({ ...deleteModal, isOpen: false, saleId: null });
            await loadSales();
        } catch (error) {
            console.error('Error deleting sale:', error);
            alert('Erro ao excluir venda.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSaleIds.length === 0) return;

        try {
            setLoading(true);
            for (const id of selectedSaleIds) {
                await salesService.deleteSale(id, { returnStock: bulkDeleteModal.returnStock });
            }
            setBulkDeleteModal({ isOpen: false, returnStock: true });
            setSelectedSaleIds([]);
            await loadSales();
        } catch (error) {
            console.error('Error deleting sales:', error);
            alert('Erro ao excluir algumas vendas.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportSelected = () => {
        const salesToExport = sales.filter(s => selectedSaleIds.includes(s.id!));
        generateSalesReportPDF(salesToExport, startDate, endDate);
    };

    const handleRefund = async () => {
        if (!refundModal.saleId) return;

        try {
            setLoading(true);
            await salesService.refundSale(refundModal.saleId, refundModal.reason, { returnStock: refundModal.returnStock });
            setRefundModal({ ...refundModal, isOpen: false, saleId: null });
            await loadSales();
        } catch (error) {
            console.error('Error refunding sale:', error);
            alert('Erro ao processar reembolso.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Pedidos de Venda</h1>
                    <p className="text-slate-400 mt-1">Gerenciamento de vendas e pedidos do sistema.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 bg-surface-dark p-2 rounded-xl border border-slate-800">
                    {/* Multi-select de Vendedores */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowSellerFilter(!showSellerFilter)}
                            className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-primary outline-none min-w-[160px] flex items-center justify-between gap-2 h-full hover:bg-slate-700 transition-colors"
                        >
                            <span className="truncate">
                                {selectedSellers.length === 0 
                                    ? 'Todos os Vendedores' 
                                    : `${selectedSellers.length} Vendedor(es)`}
                            </span>
                            <span className="material-symbols-outlined text-[16px] text-slate-400">
                                {showSellerFilter ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                            </span>
                        </button>

                        {showSellerFilter && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowSellerFilter(false)} 
                                />
                                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-2 animate-fadeIn max-h-[300px] overflow-y-auto text-left">
                                    <div className="px-3 py-1.5 border-b border-slate-700 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Filtrar Vendedor</span>
                                        {selectedSellers.length > 0 && (
                                            <button 
                                                onClick={() => setSelectedSellers([])} 
                                                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase"
                                            >
                                                Limpar
                                            </button>
                                        )}
                                    </div>
                                    <div className="p-1 space-y-1">
                                        {vendedores.map(v => {
                                            const isSelected = selectedSellers.includes(v.id);
                                            return (
                                                <button
                                                    key={v.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedSellers(selectedSellers.filter(id => id !== v.id));
                                                        } else {
                                                            setSelectedSellers([...selectedSellers, v.id]);
                                                        }
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                                        isSelected 
                                                            ? 'bg-blue-600/20 text-blue-400 font-medium' 
                                                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                                                    }`}>
                                                        {isSelected && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                                                    </div>
                                                    <span className="truncate">{v.nome}</span>
                                                </button>
                                            );
                                        })}
                                        {vendedores.length === 0 && (
                                            <div className="text-center py-4 text-xs text-slate-500">Nenhum vendedor encontrado</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <select
                        value={preset}
                        onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
                        className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-primary outline-none min-w-[140px]"
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
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                            <span className="text-slate-500">até</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    )}

                    <button
                        onClick={loadSales}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        {loading ? '...' : 'Atualizar'}
                    </button>

                    <button
                        onClick={() => generateSalesReportPDF(filteredSales, startDate, endDate)}
                        disabled={loading || filteredSales.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                        title="Baixar Relatório em PDF para a contadora do período selecionado"
                    >
                        <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                        Exportar Contadora
                    </button>
                </div>
            </div>

            {/* Tabs / Filters */}
            <div className="flex border-b border-slate-800 gap-8 overflow-x-auto pb-px">
                {[
                    { id: 'all', label: 'Todas' },
                    { id: 'Em Aberto', label: 'Em Aberto' },
                    { id: 'Concluída', label: 'Concluídas' },
                    { id: 'Reembolsada', label: 'Reembolsadas' },
                    { id: 'Cancelada', label: 'Canceladas' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`pb-4 text-sm font-semibold transition-all relative ${filter === tab.id ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab.label}
                        {filter === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-4 py-2.5 bg-surface-dark border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    placeholder="Buscar por nº venda, cliente, vendedor ou forma de pagamento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-surface-dark border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-[#161b22]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-10 text-center">
                                    <label className="flex items-center justify-center cursor-pointer">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                            filteredSales.length > 0 && selectedSaleIds.length === filteredSales.length 
                                                ? 'bg-blue-500 border-blue-500' 
                                                : 'border-slate-600'
                                        }`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={filteredSales.length > 0 && selectedSaleIds.length === filteredSales.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSaleIds(filteredSales.map(s => s.id!).filter(Boolean));
                                                    } else {
                                                        setSelectedSaleIds([]);
                                                    }
                                                }}
                                            />
                                            {filteredSales.length > 0 && selectedSaleIds.length === filteredSales.length && (
                                                <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                            )}
                                        </div>
                                    </label>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nº Venda</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pagamento</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 bg-[#1e242b]">
                                        Nenhum pedido encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => {
                                    const isSelected = selectedSaleIds.includes(sale.id!);
                                    return (
                                        <tr key={sale.id || Math.random()} className={`hover:bg-slate-800/50 transition-colors group ${isSelected ? 'bg-slate-800/30' : ''}`}>
                                            <td className="px-6 py-4 text-center w-10">
                                                <label className="flex items-center justify-center cursor-pointer">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                                                    }`}>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedSaleIds([...selectedSaleIds, sale.id!]);
                                                                } else {
                                                                    setSelectedSaleIds(selectedSaleIds.filter(id => id !== sale.id));
                                                                }
                                                            }}
                                                        />
                                                        {isSelected && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                                                    </div>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-bold text-sm">#{sale.numero_venda || (sale.id ? sale.id.substring(0, 8) : '---')}</span>
                                            </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium text-sm">{sale.cliente_nome || 'Consumidor Final'}</span>
                                                <span className="text-slate-500 text-xs">
                                                    {sale.vendedor?.nome 
                                                        ? `Vendedor: ${sale.vendedor.nome}` 
                                                        : sale.vendedor_id 
                                                            ? 'Vendedor Vinculado' 
                                                            : 'Sem vendedor'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {sale.created_at ? (
                                                <>
                                                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                                                    <span className="text-slate-600 ml-2">
                                                        {new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </>
                                            ) : '---'}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-slate-300 text-sm bg-slate-800 px-2 py-1 rounded">
                                                {sale.forma_pagamento || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-bold text-sm">
                                                R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(sale.status || 'Pendente')}`}>
                                                    {sale.status || 'Pendente'}
                                                </span>
                                                {sale.status === 'Reembolsada' && sale.refund_reason && (
                                                    <span className="text-[10px] text-slate-400">{sale.refund_reason}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => generateSalePDF(sale)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all flex items-center justify-center"
                                                    title="Baixar Recibo PDF"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                                </button>
                                                <a
                                                    href={`#/vendas?edit=${sale.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all flex items-center justify-center"
                                                    title="Visualizar / Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </a>
                                                <button
                                                    onClick={() => setRefundModal({ isOpen: true, saleId: sale.id || null, reason: 'Desistência', returnStock: true })}
                                                    className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                                                    title="Reembolsar Venda"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, saleId: sale.id || null, returnStock: true })}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Excluir Venda"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1c2128] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-red-500 mb-4">
                                <span className="material-symbols-outlined text-3xl">warning</span>
                                <h3 className="text-xl font-bold text-white">Excluir Venda</h3>
                            </div>
                            <p className="text-slate-400 mb-6">
                                Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                            </p>

                            <div className="space-y-4 mb-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${deleteModal.returnStock ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={deleteModal.returnStock}
                                            onChange={(e) => setDeleteModal({ ...deleteModal, returnStock: e.target.checked })}
                                        />
                                        {deleteModal.returnStock && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <span className="text-sm text-slate-300">Retornar itens ao estoque</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                                    <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-[16px]">check</span>
                                    </div>
                                    <span className="text-sm text-slate-300">Estornar contas lançadas (Automático)</span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Confirmar Exclusão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {refundModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1c2128] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-purple-500 mb-4">
                                <span className="material-symbols-outlined text-3xl">currency_exchange</span>
                                <h3 className="text-xl font-bold text-white">Reembolsar Venda</h3>
                            </div>
                            <p className="text-slate-400 mb-4 text-sm">
                                Informe o motivo do reembolso e se os itens devem retornar ao estoque. O status da venda será alterado para <strong>Reembolsada</strong>.
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Motivo do Reembolso</label>
                                    <select
                                        value={refundModal.reason}
                                        onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                                        className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none w-full"
                                    >
                                        <option value="Desistência">Desistência</option>
                                        <option value="Não Entregue">Não Entregue</option>
                                        <option value="Retornado por Defeito">Retornado por Defeito</option>
                                        <option value="Arrependimento (7 dias)">Arrependimento (7 dias)</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${refundModal.returnStock ? 'bg-purple-500 border-purple-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={refundModal.returnStock}
                                            onChange={(e) => setRefundModal({ ...refundModal, returnStock: e.target.checked })}
                                        />
                                        {refundModal.returnStock && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <span className="text-sm text-slate-300">Retornar itens ao estoque</span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRefundModal({ ...refundModal, isOpen: false })}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRefund}
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Confirmar Reembolso
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions Floating Bar */}
            {selectedSaleIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1c2128] border border-slate-700 rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 z-50 animate-bounceOnce">
                    <span className="text-sm font-semibold text-white whitespace-nowrap">
                        {selectedSaleIds.length} selecionado(s)
                    </span>
                    <div className="h-4 w-px bg-slate-700" />
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleExportSelected}
                            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-full text-xs font-bold text-white transition-colors"
                            title="Exportar itens selecionados para a contadora"
                        >
                            <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
                            Exportar PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteModal({ isOpen: true, returnStock: true })}
                            className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-full text-xs font-bold text-white transition-colors"
                            title="Excluir itens selecionados"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Excluir
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {bulkDeleteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1c2128] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-red-500 mb-4">
                                <span className="material-symbols-outlined text-3xl">warning</span>
                                <h3 className="text-xl font-bold text-white">Excluir Vendas em Lote</h3>
                            </div>
                            <p className="text-slate-400 mb-6">
                                Tem certeza que deseja excluir as <strong>{selectedSaleIds.length}</strong> vendas selecionadas? Esta ação é irreversível.
                            </p>

                            <div className="space-y-4 mb-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${bulkDeleteModal.returnStock ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={bulkDeleteModal.returnStock}
                                            onChange={(e) => setBulkDeleteModal({ ...bulkDeleteModal, returnStock: e.target.checked })}
                                        />
                                        {bulkDeleteModal.returnStock && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <span className="text-sm text-slate-300">Retornar itens ao estoque</span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setBulkDeleteModal({ ...bulkDeleteModal, isOpen: false })}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Confirmar Exclusão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaleList;

