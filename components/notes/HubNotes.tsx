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

            {/* Note Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-10 flex flex-col gap-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center">
                             <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{editingNote?.id ? 'Editar' : 'Nova'} Anotação</h3>
                             <button onClick={() => setEditingNote({ ...editingNote, is_pinned: !editingNote?.is_pinned })} className={`p-2 rounded-xl transition-all ${editingNote?.is_pinned ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                                <span className="material-symbols-outlined">push_pin</span>
                             </button>
                        </div>
                        <form onSubmit={handleSave} className="flex flex-col gap-6">
                            <input className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-black text-xl" placeholder="Título da reunião ou decisão..." value={editingNote?.titulo || ''} onChange={e => setEditingNote({ ...editingNote, titulo: e.target.value })} required />
                            <textarea rows={12} className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-medium text-lg leading-relaxed resize-none custom-scrollbar" placeholder="Escreva livremente aqui..." value={editingNote?.conteudo || ''} onChange={e => setEditingNote({ ...editingNote, conteudo: e.target.value })} />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black">CANCELAR</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">SALVAR REGISTRO</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HubNotes;
