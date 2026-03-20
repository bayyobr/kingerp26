import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types';
import { campaignService } from '../../services/campaignService';

const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Campaign['type']>('Desconto');

  useEffect(() => {
    loadCampaigns();
  },[]);

  const loadCampaigns = async () => {
    const data = await campaignService.getAllCampaigns();
    setCampaigns(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    await campaignService.createCampaign({
      name,
      description,
      type,
      status: 'Ativa'
    });

    setName('');
    setDescription('');
    setIsCreating(false);
    loadCampaigns();
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativa' ? 'Encerrada' : 'Ativa';
    await campaignService.toggleCampaignStatus(id, newStatus);
    loadCampaigns();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">sync</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400">campaign</span>
          Minhas Campanhas
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <span className="material-symbols-outlined text-[20px]">{isCreating ? 'close' : 'add'}</span>
          {isCreating ? 'Cancelar' : 'Nova Campanha'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-bold text-white mb-4">Criar Módulo de Disparo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">Nome da Campanha *</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Black Friday VIP" 
                className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" 
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">Gatilho (Tipo)</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as Campaign['type'])}
                className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Desconto">Desconto Exclusivo</option>
                <option value="Brinde">Brinde Física</option>
                <option value="Reativação">Reativação (Inativos)</option>
                <option value="Informativo">Informativo</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm font-medium mb-2">Mensagem Interna / Descrição</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 resize-none h-24"
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end">
             <button 
               onClick={handleCreate}
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
             >
               Salvar Campanha
             </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-[#13191f] border border-[#1e242b] rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e1217] text-slate-400 text-xs uppercase border-b border-[#1e242b]">
                <th className="p-4 font-semibold">Campanha</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold text-center">Data Criação</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-slate-500">
                    Nenhuma campanha registrada. Crie a primeira acima!
                  </td>
                </tr>
              ) : (
                campaigns.map(camp => (
                  <tr key={camp.id} className="border-b border-[#1e242b] hover:bg-[#1a2129] transition-colors text-slate-300">
                    <td className="p-4">
                      <div className="font-bold text-white mb-1">{camp.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{camp.description || 'Sem descrição'}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded text-xs font-semibold">
                        {camp.type}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-400 font-mono text-xs">
                      {new Date(camp.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        camp.status === 'Ativa' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => toggleStatus(camp.id, camp.status)}
                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                          camp.status === 'Ativa' 
                            ? 'text-rose-400 hover:bg-rose-500/20' 
                            : 'text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {camp.status === 'Ativa' ? 'Encerrar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CampaignManager;
