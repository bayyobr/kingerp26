import React from 'react';
import { useNavigate } from 'react-router-dom';

const IntegrationsList: React.FC = () => {
    const navigate = useNavigate();

    const integrations = [
        {
            id: 'mercadolivre',
            name: 'Mercado Livre',
            description: 'Venda e gerencie seus anúncios do Mercado Livre.',
            icon: 'local_mall',
            color: '#ffe600',
            path: '/integracoes/mercado-livre',
            status: 'Em breve'
        }
    ];

    return (
        <div className="p-8 max-w-[1200px] mx-auto min-h-full">
            <header className="mb-8 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">Integrações</h1>
                <p className="text-slate-400">Gerencie a conexão com marketplaces e ferramentas externas.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => item.status !== 'Em breve' && navigate(item.path)}
                        className={`
                            bg-surface-dark border border-slate-800 p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]
                            ${item.status === 'Em breve' ? 'opacity-60 grayscale' : 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5'}
                        `}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                style={{ backgroundColor: item.color }}
                            >
                                <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${item.status === 'Ativo' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                                }`}>
                                {item.status}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>

                        {item.status !== 'Em breve' && (
                            <div className="mt-6 flex items-center gap-2 text-blue-500 text-sm font-bold">
                                Configurar <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IntegrationsList;
