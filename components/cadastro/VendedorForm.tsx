import { useState, useEffect } from 'react';
import { Vendedor } from '../../types';
import { vendedorService } from '../../services/vendedorService';
import { formatCPF, formatPhone, formatCurrency } from '../../utils/formatters';

interface VendedorFormProps {
    onClose: () => void;
    onSave: () => void;
    vendedorToEdit?: Vendedor | null;
}

export const VendedorForm = ({ onClose, onSave, vendedorToEdit }: VendedorFormProps) => {
    const [formData, setFormData] = useState<Partial<Vendedor>>({
        nome: '',
        cpf: '',
        telefone: '',
        email: '',
        cargo: 'Vendedor',
        data_admissao: new Date().toISOString().split('T')[0],
        salario: 0,
        comissao_percentual: 0,
        meta_vendas_mensal: 0,
        meta_pedidos_mensal: 0,
        data_entrada: new Date().toISOString().split('T')[0],
        ativo: true,
        foto_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (vendedorToEdit) {
            setFormData(vendedorToEdit);
        }
    }, [vendedorToEdit]);

    const handleChange = (field: keyof Vendedor, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMaskedChange = (field: 'cpf' | 'telefone', value: string) => {
        const formatted = field === 'cpf' ? formatCPF(value) : formatPhone(value);
        handleChange(field, formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.nome || !formData.cpf || !formData.cargo || !formData.data_admissao) {
                throw new Error('Preencha os campos obrigatórios (*).');
            }

            const payload = {
                ...formData,
                salario: Number(formData.salario) || 0,
                comissao_percentual: Number(formData.comissao_percentual) || 0,
                meta_vendas_mensal: Number(formData.meta_vendas_mensal) || 0,
                meta_pedidos_mensal: Number(formData.meta_pedidos_mensal) || 0
            } as Vendedor;

            if (vendedorToEdit) {
                await vendedorService.update(payload);
            } else {
                await vendedorService.create(payload);
            }
            onSave();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao salvar vendedor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-border-dark">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {vendedorToEdit ? 'Editar Vendedor/Funcionário' : 'Novo Vendedor/Funcionário'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => handleChange('nome', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Ex: João Silva"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF *</label>
                            <input
                                type="text"
                                value={formData.cpf}
                                onChange={(e) => handleMaskedChange('cpf', e.target.value)}
                                maxLength={14}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="000.000.000-00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone/WhatsApp *</label>
                            <input
                                type="text"
                                value={formData.telefone}
                                onChange={(e) => handleMaskedChange('telefone', e.target.value)}
                                maxLength={16}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="(00) 0 0000-0000"
                                required
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email (Opcional)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo *</label>
                            <select
                                value={formData.cargo}
                                onChange={(e) => handleChange('cargo', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            >
                                <option value="Vendedor">Vendedor</option>
                                <option value="Técnico">Técnico</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Atendente">Atendente</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Entrada *</label>
                            <input
                                type="date"
                                value={formData.data_entrada || formData.data_admissao}
                                onChange={(e) => handleChange('data_entrada', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta de Vendas (R$)</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.meta_vendas_mensal || 0)}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    const numberValue = rawValue ? parseFloat(rawValue) / 100 : 0;
                                    handleChange('meta_vendas_mensal', numberValue);
                                }}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0,00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta de Pedidos (Qtd)</label>
                            <input
                                type="number"
                                value={formData.meta_pedidos_mensal}
                                onChange={(e) => handleChange('meta_pedidos_mensal', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salário Base (R$)</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.salario || 0)}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    const numberValue = rawValue ? parseFloat(rawValue) / 100 : 0;
                                    handleChange('salario', numberValue);
                                }}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0,00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comissão (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={formData.comissao_percentual}
                                onChange={(e) => handleChange('comissao_percentual', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0.0"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="ativo"
                                checked={formData.ativo}
                                onChange={(e) => handleChange('ativo', e.target.checked)}
                                className="w-5 h-5 text-primary rounded focus:ring-primary/50"
                            />
                            <label htmlFor="ativo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Cadastro Ativo?
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-border-dark">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-darker rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">save</span>
                                    Salvar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
