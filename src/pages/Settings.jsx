import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getAIKeyStatus, isValidGroqKey } from '../services/ai';
import { getCompilerStatus } from '../services/compiler';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Key, Bell, Shield, Trash2, Camera, Save, LogOut, Zap, Info, ChevronRight } from 'lucide-react';

const Settings = () => {
    const { user, profile, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [name, setName] = useState(profile?.full_name || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center selection:bg-[#00E0B8]/20">
            <header className="w-full h-20 border-b border-[#E2E8F0] bg-white flex items-center justify-center sticky top-0 z-50 px-6">
                <div className="max-w-4xl w-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-[#64748B] hover:text-[#0F172A]">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-black uppercase tracking-tighter">System Config</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-[#0F172A] text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#1e293b] shadow-xl shadow-slate-100 transition-all"
                    >
                        {isSaving ? 'Syncing...' : <><Save className="w-4 h-4" /> Save Configuration</>}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl w-full p-8 lg:p-12 space-y-16">
                {/* Profile Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#64748B]">
                            <User className="w-4 h-4" />
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0F172A]">Engineer Profile</h2>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-[32px] p-8 lg:p-10 shadow-sm flex flex-col md:flex-row gap-12 items-center md:items-start">
                        <div className="relative group shrink-0">
                            <div className="w-28 h-28 rounded-[2rem] bg-slate-50 border-4 border-white shadow-2xl shadow-slate-200 overflow-hidden flex items-center justify-center text-4xl font-black text-[#0F172A]">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    name?.[0] || user?.email?.[0]?.toUpperCase()
                                )}
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#00E0B8] text-black rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-all border-4 border-white">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Identifier Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#00E0B8] transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Node Interface (Email)</label>
                                <input
                                    value={user?.email}
                                    disabled
                                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-medium opacity-50 cursor-not-allowed"
                                />
                            </div>
                            <div className="md:col-span-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider bg-blue-50/50 p-4 rounded-xl border border-blue-50">
                                PRO TIP: Your neural identity is public to collaborators on shared solution nodes.
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Credentials Status */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#64748B]">
                            <Key className="w-4 h-4" />
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0F172A]">AI Provider</h2>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-[32px] p-8 lg:p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Zap className="w-32 h-32" />
                        </div>
                        <p className="text-[#64748B] text-sm font-medium mb-4 max-w-lg">
                            Mr K Agent uses <strong>Groq only</strong>. Set{' '}
                            <code className="text-[11px]">VITE_GROQ_KEY_1=gsk_…</code> from{' '}
                            <a href="https://console.groq.com/keys" className="text-[#00E0B8] underline" target="_blank" rel="noreferrer">
                                console.groq.com
                            </a>
                            . Restart <code className="text-[11px]">npm run dev</code> after changes. If you see 413, clear chat and use shorter prompts.
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-4">
                            Provider: {getAIKeyStatus().provider === 'groq' ? 'Groq' : 'Not configured'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                            {[
                                { name: 'Groq key 1', active: isValidGroqKey(import.meta.env.VITE_GROQ_KEY_1), type: 'Primary' },
                                { name: 'Groq key 2', active: isValidGroqKey(import.meta.env.VITE_GROQ_KEY_2), type: 'Rotation' },
                                { name: 'Groq key 3', active: isValidGroqKey(import.meta.env.VITE_GROQ_KEY_3), type: 'Rotation' },
                            ].map((provider) => (
                                <div key={provider.name} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] group hover:border-[#00E0B8] transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[12px] font-black uppercase tracking-tight text-[#0F172A]">{provider.name}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${provider.active ? 'bg-[#00E0B8] shadow-[0_0_8px_#00E0B8]' : 'bg-red-400'}`} />
                                    </div>
                                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">{provider.active ? 'Stream Online' : 'Offline'}</span>
                                    <div className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-[#94A3B8] group-hover:text-[#00E0B8] transition-colors">{provider.type}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-[32px] p-8 lg:p-10 shadow-sm mt-6 space-y-6">
                        <div>
                            <p className="text-[#64748B] text-sm font-medium mb-3 max-w-lg">
                                <strong>Preview</strong> — Sandpack (React, HTML/CSS/JS in browser).{' '}
                                <strong>Run code</strong> —{' '}
                                <a
                                    href="https://api.onlinecompiler.io"
                                    className="text-[#00E0B8] underline"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    OnlineCompiler.io
                                </a>{' '}
                                (12 languages, sync API).
                            </p>
                            <p className="text-[10px] text-[#94A3B8] font-mono">
                                VITE_ONLINE_COMPILER_API_KEY=… (aliases: VITE_COMPILER_API_KEY, VITE_Compllier_API_KEY)
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                                <span className="text-[12px] font-black uppercase tracking-tight text-[#0F172A]">
                                    Browser preview
                                </span>
                                <p className="text-[9px] text-[#64748B] mt-1">{getCompilerStatus().preview.runtime}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E0B8]" />
                                    <span className="text-[9px] font-bold text-[#64748B] uppercase">Always on</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                                <span className="text-[12px] font-black uppercase tracking-tight text-[#0F172A]">
                                    OnlineCompiler.io
                                </span>
                                <p className="text-[9px] text-[#64748B] mt-1">
                                    Terminal: <code className="text-[10px]">run</code> or{' '}
                                    <code className="text-[10px]">run script.py</code>
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${getCompilerStatus().online.configured ? 'bg-[#00E0B8] shadow-[0_0_8px_#00E0B8]' : 'bg-amber-400'}`}
                                    />
                                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">
                                        {getCompilerStatus().online.configured
                                            ? `${getCompilerStatus().online.languages} extensions`
                                            : 'API key missing'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 line-through">
                            <Shield className="w-4 h-4" />
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#EF4444]">Nuclear Protocol</h2>
                    </div>

                    <div className="bg-red-50/30 border border-red-100 rounded-[32px] p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h3 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase mb-2">Purge Architectural Data</h3>
                            <p className="text-[#64748B] text-sm font-medium">Permanently disconnect and delete your neural node and all active solution projects.</p>
                        </div>
                        <button className="px-8 py-4 bg-red-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-100 transition-all flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Final Deletion
                        </button>
                    </div>
                </section>

                {/* Metadata / About Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#64748B]">
                            <Info className="w-4 h-4" />
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0F172A]">System Metadata</h2>
                    </div>

                    <button
                        onClick={() => navigate('/settings/about')}
                        className="w-full bg-white border border-[#E2E8F0] rounded-[32px] p-8 lg:px-10 flex items-center justify-between group hover:border-[#00E0B8] transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center border border-[#E2E8F0] group-hover:scale-110 transition-transform">
                                <img src="/logo.png" className="w-10 h-10 object-contain" alt="" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">About Mr K Agent</h3>
                                <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest mt-1">v1.0 Production | Tech Stach Core</p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-[#94A3B8] group-hover:text-[#00E0B8] transition-colors" />
                    </button>
                </section>

                <div className="py-16 border-t border-[#E2E8F0] flex flex-col items-center">
                    <button
                        onClick={() => { signOut(); navigate('/'); }}
                        className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] text-[11px] font-black uppercase tracking-[0.2em] transition-all px-8 py-4 rounded-2xl hover:bg-slate-50"
                    >
                        <LogOut className="w-4 h-4" /> Disconnect Node
                    </button>
                    <p className="text-[9px] font-bold text-[#94A3B8] mt-6 tracking-[0.4em] uppercase">Mr K Agent · Mr&apos;K Eco</p>
                </div>
            </main>
        </div>
    );
};

export default Settings;
