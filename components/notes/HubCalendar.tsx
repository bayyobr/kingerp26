import React, { useState, useEffect } from 'react';
import { hubEstrategicoService } from '../../services/hubEstrategicoService';
import { StrategicEvent } from '../../types';

const HubCalendar: React.FC = () => {
    const [events, setEvents] = useState<StrategicEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<StrategicEvent>>({ titulo: '', tipo: 'reuniao', data: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await hubEstrategicoService.getEvents();
            setEvents(data);
        } catch (error) { console.error(error); }
    };

    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const numDays = daysInMonth(month, year);
        const startDay = firstDayOfMonth(month, year);
        const calendar = [];

        for (let i = 0; i < startDay; i++) {
            calendar.push(<div key={`empty-${i}`} className="h-32 border border-slate-800/20"></div>);
        }

        for (let day = 1; day <= numDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.data === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            calendar.push(
                <div key={day} className={`h-32 border border-slate-800/50 p-2 flex flex-col gap-1 transition-all hover:bg-slate-800/30 overflow-y-auto custom-scrollbar no-scrollbar ${isToday ? 'bg-blue-600/5 ring-1 ring-inset ring-blue-500/50' : ''}`}>
                    <span className={`text-xs font-black ${isToday ? 'text-blue-500' : 'text-slate-500'}`}>{day}</span>
                    {dayEvents.map(event => (
                        <div key={event.id} className="bg-blue-600/20 border-l-2 border-blue-500 px-1.5 py-0.5 rounded-r-sm truncate">
                            <span className="text-[9px] font-black text-blue-300 uppercase block">{event.tipo}</span>
                            <span className="text-[10px] font-bold text-white truncate block">{event.titulo}</span>
                        </div>
                    ))}
                </div>
            );
        }

        return calendar;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hubEstrategicoService.upsertEvent(newEvent);
            setIsModalOpen(false);
            fetchData();
        } catch (error) { alert("Erro ao salvar evento"); }
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                        <p className="text-slate-400 font-medium text-xs font-black uppercase tracking-widest">MAPA DE EXECUÇÃO</p>
                    </div>
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-xl shrink-0">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 text-[10px] font-black text-slate-400 hover:text-white uppercase transition-colors">Hoje</button>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg">
                    <span className="material-symbols-outlined">event</span>
                    NOVO EVENTO
                </button>
            </div>

            <div className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/50">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-slate-800/50 last:border-0">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {renderCalendar()}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 flex flex-col gap-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Agendar Evento</h3>
                            <p className="text-slate-400 font-medium">Lançamentos, reuniões e marcos do negócio.</p>
                        </div>
                        <form onSubmit={handleSave} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Título</label>
                                <input className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold" value={newEvent.titulo} onChange={e => setNewEvent({ ...newEvent, titulo: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                                    <select className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold" value={newEvent.tipo} onChange={e => setNewEvent({ ...newEvent, tipo: e.target.value })}>
                                        <option value="meta">Prazo de Meta</option>
                                        <option value="reuniao">Reunião</option>
                                        <option value="campanha">Campanha</option>
                                        <option value="lancamento">Lançamento</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                                    <input type="date" className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all text-white font-bold" value={newEvent.data} onChange={e => setNewEvent({ ...newEvent, data: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black">CANCELAR</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">CRIAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HubCalendar;
