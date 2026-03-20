import React, { useState, useEffect } from 'react';
import { Client, ClientProfileStats } from '../../types';
import { clientService } from '../../services/clientService';

interface ClientListProps {
  onSelectClient: (client: Client) => void;
}

interface ExtendedClient extends Client {
  stats?: ClientProfileStats;
}

const ClientList: React.FC<ClientListProps> = ({ onSelectClient }) => {
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('Todos');

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: ''
  });

  useEffect(() => {
    loadClients();
  },[]);

  const loadClients = async () => {
    try {
      const data = await clientService.getAllClients();
      
      // Calculate stats for each client for the list metrics
      const enrichedData = await Promise.all(
        data.map(async (cli) => {
          const history = await clientService.getClientPurchaseHistory(cli);
          const stats = await clientService.calculateClientStats(cli, history);
          return { ...cli, stats };
        })
      );

      setClients(enrichedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'Ativo': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Regular': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Em Risco': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Inativo': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Create fake client for testing if empty
  const handleCreateTestClient = async () => {
    await clientService.createClient({
      nome: 'Cliente Exemplo VIP',
      telefone: '11999999999',
      cpf: '12345678900',
      is_vip_manual: false
    });
    loadClients();
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.cpf || '').includes(searchTerm) || 
                          (c.telefone || '').includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterSegment === 'VIPs') return c.stats?.isVip;
    if (filterSegment !== 'Todos') return c.stats?.frequencyStatus === filterSegment;
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    await clientService.createClient({
      nome: formData.nome,
      cpf: formData.cpf,
      telefone: formData.telefone,
      email: formData.email,
      endereco: formData.endereco,
      is_vip_manual: false
    });

    setFormData({ nome: '', cpf: '', telefone: '', email: '', endereco: '' });
    setIsCreating(false);
    loadClients();
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
        <div className="flex gap-4 flex-1 mr-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#13191f] border border-[#1e242b] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="bg-[#13191f] border border-[#1e242b] rounded-lg px-4 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos Segmentos</option>
            <option value="VIPs">👑 Apenas VIPs</option>
            <option value="Ativo">🟢 Ativos (30d)</option>
            <option value="Regular">🔵 Regulares (90d)</option>
            <option value="Em Risco">🟠 Em Risco (180d)</option>
            <option value="Inativo">🔴 Inativos (+180d)</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[20px]">{isCreating ? 'close' : 'person_add'}</span>
          {isCreating ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-bold text-white mb-4">Adicionar Novo Cliente</h3>
          
          <form onSubmit={handleCreateSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Nome Completo *</label>
                <input 
                  type="text" required
                  value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">CPF</label>
                <input 
                  type="text" 
                  value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})}
                  className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})}
                  className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-400 text-sm font-medium mb-1">Endereço Completo</label>
                <input 
                  type="text" 
                  value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})}
                  className="w-full bg-[#0e1217] border border-[#1e242b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#1e242b]">
               <button 
                 type="submit"
                 className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
               >
                 Salvar Cliente
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#13191f] border border-[#1e242b] rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e1217] text-slate-400 text-xs uppercase border-b border-[#1e242b]">
                <th className="p-4 font-semibold w-12"></th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Contato</th>
                <th className="p-4 font-semibold text-center">Frequência</th>
                <th className="p-4 font-semibold text-right">Cadastrado em</th>
                <th className="p-4 font-semibold text-right">LTV (Gasto Total)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-500">
                    <p className="mb-4">Nenhum cliente encontrado nos filtros atuais.</p>
                    <button onClick={handleCreateTestClient} className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-600/30">
                      Adicionar Cliente Teste
                    </button>
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr 
                    key={client.id} 
                    onClick={() => onSelectClient(client)}
                    className="border-b border-[#1e242b] hover:bg-[#1a2129] cursor-pointer transition-colors text-slate-300"
                  >
                    <td className="p-4 text-center">
                       {client.stats?.isVip && (
                         <span className="material-symbols-outlined text-amber-400" title="Cliente VIP">workspace_premium</span>
                       )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{client.nome}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{client.cpf || 'Sem CPF'}</div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>{client.telefone || 'Sem telefone'}</div>
                      <div className="text-xs">{client.email || ''}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(client.stats?.frequencyStatus)}`}>
                        {client.stats?.frequencyStatus}
                      </span>
                      {client.stats?.averageDaysBetweenPurchases && (
                        <div className="text-[10px] text-slate-500 mt-2">Média: {client.stats.averageDaysBetweenPurchases} dias</div>
                      )}
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right font-semibold text-emerald-400">
                      R$ {client.stats?.totalSpent.toFixed(2)}
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

export default ClientList;
