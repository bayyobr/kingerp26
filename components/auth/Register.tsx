import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        password: '',
        confirmPassword: ''
    });
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone: formData.phone,
                        company_name: formData.company
                    }
                }
            });

            if (error) throw error;

            alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação (se habilitado).');
            navigate('/login');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background-dark text-white font-sans overflow-hidden">
            {/* Left Side - Branding (Identical to Login for consistency) */}
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
                        Comece a transformar <br />
                        <span className="text-blue-500">sua loja hoje</span>
                    </h2>

                    <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                        Junte-se a mais de 500 assistências técnicas que já otimizaram seus processos com o King Carcaças ERP.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Setup Rápido</h4>
                                <p className="text-slate-400 text-sm">Configure sua loja em menos de 5 minutos.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined">analytics</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Dashboards em Tempo Real</h4>
                                <p className="text-slate-400 text-sm">Acompanhe métricas vitais do seu negócio.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined">support_agent</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Suporte Premium</h4>
                                <p className="text-slate-400 text-sm">Nossa equipe pronta para te ajudar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background-dark overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    <div className="mb-8">
                        <button onClick={() => navigate('/login')} className="text-slate-500 hover:text-white flex items-center gap-2 mb-6 group transition-colors">
                            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Voltar para login
                        </button>
                        <h2 className="text-3xl font-bold mb-2">Solicitar Demonstração</h2>
                        <p className="text-slate-400">Preencha seus dados para criar sua conta.</p>
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
                        Continuar com o Google
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-[#2b3036]"></div>
                        <span className="text-slate-500 text-xs font-bold tracking-wider">OU COM E-MAIL</span>
                        <div className="flex-1 h-px bg-[#2b3036]"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Nome Completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 px-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="Seu nome"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Celular / WhatsApp</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 px-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Nome da Empresa</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-500 group-focus-within:text-blue-500 transition-colors">store</span>
                                </div>
                                <input
                                    type="text"
                                    name="company"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 pl-12 pr-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="Nome da sua assistência"
                                    value={formData.company}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">E-mail Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-500 group-focus-within:text-blue-500 transition-colors">alternate_email</span>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 pl-12 pr-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-500 group-focus-within:text-blue-500 transition-colors">lock</span>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 pl-12 pr-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="Mínimo 8 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Confirmar Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-500 group-focus-within:text-blue-500 transition-colors">lock_reset</span>
                                </div>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="w-full bg-[#161b22] border border-[#2b3036] text-white py-3 pl-12 pr-4 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="Repita a senha"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-primary hover:bg-blue-500/90 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <>
                                        CRIAR CONTA GRÁTIS
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
                            Ao clicar em "Criar Conta Grátis", você concorda com nossos <a href="#" className="text-blue-500 hover:underline">Termos de Uso</a> e <a href="#" className="text-blue-500 hover:underline">Política de Privacidade</a>.
                        </p>
                    </form>

                    <div className="mt-8 text-center border-t border-border-dark pt-8">
                        <p className="text-slate-500 text-sm">
                            Já tem uma conta? <br />
                            <button onClick={() => navigate('/login')} className="text-blue-500 font-bold hover:underline mt-1">
                                Fazer Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
