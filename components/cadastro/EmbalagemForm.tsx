import React, { useState, useEffect } from 'react';
import { Embalagem } from '../../types';
import { embalagemService } from '../../services/embalagemService';
import { formatCurrency } from '../../utils/formatters';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import NumberInput from '../common/NumberInput';

interface EmbalagemFormProps {
  onClose: () => void;
  onSave: () => void;
  embalagemToEdit?: Embalagem | null;
}

export const EmbalagemForm: React.FC<EmbalagemFormProps> = ({ onClose, onSave, embalagemToEdit }) => {
  const [formData, setFormData] = useState<Partial<Embalagem>>({
    nome: '',
    tipo: 'Caixa',
    largura: 0,
    altura: 0,
    profundidade: 0,
    status: 'Ativo',
    estoque_minimo: 5,
    preco_unitario_usd: 0,
    preco_unitario_brl: 0,
    unidades_por_pacote: 1,
    custo_material_adicional: 0,
    foto_url: '',
    vinculos: []
  });
  const { rate } = useExchangeRate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Local state for adding new link
  const [newLinkType, setNewLinkType] = useState<'categoria' | 'produto'>('categoria');
  const [newLinkId, setNewLinkId] = useState('');
  const [newLinkQty, setNewLinkQty] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
    if (embalagemToEdit) {
      setFormData(embalagemToEdit);
    }
  }, [embalagemToEdit]);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
      
      // Extract unique categories
      const cats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
      setCategories(cats);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const handleChange = (field: keyof Embalagem, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-conversion logic
      if (rate) {
        if (field === 'preco_unitario_brl') {
          updated.preco_unitario_usd = Number((Number(value) / rate).toFixed(2));
        } else if (field === 'preco_unitario_usd') {
          updated.preco_unitario_brl = Number((Number(value) * rate).toFixed(2));
        }
      }
      
      return updated;
    });
  };

  const handleAddVinculo = () => {
    if (!newLinkId) return;
    
    const existing = formData.vinculos?.find(v => v.tipo_vinculo === newLinkType && v.vinculo_id === newLinkId);
    if (existing) {
       setError('Este vínculo já foi adicionado.');
       return;
    }

    const newVinculo = {
      id: Math.random().toString(36).substr(2, 9), // Temp ID
      embalagem_id: embalagemToEdit?.id || '',
      tipo_vinculo: newLinkType,
      vinculo_id: newLinkId,
      quantidade: newLinkQty
    };

    setFormData(prev => ({
      ...prev,
      vinculos: [...(prev.vinculos || []), newVinculo as any]
    }));

    setNewLinkId('');
    setNewLinkQty(1);
    setError('');
  };

  const handleRemoveVinculo = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vinculos: (prev.vinculos || []).filter(v => v.id !== id)
    }));
  };

  const calculatePackPrice = () => {
    const unitPrice = formData.preco_unitario_brl || 0;
    const qty = formData.unidades_por_pacote || 1;
    return unitPrice * qty;
  };

  const calculateTotalCost = () => {
    const unitPrice = formData.preco_unitario_brl || 0;
    const additional = formData.custo_material_adicional || 0;
    return unitPrice + additional;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nome || !formData.tipo) {
        throw new Error('Nome e Tipo são obrigatórios.');
      }

      const payload = {
        ...formData,
        largura: Number(formData.largura),
        altura: Number(formData.altura),
        profundidade: Number(formData.profundidade),
        estoque_minimo: Number(formData.estoque_minimo),
        preco_unitario_usd: Number(formData.preco_unitario_usd),
        preco_unitario_brl: Number(formData.preco_unitario_brl),
        unidades_por_pacote: Number(formData.unidades_por_pacote),
        custo_material_adicional: Number(formData.custo_material_adicional)
      } as Embalagem;

      if (embalagemToEdit) {
        await embalagemService.update(embalagemToEdit.id, payload);
      } else {
        await embalagemService.create(payload as any);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar embalagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-border-dark">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {embalagemToEdit ? 'Editar Embalagem' : 'Nova Embalagem'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Básicas */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Identificação Básica</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome da Embalagem *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Ex: Caixa Padrão AliExpress"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tipo/Categoria *</label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => handleChange('tipo', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="Caixa">Caixa</option>
                        <option value="Sacola">Sacola</option>
                        <option value="Envelope">Envelope</option>
                        <option value="Plástico Bolha">Plástico Bolha</option>
                        <option value="Fita">Fita</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Dimensões (cm) e Alerta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase text-center">Largura</label>
                        <NumberInput
                          value={Number(formData.largura) || 0}
                          onChange={(val) => handleChange('largura', val)}
                          className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-2 py-2 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase text-center">Altura</label>
                        <NumberInput
                          value={Number(formData.altura) || 0}
                          onChange={(val) => handleChange('altura', val)}
                          className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-2 py-2 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase text-center">Profund.</label>
                        <NumberInput
                          value={Number(formData.profundidade) || 0}
                          onChange={(val) => handleChange('profundidade', val)}
                          className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-2 py-2 text-center"
                        />
                      </div>
                   </div>
                   <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Estoque Mínimo</label>
                    <NumberInput
                      value={Number(formData.estoque_minimo) || 0}
                      onChange={(val) => handleChange('estoque_minimo', val)}
                      className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 text-amber-600 font-bold"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-border-dark">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Custos e Precificação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Preço Unit. (R$)</label>
                    <NumberInput
                      step="0.01"
                      value={Number(formData.preco_unitario_brl) || 0}
                      onChange={(val) => handleChange('preco_unitario_brl', val)}
                      className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Uni. por Fardo</label>
                    <NumberInput
                      value={Number(formData.unidades_por_pacote) || 0}
                      onChange={(val) => handleChange('unidades_por_pacote', val)}
                      className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Custo Adicional (Plástico Bolha, etc)</label>
                   <NumberInput
                     step="0.01"
                     value={Number(formData.custo_material_adicional) || 0}
                     onChange={(val) => handleChange('custo_material_adicional', val)}
                     className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                   />
                </div>
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
                   <span className="text-xs font-bold text-primary uppercase">Custo Total / Unidade:</span>
                   <span className="text-lg font-black text-primary">R$ {formatCurrency(calculateTotalCost())}</span>
                </div>
              </section>
            </div>

            {/* Vínculos de Produtos/Categorias */}
            <div className="space-y-6">
               <section className="space-y-4 h-full flex flex-col">
                  <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Produtos que utilizam esta Embalagem</h3>
                  
                  {/* Add Link UI */}
                  <div className="p-4 bg-slate-50 dark:bg-surface-darker rounded-xl border border-dashed border-slate-300 dark:border-border-dark space-y-4">
                     <div className="flex gap-2">
                        <button 
                           type="button"
                           onClick={() => setNewLinkType('categoria')}
                           className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${newLinkType === 'categoria' ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                        >
                           Por Categoria
                        </button>
                        <button 
                           type="button"
                           onClick={() => setNewLinkType('produto')}
                           className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${newLinkType === 'produto' ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                        >
                           Por Produto
                        </button>
                     </div>

                     <div className="grid grid-cols-1 gap-3">
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                              {newLinkType === 'categoria' ? 'Selecionar Categoria' : 'Selecionar Produto'}
                           </label>
                           <select 
                             value={newLinkId}
                             onChange={(e) => setNewLinkId(e.target.value)}
                             className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none"
                           >
                              <option value="">Selecione...</option>
                              {newLinkType === 'categoria' ? (
                                categories.map(c => <option key={c} value={c}>{c}</option>)
                              ) : (
                                products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                              )}
                           </select>
                        </div>
                        <div className="flex gap-3">
                           <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Qtd de Embalagem por Item</label>
                              <NumberInput 
                                value={newLinkQty}
                                onChange={setNewLinkQty}
                                min={1}
                                className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm"
                              />
                           </div>
                           <div className="flex items-end">
                              <button
                                type="button"
                                onClick={handleAddVinculo}
                                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Adicionar
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* List of Links */}
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                     {(!formData.vinculos || formData.vinculos.length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">
                           <span className="material-symbols-outlined text-4xl mb-2 opacity-20">inventory_2</span>
                           Nenhum vínculo adicionado
                        </div>
                     ) : (
                        formData.vinculos.map((v) => {
                           const itemName = v.tipo_vinculo === 'categoria' ? v.vinculo_id : products.find(p => p.id === v.vinculo_id)?.name || 'Produto não encontrado';
                           return (
                              <div key={v.id} className="flex items-center justify-between p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-xl group hover:border-primary/30 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${v.tipo_vinculo === 'categoria' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                       <span className="material-symbols-outlined text-sm">
                                          {v.tipo_vinculo === 'categoria' ? 'category' : 'inventory_2'}
                                       </span>
                                    </div>
                                    <div>
                                       <p className="text-xs font-black text-slate-700 dark:text-slate-200">{itemName}</p>
                                       <p className="text-[10px] text-slate-400 uppercase font-bold">{v.tipo_vinculo} • {v.quantidade} un.</p>
                                    </div>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => handleRemoveVinculo(v.id)}
                                   className="text-slate-300 hover:text-red-500 transition-colors"
                                 >
                                    <span className="material-symbols-outlined">delete</span>
                                 </button>
                              </div>
                           );
                        })
                     )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                     * Os custos dessas embalagens serão somados ao custo dos produtos vinculados nos cálculos de lucro do Dashboard.
                  </p>
               </section>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-border-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-border-dark rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-surface-darker transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">save</span>}
              Salvar Embalagem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
