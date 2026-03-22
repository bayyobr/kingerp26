import React, { useState, useEffect } from 'react';
import { deviceService } from '../../services/deviceService';
import { Aparelho, Checklist } from '../../types';
import { INITIAL_CHECKLIST, CHECKLIST_LABELS } from '../../constants';
import { formatCPF, formatPhone, formatCurrency } from '../../utils/formatters';
import NumberInput from '../common/NumberInput';

interface DeviceFormProps {
    onClose: () => void;
    deviceToEdit?: Aparelho | null;
}

const IPHONE_MODELS = [
    'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 12'
];

const DeviceForm: React.FC<DeviceFormProps> = ({ onClose, deviceToEdit }) => {
    const [loading, setLoading] = useState(false);
    const [showModels, setShowModels] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Aparelho>>({
        tipo: 'iPhone',
        marca: 'Apple',
        modelo: '',
        capacidade: '128GB',
        cor: '',
        imei: '',
        imei2: '',
        condicao: 'Usado',
        estado_bateria: 100,
        preco_custo: 0,
        preco_venda: 0,
        status: 'Disponível',
        observacoes: '',
        fotos_urls: [],
        checklist: { ...INITIAL_CHECKLIST },
        vendedor_dados: { nome: '', cpf: '', telefone: '' },
        data_entrada: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (deviceToEdit) {
            setFormData(deviceToEdit);
        }
    }, [deviceToEdit]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.modelo-container')) {
                setShowModels(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (field: keyof Aparelho, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoAdd = () => {
        const url = prompt('Cole a URL da foto (temporário):');
        if (url) {
            handleChange('fotos_urls', [...(formData.fotos_urls || []), url]);
        }
    };

    const handleChecklistToggle = (key: keyof Checklist, val: boolean | null) => {
        setFormData(prev => ({
            ...prev,
            checklist: { ...(prev.checklist as Checklist), [key]: val }
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validations
        if (!formData.imei || formData.imei.length < 15) return alert('IMEI inválido (mínimo 15 dígitos)');
        if (!formData.modelo) return alert('Informe o modelo');
        if (!formData.preco_custo || !formData.preco_venda) return alert('Informe os preços');
        if (Number(formData.preco_venda) < Number(formData.preco_custo)) {
            if (!confirm('Atenção: Preço de venda menor que o custo. Continuar?')) return;
        }

        const dataToSave = { ...formData };
        if (dataToSave.condicao === 'Novo') {
            delete dataToSave.vendedor_dados;
        }

        setLoading(true);
        try {
            if (deviceToEdit && deviceToEdit.id) {
                await deviceService.update(deviceToEdit.id, dataToSave);
            } else {
                await deviceService.create(dataToSave);
            }
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao salvar');
        }
        setLoading(false);
    };

    // Calculate Margin
    const margin = formData.preco_venda && formData.preco_custo
        ? ((formData.preco_venda - formData.preco_custo) / formData.preco_venda * 100).toFixed(1)
        : '0';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-surface-dark w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {deviceToEdit ? 'Editar Aparelho' : 'Cadastrar Novo Aparelho'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-8 bg-[#1a1d24]">

                    {/* Section 1: Identificação Básica */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-[#3b82f6] flex items-center gap-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg">smartphone</span>
                            Identificação do Aparelho
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Tipo</label>
                                <div className="relative">
                                    <select
                                        value={formData.tipo}
                                        onChange={e => {
                                            const tipo = e.target.value;
                                            handleChange('tipo', tipo);
                                            if (tipo === 'iPhone') handleChange('marca', 'Apple');
                                            else if (tipo === 'Samsung') handleChange('marca', 'Samsung');
                                        }}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all appearance-none"
                                    >
                                        <option value="iPhone">iPhone</option>
                                        <option value="Samsung">Samsung</option>
                                        <option value="Motorola">Motorola</option>
                                        <option value="Xiaomi">Xiaomi</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col relative modelo-container">
                                <label className="text-[14px] font-medium text-white mb-2 block">Modelo</label>
                                <div className="relative">
                                    <input
                                        value={formData.modelo}
                                        onChange={e => handleChange('modelo', e.target.value)}
                                        onFocus={() => formData.marca === 'Apple' && setShowModels(true)}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#9ca3af]"
                                        placeholder="Ex: iPhone XR"
                                        required
                                    />
                                    {formData.marca === 'Apple' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowModels(!showModels)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            <span className="material-symbols-outlined">{showModels ? 'expand_less' : 'expand_more'}</span>
                                        </button>
                                    )}
                                </div>

                                {showModels && formData.marca === 'Apple' && (
                                    <div className="absolute top-[85px] left-0 w-full bg-[#2a2f3a] border border-slate-700 rounded-lg shadow-2xl z-[60] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="text-[10px] font-bold text-slate-500 px-3 mb-1 uppercase tracking-widest">Modelos Sugeridos</div>
                                        {IPHONE_MODELS.map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => {
                                                    handleChange('modelo', m);
                                                    setShowModels(false);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-[#3b82f6] hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-xs border border-slate-600 rounded p-0.5">smartphone</span>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Marca</label>
                                <input
                                    value={formData.marca}
                                    onChange={e => handleChange('marca', e.target.value)}
                                    className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Capacidade</label>
                                <div className="relative">
                                    <select
                                        value={formData.capacidade}
                                        onChange={e => handleChange('capacidade', e.target.value)}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all appearance-none"
                                    >
                                        <option value="64GB">64GB</option>
                                        <option value="128GB">128GB</option>
                                        <option value="256GB">256GB</option>
                                        <option value="512GB">512GB</option>
                                        <option value="1TB">1TB</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Cor</label>
                                <input
                                    value={formData.cor}
                                    onChange={e => handleChange('cor', e.target.value)}
                                    className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#9ca3af]"
                                    placeholder="Ex: Dourado"
                                />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[14px] font-medium text-white mb-2 block">IMEI 1 (Principal)</label>
                                <input
                                    value={formData.imei}
                                    onChange={e => handleChange('imei', e.target.value)}
                                    className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all font-mono placeholder:text-[#9ca3af]"
                                    placeholder="15 dígitos"
                                    maxLength={15}
                                    required
                                />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-[14px] font-medium text-white mb-2 block">IMEI 2 / E-SIM (Opcional)</label>
                                <input
                                    value={formData.imei2}
                                    onChange={e => handleChange('imei2', e.target.value)}
                                    className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all font-mono placeholder:text-[#9ca3af]"
                                    placeholder="15 dígitos"
                                    maxLength={15}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Checklist de Condição */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-[#3b82f6] flex items-center gap-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg">fact_check</span>
                            Checklist de Condição
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Object.keys(INITIAL_CHECKLIST).map((key) => (
                                <div key={key} className="flex flex-col gap-2 p-3 bg-[#1f2937] rounded-xl border border-slate-700/50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                                        {CHECKLIST_LABELS[key as keyof Checklist]}
                                    </span>
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleChecklistToggle(key as keyof Checklist, true)}
                                            className={`flex-1 h-8 rounded-lg transition-all flex items-center justify-center ${formData.checklist?.[key as keyof Checklist] === true ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-[#2a2f3a] text-slate-500 border border-slate-700 hover:border-slate-500'}`}
                                        >
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChecklistToggle(key as keyof Checklist, false)}
                                            className={`flex-1 h-8 rounded-lg transition-all flex items-center justify-center ${formData.checklist?.[key as keyof Checklist] === false ? 'bg-red-500 text-white shadow-lg shadow-red-900/20' : 'bg-[#2a2f3a] text-slate-500 border border-slate-700 hover:border-slate-500'}`}
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-700/50" />

                    {/* Section 4: Dados de Quem Vendeu (Conditional) */}
                    {formData.condicao === 'Usado' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-bold text-[#3b82f6] flex items-center gap-2 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-lg">person_pin</span>
                                Dados do Vendedor (Aparelho de Terceiros)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-[14px] font-medium text-white mb-2 block">Nome do Vendedor</label>
                                    <input
                                        value={formData.vendedor_dados?.nome}
                                        onChange={e => setFormData(prev => ({ ...prev, vendedor_dados: { ...prev.vendedor_dados!, nome: e.target.value } }))}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#9ca3af]"
                                        placeholder="Nome completo"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[14px] font-medium text-white mb-2 block">CPF / RG</label>
                                    <input
                                        value={formData.vendedor_dados?.cpf}
                                        onChange={e => setFormData(prev => ({ ...prev, vendedor_dados: { ...prev.vendedor_dados!, cpf: formatCPF(e.target.value) } }))}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#9ca3af]"
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[14px] font-medium text-white mb-2 block">Telefone de Contato</label>
                                    <input
                                        value={formData.vendedor_dados?.telefone}
                                        onChange={e => setFormData(prev => ({ ...prev, vendedor_dados: { ...prev.vendedor_dados!, telefone: formatPhone(e.target.value) } }))}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#9ca3af]"
                                        placeholder="(00) 0 0000-0000"
                                        maxLength={16}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 2: Condição e Valores */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-[#3b82f6] flex items-center gap-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg">attach_money</span>
                            Condição e Valores
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Condição</label>
                                <div className="relative">
                                    <select
                                        value={formData.condicao}
                                        onChange={e => handleChange('condicao', e.target.value)}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all appearance-none"
                                    >
                                        <option value="Novo">Novo (Lacrado)</option>
                                        <option value="Usado">Usado</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Saúde Bateria (%)</label>
                                <NumberInput
                                    value={formData.estado_bateria || 0}
                                    onChange={val => {
                                        if (val <= 100) handleChange('estado_bateria', val);
                                        else handleChange('estado_bateria', 100);
                                    }}
                                    className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all"
                                    min={0}
                                    max={100}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Status</label>
                                <div className="relative">
                                    <select
                                        value={formData.status}
                                        onChange={e => handleChange('status', e.target.value)}
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[52px] px-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all appearance-none"
                                    >
                                        <option value="Disponível">Disponível</option>
                                        <option value="Reservado">Reservado</option>
                                        <option value="Vendido">Vendido</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#1f2937] p-6 rounded-xl border border-slate-700 mt-2">
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Preço Custo</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                                    <input
                                        type="text"
                                        value={formData.preco_custo ? formatCurrency(formData.preco_custo) : ''}
                                        onChange={e => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            handleChange('preco_custo', raw ? Number(raw) / 100 : 0);
                                        }}
                                        onFocus={e => e.target.select()}
                                        placeholder="R$ 0,00"
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[48px] pl-10 pr-4 text-white font-bold outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[14px] font-medium text-white mb-2 block">Preço Venda</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10b981] font-bold">R$</span>
                                    <input
                                        type="text"
                                        value={formData.preco_venda ? formatCurrency(formData.preco_venda) : ''}
                                        onChange={e => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            handleChange('preco_venda', raw ? Number(raw) / 100 : 0);
                                        }}
                                        onFocus={e => e.target.select()}
                                        placeholder="R$ 0,00"
                                        className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg h-[48px] pl-10 pr-4 text-[#10b981] font-bold outline-none focus:ring-1 focus:ring-[#10b981] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 items-center justify-center p-2 rounded-lg bg-[#2a2f3a] border border-slate-700">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MARGEM</span>
                                <span className={`text-2xl font-black ${Number(margin) > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                    {margin}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Fotos & Obs */}
                    <div className="flex flex-col gap-4 text-white text-[14px]">
                        <h3 className="text-sm font-bold text-[#3b82f6] flex items-center gap-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg">image</span>
                            Fotos e Observações
                        </h3>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[14px] font-medium text-white mb-2 block">Galeria de Fotos</label>
                                <button type="button" onClick={handlePhotoAdd} className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-4 py-2 rounded-lg font-bold hover:bg-[#3b82f6]/30 transition-colors">
                                    + Adicionar URL
                                </button>
                            </div>
                            <div className="flex gap-4 p-4 bg-[#1f2937] rounded-xl border border-dashed border-slate-700 overflow-x-auto min-h-[120px]">
                                {formData.fotos_urls?.map((url, i) => (
                                    <div key={i} className="relative w-24 h-24 flex-shrink-0 bg-[#2a2f3a] rounded-lg overflow-hidden group border border-slate-700 shadow-sm">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newUrls = [...(formData.fotos_urls || [])];
                                                    newUrls.splice(i, 1);
                                                    handleChange('fotos_urls', newUrls);
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!formData.fotos_urls || formData.fotos_urls.length === 0) && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
                                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                                        <span className="text-xs font-medium">Nenhuma foto adicionada</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[14px] font-medium text-white mb-2 block">Observações Gerais</label>
                            <textarea
                                value={formData.observacoes}
                                onChange={e => handleChange('observacoes', e.target.value)}
                                className="w-full bg-[#2a2f3a] border border-slate-700/50 rounded-lg p-4 text-white outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#9ca3af] min-h-[120px] resize-y"
                                placeholder="Descreva detalhes importantes, avarias ou características específicas..."
                            />
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-[#1f2937] rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 text-white font-semibold border border-slate-600 hover:bg-slate-700 rounded-xl transition-all active:scale-95"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin text-xl">refresh</span> : <span className="material-symbols-outlined text-xl">check</span>}
                        {loading ? 'Salvando...' : 'Salvar Aparelho'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeviceForm;
