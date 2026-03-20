import React, { useState, useEffect } from 'react';
import { StockMovement, Product } from '../types';
import { stockService } from '../services/stockService';
import { productService } from '../services/productService';

const StockHistory: React.FC = () => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);

    // Filters
    const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMovement, setNewMovement] = useState({
        productId: '',
        type: 'entrada',
        quantity: 1,
        reason: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterData();
    }, [movements, filterType, searchTerm]);

    const loadData = async () => {
        try {
            const [history, productList] = await Promise.all([
                stockService.getFullHistory(),
                productService.getAll()
            ]);
            setMovements(history);
            setProducts(productList);
        } catch (error) {
            console.error("Failed to load stock history:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = movements;

        if (filterType !== 'all') {
            result = result.filter(m => m.type === filterType);
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.productName.toLowerCase().includes(lowerSearch) ||
                m.reason.toLowerCase().includes(lowerSearch)
            );
        }

        setFilteredMovements(result);
    };

    const handleSaveMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMovement.productId || newMovement.quantity <= 0) return;

        const product = products.find(p => p.id === newMovement.productId);
        if (!product) return;

        try {
            await stockService.addMovement({
                productId: newMovement.productId,
                productName: product.name,
                type: newMovement.type as 'entrada' | 'saida',
                quantity: Number(newMovement.quantity),
                reason: newMovement.reason || 'Ajuste Manual'
            });

            // Refresh data
            loadData();
            setIsModalOpen(false);
            setNewMovement({ productId: '', type: 'entrada', quantity: 1, reason: '' });
        } catch (error) {
            console.error("Failed to save movement:", error);
            alert("Erro ao salvar movimentação. Verifique o console.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-surface-darker">
            {/* Header / Filters */}
            <div className="p-6 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-border-dark flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar produto ou motivo..."
                            className="pl-10 pr-4 py-2 w-full rounded-lg bg-slate-100 dark:bg-surface-darker border-none outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 dark:text-slate-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="p-2 rounded-lg bg-slate-100 dark:bg-surface-darker border-none outline-none text-slate-600 dark:text-slate-200 cursor-pointer"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as any)}
                    >
                        <option value="all">Todas</option>
                        <option value="entrada">Entradas</option>
                        <option value="saida">Saídas</option>
                    </select>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Registrar Movimentação
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-surface-darker text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Produto</th>
                                <th className="p-4 text-center">Tipo</th>
                                <th className="p-4 text-center">Quantidade</th>
                                <th className="p-4">Motivo / Origem</th>
                                <th className="p-4">Usuário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando histórico...</td></tr>
                            ) : filteredMovements.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma movimentação encontrada.</td></tr>
                            ) : (
                                filteredMovements.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-slate-50 dark:hover:bg-surface-darker/50 transition-colors">
                                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                            {new Date(movement.date).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(movement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="p-4 text-slate-800 dark:text-white font-medium text-sm">
                                            {movement.productName}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${movement.type === 'entrada'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                                {movement.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-mono font-medium">
                                            {movement.quantity}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-sm truncate max-w-[200px]">
                                            {movement.reason}
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-500 text-xs">
                                            {movement.userName || 'Sistema'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-border-dark">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registrar Movimentação Manual</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveMovement} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Produto</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    required
                                    value={newMovement.productId}
                                    onChange={e => setNewMovement({ ...newMovement, productId: e.target.value })}
                                >
                                    <option value="">Selecione um produto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Atual: {p.stockQuantity})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                    <div className="flex rounded-lg bg-slate-100 dark:bg-surface-darker p-1">
                                        <button
                                            type="button"
                                            onClick={() => setNewMovement({ ...newMovement, type: 'entrada' })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newMovement.type === 'entrada' ? 'bg-white dark:bg-surface-light shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Entrada
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewMovement({ ...newMovement, type: 'saida' })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newMovement.type === 'saida' ? 'bg-white dark:bg-surface-light shadow text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Saída
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-mono"
                                        required
                                        value={newMovement.quantity}
                                        onChange={e => setNewMovement({ ...newMovement, quantity: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo / Observação</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    placeholder="Ex: Nota Fiscal 123, Avaria, Correção..."
                                    required
                                    value={newMovement.reason}
                                    onChange={e => setNewMovement({ ...newMovement, reason: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2 text-sm font-medium">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-darker rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                    Salvar Ajuste
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockHistory;
