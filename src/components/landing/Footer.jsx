import React from 'react';
import { Zap, Github, Twitter, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-white border-t border-slate-100 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6 pointer-events-none">
                            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
                                <img src="/logo.png" className="w-full h-full object-contain" alt="" />
                            </div>
                            <span className="text-xl font-black uppercase tracking-tighter text-[#0F172A]">Agent K</span>
                        </div>
                        <p className="text-[#64748B] text-sm font-medium leading-relaxed max-w-xs">
                            The enterprise-grade AI IDE for professional developers who value precision, speed, and security.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F172A] mb-6">Environment</h4>
                        <ul className="space-y-4 text-[13px] font-semibold text-[#64748B]">
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">Workspace</a></li>
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">Models</a></li>
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">Architecture</a></li>
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">VFS System</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F172A] mb-6">Company</h4>
                        <ul className="space-y-4 text-[13px] font-semibold text-[#64748B]">
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">Security</a></li>
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-[#00E0B8] transition-colors">Terms</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F172A] mb-6">Connect</h4>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#00E0B8] hover:bg-[#00E0B8]/10 transition-all border border-slate-100">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#00E0B8] hover:bg-[#00E0B8]/10 transition-all border border-slate-100">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#00E0B8] hover:bg-[#00E0B8]/10 transition-all border border-slate-100">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-100 text-[11px] font-black uppercase tracking-widest text-[#94A3B8]">
                    <span>© 2026 Agent K. All Node Streams Active.</span>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a href="#" className="hover:text-[#64748B]">Status</a>
                        <a href="#" className="hover:text-[#64748B]">API</a>
                        <a href="#" className="hover:text-[#64748B]">Credits</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
