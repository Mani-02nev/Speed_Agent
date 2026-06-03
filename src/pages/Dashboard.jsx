import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Folder, Clock, Settings, LogOut, Zap,
    LayoutGrid, FileText, ArrowRight, X, Search,
    Activity, Sparkles,
} from 'lucide-react';
import { BRAND } from '../constants/brand';
import * as Dialog from '@radix-ui/react-dialog';

const Dashboard = () => {
    const user     = useAuthStore(s => s.user);
    const profile  = useAuthStore(s => s.profile);
    const signOut  = useAuthStore(s => s.signOut);
    const init     = useAuthStore(s => s.init);

    const projects       = useProjectStore(s => s.projects);
    const fetchProjects  = useProjectStore(s => s.fetchProjects);
    const createProject  = useProjectStore(s => s.createProject);
    const loading        = useProjectStore(s => s.loading);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [projectName,  setProjectName]  = useState('');
    const [projectDesc,  setProjectDesc]  = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const check = async () => {
            await init();
            if (!user) {
                const session = JSON.parse(localStorage.getItem('agent-speed-auth'));
                if (!session) navigate('/login');
            }
        };
        check();
        fetchProjects();
    }, [user, navigate, init, fetchProjects]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (isSubmitting || !projectName.trim()) return;
        setIsSubmitting(true);
        try {
            const project = await createProject(projectName, projectDesc);
            setIsCreateOpen(false);
            setProjectName('');
            setProjectDesc('');
            navigate(`/project/${project.id}`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !projects.length) {
        return (
            <div className="h-screen w-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                <div className="flex flex-col items-center gap-3">
                    <Sparkles className="w-7 h-7 animate-pulse" style={{ color: 'var(--accent)' }} />
                    <span className="text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                        Loading…
                    </span>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Projects',   value: projects.length, icon: Folder,   color: 'var(--accent)' },
        { label: 'Files',      value: '—',             icon: FileText, color: 'var(--purple)' },
        { label: 'AI Runs',    value: '—',             icon: Zap,      color: 'var(--warning)' },
        { label: 'Health',     value: '100%',          icon: Activity, color: 'var(--success)' },
    ];

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, active: true },
        { id: 'projects',  label: 'Projects',  icon: Folder },
        { id: 'activity',  label: 'Activity',  icon: Activity },
        { id: 'settings',  label: 'Settings',  icon: Settings },
    ];

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>

            {/* ── Sidebar ── */}
            <aside className="hidden lg:flex w-64 flex-col shrink-0 glass-sidebar">
                <div className="px-6 py-6 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-white">{BRAND.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{BRAND.eco}</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(item => (
                        <button key={item.id} className={`nav-item ${item.active ? 'active' : ''}`}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-semibold text-white shrink-0"
                            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                            {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-white truncate">{profile?.full_name || 'Engineer'}</p>
                            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                        </div>
                        <button onClick={() => { signOut(); navigate('/login'); }}
                            className="p-1.5 rounded-lg transition-colors hover:text-red-400"
                            style={{ color: 'var(--text-muted)' }}>
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="glass-header h-14 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-[15px] font-semibold text-white">Dashboard</h1>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                            <input className="input-glass pl-9 h-8 text-[12px] w-52" placeholder="Search projects…" />
                        </div>
                    </div>

                    <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <Dialog.Trigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-3.5 h-3.5" />
                                New Project
                            </button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 z-[100] backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.6)' }} />
                            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md outline-none glass rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <div>
                                        <Dialog.Title className="text-[16px] font-semibold text-white">New Project</Dialog.Title>
                                        <Dialog.Description className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                            Create a new coding workspace.
                                        </Dialog.Description>
                                    </div>
                                    <Dialog.Close className="p-1.5 rounded-lg transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                                        <X className="w-4 h-4" />
                                    </Dialog.Close>
                                </div>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                            Project Name
                                        </label>
                                        <input
                                            className="input-glass"
                                            placeholder="e.g. My Calculator App"
                                            value={projectName}
                                            onChange={e => setProjectName(e.target.value)}
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                            Description (optional)
                                        </label>
                                        <textarea
                                            className="input-glass resize-none"
                                            placeholder="What are you building?"
                                            rows={3}
                                            value={projectDesc}
                                            onChange={e => setProjectDesc(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Dialog.Close className="btn-ghost flex-1">Cancel</Dialog.Close>
                                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-[2]">
                                            {isSubmitting ? 'Creating…' : 'Create Project'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, i) => (
                                <motion.div key={stat.label} className="stat-card"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: `${stat.color}18`, color: stat.color }}>
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-2xl font-semibold text-white">{stat.value}</span>
                                    </div>
                                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Projects */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-text)' }} />
                                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                    Recent Projects
                                </span>
                            </div>

                            {projects.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass rounded-2xl p-16 text-center">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                        <Sparkles className="w-6 h-6" style={{ color: 'var(--accent-text)' }} />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-white mb-2">No projects yet</h3>
                                    <p className="text-[13px] mb-6 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                        Create your first project and let the AI agent build it for you.
                                    </p>
                                    <button onClick={() => setIsCreateOpen(true)} className="btn-primary mx-auto">
                                        <Plus className="w-3.5 h-3.5" /> New Project
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {projects.map((project, i) => (
                                        <motion.div
                                            key={project.id}
                                            className="project-card p-5 flex flex-col min-h-[180px]"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => navigate(`/project/${project.id}`)}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                    style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                                                    <Folder className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
                                                </div>
                                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ color: 'var(--text-muted)' }} />
                                            </div>
                                            <h3 className="text-[14px] font-semibold text-white mb-1.5 truncate">{project.name}</h3>
                                            <p className="text-[12px] leading-relaxed line-clamp-2 flex-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                                                {project.description || 'No description.'}
                                            </p>
                                            <div className="flex items-center gap-1.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                                <Clock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(project.created_at).toLocaleDateString()}
                                                </span>
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
