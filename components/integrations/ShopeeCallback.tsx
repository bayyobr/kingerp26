import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { shopeeService } from '../../services/shopeeService';
import { supabase } from '../../services/supabase';

const ShopeeCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Finalizando integração com a Shopee...');

    useEffect(() => {
        const handleAuth = async () => {
            const code = searchParams.get('code');
            const shopId = searchParams.get('shop_id');

            if (!code || !shopId) {
                setStatus('error');
                setMessage('Código de autorização ou Shop ID ausente.');
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Usuário não autenticado.');

                await shopeeService.handleCallback(code, shopId, user.id);
                setStatus('success');
                setMessage('Loja conectada com sucesso! Redirecionando...');

                setTimeout(() => {
                    navigate('/integracoes/shopee');
                }, 2000);
            } catch (err: any) {
                console.error('Shopee Callback Error:', err);
                setStatus('error');
                setMessage(`Erro ao finalizar integração: ${err.message}`);
            }
        };

        handleAuth();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-surface-dark border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white font-medium">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Parabéns!</h2>
                        <p className="text-slate-400">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl">error</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Ops!</h2>
                        <p className="text-slate-400">{message}</p>
                        <button
                            onClick={() => navigate('/integracoes/shopee')}
                            className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            Voltar para Integrações
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopeeCallback;
