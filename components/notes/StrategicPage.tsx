import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';
import HubDashboard from './HubDashboard';
import HubGoals from './HubGoals';
import HubIdeasActions from './HubIdeasActions';
import HubCalendar from './HubCalendar';
import HubTrends from './HubTrends';
import HubNotes from './HubNotes';
import HubCompetitors from './HubCompetitors';

type StrategicTab = 'dashboard' | 'metas' | 'ideias' | 'calendario' | 'tendencias' | 'anotacoes' | 'radar';

const StrategicPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<StrategicTab>('dashboard');
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'monitoring' },
        { id: 'metas', label: 'Metas', icon: 'rocket_launch' },
        { id: 'ideias', label: 'Ideias & Ações', icon: 'lightbulb' },
        { id: 'calendario', label: 'Calendário', icon: 'calendar_month' },
        { id: 'tendencias', label: 'Tendências', icon: 'trending_up' },
        { id: 'anotacoes', label: 'Anotações', icon: 'edit_note' },
        { id: 'radar', label: 'Radar Central', icon: 'radar' },
    ];

    return (
        <div className="flex flex-col h-full bg-[#0f172a]">
            {/* Sub-Header / Tab Navigation */}
            <div className="bg-[#1e293b] border-b border-slate-700 px-8 py-2 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as StrategicTab)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-blue-600 text-white font-bold shadow-lg' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                            <span className="text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>
                
                <div className="hidden lg:flex items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        QG Operacional
                    </span>
                </div>
            </div>

            {/* Active Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                {activeTab === 'dashboard' && <HubDashboard />}
                {activeTab === 'metas' && <HubGoals />}
                {activeTab === 'ideias' && <HubIdeasActions />}
                {activeTab === 'calendario' && <HubCalendar />}
                {activeTab === 'tendencias' && <HubTrends />}
                {activeTab === 'anotacoes' && <HubNotes />}
                {activeTab === 'radar' && <HubCompetitors />}
            </div>
        </div>
    );
};

export default StrategicPage;
