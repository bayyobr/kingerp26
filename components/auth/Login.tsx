import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [keepConnected, setKeepConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
            // Redirect handled by OAuth flow
        } catch (err: any) {
            console.error('Google Login error:', err);
            setError(err.message || 'Erro ao logar com o Google.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background-dark text-white font-sans overflow-hidden">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center p-12 relative overflow-hidden bg-[#0d1218]">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-lg mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="material-symbols-outlined text-white">crown</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-wider italic">KING CARCAÇAS</h1>
                    </div>

                    <h2 className="text-5xl font-bold leading-tight mb-6">
                        A gestão da sua <br />
                        <span className="text-blue-500">assistência técnica</span> <br />
                        em outro nível.
                    </h2>

                    <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                        Controle ordens de serviço, estoque e faturamento com inteligência artificial
                        e relatórios em tempo real.
                    </p>

                    {/* Stats Mockup Card */}
                    <div className="bg-[#161b22] border border-border-dark p-6 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-sm bg-opacity-90">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <div className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">V2.4.0 STABLE</div>
                        </div>

                        <div className="flex gap-12 mb-8">
                            <div>
                                <div className="text-2xl font-bold text-white">500+</div>
                                <div className="text-xs text-slate-500 font-bold tracking-wider">LOJAS ATIVAS</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">1M+</div>
                                <div className="text-xs text-slate-500 font-bold tracking-wider">OS PROCESSADAS</div>
                            </div>
                        </div>

                        <div className="space-y-3 opacity-50">
                            <div className="h-2 w-3/4 bg-slate-700 rounded-full"></div>
                            <div className="h-2 w-full bg-slate-700 rounded-full"></div>
                            <div className="h-2 w-5/6 bg-slate-700 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background-dark">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta</h2>
                        <p className="text-slate-400">Acesse sua conta para gerenciar sua loja.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-100 text-slate-800 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-3 mb-6 shadow-sm"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Entrar com o Google
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-[#2b3036]"></div>
                        <span className="text-slate-500 text-xs font-bold tracking-wider">OU COM E-MAIL</span>
                        <div className="flex-1 h-px bg-[#2b3036]"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">E-mail Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-500 group-focus-within:text-blue-500 transition-colors">alternate_email</span>
                                </div>
                                <input
                                    type="email"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 pl-12 pr-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Senha de Acesso</label>
                                <a href="#" className="text-xs font-bold text-blue-500 hover:text-blue-400">Esqueceu a senha?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-500 group-focus-within:text-blue-500 transition-colors">lock</span>
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 pl-12 pr-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="keep-connected"
                                type="checkbox"
                                checked={keepConnected}
                                onChange={(e) => setKeepConnected(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-[#161b22] text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0"
                            />
                            <label htmlFor="keep-connected" className="ml-2 text-sm text-slate-400 cursor-pointer select-none">
                                Manter conectado neste dispositivo
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-primary hover:bg-blue-500/90 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                                <>
                                    ACESSAR DASHBOARD
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 text-sm">
                            Ainda não tem o King Carcaças? <br />
                            <button onClick={() => navigate('/register')} className="text-blue-500 font-bold hover:underline mt-1">
                                Solicitar demonstração gratuita
                            </button>
                        </p>
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">
                            Powered by King System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
