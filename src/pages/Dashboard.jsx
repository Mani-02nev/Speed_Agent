import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, Clock, Settings, LogOut, Zap, LayoutGrid, FileText, ArrowRight, X, Search, Activity } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const Dashboard = () => {
    const user = useAuthStore(state => state.user);
    const profile = useAuthStore(state => state.profile);
    const signOut = useAuthStore(state => state.signOut);
    const init = useAuthStore(state => state.init);

    const projects = useProjectStore(state => state.projects);
    const fetchProjects = useProjectStore(state => state.fetchProjects);
    const createProject = useProjectStore(state => state.createProject);
    const loading = useProjectStore(state => state.loading);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            await init();
            if (!user) {
                const session = JSON.parse(localStorage.getItem('agent-speed-auth'));
                if (!session) navigate('/login');
            }
        };
        checkUser();
        fetchProjects();
    }, [user, navigate, init, fetchProjects]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const project = await createProject(projectName, projectDesc);

            // v6: Precision Instant Initialization
            // Create essential web modules automatically for an "unboxed" experience
            const languageMap = { html: 'html', css: 'css', js: 'javascript' };
            const defaults = [
                { name: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${projectName}</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div id="app">\n        <h1>${projectName}</h1>\n        <p>Neural engine active. Start builds below.</p>\n    </div>\n    <script src="main.js"></script>\n</body>\n</html>`, lang: 'html' },
                { name: 'style.css', content: `body {\n    font-family: 'Inter', sans-serif;\n    background: #0F172A;\n    color: white;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    height: 100vh;\n    margin: 0;\n}\n\n#app {\n    text-align: center;\n    padding: 2rem;\n    border: 1px solid rgba(255,255,255,0.1);\n    border-radius: 2rem;\n    background: rgba(255,255,255,0.02);\n}`, lang: 'css' },
                { name: 'main.js', content: `console.log('Agent K Node initialized for ${projectName}');\n\nconst app = document.getElementById('app');\n// Neural expansion logic here`, lang: 'javascript' }
            ];

            for (const file of defaults) {
                await useProjectStore.getState().createFile(project.id, file.name, file.content, file.lang);
            }

            setIsCreateOpen(false);
            setProjectName('');
            setProjectDesc('');
            navigate(`/project/${project.id}`);
        } catch (error) {
            console.error('Project Creation Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !projects.length) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white text-[#0F172A]">
                <div className="flex flex-col items-center gap-4">
                    <Zap className="w-8 h-8 text-[#00E0B8] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Nodes...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden">
            {/* Enterprise Sidebar */}
            <aside className="hidden lg:flex w-72 border-r border-[#E2E8F0] bg-white flex-col z-30">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <img src="/logo.png" className="w-6 h-6 object-contain brightness-0 invert" alt="" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[13px] uppercase tracking-tighter text-[#0F172A]">Agent K</span>
                        <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest leading-none">Enterprise Production</span>
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-1">
                    {[
                        { id: 'dashboard', label: 'Workbench', icon: LayoutGrid, active: true },
                        { id: 'projects', label: 'Code Solutions', icon: Folder },
                        { id: 'activity', label: 'Neural Logs', icon: Activity },
                        { id: 'settings', label: 'System Config', icon: Settings },
                    ].map(item => (
                        <button
                            key={item.id}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[13px] font-bold ${item.active ? 'bg-[#0F172A] text-white shadow-lg shadow-slate-200' : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${item.active ? 'text-[#00E0B8]' : ''}`} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 mt-auto border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3 truncate">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-[12px] font-black text-[#0F172A]">
                                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-[11px] font-black uppercase text-[#0F172A] truncate tracking-tight">{profile?.full_name || 'Engineer'}</span>
                                <span className="text-[9px] font-bold text-[#64748B] truncate">Release: 1.0 Production</span>
                            </div>
                        </div>
                        <button onClick={() => { signOut(); navigate('/login'); }} className="p-2 text-[#64748B] hover:text-red-500 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Workbench */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-20 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 z-20 shrink-0">
                    <div className="flex items-center gap-6">
                        <h1 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Workbench</h1>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Locate architectural node..."
                                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-[12px] font-medium w-64 focus:outline-none focus:border-[#00E0B8] transition-all"
                            />
                        </div>
                    </div>

                    <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <Dialog.Trigger asChild>
                            <button className="h-11 px-6 bg-[#00E0B8] text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:brightness-105 transition-all flex items-center gap-2 shadow-lg shadow-[#00E0B8]/10">
                                <Plus className="w-4 h-4" /> Create Solution
                            </button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
                            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-10 bg-white rounded-3xl shadow-2xl z-[101] outline-none">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <Dialog.Title className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">Initiate Project</Dialog.Title>
                                        <Dialog.Description className="text-[#64748B] text-sm mt-1 font-medium">Define a new engineering solution node.</Dialog.Description>
                                    </div>
                                    <Dialog.Close className="p-2 text-[#64748B] hover:text-[#0F172A]"><X className="w-5 h-5" /></Dialog.Close>
                                </div>
                                <form onSubmit={handleCreateProject} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Project Identifier</label>
                                        <input
                                            placeholder="Example: Neural Dashboard"
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#00E0B8] transition-all"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Solution Scope (Optional)</label>
                                        <textarea
                                            placeholder="Detailed architecture summary..."
                                            rows={3}
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#00E0B8] transition-all resize-none"
                                            value={projectDesc}
                                            onChange={(e) => setProjectDesc(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <Dialog.Close className="flex-1 py-4 text-[#64748B] text-[11px] font-black uppercase tracking-widest hover:text-[#0F172A]">Abort</Dialog.Close>
                                        <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-[#0F172A] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#1e293b] shadow-xl shadow-slate-200">
                                            {isSubmitting ? 'Distributing Nodes...' : 'Deploy Solution'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8FAFC]">
                    <div className="max-w-7xl mx-auto space-y-12">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Solution Nodes', value: projects.length, icon: Folder, color: '#2563EB' },
                                { label: 'Architectural Files', value: '42', icon: FileText, color: '#00E0B8' },
                                { label: 'Neural Inferences', value: '890', icon: Zap, color: '#F59E0B' },
                                { label: 'Node Health', value: '98%', icon: Activity, color: '#10B981' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm group hover:shadow-xl hover:shadow-slate-200 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-3xl font-black text-[#0F172A] tracking-tighter">{stat.value}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Solutions Grid */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0F172A] flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-[#00E0B8]" />
                                    Active Solution Nodes
                                </h2>
                                <div className="h-[1px] flex-1 bg-slate-200 mx-6 opacity-50" />
                            </div>

                            {projects.length === 0 ? (
                                <div className="p-24 bg-white border border-[#E2E8F0] rounded-[48px] text-center shadow-sm relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#00E0B8]/5 to-transparent pointer-events-none" />
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-slate-100">
                                        <img src="/logo.png" className="w-12 h-12 object-contain" alt="Agent K" />
                                    </div>
                                    <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase mb-4">Awaiting Core Architecture</h3>
                                    <p className="text-[#64748B] text-lg font-medium mb-10 max-w-sm mx-auto leading-relaxed">System is idle. Deploy your first neural node to begin architectural expansion.</p>
                                    <button
                                        onClick={() => setIsCreateOpen(true)}
                                        className="px-10 py-5 bg-[#0F172A] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#1e293b] shadow-2xl shadow-slate-200 transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <Plus className="w-4 h-4" /> Initialize First Solution
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {projects.map((project, i) => (
                                        <motion.div
                                            key={project.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => navigate(`/project/${project.id}`)}
                                            className="group cursor-pointer p-8 bg-white border border-[#E2E8F0] rounded-[40px] hover:border-[#00E0B8] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden flex flex-col min-h-[260px]"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 opacity-20 -mr-16 -mt-16 rounded-full group-hover:bg-[#00E0B8]/10 transition-colors" />

                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-[#00E0B8] group-hover:text-black transition-all shadow-sm">
                                                    <Folder className="w-6 h-6" />
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E0B8]/10 text-[#00E0B8] rounded-full border border-[#00E0B8]/20 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-black">Active</span>
                                                </div>
                                            </div>

                                            <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase mb-4 truncate group-hover:text-[#00E0B8] transition-colors relative z-10">
                                                {project.name}
                                            </h3>
                                            <p className="text-[#64748B] text-[13px] font-medium leading-relaxed line-clamp-2 mb-10 relative z-10">
                                                {project.description || 'Enterprise architecture solution for scalable AI engineering.'}
                                            </p>

                                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Last Distributed</span>
                                                    <span className="text-[11px] font-black text-[#0F172A] mt-0.5">{new Date(project.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#64748B] group-hover:bg-[#0F172A] group-hover:text-white transition-all shadow-sm">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
