import React, { useState, useEffect } from 'react';
import { serviceService, Service } from '../../services/serviceService';
import NumberInput from '../common/NumberInput';

const ServiceList: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: 0 });

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const data = await serviceService.getAll();
            setServices(data);
        } catch (error) {
            console.error('Error loading services:', error);
            alert('Erro ao carregar serviços.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (service: Service | null = null) => {
        if (service) {
            setEditingService(service);
            setFormData({ name: service.name, description: service.description || '', price: service.price });
        } else {
            setEditingService(null);
            setFormData({ name: '', description: '', price: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingService) {
                await serviceService.update(editingService.id, formData);
            } else {
                await serviceService.create(formData);
            }
            setIsModalOpen(false);
            loadServices();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Erro ao salvar serviço.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
        try {
            await serviceService.delete(id);
            loadServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Erro ao excluir serviço.');
        }
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && services.length === 0) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-3xl">build</span>
                        Cadastro de Serviços
                    </h1>
                    <p className="text-slate-400 mt-1">Gerencie a mão de obra e serviços oferecidos pela assistência.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Serviço
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-[#13191f] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Filters */}
                <div className="p-6 border-b border-slate-800 bg-[#161b22]/50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                        <input
                            type="text"
                            placeholder="Buscar serviço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-[#161b22]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Serviço</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição / Detalhes</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-slate-500 bg-[#1c2128]">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">inventory_2</span>
                                        Nenhum serviço encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-blue-500/5 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold group-hover:scale-110 transition-transform">
                                                    {service.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-white font-bold text-base">{service.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-slate-400 text-sm max-w-sm truncate">{service.description || 'Sem descrição'}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-emerald-400 font-bold text-base px-3 py-1 bg-emerald-400/10 rounded-lg border border-emerald-400/20">
                                                R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(service)}
                                                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
                                                    className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#1c2128] border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <form onSubmit={handleSave}>
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#252d37]">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500">{editingService ? 'edit' : 'add'}</span>
                                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-8 space-y-5 bg-[#1c2128]">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">Nome do Serviço</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Troca de Tela iPhone 11"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detalhes sobre o que inclui o serviço..."
                                        rows={3}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-all shadow-inner resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300">Preço (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                                        <NumberInput
                                            step="0.01"
                                            required
                                            value={formData.price}
                                            onChange={(val) => setFormData({ ...formData, price: val })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:border-blue-500 focus:outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-700 bg-[#252d37] flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                                >
                                    {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceList;
