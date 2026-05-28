import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<'buyer' | 'seller'>('seller');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSeed = async () => {
        setLoading(true);
        setError('');
        try {
            const demoUsers = [
                { email: 'seller1@demo.com', pass: 'password123', name: 'UMKM Berkah', role: 'seller' },
                { email: 'seller2@demo.com', pass: 'password123', name: 'Tani Maju', role: 'seller' },
                { email: 'buyer1@demo.com', pass: 'password123', name: 'Pasar Senen', role: 'buyer' },
                { email: 'buyer2@demo.com', pass: 'password123', name: 'Catering Ibu', role: 'buyer' },
                { email: 'buyer3@demo.com', pass: 'password123', name: 'Resto Seafood', role: 'buyer' },
            ];

            for (const u of demoUsers) {
                try {
                    await signUp(u.email, u.pass, u.name, u.role as any);
                } catch (e) {
                    console.log(`User ${u.email} mungkin sudah ada.`);
                }
            }

            alert('5 Akun Demo Berhasil Dibuat di Supabase!\nEmail: seller1@demo.com s/d buyer3@demo.com\nPassword: password123');
        } catch (err: any) {
            setError('Gagal membuat data demo: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signUp(email, password, username, role);
                alert('Registrasi berhasil! Silakan login.');
                setIsLogin(true);
                setLoading(false);
                return;
            }
            // Navigate based on role (fetch role again if needed or use metadata)
            // For now, let's just go to landing or handle it in App.tsx ProtectedRoute
            navigate('/home', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan login/daftar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center bg-emerald-500 p-3 rounded-2xl text-white mb-4 shadow-xl shadow-emerald-200">
                        <Leaf size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">DirectRoute <span className="text-emerald-500">AI</span></h1>
                    <p className="text-slate-500 text-sm mt-2">Agentic Supply Chain Platform for Modern UMKM</p>
                </div>

                <GlassCard className="p-8">
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                        <button 
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            LOGIN
                        </button>
                        <button 
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            DAFTAR BARU
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Nama UMKM / Buyer"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 pl-12 text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 pl-12 text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 pl-12 text-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pilih Peran</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setRole('seller')}
                                        className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${role === 'seller' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'}`}
                                    >
                                        SELLER / UMKM
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setRole('buyer')}
                                        className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${role === 'buyer' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'}`}
                                    >
                                        BUYER / PASAR
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-[10px] font-bold flex items-center gap-2">
                                <ShieldCheck size={14} /> {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'PROCESSING...' : (isLogin ? 'ENTER DASHBOARD' : 'CREATE ACCOUNT')}
                            <ArrowRight size={18} />
                        </button>

                        <div className="pt-4 border-t border-slate-100">
                            <button 
                                type="button"
                                onClick={handleSeed}
                                disabled={loading}
                                className="w-full py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all"
                            >
                                ✨ Generate 5 Demo Users to Supabase
                            </button>
                        </div>
                    </form>
                </GlassCard>

                <p className="text-center text-slate-400 text-[10px] mt-8 uppercase tracking-widest font-bold">
                    DirectRoute AI Security • Supabase Cloud Verified
                </p>
            </div>
        </div>
    );
};

export default Login;
