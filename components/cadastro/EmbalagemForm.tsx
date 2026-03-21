import React, { useState, useEffect } from 'react';
import { Embalagem } from '../../types';
import { embalagemService } from '../../services/embalagemService';
import { formatCurrency } from '../../utils/formatters';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { productService } from '../../services/productService';
import { Product } from '../../types';

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
    produto_id: null
  });
  const { rate } = useExchangeRate();
  const [products, setProducts] = useState<Product[]>([]);

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
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-border-dark">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {embalagemToEdit ? 'Editar Embalagem' : 'Nova Embalagem'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Identificação</h3>
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
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Produto que utiliza esta embalagem (Opcional)</label>
                <select
                  value={formData.produto_id || ''}
                  onChange={(e) => handleChange('produto_id', e.target.value || null)}
                  className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Nenhum produto específico</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Ao vincular, o custo desta embalagem será somado ao custo do produto no cálculo de lucro.</p>
              </div>
            </div>

            {/* Dimensões */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Dimensões (cm)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Largura</label>
                  <input
                    type="number"
                    value={formData.largura}
                    onChange={(e) => handleChange('largura', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Altura</label>
                  <input
                    type="number"
                    value={formData.altura}
                    onChange={(e) => handleChange('altura', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Profundidade</label>
                  <input
                    type="number"
                    value={formData.profundidade}
                    onChange={(e) => handleChange('profundidade', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Mínimo para Alerta</label>
                <input
                  type="number"
                  value={formData.estoque_minimo}
                  onChange={(e) => handleChange('estoque_minimo', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-amber-600 font-bold"
                />
              </div>
            </div>

            {/* Precificação */}
            <div className="space-y-4 col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-xl border border-slate-100 dark:border-border-dark">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider mb-4">Custos e Precificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Preço Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco_unitario_brl}
                    onChange={(e) => handleChange('preco_unitario_brl', e.target.value)}
                    className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Uni. por Pacote/Fardo</label>
                  <input
                    type="number"
                    value={formData.unidades_por_pacote}
                    onChange={(e) => handleChange('unidades_por_pacote', e.target.value)}
                    className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Preço por Pacote</label>
                  <div className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 text-slate-500 font-bold flex items-center justify-between">
                    <span>R$</span>
                    {formatCurrency(calculatePackPrice())}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-100 opacity-0 mb-1">Preço Unitário (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.preco_unitario_usd}
                      onChange={(e) => handleChange('preco_unitario_usd', e.target.value)}
                      className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-7 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Custo Adicional (ex: Plástico Bolha interno)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.custo_material_adicional}
                    onChange={(e) => handleChange('custo_material_adicional', e.target.value)}
                    className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex flex-col justify-end">
                   <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase">Custo Total por Unidade:</span>
                      <span className="text-lg font-black text-primary">R$ {formatCurrency(calculateTotalCost())}</span>
                   </div>
                </div>
              </div>
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
