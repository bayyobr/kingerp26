import React, { useState, useEffect, useRef } from "react";
import { aiAssistantService, ChatMessage } from "../../services/aiAssistantService";

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

const AIAssistantDrawer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ id: string; sender: "user" | "ai" | "system"; text: string; toolDetails?: any }[]>([
        { id: "1", sender: "ai", text: "Olá! Sou o Assistente IA do King ERP. Como posso te ajudar hoje?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [voiceActive, setVoiceActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [pendingConfirm, setPendingConfirm] = useState<any | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Handle global event to toggle assistant
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener("toggle-ai-assistant", handleToggle);

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.lang = "pt-BR";
            rec.continuous = false;
            rec.interimResults = false;

            rec.onstart = () => setIsRecording(true);
            rec.onend = () => setIsRecording(false);
            rec.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                if (text) {
                    setInputValue(text);
                    handleSend(text);
                }
            };
            rec.onerror = (e: any) => {
                console.error("Speech recognition error:", e);
                setIsRecording(false);
            };

            recognitionRef.current = rec;
        }

        return () => {
            window.removeEventListener("toggle-ai-assistant", handleToggle);
        };
    }, [history]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Text-to-Speech synthesis
    const speak = (text: string) => {
        if (!voiceActive) return;
        window.speechSynthesis.cancel();
        // Strip out Markdown links/bold formatting for cleaner voice output
        const cleanText = text.replace(/[*#_\-\[\]()]/g, "").substring(0, 200);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "pt-BR";
        window.speechSynthesis.speak(utterance);
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("O reconhecimento de voz não é suportado ou está desabilitado neste navegador.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const handleSend = async (textToSend: string) => {
        const text = textToSend.trim();
        if (!text) return;

        // Reset inputs
        setInputValue("");
        const userMsgId = Date.now().toString();
        
        setMessages(prev => [...prev, { id: userMsgId, sender: "user", text }]);
        setLoading(true);

        try {
            // Check if OpenAI key is active
            if (!aiAssistantService.isKeyConfigured()) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        sender: "system",
                        text: "Atenção: A chave OPENAI_API_KEY não está configurada no arquivo .env.local. Por favor, cadastre a chave para habilitar as funções de IA."
                    }
                ]);
                setLoading(false);
                return;
            }

            const response = await aiAssistantService.sendMessage(text, history, (name, args, onConfirm) => {
                // Irreversible action hook triggered
            });

            if (response.pendingAction) {
                setPendingConfirm(response.pendingAction);
            }

            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    sender: "ai",
                    text: response.text,
                    toolDetails: response.pendingAction ? { ...response.pendingAction, pending: true } : undefined
                }
            ]);
            setHistory(response.history);
            speak(response.text);

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), sender: "system", text: "Erro ao processar sua solicitação." }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const confirmPendingAction = async () => {
        if (!pendingConfirm) return;
        setLoading(true);
        const action = pendingConfirm;
        setPendingConfirm(null);

        // Update UI immediately
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), sender: "system", text: `Executando: ${action.name}...` }
        ]);

        try {
            const response = await aiAssistantService.confirmAction(action, history);
            setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), sender: "ai", text: response.text }
            ]);
            setHistory(response.history);
            speak(response.text);
        } catch (error) {
            console.error(error);
            setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), sender: "system", text: "Erro ao confirmar ação." }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const cancelPendingAction = () => {
        setPendingConfirm(null);
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), sender: "system", text: "Ação cancelada pelo usuário." }
        ]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fadeIn">
            {/* Click outside to close drawer */}
            <div className="flex-1" onClick={() => setIsOpen(false)}></div>

            <div className="w-full max-w-md bg-[#13191f] border-l border-slate-800 h-full flex flex-col shadow-2xl relative animate-slideIn">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0e1217]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                            <span className="material-symbols-outlined text-blue-500 text-[24px]">smart_toy</span>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base">Assistente IA King</h2>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">OpenAI Agent</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* TTS Voice Toggle */}
                        <button
                            onClick={() => {
                                setVoiceActive(!voiceActive);
                                if (voiceActive) window.speechSynthesis.cancel();
                            }}
                            className={`p-2 rounded-lg transition-colors ${voiceActive ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                            title={voiceActive ? "Desativar voz de retorno" : "Ativar voz de retorno"}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {voiceActive ? "volume_up" : "volume_off"}
                            </span>
                        </button>
                        
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#11161d]">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.sender === "user" ? "items-end" : msg.sender === "system" ? "items-center" : "items-start"}`}
                        >
                            {msg.sender === "system" ? (
                                <div className="text-[11px] font-semibold text-slate-500 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-800/50">
                                    {msg.text}
                                </div>
                            ) : (
                                <>
                                    <div
                                        className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                                            msg.sender === "user"
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-[#1c222b] text-slate-200 border border-slate-800/80 rounded-tl-none"
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.text}</p>

                                        {/* Confirmation interface inside chat bubble */}
                                        {msg.toolDetails?.pending && pendingConfirm && (
                                            <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-col gap-2">
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                                    Ação requer autorização
                                                </span>
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        onClick={confirmPendingAction}
                                                        className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors"
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        onClick={cancelPendingAction}
                                                        className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs px-2 animate-pulse">
                            <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                            O assistente está pensando...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-slate-800 bg-[#0e1217] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        {/* Audio / Mic Recording Trigger */}
                        <button
                            type="button"
                            onClick={toggleRecording}
                            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all ${
                                isRecording
                                    ? "bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-500/20"
                                    : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
                            }`}
                            title={isRecording ? "Parar gravação" : "Falar com Assistente"}
                        >
                            <span className="material-symbols-outlined text-[30px]">
                                {isRecording ? "settings_voice" : "mic"}
                            </span>
                        </button>

                        {/* Alt Text Input Field */}
                        <div className="flex-1 relative flex items-center">
                            <input
                                type="text"
                                className="w-full bg-[#1c222b] border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder={isRecording ? "Ouvindo você..." : "Digite uma mensagem..."}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") handleSend(inputValue);
                                }}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => handleSend(inputValue)}
                                disabled={loading || !inputValue.trim()}
                                className="absolute right-3 p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                        </div>
                    </div>
                    {isRecording && (
                        <div className="text-[10px] text-center text-red-500 font-semibold animate-pulse uppercase tracking-wider">
                            Gravando áudio... Fale agora.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAssistantDrawer;
