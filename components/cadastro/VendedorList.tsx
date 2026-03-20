import { useState, useEffect } from 'react';
import { Vendedor } from '../../types';
import { vendedorService } from '../../services/vendedorService';
import { VendedorForm } from './VendedorForm';
import VendedorProfile from './VendedorProfile';
import { formatCPF, formatPhone } from '../../utils/formatters';

export const VendedorList = () => {
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCargo, setFilterCargo] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
    const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await vendedorService.getAll();
            setVendedores(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este vendedor?')) {
            try {
                await vendedorService.delete(id);
                loadData();
            } catch (error) {
                alert('Erro ao excluir vendedor.');
            }
        }
    };

    const filtered = vendedores.filter(v => {
        const matchesSearch = v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.cpf.includes(searchTerm);
        const matchesCargo = filterCargo ? v.cargo === filterCargo : true;
        return matchesSearch && matchesCargo;
    });

    if (selectedVendedor) {
        return <VendedorProfile vendedor={selectedVendedor} onBack={() => setSelectedVendedor(null)} />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Vendedores e Funcionários</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie sua equipe de vendas e técnica</p>
                </div>
                <button
                    onClick={() => { setEditingVendedor(null); setShowForm(true); }}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    Adicionar Vendedor
                </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <select
                            value={filterCargo}
                            onChange={(e) => setFilterCargo(e.target.value)}
                            className="w-full md:w-48 pl-4 pr-8 py-2 bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                        >
                            <option value="">Todos os Cargos</option>
                            <option value="Vendedor">Vendedor</option>
                            <option value="Técnico">Técnico</option>
                            <option value="Gerente">Gerente</option>
                            <option value="Atendente">Atendente</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(v => (
                        <div 
                            key={v.id} 
                            onClick={() => setSelectedVendedor(v)}
                            className="bg-white dark:bg-surface-dark rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-border-dark overflow-hidden group cursor-pointer"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                            {v.foto_url ? (
                                                <img src={v.foto_url} alt={v.nome} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                v.nome.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{v.nome}</h3>
                                            <p className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {v.cargo}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${v.ativo ? 'bg-green-500' : 'bg-red-500'}`} title={v.ativo ? 'Ativo' : 'Inativo'}></div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">badge</span>
                                        <span>{formatCPF(v.cpf)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">call</span>
                                        <span>{formatPhone(v.telefone)}</span>
                                    </div>
                                    {v.email && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">mail</span>
                                            <span className="truncate">{v.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-surface-darker px-6 py-3 flex justify-end gap-2 border-t border-slate-100 dark:border-border-dark opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingVendedor(v); setShowForm(true); }}
                                    className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Excluir"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                            <p>Nenhum vendedor encontrado.</p>
                        </div>
                    )}
                </div>
            )}

            {showForm && (
                <VendedorForm
                    onClose={() => { setShowForm(false); setEditingVendedor(null); }}
                    onSave={() => { setShowForm(false); setEditingVendedor(null); loadData(); }}
                    vendedorToEdit={editingVendedor}
                />
            )}
        </div>
    );
};
