import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';
import { StrategicNote } from '../../types';

const HubNotes: React.FC = () => {
    const [notes, setNotes] = useState<StrategicNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Partial<StrategicNote> | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await hubEstrategicoService.getNotes();
            setNotes(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hubEstrategicoService.upsertNote({
                ...editingNote,
                data: editingNote?.data || new Date().toISOString()
            });
            setIsModalOpen(false);
            fetchData();
        } catch (error) { alert("Erro ao salvar nota."); }
    };

    const filteredNotes = notes.filter(n => 
        n.titulo.toLowerCase().includes(search.toLowerCase()) || 
        n.conteudo?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Anotações Estratégicas</h2>
                    <p className="text-slate-400 font-medium">Memória viva de decisões e planos de longo prazo.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                         <input 
                            type="text" 
                            className="w-full bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-3 text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Buscar anotações..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                         />
                    </div>
                    <button onClick={() => { setEditingNote({ titulo: '', conteudo: '', is_pinned: false }); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map(note => (
                    <div key={note.id} onClick={() => { setEditingNote(note); setIsModalOpen(true); }} className={`bg-[#1e293b] border ${note.is_pinned ? 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'border-slate-800'} p-8 rounded-[2.5rem] flex flex-col gap-4 cursor-pointer hover:scale-[1.02] transition-all group`}>
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(note.data).toLocaleDateString('pt-BR')}</span>
                            {note.is_pinned && <span className="material-symbols-outlined text-blue-500 text-xl">push_pin</span>}
                        </div>
                        <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{note.titulo}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">{note.conteudo}</p>
                        <div className="mt-auto pt-4 flex justify-end">
                             <span className="material-symbols-outlined text-slate-700 group-hover:text-blue-500/50">arrow_forward_ios</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Digital Book/Folio Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-[#1e293b] border border-slate-800 rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative group/modal max-h-[90vh]">
                        
                        {/* LEFT PAGE: Metadata & Title */}
                        <div className="w-full md:w-[35%] bg-slate-900/50 p-10 flex flex-col gap-8 border-r border-slate-800/50 relative">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Página de Registro</span>
                                <button 
                                    onClick={() => setEditingNote({ ...editingNote, is_pinned: !editingNote?.is_pinned })} 
                                    className={`p-2.5 rounded-2xl transition-all ${editingNote?.is_pinned ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-110' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">push_pin</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Título do Documento</label>
                                <input 
                                    className="bg-transparent border-none text-2xl font-black text-white placeholder:text-slate-700 focus:ring-0 w-full p-0 leading-tight uppercase tracking-tighter"
                                    placeholder="TÍTULO DA ANOTAÇÃO..." 
                                    value={editingNote?.titulo || ''} 
                                    onChange={e => setEditingNote({ ...editingNote, titulo: e.target.value })} 
                                    required 
                                    autoFocus
                                />
                            </div>

                            <div className="mt-auto flex flex-col gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Registro</span>
                                    <span className="text-sm font-bold text-slate-300">{new Date(editingNote?.data || new Date()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    <button 
                                        type="button" 
                                        onClick={handleSave}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-600/10 transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined">save</span>
                                        SALVAR REGISTRO
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-4 rounded-2xl font-black text-sm tracking-widest transition-all"
                                    >
                                        FECHAR LIVRO
                                    </button>
                                </div>
                            </div>

                            {/* Book Spine Shadow */}
                            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>
                        </div>

                        {/* RIGHT PAGE: Large Content Area */}
                        <div className="flex-1 bg-[#1e293b] p-2 md:p-10 flex flex-col relative overflow-hidden">
                            {/* Paper Lines subtle effect */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex flex-col p-10 gap-8">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="h-[1px] w-full bg-white"></div>
                                ))}
                            </div>
                            
                            <textarea 
                                className="flex-1 bg-transparent border-none text-slate-200 font-medium text-lg md:text-xl leading-[2] md:leading-[2.5] resize-none focus:ring-0 custom-scrollbar p-0 z-10 placeholder:text-slate-700/50"
                                placeholder="Descreva aqui sua visão estratégica, insights ou decisões tomadas..." 
                                value={editingNote?.conteudo || ''} 
                                onChange={e => setEditingNote({ ...editingNote, conteudo: e.target.value })} 
                            />

                            {/* Page Indicator Decor */}
                            <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] select-none z-10">
                                <span>KING OS • ESTRATÉGICO</span>
                                <span>FOLIO № {editingNote?.id?.substring(0, 4) || 'NEW'}</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default HubNotes;
