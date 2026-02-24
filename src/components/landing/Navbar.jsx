import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Menu, X, ArrowRight, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-3' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shadow-lg border border-slate-200/20 overflow-hidden">
                        <img src="/logo.png" className="w-7 h-7 object-contain" alt="Agent K" />
                    </div>
                    <span className="text-xl font-black uppercase tracking-tighter text-[#0F172A]">Agent K</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-[13px] font-bold text-[#64748B] uppercase tracking-widest">
                    <a href="#features" className="hover:text-[#00E0B8] transition-colors">Features</a>
                    <a href="#architecture" className="hover:text-[#00E0B8] transition-colors">Architecture</a>
                    <a href="#pricing" className="hover:text-[#00E0B8] transition-colors">Pricing</a>
                    <a href="#docs" className="hover:text-[#00E0B8] transition-colors">Docs</a>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#1e293b] transition-all"
                        >
                            Workbench <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-[11px] font-black uppercase tracking-widest text-[#0F172A] hover:opacity-70"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 bg-[#00E0B8] text-black rounded-lg text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-[0_4px_15px_rgba(0,224,184,0.3)] transition-all"
                            >
                                Launch IDE
                            </button>
                        </>
                    )}
                </div>

                <button className="md:hidden text-[#0F172A]" onClick={() => setMobileMenuOpen(true)}>
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 bg-white z-[60] p-10 flex flex-col"
                    >
                        <div className="flex justify-end">
                            <button onClick={() => setMobileMenuOpen(false)}><X className="w-8 h-8 text-[#0F172A]" /></button>
                        </div>
                        <div className="flex flex-col gap-8 mt-10">
                            {['Features', 'Architecture', 'Pricing', 'Docs'].map(item => (
                                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-4xl font-black uppercase tracking-tighter text-[#0F172A]">{item}</a>
                            ))}
                        </div>
                        <div className="mt-auto flex flex-col gap-4">
                            <button onClick={() => navigate('/login')} className="w-full py-4 bg-[#F8FAFC] text-[#0F172A] rounded-xl font-black uppercase tracking-widest">Login</button>
                            <button onClick={() => navigate('/login')} className="w-full py-4 bg-[#00E0B8] text-black rounded-xl font-black uppercase tracking-widest">Launch IDE</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
