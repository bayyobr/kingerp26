import React from 'react';
import { Link } from 'react-router-dom';

export const QuickActions: React.FC = () => {
    const actions = [
        { label: 'Nova Venda', icon: 'add_shopping_cart', link: '/pdv', color: 'bg-primary' },
        { label: 'OS Entrada', icon: 'build', link: '/ordens-servico', color: 'bg-blue-500' },
        { label: 'Novo Cliente', icon: 'person_add', link: '/cadastro/clientes', color: 'bg-purple-500' },
        { label: 'Estoque', icon: 'inventory', link: '/estoque', color: 'bg-amber-500' },
        { label: 'Ideia Central', icon: 'lightbulb', link: '/estrategico', color: 'bg-rose-500' },
    ];

    return (
        <div className="bg-surface-dark border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acesso Rápido</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                {actions.map((act, i) => (
                    <Link 
                        key={i}
                        to={act.link}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl transition-all active:scale-95 group flex-shrink-0"
                    >
                        <span className={`material-symbols-outlined text-[18px] text-white/70 group-hover:scale-110 transition-transform`}>
                            {act.icon}
                        </span>
                        <span className="text-xs font-bold text-white whitespace-nowrap">{act.label}</span>
                    </Link>
                ))}
            </div>

            <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
        </div>
    );
};
