import React, { useState, useEffect } from 'react';
import { Client, PurchaseHistoryItem, ClientProfileStats, ClientCampaign } from '../../types';
import { clientService } from '../../services/clientService';
import { campaignService } from '../../services/campaignService';

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onBack }) => {
  const [stats, setStats] = useState<ClientProfileStats | null>(null);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [campaigns, setCampaigns] = useState<ClientCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [client.id]);

  const loadProfile = async () => {
    try {
       const hist = await clientService.getClientPurchaseHistory(client);
       setHistory(hist);

       const st = await clientService.calculateClientStats(client, hist);
       setStats(st);

       const camps = await campaignService.getCampaignsForClient(client.id);
       setCampaigns(camps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleManualVip = async () => {
    const updated = !client.is_vip_manual;
    await clientService.updateClient(client.id, { is_vip_manual: updated });
    client.is_vip_manual = updated;
    loadProfile();
  };

  if (loading || !stats) {
     return (
       <div className="flex justify-center items-center h-full">
         <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">sync</span>
       </div>
     );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Ativo': return 'text-emerald-400';
      case 'Regular': return 'text-blue-400';
      case 'Em Risco': return 'text-amber-400';
      case 'Inativo': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col pt-4 overflow-y-auto pr-2 custom-scrollbar">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          Voltar para Lista
        </button>

        <button 
          onClick={toggleManualVip}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            stats.isVip 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {stats.isVip ? 'workspace_premium' : 'star_border'}
          </span>
          {stats.isVip ? 'Cliente VIP' : 'Tornar VIP'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Profile Card */}
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6 flex flex-col items-center">
           <div className="w-24 h-24 bg-[#1e242b] rounded-full flex items-center justify-center text-3xl font-bold text-slate-500 mb-4">
              {client.nome.charAt(0).toUpperCase()}
           </div>
           <h2 className="text-xl font-bold text-white text-center mb-1">{client.nome}</h2>
           <p className="text-slate-400 text-sm mb-4 font-mono">{client.cpf || 'Sem CPF'}</p>
           
           <div className="w-full space-y-3 text-sm text-slate-300 mt-4 border-t border-[#1e242b] pt-4">
             <div className="flex justify-between">
               <span className="text-slate-500">Telefone:</span>
               <span>{client.telefone || '-'}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">Email:</span>
               <span>{client.email || '-'}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">Cadastrado em:</span>
               <span>{new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
             </div>
           </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6 lg:col-span-2 grid grid-cols-2 gap-6">
           <div className="col-span-2">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">monitoring</span>
                Radar de Frequência
             </h3>
           </div>
           
           <div className="bg-[#0e1217] p-4 rounded-lg border border-[#1e242b]">
              <p className="text-slate-500 text-sm mb-1">Status Atual</p>
              <p className={`text-2xl font-bold ${getStatusColor(stats.frequencyStatus)}`}>
                {stats.frequencyStatus}
              </p>
           </div>

           <div className="bg-[#0e1217] p-4 rounded-lg border border-[#1e242b]">
              <p className="text-slate-500 text-sm mb-1">Valor Gasto (LTV)</p>
              <p className="text-2xl font-bold text-emerald-400">
                R$ {stats.totalSpent.toFixed(2)}
              </p>
           </div>

           <div className="bg-[#0e1217] p-4 rounded-lg border border-[#1e242b]">
              <p className="text-slate-500 text-sm mb-1">Média entre compras</p>
              <p className="text-xl font-semibold text-white">
                {stats.averageDaysBetweenPurchases ? `${stats.averageDaysBetweenPurchases} dias` : 'N/A'}
              </p>
           </div>

           <div className="bg-[#0e1217] p-4 rounded-lg border border-[#1e242b]">
              <p className="text-slate-500 text-sm mb-1">Previsão Próxima Compra</p>
              <p className="text-xl font-semibold text-blue-400">
                {stats.estimatedNextPurchaseDate 
                  ? new Date(stats.estimatedNextPurchaseDate).toLocaleDateString('pt-BR') 
                  : 'N/A'}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Purchase History */}
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl flex flex-col lg:col-span-2">
           <div className="p-4 border-b border-[#1e242b]">
             <h3 className="text-lg font-bold text-white">Histórico Multicanal ({history.length} compras)</h3>
           </div>
           <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar">
             {history.length === 0 ? (
               <p className="text-slate-500 text-center py-8">Nenhuma compra registrada com este CPF/Telefone.</p>
             ) : (
               <div className="space-y-4">
                 {history.map((h, i) => (
                   <div key={i} className="bg-[#0e1217] border border-[#1e242b] p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${h.type === 'PDV' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {h.type}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">{h.id}</span>
                          <span className="text-slate-500 text-xs">• {new Date(h.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-white text-sm">{h.itemsDescription}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">R$ {h.total.toFixed(2)}</p>
                        <p className="text-xs text-slate-500 capitalize">{h.status}</p>
                      </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Campaign History Log */}
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl flex flex-col">
           <div className="p-4 border-b border-[#1e242b]">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <span className="material-symbols-outlined text-purple-400">campaign</span>
               Campanhas Recebidas
             </h3>
           </div>
           <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar">
             {campaigns.length === 0 ? (
               <p className="text-slate-500 text-center py-8 text-sm">Nenhuma campanha enviada para este cliente ainda.</p>
             ) : (
               <div className="space-y-3">
                 {campaigns.map((c, i) => (
                   <div key={i} className="bg-[#0e1217] border border-[#1e242b] p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white text-sm font-semibold">Campanha ID: {c.campaign_id.slice(0,8)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Enviada em {new Date(c.date_sent).toLocaleDateString('pt-BR')}</p>
                      
                      <div className="flex items-center gap-2">
                        {c.converted ? (
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Converteu
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">pending</span>
                            Aguardando
                          </span>
                        )}
                      </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>

    </div>
  );
};

export default ClientProfile;
