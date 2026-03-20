import React, { useState } from 'react';
import { Embalagem } from '../../types';
import { embalagemService } from '../../services/embalagemService';

interface EmbalagemMovementFormProps {
  embalagem: Embalagem;
  onClose: () => void;
  onSave: () => void;
}

export const EmbalagemMovementForm: React.FC<EmbalagemMovementFormProps> = ({ embalagem, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    quantidade: 1,
    valor_pago: 0,
    fornecedor: '',
    motivo: 'Compra/Reposição',
    data: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.quantidade <= 0) {
        throw new Error('Quantidade deve ser maior que zero.');
      }

      await embalagemService.addMovement({
        embalagem_id: embalagem.id,
        tipo_movimentacao: 'entrada',
        quantidade: Number(formData.quantidade),
        valor_pago: Number(formData.valor_pago),
        fornecedor: formData.fornecedor,
        motivo: formData.motivo,
        data: new Date(formData.data).toISOString()
      });

      onSave();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar entrada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="bg-primary p-6 text-white flex justify-between items-center">
           <div>
              <h2 className="text-xl font-bold">Registrar Entrada</h2>
              <p className="text-white/70 text-sm mt-1">{embalagem.nome}</p>
           </div>
           <button onClick={onClose} className="hover:rotate-90 transition-transform">
             <span className="material-symbols-outlined">close</span>
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade Recebida (und)</label>
              <input
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-lg font-black text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Total Pago (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_pago}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_pago: Number(e.target.value) }))}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fornecedor</label>
              <input
                type="text"
                value={formData.fornecedor}
                onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ex: Embalagens Premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                 <input
                   type="date"
                   value={formData.data}
                   onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                   className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none"
                 />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo</label>
                  <select 
                    value={formData.motivo}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none"
                  >
                    <option value="Compra/Reposição">Compra</option>
                    <option value="Ajuste de Saldo">Ajuste</option>
                    <option value="Estorno">Estorno</option>
                  </select>
               </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
          >
            {loading ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">check_circle</span>}
            Confirmar Entrada
          </button>
        </form>
      </div>
    </div>
  );
};
