import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Product, Variation } from '../../types';
import { productService } from '../../services/productService';
import NumberInput from '../common/NumberInput';
import { useFormPersistence } from '../../hooks/useFormPersistence';

// Moved outside to prevent re-render focus loss

const ProductForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const initialFormData: Omit<Product, 'id'> = {
        name: '',
        sku: '',
        description: '',
        type: 'simple',
        category: '',
        costPrice: 0,
        salePrice: 0,
        stockQuantity: 0,
        imageUrl: '',
        minStock: 5,
        variations: []
    };

    const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialFormData);

    const { draftRequest, saveDraft, clearDraft, setDraftRequest } = useFormPersistence('product', initialFormData, !id);

    // Persistence Effect
    useEffect(() => {
        if (!id && formData.name) {
            saveDraft(formData);
        }
    }, [formData, id, saveDraft]);

    // BeforeUnload Protection
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!id && formData.name) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [id, formData.name]);

    const [newVariation, setNewVariation] = useState<{ name: string, stock: string, sku: string, price: string }>({ name: '', stock: '', sku: '', price: '' });

    // Calculate Margin
    const profitMargin = formData.salePrice > 0
        ? ((formData.salePrice - formData.costPrice) / formData.salePrice) * 100
        : 0;

    useEffect(() => {
        if (id) {
            loadProduct(id);
        } else if (location.state?.cloneFrom) {
            const cloned = location.state.cloneFrom as Product;
            const { id: _id, sku: _sku, ...rest } = cloned;
            setFormData({
                ...rest,
                sku: '', // Force a new SKU generation or manual entry
                name: `${rest.name} (Cópia)`
            });
        }
    }, [id, location.state]);

    // Recalculate total stock when variations change
    useEffect(() => {
        if (formData.type === 'variation' && formData.variations) {
            const total = formData.variations.reduce((acc, v) => acc + v.stock, 0);
            setFormData(prev => ({ ...prev, stockQuantity: total }));
        }
    }, [formData.variations, formData.type]);

    // Sync Price to Variations
    useEffect(() => {
        if (formData.salePrice) {
            // Update "Add Variation" input
            setNewVariation(prev => ({ ...prev, price: formData.salePrice.toString() }));

            // Update existing variations
            if (formData.variations && formData.variations.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    variations: prev.variations?.map(v => ({ ...v, price: formData.salePrice }))
                }));
            }
        }
    }, [formData.salePrice]);

    // Auto-generate SKU if empty and name is present
    useEffect(() => {
        if (!formData.sku && formData.name.length >= 3) {
            const prefix = formData.name.substring(0, 3).toUpperCase();
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
        }
    }, [formData.name]);

    const loadProduct = async (productId: string) => {
        try {
            const products = await productService.getAll();
            const found = products.find(p => p.id === productId);
            if (found) {
                const { id, ...rest } = found;
                setFormData(rest);
            }
        } catch (error) {
            alert('Erro ao carregar produto');
        }
    };

    const generateSKU = () => {
        const prefix = formData.name.substring(0, 3).toUpperCase() || 'PRO';
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
    };

    const addVariation = () => {
        if (!newVariation.name || !newVariation.stock) return;

        const stockVal = parseInt(newVariation.stock);
        const priceVal = parseFloat(newVariation.price);

        const variation: Variation = {
            id: crypto.randomUUID(),
            name: newVariation.name,
            stock: isNaN(stockVal) ? 0 : stockVal,
            sku: newVariation.sku || formData.sku,
            price: isNaN(priceVal) ? (formData.salePrice || undefined) : priceVal
        };

        setFormData(prev => ({
            ...prev,
            variations: [...(prev.variations || []), variation]
        }));
        setNewVariation({ name: '', stock: '', sku: '', price: formData.salePrice.toString() });
    };

    const removeVariation = (id: string) => {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations?.filter(v => v.id !== id) || []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (id) {
                await productService.update({ ...formData, id });
            } else {
                await productService.create(formData);
                clearDraft(); // Clear draft on success
            }
            navigate('/cadastro/produtos');
        } catch (error) {
            alert('Erro ao salvar produto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
            {/* Draft Alert */}
            {draftRequest && !id && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-600">history</span>
                        <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Rascunho Encontrado</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">Você tem dados de um produto que não foram salvos: <span className="font-bold">{draftRequest.name}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => clearDraft()}
                            className="px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
                        >
                            Descartar
                        </button>
                        <button 
                            onClick={() => {
                                setFormData(draftRequest);
                                setDraftRequest(null);
                            }}
                            className="px-4 py-1.5 text-xs bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20"
                        >
                            Restaurar
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {id ? 'Editar Produto' : 'Novo Produto'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Preencha as informações abaixo.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-darker transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">save</span>
                        {loading ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Group 1: Basic Info */}
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        Informações Básicas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Produto</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código / SKU</label>
                            <div className="flex gap-2">
                                <input
                                    value={formData.sku || ''}
                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="Gerado automaticamente"
                                    disabled={true}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={generateSKU}
                                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium text-xs uppercase tracking-wide"
                                >
                                    Gerar
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="simple">Simples</option>
                                <option value="kit">Kit</option>
                                <option value="variation">Variação</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                            <input
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                list="categories"
                                placeholder="Selecione ou digite..."
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <datalist id="categories">
                                <option value="Peças" />
                                <option value="Acessórios" />
                                <option value="Capinhas" />
                                <option value="Películas" />
                                <option value="Ferramentas" />
                            </datalist>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                            <textarea
                                rows={3}
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Group 2: Image */}
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">image</span>
                        Imagem do Produto
                    </h2>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL da Imagem</label>
                            <input
                                value={formData.imageUrl || ''}
                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="https://exemplo.com/imagem.jpg"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="w-32 h-32 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-slate-400 text-center px-2">Sem Imagem</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* VARIATIONS SECTION */}
                {formData.type === 'variation' && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6 border-l-4 border-l-primary">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">schema</span>
                            Variações de Produto
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome (Cor/Modelo)</label>
                                <input
                                    value={newVariation.name}
                                    onChange={e => setNewVariation({ ...newVariation, name: e.target.value })}
                                    placeholder="Ex: Vermelho"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU (Opcional)</label>
                                <input
                                    value={newVariation.sku}
                                    onChange={e => setNewVariation({ ...newVariation, sku: e.target.value })}
                                    placeholder="Ex: PRO-RED"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estoque</label>
                                        <NumberInput
                                            value={Number(newVariation.stock) || 0}
                                            onChange={val => setNewVariation({ ...newVariation, stock: val.toString() })}
                                            placeholder="Qtd"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preço</label>
                                        <NumberInput
                                            value={Number(newVariation.price) || 0}
                                            onChange={val => setNewVariation({ ...newVariation, price: val.toString() })}
                                            placeholder="R$"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addVariation}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-bold h-[42px]"
                            >
                                Adicionar
                            </button>
                        </div>

                        <div className="bg-slate-50 dark:bg-surface-darker rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
                            {(formData.variations || []).length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">Nenhuma variação adicionada.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Nome</th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">SKU</th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Preço</th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Estoque</th>
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(formData.variations || []).map(v => (
                                            <tr key={v.id}>
                                                <td className="px-4 py-2 text-slate-900 dark:text-white">{v.name}</td>
                                                <td className="px-4 py-2 text-slate-500 font-mono">{v.sku || '-'}</td>
                                                <td className="px-4 py-2 text-slate-900 dark:text-white">
                                                    {v.price ? `R$ ${v.price.toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-slate-900 dark:text-white font-bold">{v.stock}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button onClick={() => removeVariation(v.id)} className="text-red-500 hover:text-red-700">
                                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Group 3: Values & Stock */}
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">attach_money</span>
                        Estoque e Valores
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estoque Atual</label>
                            <NumberInput
                                value={formData.stockQuantity}
                                onChange={(val: number) => setFormData({ ...formData, stockQuantity: val })}
                                disabled={formData.type === 'variation'} // Disabled if variation
                                className={`w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50 ${formData.type === 'variation' ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                            />
                            {formData.type === 'variation' && <p className="text-xs text-slate-500 mt-1">Calculado pelas variações.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estoque Mínimo</label>
                            <NumberInput
                                value={formData.minStock || 0}
                                onChange={(val: number) => setFormData({ ...formData, minStock: val })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="hidden md:block"></div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custo (R$)</label>
                            <NumberInput
                                value={formData.costPrice}
                                onChange={(val: number) => setFormData({ ...formData, costPrice: val })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preço de Venda (R$)</label>
                            <NumberInput
                                value={formData.salePrice}
                                onChange={(val: number) => setFormData({ ...formData, salePrice: val })}
                                className="w-full px-4 py-2 rounded-lg border-2 border-primary/20 dark:border-primary/20 bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary font-bold text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Margem de Lucro</label>
                            <div className={`px-4 py-2 rounded-lg border border-transparent font-bold ${profitMargin > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {profitMargin.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 sticky bottom-0 bg-background-light dark:bg-background-dark p-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-darker transition-colors font-medium mr-3"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/30 flex items-center gap-2 transform active:scale-95"
                    >
                        <span className="material-symbols-outlined">save</span>
                        {loading ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                </div>
            </form>
            <div className="h-10"></div>
        </div>
    );
};

export default ProductForm;
