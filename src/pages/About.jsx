import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Globe, Briefcase, FileText, User, Github } from 'lucide-react';

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center selection:bg-[#00E0B8]/20">
            <header className="w-full h-20 border-b border-[#E2E8F0] bg-white flex items-center justify-center sticky top-0 z-50 px-6">
                <div className="max-w-4xl w-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/settings')} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-[#64748B] hover:text-[#0F172A]">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-black uppercase tracking-tighter text-[#0F172A]">Project Metadata</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" className="h-8 w-auto grayscale opacity-50" alt="Speed Agent" />
                        <img src="/company-logo.png" className="h-6 w-auto grayscale opacity-50" alt="Tech Stach" />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl w-full p-8 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E2E8F0] rounded-[48px] p-10 lg:p-16 shadow-2xl shadow-slate-200 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <img src="/logo.png" className="w-64 h-64 object-contain" alt="" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-16 items-start">
                        <div className="shrink-0 flex flex-col items-center gap-6">
                            <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-slate-50 to-white border-8 border-white shadow-2xl overflow-hidden shadow-slate-200">
                                <img src="https://ks02.vercel.app/profile.png" onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=KARUPPASAMY+M&background=0F172A&color=fff&size=512"} className="w-full h-full object-cover" alt="KARUPPASAMY M" />
                            </div>
                            <div className="flex flex-col items-center">
                                <h2 className="text-2xl font-black tracking-tighter text-[#0F172A]">KARUPPASAMY M</h2>
                                <p className="text-[#00E0B8] font-black uppercase tracking-widest text-[10px] mt-2">Master Developer & Founder</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-12">
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#64748B]">Architectural Context</h3>
                                <p className="text-[#475569] text-xl font-medium leading-relaxed">
                                    Speed Agent IDE represents the pinnacle of AI-native engineering environments,
                                    built to eliminate setup friction and maximize cognitive flow.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <a href="https://ks02.vercel.app" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-[#00E0B8] hover:bg-white transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-[#00E0B8]/10 transition-all">
                                        <Briefcase className="w-4 h-4 text-[#64748B] group-hover:text-[#00E0B8]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Personal Work</span>
                                        <span className="text-sm font-bold text-[#0F172A]">ks02.vercel.app</span>
                                    </div>
                                </a>

                                <a href="https://tt0211.vercel.app/" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-[#00E0B8] hover:bg-white transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-[#00E0B8]/10 transition-all">
                                        <Globe className="w-4 h-4 text-[#64748B] group-hover:text-[#00E0B8]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Tech Stach</span>
                                        <span className="text-sm font-bold text-[#0F172A]">tt0211.vercel.app</span>
                                    </div>
                                </a>

                                <a href="https://kscv.vercel.app/" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-[#00E0B8] hover:bg-white transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-[#00E0B8]/10 transition-all">
                                        <FileText className="w-4 h-4 text-[#64748B] group-hover:text-[#00E0B8]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">AI Resume Core</span>
                                        <span className="text-sm font-bold text-[#0F172A]">kscv.vercel.app</span>
                                    </div>
                                </a>

                                <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-[#0F172A] border border-[#0F172A] shadow-xl shadow-slate-200">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <img src="/company-logo.png" className="w-6 h-6 object-contain brightness-0 invert" alt="" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Parent Node</span>
                                        <span className="text-sm font-bold text-white">Tech Stach</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 pt-10 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src="/logo.png" className="h-10 w-auto" alt="Speed Agent" />
                            <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0F172A]">Speed Agent IDE v1.0 Production</span>
                        </div>
                        <p className="text-[9px] font-bold text-[#94A3B8] tracking-widest uppercase italic">Engineered with precision for deployments.</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default About;
