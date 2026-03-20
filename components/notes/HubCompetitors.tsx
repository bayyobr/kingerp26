import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';
import { Competitor } from '../../types';

const HubCompetitors: React.FC = () => {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComp, setEditingComp] = useState<Partial<Competitor> | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await hubEstrategicoService.getCompetitors();
            setCompetitors(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hubEstrategicoService.upsertCompetitor(editingComp as any);
            setIsModalOpen(false);
            fetchData();
        } catch (error) { alert("Erro ao salvar concorrente"); }
    };

    return (
        <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Radar de Concorrência</h2>
                    <p className="text-slate-400 font-medium">Monitore o mercado e antecipe movimentos.</p>
                </div>
                <button onClick={() => { setEditingComp({ nome: '', channel_venda: '', pontos_fortes: '', pontos_fracos: '', faixa_preco: '', observacoes: '' }); setIsModalOpen(true); }} className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-2xl border border-slate-700 shadow-xl transition-all">
                    <span className="material-symbols-outlined">radar</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitors.map(comp => (
                    <div key={comp.id} className="bg-[#1e293b] border border-slate-800 p-8 rounded-[2.5rem] flex flex-col gap-6 group hover:border-blue-500/50 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-500">{comp.nome.charAt(0)}</div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{comp.nome}</h3>
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{comp.canal_venda || 'Canais Digitais'}</p>
                                </div>
                            </div>
                            <button onClick={() => { setEditingComp(comp); setIsModalOpen(true); }} className="p-2 text-slate-600 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">edit_square</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Pontos Fortes</span>
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{comp.pontos_fortes || 'Nenhuma informação registrada.'}</p>
                            </div>
                            <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl">
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Fraquezas</span>
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{comp.pontos_fracos || 'Nenhuma informação registrada.'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Observações do Mercado</span>
                                <span>{comp.ultima_atualizacao ? new Date(comp.ultima_atualizacao).toLocaleDateString('pt-BR') : '-'}</span>
                             </div>
                             <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
                                <p className="text-slate-400 text-sm italic">"{comp.observacoes || 'Sem notas recentes.'}"</p>
                             </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Faixa de Preço</span>
                             <span className="bg-slate-800 text-white px-4 py-1 rounded-full text-xs font-black">{comp.faixa_preco || 'Média'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Competitor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-10 flex flex-col gap-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Radar de Concorrência</h3>
                            <p className="text-slate-400 font-medium">Documente movimentos da concorrência.</p>
                        </div>
                        <form onSubmit={handleSave} className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Concorrente</label>
                                <input className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 text-white font-bold" value={editingComp?.nome || ''} onChange={e => setEditingComp({ ...editingComp, nome: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Canais</label>
                                    <input className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 text-white font-bold" placeholder="Ex: Instagram, Mercado Livre" value={editingComp?.canal_venda || ''} onChange={e => setEditingComp({ ...editingComp, canal_venda: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Preço</label>
                                    <select className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 text-white font-bold" value={editingComp?.faixa_preco || ''} onChange={e => setEditingComp({ ...editingComp, faixa_preco: e.target.value })}>
                                        <option value="Premium">Premium (Mais Caro)</option>
                                        <option value="Média">Média de Mercado</option>
                                        <option value="Low Cost">Low Cost (Combate)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 text-emerald-500">Pontos Fortes</label>
                                    <textarea className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 text-white font-bold h-24" value={editingComp?.pontos_fortes || ''} onChange={e => setEditingComp({ ...editingComp, pontos_fortes: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 text-rose-500">Fraquezas</label>
                                    <textarea className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 text-white font-bold h-24" value={editingComp?.pontos_fracos || ''} onChange={e => setEditingComp({ ...editingComp, pontos_fracos: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Observações Recentes</label>
                                <textarea className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 text-white font-bold h-24" value={editingComp?.observacoes || ''} onChange={e => setEditingComp({ ...editingComp, observacoes: e.target.value })} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black">CANCELAR</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">SALVAR RADAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HubCompetitors;
