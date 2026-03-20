import React, { useState, useEffect } from 'react';
import { Embalagem } from '../../types';
import { embalagemService } from '../../services/embalagemService';
import { EmbalagemForm } from './EmbalagemForm';
import { EmbalagemMovementForm } from './EmbalagemMovementForm';
import { formatCurrency } from '../../utils/formatters';

export const EmbalagemList = () => {
  const [embalagens, setEmbalagens] = useState<Embalagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [selectedEmbalagem, setSelectedEmbalagem] = useState<Embalagem | null>(null);
  
  const [filterType, setFilterType] = useState('Todos');
  const [filterStock, setFilterStock] = useState('Todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await embalagemService.getAll();
      setEmbalagens(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (e: Embalagem) => {
    if (e.estoque_atual === 0) return { label: 'Zerado', color: 'text-rose-500', bg: 'bg-rose-500/10' };
    if (e.estoque_atual <= e.estoque_minimo) return { label: 'Baixo', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'Normal', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  };

  const filtered = embalagens.filter(e => {
    const matchesType = filterType === 'Todos' || e.tipo === filterType;
    const { label } = getStockStatus(e);
    const matchesStock = filterStock === 'Todos' || label === filterStock;
    return matchesType && matchesStock && e.status === 'Ativo';
  });

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gestão de Embalagens</h1>
          <p className="text-slate-500 mt-1">Controle de estoque, custos e reposição de insumos.</p>
        </div>
        <button 
          onClick={() => { setSelectedEmbalagem(null); setShowForm(true); }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_box</span>
          Novo Tipo de Embalagem
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tipo de Embalagem</label>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="Caixa">Caixa</option>
            <option value="Sacola">Sacola</option>
            <option value="Envelope">Envelope</option>
            <option value="Plástico Bolha">Plástico Bolha</option>
            <option value="Fita">Fita</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nível de Estoque</label>
          <select 
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="Todos">Todos os Níveis</option>
            <option value="Normal">Estoque Normal</option>
            <option value="Baixo">Estoque Baixo</option>
            <option value="Zerado">Estoque Zerado</option>
          </select>
        </div>
        <div className="flex items-end">
            <button 
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-primary transition-colors"
              title="Recarregar dados"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => {
          const status = getStockStatus(item);
          return (
            <div key={item.id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden group shadow-sm hover:shadow-md transition-all">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                      {status.label}
                   </div>
                   <div className="flex gap-1">
                      <button 
                        onClick={() => { setSelectedEmbalagem(item); setShowForm(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                         <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                   </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                     <span className="material-symbols-outlined text-3xl">
                        {item.tipo === 'Caixa' ? 'inventory_2' : item.tipo === 'Sacola' ? 'shopping_bag' : 'mail'}
                     </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.nome}</h3>
                    <p className="text-xs text-slate-500">{item.tipo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stock</p>
                    <p className={`text-xl font-black ${item.estoque_atual <= item.estoque_minimo ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                       {item.estoque_atual}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Preço Uni.</p>
                    <p className="text-xl font-black text-emerald-500">
                       R$ {formatCurrency(item.preco_unitario_brl + item.custo_material_adicional)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-border-dark pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Mínimo p/ Alerta:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.estoque_minimo} unidades</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Preço p/ Pacote ({item.unidades_por_pacote}un):</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">R$ {formatCurrency(item.preco_unitario_brl * item.unidades_por_pacote)}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-surface-darker flex gap-2">
                <button 
                  onClick={() => { setSelectedEmbalagem(item); setShowMovementForm(true); }}
                  className="flex-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-700 dark:text-slate-300 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Registrar Entrada
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-20 bg-white dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-border-dark rounded-3xl flex flex-col items-center justify-center text-slate-400">
             <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inventory</span>
             <p className="font-bold">Nenhuma embalagem encontrada.</p>
             <p className="text-sm">Clique em "Novo Tipo" para começar.</p>
          </div>
        )}
      </div>

      {showForm && (
        <EmbalagemForm 
          onClose={() => setShowForm(false)} 
          onSave={() => { setShowForm(false); loadData(); }} 
          embalagemToEdit={selectedEmbalagem}
        />
      )}

      {showMovementForm && selectedEmbalagem && (
        <EmbalagemMovementForm 
          embalagem={selectedEmbalagem} 
          onClose={() => setShowMovementForm(false)} 
          onSave={() => { setShowMovementForm(false); loadData(); }} 
        />
      )}
    </div>
  );
};
