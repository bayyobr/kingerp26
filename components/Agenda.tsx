import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../services/hubEstrategicoService';
import { StrategicEvent } from '../types';

const Agenda: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<StrategicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newEvent, setNewEvent] = useState({ titulo: '', data: '', tipo: 'reuniao', descricao: '' });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await hubEstrategicoService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.titulo || !newEvent.data) return;

        try {
            const eventToSave: Partial<StrategicEvent> = {
                titulo: newEvent.titulo,
                data: newEvent.data,
                tipo: newEvent.tipo,
                descricao: newEvent.descricao
            };

            if (editingId) {
                eventToSave.id = editingId;
            }

            await hubEstrategicoService.upsertEvent(eventToSave);
            await loadEvents();
            closeModal();
        } catch (error) {
            alert('Erro ao salvar evento');
        }
    };

    const deleteEvent = async () => {
        if (editingId) {
            try {
                await hubEstrategicoService.deleteEvent(editingId);
                await loadEvents();
                closeModal();
            } catch (error) {
                alert('Erro ao excluir evento');
            }
        }
    };

    const openNewEventModal = () => {
        setEditingId(null);
        setNewEvent({ titulo: '', data: '', tipo: 'reuniao', descricao: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (event: StrategicEvent) => {
        setEditingId(event.id);
        setNewEvent({
            titulo: event.titulo,
            data: event.data,
            tipo: event.tipo,
            descricao: event.descricao || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setNewEvent({ titulo: '', data: '', tipo: 'reuniao', descricao: '' });
    };

    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50 dark:bg-surface-darker/30 border border-slate-100 dark:border-slate-800/50"></div>);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

        const dayEvents = events.filter(e => {
            const [y, m, d] = e.data.split('-').map(Number);
            return d === i && (m - 1) === currentDate.getMonth() && y === currentDate.getFullYear();
        });

        days.push(
            <div key={i} className={`h-24 md:h-32 border border-slate-100 dark:border-slate-800/50 p-2 relative group hover:bg-slate-50 dark:hover:bg-surface-darker/50 transition-colors ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-surface-dark'}`}>
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {i}
                </span>

                <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[calc(100%-2rem)] custom-scrollbar">
                    {dayEvents.map(event => (
                        <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                            className={`text-[10px] p-1.5 rounded-lg border cursor-pointer hover:scale-[1.02] transition-all flex flex-col gap-0.5 ${event.tipo === 'reuniao' ? 'bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900/50' :
                                event.tipo === 'cliente' ? 'bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50' :
                                    event.tipo === 'entrega' ? 'bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50' :
                                        'bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                }`}
                        >
                            <span className="font-bold truncate">{event.titulo}</span>
                            {event.descricao && (
                                <span className="text-[9px] opacity-80 truncate">{event.descricao}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 h-full relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Agenda</h1>
                    <p className="text-slate-500 dark:text-[#a2aab4]">Gerencie seus compromissos e tarefas.</p>
                </div>
                <div className="flex bg-white dark:bg-surface-dark rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-surface-darker rounded-md text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex items-center justify-center px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[140px]">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-surface-darker rounded-md text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
                <button
                    onClick={openNewEventModal}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Evento
                </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-darker">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1">
                    {days}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-border-dark">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingId ? 'Editar Evento' : 'Novo Evento'}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveEvent} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    placeholder="Ex: Reunião com Cliente"
                                    value={newEvent.titulo}
                                    onChange={e => setNewEvent({ ...newEvent, titulo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    value={newEvent.data}
                                    onChange={e => setNewEvent({ ...newEvent, data: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    value={newEvent.tipo}
                                    onChange={e => setNewEvent({ ...newEvent, tipo: e.target.value as any })}
                                >
                                    <option value="reuniao">Reunião (Roxo)</option>
                                    <option value="cliente">Cliente (Azul)</option>
                                    <option value="entrega">Entrega (Amarelo)</option>
                                    <option value="outros">Outros (Cinza)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Descrição e Horário <span className="text-slate-400 font-normal">(opcional)</span>
                                </label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white resize-none h-24"
                                    placeholder="Ex: 14:00 - Levar aparelhos para o fornecedor na rua X"
                                    value={newEvent.descricao}
                                    onChange={e => setNewEvent({ ...newEvent, descricao: e.target.value })}
                                />
                            </div>
                            <div className="pt-2 flex justify-between gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={deleteEvent}
                                        className="px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg font-medium transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        Excluir
                                    </button>
                                )}
                                <div className="flex gap-2 ml-auto">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-darker rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {editingId ? 'Salvar Alterações' : 'Salvar Evento'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
