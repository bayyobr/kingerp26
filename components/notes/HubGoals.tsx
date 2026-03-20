import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';
import { StrategicGoal } from '../../types';

const HubGoals: React.FC = () => {
    const [goals, setGoals] = useState<StrategicGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Partial<StrategicGoal> | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await hubEstrategicoService.getGoals();
            setGoals(data);
        } catch (error) {
            console.error("Error fetching goals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGoal?.nome || !editingGoal?.valor_alvo) return;
        
        try {
            await hubEstrategicoService.upsertGoal({
                ...editingGoal,
                status: editingGoal.status || 'no_prazo'
            });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert("Erro ao salvar meta.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir meta estrategica?")) return;
        try {
            await hubEstrategicoService.deleteGoal(id);
            fetchData();
        } catch (error) {
            alert("Erro ao deletar.");
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão de Metas</h2>
                    <p className="text-slate-400 font-medium">Transformando visão em números alcançáveis.</p>
                </div>
                <button 
                    onClick={() => { setEditingGoal({ valor_alvo: 0, valor_atual: 0, unidade: 'R$', periodicidade: 'mensal', status: 'no_prazo' }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    DEFINIR NOVA META
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-800 rounded-3xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => {
                        const progress = Math.min(100, (goal.valor_atual / (goal.valor_alvo || 1)) * 100);
                        const isExpired = goal.prazo && new Date(goal.prazo) < new Date();
                        
                        return (
                            <div key={goal.id} className="bg-[#1e293b] border border-slate-800 p-8 rounded-[2rem] flex flex-col gap-6 group hover:border-blue-500/50 transition-all relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{goal.periodicidade}</span>
                                        <h3 className="text-xl font-black text-white leading-tight mt-1">{goal.nome}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }} className="text-slate-500 hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(goal.id)} className="text-slate-700 hover:text-rose-500 transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-2xl font-black ${progress >= 100 ? 'text-emerald-500' : 'text-white'}`}>
                                                {goal.unidade === 'R$' ? 'R$ ' : ''}{goal.valor_atual.toLocaleString('pt-BR')}
                                            </span>
                                            <span className="text-slate-500 font-bold text-sm">/ {goal.valor_alvo.toLocaleString('pt-BR')}{goal.unidade !== 'R$' ? ` ${goal.unidade}` : ''}</span>
                                        </div>
                                        <span className={`text-xs font-black ${progress >= 100 ? 'text-emerald-500' : 'text-blue-400'}`}>{progress.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 mt-auto border-t border-slate-800/50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsavel</span>
                                        <span className="text-xs font-bold text-slate-300">{goal.responsavel || 'Equipe Geral'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prazo</span>
                                        <span className={`text-xs font-bold ${isExpired ? 'text-rose-400' : 'text-slate-300'}`}>
                                            {goal.prazo ? new Date(goal.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                        </span>
                                    </div>
                                </div>

                                {progress >= 100 && (
                                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-slate-900 font-black px-4 py-1.5 rounded-xl text-[10px] uppercase shadow-lg animate-bounce">
                                        Meta Batida 🏆
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Meta */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 flex flex-col gap-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{editingGoal?.id ? 'Editar' : 'Nova'} Meta Estratégica</h3>
                            <p className="text-slate-400 font-medium">Defina alvos claros para o crescimento.</p>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Meta</label>
                                <input 
                                    className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                                    placeholder="Ex: Faturamento Março"
                                    value={editingGoal?.nome || ''}
                                    onChange={e => setEditingGoal({ ...editingGoal, nome: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Alvo (Target)</label>
                                    <input 
                                        type="number"
                                        className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                                        value={editingGoal?.valor_alvo || 0}
                                        onChange={e => setEditingGoal({ ...editingGoal, valor_alvo: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Atual</label>
                                    <input 
                                        type="number"
                                        className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                                        value={editingGoal?.valor_atual || 0}
                                        onChange={e => setEditingGoal({ ...editingGoal, valor_atual: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Unidade</label>
                                    <select 
                                        className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                                        value={editingGoal?.unidade || 'R$'}
                                        onChange={e => setEditingGoal({ ...editingGoal, unidade: e.target.value })}
                                    >
                                        <option value="R$">R$ (Financeiro)</option>
                                        <option value="un">un (Quantidade)</option>
                                        <option value="%">% (Percentual)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Periodo</label>
                                    <select 
                                        className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                                        value={editingGoal?.periodicidade || 'mensal'}
                                        onChange={e => setEditingGoal({ ...editingGoal, periodicidade: e.target.value as any })}
                                    >
                                        <option value="mensal">Mensal</option>
                                        <option value="trimestral">Trimestral</option>
                                        <option value="anual">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Prazo</label>
                                    <input 
                                        type="date"
                                        className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                                        value={editingGoal?.prazo || ''}
                                        onChange={e => setEditingGoal({ ...editingGoal, prazo: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Responsavel</label>
                                    <input 
                                        className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                                        placeholder="Ex: Vendedores"
                                        value={editingGoal?.responsavel || ''}
                                        onChange={e => setEditingGoal({ ...editingGoal, responsavel: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black transition-all hover:bg-slate-700">CANCELAR</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black transition-all hover:bg-blue-500 shadow-xl">SALVAR META</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HubGoals;
