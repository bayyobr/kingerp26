import React, { useState, useEffect } from 'react';
import { shopeeService } from '../../services/shopeeService';
import { supabase } from '../../services/supabase';

const ShopeeIntegration: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
        
        // Verifica se voltou do redirecionamento com sucesso
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            loadStatus();
            // Limpa a URL para não ficar com o param de sucesso
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const data = await shopeeService.getConnectionStatus();
            setStatus(data);
        } catch (err: any) {
            console.error('Error loading Shopee status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            setLoading(true);
            const url = await shopeeService.getAuthUrl();
            window.location.href = url;
        } catch (err: any) {
            setError('Erro ao gerar URL de conexão. Verifique se as Edge Functions estão configuradas.');
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Tem certeza que deseja desconectar sua conta Shopee?')) return;
        try {
            setLoading(true);
            await shopeeService.disconnect();
            setStatus(null);
        } catch (err: any) {
            setError('Erro ao desconectar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-[#ee4d2d]">shopping_bag</span>
                    Integração Shopee
                </h1>
                <p className="text-slate-400 mt-2">Sincronize pedidos, estoque e produtos com sua loja na Shopee.</p>
            </header>

            <div className="bg-surface-dark border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-slate-800">
                        <div className="w-24 h-24 bg-[#ee4d2d] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ee4d2d]/20">
                            <span className="text-white font-black text-4xl italic">S</span>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-xl font-bold text-white mb-2">
                                {status ? 'Loja Conectada' : 'Conecte sua conta Shopee'}
                            </h2>
                            <p className="text-slate-400 max-w-md">
                                {status
                                    ? `Sua conta está vinculada ao Shop ID: ${status.shop_id}. Tokens renovados automaticamente.`
                                    : 'Ao conectar, você poderá importar seus anúncios e gerenciar pedidos diretamente pelo King Carcaças ERP.'}
                            </p>
                        </div>
                        <div>
                            {status ? (
                                <button
                                    onClick={handleDisconnect}
                                    disabled={loading}
                                    className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold transition-all border border-red-500/20"
                                >
                                    Desconectar Conta
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnect}
                                    disabled={loading}
                                    className="px-8 py-4 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#ee4d2d]/30 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">link</span>
                                            Conectar Agora
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
                            <span className="material-symbols-outlined">warning</span>
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                            <span className="material-symbols-outlined text-blue-400 mb-3">inventory_2</span>
                            <h3 className="font-bold text-white mb-1">Stock Sync</h3>
                            <p className="text-xs text-slate-500">Sincronização automática de estoque entre ERP e Shopee.</p>
                        </div>
                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50 opacity-50">
                            <span className="material-symbols-outlined text-green-400 mb-3">receipt_long</span>
                            <h3 className="font-bold text-white mb-1">Pedidos</h3>
                            <p className="text-xs text-slate-500">Importação de pedidos realizados na Shopee.</p>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded mt-2 inline-block">EM BREVE</span>
                        </div>
                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50 opacity-50">
                            <span className="material-symbols-outlined text-purple-400 mb-3">auto_awesome</span>
                            <h3 className="font-bold text-white mb-1">IA Integration</h3>
                            <p className="text-xs text-slate-500">Otimização de títulos e descrições com Gemini AI.</p>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded mt-2 inline-block">EM BREVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopeeIntegration;
