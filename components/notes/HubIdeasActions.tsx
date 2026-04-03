import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';
import { StrategicIdea, StrategicAction } from '../../types';

const HubIdeasActions: React.FC = () => {
    const [view, setView] = useState<'ideas' | 'actions'>('ideas');
    const [ideas, setIdeas] = useState<StrategicIdea[]>([]);
    const [actions, setActions] = useState<StrategicAction[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState<Partial<StrategicIdea> | null>(null);

    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<Partial<StrategicAction> | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [i, a] = await Promise.all([
                hubEstrategicoService.getIdeas(),
                hubEstrategicoService.getActions()
            ]);
            setIdeas(i);
            setActions(a);
        } catch (error) {
            console.error("Error fetching ideas/actions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveIdea = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hubEstrategicoService.upsertIdea(editingIdea as any);
            setIsIdeaModalOpen(false);
            fetchData();
        } catch (error) { alert("Erro ao salvar ideia."); }
    };

    const handleSaveAction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hubEstrategicoService.upsertAction(editingAction as any);
            setIsActionModalOpen(false);
            fetchData();
        } catch (error) { alert("Erro ao salvar ação."); }
    };

    const getPriorityColor = (p: string) => {
        if (p === 'alta') return 'bg-rose-500/10 text-rose-500';
        if (p === 'media') return 'bg-amber-500/10 text-amber-500';
        return 'bg-blue-500/10 text-blue-500';
    };

    return (
        <div className="flex flex-col gap-8 animate-fadeIn">
            {/* Toggle Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-slate-800 p-1.5 rounded-2xl">
                    <button 
                        onClick={() => setView('ideas')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${view === 'ideas' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        MURAL DE IDEIAS
                    </button>
                    <button 
                        onClick={() => setView('actions')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${view === 'actions' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        PLANO DE AÇÃO
                    </button>
                </div>
                
                <button 
                    onClick={() => view === 'ideas' ? (setEditingIdea({ prioridade: 'media', status: 'ideia' }), setIsIdeaModalOpen(true)) : (setEditingAction({ status: 'pendente', prioridade: 'media' }), setIsActionModalOpen(true))}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black transition-all border border-slate-700"
                >
                    <span className="material-symbols-outlined">add</span>
                    ADICIONAR {view === 'ideas' ? 'IDEIA' : 'AÇÃO'}
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-800 rounded-3xl"></div>)}
                </div>
            ) : view === 'ideas' ? (
                /* IDEAS VIEW - MURAL STYLE */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {ideas.map(idea => (
                        <div key={idea.id} onClick={() => { setEditingIdea(idea); setIsIdeaModalOpen(true); }} className="bg-[#1e293b] border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 hover:border-blue-500/50 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getPriorityColor(idea.prioridade)}`}>
                                    {idea.prioridade}
                                </span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{idea.categoria || 'Geral'}</span>
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-white leading-tight group-hover:text-blue-400 transition-colors">{idea.titulo}</h4>
                                <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">{idea.descricao}</p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{idea.status.replace('_', ' ')}</span>
                                <span className="material-symbols-outlined text-slate-700 text-[18px]">lightbulb</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ACTIONS VIEW - KANBAN STYLE */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['pendente', 'em_andamento', 'concluida'].map(status => (
                        <div key={status} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 px-2 mb-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${status === 'pendente' ? 'bg-slate-500' : status === 'em_andamento' ? 'bg-blue-500' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{status.replace('_', ' ')}</h3>
                                <span className="text-slate-600 text-xs font-bold">{actions.filter(a => a.status === status).length}</span>
                            </div>
                            
                            <div className="flex flex-col gap-4 min-h-[500px] p-2 rounded-3xl bg-slate-900/40 border border-slate-800/50">
                                {actions.filter(a => a.status === status).map(action => (
                                    <div key={action.id} onClick={() => { setEditingAction(action); setIsActionModalOpen(true); }} className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl flex flex-col gap-3 hover:border-slate-600 cursor-pointer shadow-lg group">
                                        <h4 className="text-sm font-bold text-slate-200 leading-tight">{action.descricao}</h4>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Responsável</span>
                                                <span className="text-[11px] font-bold text-slate-400">{action.responsavel || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Prazo</span>
                                                <span className="text-[11px] font-bold text-slate-300">{action.prazo ? new Date(action.prazo).toLocaleDateString('pt-BR') : '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Idea Modal */}
            {isIdeaModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 flex flex-col gap-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Registrar Ideia</h3>
                            <p className="text-slate-400 font-medium">Capture insights estratégicos para o futuro.</p>
                        </div>
                        <form onSubmit={handleSaveIdea} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Titulo da Ideia</label>
                                <input className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold" value={editingIdea?.titulo || ''} onChange={e => setEditingIdea({ ...editingIdea, titulo: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Prioridade</label>
                                    <select className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold" value={editingIdea?.prioridade || 'media'} onChange={e => setEditingIdea({ ...editingIdea, prioridade: e.target.value as any })}>
                                        <option value="alta">Alta</option>
                                        <option value="media">Média</option>
                                        <option value="low">Baixa</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                    <select className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold" value={editingIdea?.status || 'ideia'} onChange={e => setEditingIdea({ ...editingIdea, status: e.target.value as any })}>
                                        <option value="ideia">Ideia</option>
                                        <option value="em_avaliação">Em Avaliação</option>
                                        <option value="aprovada">Aprovada</option>
                                        <option value="em_execução">Em Execução</option>
                                        <option value="descartada">Descartada</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                                <textarea rows={4} className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold" value={editingIdea?.descricao || ''} onChange={e => setEditingIdea({ ...editingIdea, descricao: e.target.value })} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsIdeaModalOpen(false)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black">CANCELAR</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">SALVAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Action Modal (Book Format) */}
            {isActionModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-[#1e293b] border border-slate-800 rounded-[3rem] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative group/modal max-h-[90vh]">
                        
                        {/* LEFT PAGE: Form fields */}
                        <div className="w-full md:w-[35%] bg-slate-900/50 p-8 flex flex-col gap-6 border-r border-slate-800/50 relative overflow-y-auto custom-scrollbar">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Plano de Ação</h3>
                                <p className="text-slate-400 font-medium">Configure e detalhe sua estratégia.</p>
                            </div>

                            <form id="action-form" onSubmit={handleSaveAction} className="flex flex-col gap-5 flex-1">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">O que fazer?</label>
                                    <input className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white font-bold" value={editingAction?.descricao || ''} onChange={e => setEditingAction({ ...editingAction, descricao: e.target.value })} required placeholder="Título da ação..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                        <select className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white font-bold text-sm" value={editingAction?.status || 'pendente'} onChange={e => setEditingAction({ ...editingAction, status: e.target.value as any })}>
                                            <option value="pendente">Pendente</option>
                                            <option value="em_andamento">Em Andamento</option>
                                            <option value="concluida">Concluída</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Prioridade</label>
                                        <select className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white font-bold text-sm" value={editingAction?.prioridade || 'media'} onChange={e => setEditingAction({ ...editingAction, prioridade: e.target.value as any })}>
                                            <option value="alta">Alta</option>
                                            <option value="media">Média</option>
                                            <option value="low">Baixa</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Prazo Final</label>
                                    <input type="date" className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white font-bold" value={editingAction?.prazo || ''} onChange={e => setEditingAction({ ...editingAction, prazo: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Responsável</label>
                                    <input className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white font-bold" value={editingAction?.responsavel || ''} onChange={e => setEditingAction({ ...editingAction, responsavel: e.target.value })} placeholder="Nome ou equipe..." />
                                </div>
                                
                                <div className="mt-auto pt-6 flex flex-col gap-3">
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-600/10 transition-all active:scale-95">
                                        <span className="material-symbols-outlined">save</span>
                                        SALVAR REGISTRO
                                    </button>
                                    <button type="button" onClick={() => setIsActionModalOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-4 rounded-2xl font-black text-sm tracking-widest transition-all">
                                        FECHAR
                                    </button>
                                </div>
                            </form>

                            {/* Book Spine Shadow */}
                            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>
                        </div>

                        {/* RIGHT PAGE: Large Details/Workspace Area */}
                        <div className="flex-1 bg-[#1e293b] p-6 md:p-10 flex flex-col relative overflow-hidden">
                            {/* Paper Lines subtle effect */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex flex-col p-10 gap-8">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="h-[1px] w-full bg-white"></div>
                                ))}
                            </div>
                            
                            <textarea 
                                form="action-form"
                                className="flex-1 bg-transparent border-none text-slate-200 font-medium text-lg leading-[2] resize-none focus:ring-0 custom-scrollbar p-0 z-10 placeholder:text-slate-700/50"
                                placeholder="Espaço livre para rascunhar o plano de ação, passos, checklists manuais, ou qualquer anotação importante..." 
                                value={editingAction?.detalhes || ''} 
                                onChange={e => setEditingAction({ ...editingAction, detalhes: e.target.value })} 
                            />

                            {/* Page Indicator Decor */}
                            <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] select-none z-10">
                                <span>KING OS • ESTRATÉGICO</span>
                                <span>WORKSPACE DE AÇÃO</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default HubIdeasActions;
