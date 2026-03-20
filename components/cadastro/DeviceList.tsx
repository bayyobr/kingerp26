import React, { useState, useEffect } from 'react';
import { Aparelho } from '../../types';
import DeviceForm from './DeviceForm';
import { generateDeviceTermPDF } from '../../utils/pdfGenerator';
import { salesService } from '../../services/salesService';
import { deviceService } from '../../services/deviceService';

const DeviceList: React.FC = () => {
    const [devices, setDevices] = useState<Aparelho[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Aparelho | null>(null);

    const loadDevices = async () => {
        setLoading(true);
        try {
            const data = await deviceService.getAll({
                search,
                status: statusFilter || undefined
            });
            setDevices(data);
        } catch (error) {
            console.error('Error loading devices', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDevices();
    }, [search, statusFilter]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este aparelho?')) {
            try {
                await deviceService.delete(id);
                loadDevices();
            } catch (error) {
                alert('Erro ao excluir');
            }
        }
    };

    const handleEdit = (device: Aparelho) => {
        setEditingDevice(device);
        setShowForm(true);
    };

    const handlePrintTerm = async (device: Aparelho) => {
        try {
            const data = await salesService.getSaleByItemId(device.id);
            if (data) {
                generateDeviceTermPDF(data.venda, device, data.vendedor);
            } else {
                alert('Venda não encontrada para este aparelho.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao buscar dados da venda.');
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingDevice(null);
        loadDevices();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Disponível': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Vendido': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'Reservado': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined">smartphone</span>
                    Estoque de Aparelhos
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    Adicionar Aparelho
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 p-4 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark flex-wrap">
                <div className="flex-1 min-w-[250px] relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por Modelo ou IMEI..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="min-w-[150px] p-2 bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white"
                >
                    <option value="">Todos Status</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Vendido">Vendido</option>
                    <option value="Reservado">Reservado</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-10 text-slate-500">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {devices.map(device => (
                        <div key={device.id} className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                            {/* Header / Image Placeholder */}
                            <div className="h-40 bg-slate-100 dark:bg-surface-darker flex items-center justify-center relative">
                                {device.fotos_urls && device.fotos_urls.length > 0 ? (
                                    <img src={device.fotos_urls[0]} alt={device.modelo} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-slate-300">smartphone</span>
                                )}
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(device.status)}`}>
                                    {device.status}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 flex flex-col gap-2 flex-1">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{device.marca} {device.modelo}</h3>
                                    <div className="flex gap-2 text-xs text-slate-500">
                                        <span>{device.capacidade}</span>
                                        <span>•</span>
                                        <span>{device.cor}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-surface-darker p-2 rounded">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Condição</span>
                                        <span>{device.condicao}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Bateria</span>
                                        <span>{device.estado_bateria}%</span>
                                    </div>
                                    <div className="flex flex-col col-span-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">IMEI</span>
                                        <span className="font-mono">{device.imei}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400">Preço Venda</span>
                                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(device.preco_venda)}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {device.status === 'Vendido' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrintTerm(device); }}
                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                                                title="Imprimir Termo"
                                            >
                                                <span className="material-symbols-outlined text-lg">description</span>
                                            </button>
                                        )}
                                        <button onClick={() => handleEdit(device)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(device.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <DeviceForm
                    onClose={closeForm}
                    deviceToEdit={editingDevice}
                />
            )}
        </div>
    );
};

export default DeviceList;
