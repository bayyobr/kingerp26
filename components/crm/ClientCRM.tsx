import React, { useState } from 'react';
import ClientList from './ClientList';
import ClientProfile from './ClientProfile';
import CampaignManager from './CampaignManager';
import { Client } from '../../types';

const ClientCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clientes' | 'campanhas'>('clientes');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
            CRM & Clientes
          </h1>
          <p className="text-slate-400">Gerencie relacionamentos, analise frequências e dispare campanhas</p>
        </div>
        
        {/* CRM Tabs */}
        {!selectedClient && (
          <div className="bg-[#13191f] p-1 rounded-xl border border-[#1e242b] flex gap-1">
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'clientes'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e242b]'
              }`}
            >
              <span className="material-symbols-outlined align-middle mr-2 text-[18px]">group</span>
              Clientes
            </button>
            <button
              onClick={() => setActiveTab('campanhas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'campanhas'
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e242b]'
              }`}
            >
              <span className="material-symbols-outlined align-middle mr-2 text-[18px]">campaign</span>
              Campanhas
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedClient ? (
          <ClientProfile client={selectedClient} onBack={() => setSelectedClient(null)} />
        ) : activeTab === 'clientes' ? (
          <ClientList onSelectClient={setSelectedClient} />
        ) : (
          <CampaignManager />
        )}
      </div>
    </div>
  );
};

export default ClientCRM;
