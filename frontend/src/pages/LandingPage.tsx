import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, TrendingUp, Truck, MessageSquare, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import PromoBannersStrip from '../features/cms/components/PromoBannersStrip';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
                            <Leaf size={20} />
                        </div>
                        <span className="text-xl font-black tracking-tight">DirectRoute <span className="text-emerald-500">AI</span></span>
                    </div>
                    {isAuthenticated ? (
                        <button 
                            onClick={() =>
                                navigate(
                                    user?.role === 'admin' ? '/admin' : user?.role === 'seller' ? '/dashboard' : '/buyer-marketplace'
                                )
                            }
                            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                            {user?.role === 'admin' ? 'Masuk Admin' : user?.role === 'seller' ? 'Masuk Dashboard' : 'Masuk Marketplace'}
                        </button>
                    ) : (
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                            Masuk Sekarang
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50/50 -z-10 skew-x-12 transform origin-right"></div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Zap size={14} /> Agentic Supply Chain Platform
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                            Potong Rantai Distribusi, <br />
                            <span className="text-emerald-500 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600">Berdayakan UMKM.</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                            Platform cerdas berbasis AI untuk membantu petani dan UMKM Indonesia menghindari tengkulak. Dapatkan harga terbaik, rute logistik terefisiensi, dan akses pembeli langsung secara otomatis.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {isAuthenticated ? (
                                <button 
                                    onClick={() =>
                                        navigate(
                                            user?.role === 'admin' ? '/admin' : user?.role === 'seller' ? '/dashboard' : '/buyer-marketplace'
                                        )
                                    }
                                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 hover:-translate-y-1"
                                >
                                    Akses Platform <ArrowRight size={20} />
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 hover:-translate-y-1"
                                    >
                                        Mulai Sekarang <ArrowRight size={20} />
                                    </button>
                                    <button 
                                        onClick={() => navigate('/login')}
                                        className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                                    >
                                        Jelajahi Demo
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        <GlassCard className="!p-4 rotate-3 animate-float">
                            <img 
                                src="https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?auto=format&fit=crop&q=80&w=800" 
                                alt="Pertanian Indonesia" 
                                className="rounded-xl shadow-lg"
                            />
                        </GlassCard>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
                    </div>
                </div>
            </section>

            <section className="-mt-10 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <PromoBannersStrip />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl font-black">Fitur Utama DirectRoute</h2>
                        <p className="text-slate-500">Teknologi Agentic Workflow yang bekerja untuk Anda.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <GlassCard className="border-none bg-slate-50 hover:bg-emerald-50 transition-colors">
                            <TrendingUp className="text-emerald-500 mb-4" size={32} />
                            <h4 className="text-xl font-bold mb-2">Harga Real-time</h4>
                            <p className="text-sm text-slate-600">AI menganalisis harga pasar eceran vs tengkulak untuk memberikan rekomendasi harga jual paling adil bagi petani.</p>
                        </GlassCard>
                        <GlassCard className="border-none bg-slate-50 hover:bg-emerald-50 transition-colors">
                            <Truck className="text-emerald-500 mb-4" size={32} />
                            <h4 className="text-xl font-bold mb-2">Logistik Cerdas</h4>
                            <p className="text-sm text-slate-600">Pooling rute otomatis berbasis kapasitas dan prioritas barang perishable untuk menekan biaya transportasi.</p>
                        </GlassCard>
                        <GlassCard className="border-none bg-slate-50 hover:bg-emerald-50 transition-colors">
                            <MessageSquare className="text-emerald-500 mb-4" size={32} />
                            <h4 className="text-xl font-bold mb-2">Outreach Otomatis</h4>
                            <p className="text-sm text-slate-600">Penulisan draf penawaran persuasif ke hotel, restoran, dan katering serta pengiriman via WhatsApp satu klik.</p>
                        </GlassCard>
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-black">Aman & Terpercaya</h2>
                        <p className="text-slate-600">Aplikasi dilengkapi dengan lapisan keamanan siber untuk mendeteksi potensi penipuan pada setiap transaksi dan komunikasi.</p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <ShieldCheck className="text-emerald-500" size={20} /> AI Fraud Detection pada pesan penawaran.
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <ShieldCheck className="text-emerald-500" size={20} /> Enkripsi data transaksi real-time.
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl"></div>
                        <h3 className="text-xl font-bold mb-4">Siap untuk CODE THE FUTURE 2026?</h3>
                        <p className="text-emerald-100/70 text-sm mb-6">Jadilah bagian dari revolusi rantai pasok digital untuk UMKM Indonesia.</p>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3 bg-white text-emerald-900 rounded-xl font-black hover:bg-emerald-50 transition-all"
                        >
                            Coba Demo Dashboard
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-100 px-6 text-center">
                <div className="max-w-7xl mx-auto">
                    <p className="text-slate-400 text-sm">&copy; 2026 DirectRoute AI. Dibuat untuk Kompetisi CODE THE FUTURE.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
