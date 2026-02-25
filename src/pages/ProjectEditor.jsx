import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { useAuthStore } from '../store/authStore';
import { useTerminalStore } from '../store/terminalStore';
import { useAIStore } from '../store/aiStore';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout,
    Files,
    MessageSquare,
    Terminal as TerminalIcon,
    Settings,
    ChevronLeft,
    Search,
    Plus,
    Cpu,
    Zap,
    X,
    Save,
    Play,
    Folder,
    CheckCircle2,
    Download,
    Trash2,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import Editor from '@monaco-editor/react';
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";

// Sub-components
import FileExplorer from '../editor/FileExplorer';
import AIChat from '../agent/AIChat';
import TabBar from '../editor/TabBar';
import Terminal from '../editor/Terminal';
import WebBrowserPanel from '../components/WebBrowserPanel';

const ProjectEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Selectors to prevent over-rendering
    const fetchFiles = useProjectStore(state => state.fetchFiles);
    const files = useProjectStore(state => state.files);
    const projects = useProjectStore(state => state.projects);
    const fetchProjects = useProjectStore(state => state.fetchProjects);
    const updateFile = useProjectStore(state => state.updateFile);

    const activeFileId = useEditorStore(state => state.activeFileId);
    const tabs = useEditorStore(state => state.tabs);
    const setFileDirty = useEditorStore(state => state.setFileDirty);
    const dirtyFiles = useEditorStore(state => state.dirtyFiles);
    const setEditorInstance = useEditorStore(state => state.setEditorInstance);
    const setMonacoInstance = useEditorStore(state => state.setMonacoInstance);
    const isPreviewOpen = useEditorStore(state => state.isPreviewOpen);
    const setPreviewOpen = useEditorStore(state => state.setPreviewOpen);
    const previewRootPath = useProjectStore(state => state.previewRootPath);

    const init = useAuthStore(state => state.init);
    const terminalUpdateState = useTerminalStore(state => state.updateState);
    const terminalSyncFiles = useTerminalStore(state => state.syncProjectFiles);
    const resetTerminal = useTerminalStore(state => state.resetTerminal);
    const resetAI = useAIStore(state => state.resetAI);

    // UI Panel States
    const [explorerVisible, setExplorerVisible] = useState(true);
    const [agentVisible, setAgentVisible] = useState(true);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [activeSidebarIcon, setActiveSidebarIcon] = useState('files');
    const [activeProject, setActiveProject] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const monacoRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            init();
            await fetchProjects();
            await fetchFiles(id);
            setIsLoaded(true);
        };
        load();
    }, [id, fetchFiles, fetchProjects, init]);

    useEffect(() => {
        if (projects.length > 0) {
            const p = projects.find(proj => proj.id === id);
            setActiveProject(p);

            // RLS Diagnostics
            const loadAuth = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (p) {
                    console.log(`[PROJECT NODE] ID: ${p.id} | Owner: ${p.user_id} | Viewer: ${user?.id}`);
                    if (p.user_id !== user?.id) {
                        console.warn('[SECURITY] Project owner mismatch. RLS errors likely.');
                    }
                }
            };
            loadAuth();

            // v6: Auto-CD into project directory in terminal
            if (p) {
                const projectPath = `/home/user/projects/${p.name.toLowerCase().replace(/\s+/g, '_')}`;
                terminalUpdateState({ currentDirectory: projectPath });
            }
        }
    }, [projects, id]);

    const activeFile = tabs.find(t => t.id === activeFileId);

    const handleEditorWillMount = useCallback((monaco) => {
        monacoRef.current = monaco;
        // Optimization: Pre-create models for all files to avoid disposal lag
        files.forEach(file => {
            const uri = monaco.Uri.parse(`file:///${file.name}`);
            if (!monaco.editor.getModel(uri)) {
                monaco.editor.createModel(file.content, file.language, uri);
            }
        });

        monaco.editor.defineTheme('speed-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: 'C792EA', fontStyle: 'bold' },
                { token: 'string', foreground: 'ECC48D' },
                { token: 'function', foreground: '82AAFF' },
                { token: 'number', foreground: 'F78C6C' },
                { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
                { token: 'variable', foreground: 'E6EDF3' },
            ],
            colors: {
                'editor.background': '#0F1115',
                'editor.foreground': '#E6EDF3',
                'editorCursor.foreground': '#00E0B8',
                'editor.lineHighlightBackground': '#1A1F29',
                'editorLineNumber.foreground': '#3B4252',
                'editorLineNumber.activeForeground': '#E6EDF3',
                'editor.selectionBackground': '#264F78',
                'editorWidget.background': '#151821',
                'editorWidget.border': '#1F2430',
                'editor.border': '#1F2430',
            },
        });
    }, [files]);

    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setEditorInstance(editor);
        setMonacoInstance(monaco);

        const disposable = editor.onDidChangeModelContent(() => {
            const currentModel = editor.getModel();
            if (currentModel) {
                // Find file ID by URI mapping instead of relying on activeFileId state which might lag
                const fileName = currentModel.uri.path.split('/').pop();
                const file = useProjectStore.getState().files.find(f => f.name === fileName);
                if (file) {
                    useEditorStore.getState().setFileDirty(file.id, true);
                }
            }
        });

        return () => {
            disposable.dispose();
            editorRef.current = null;
            useEditorStore.getState().setEditorInstance(null);
        };
    }, [setEditorInstance, setMonacoInstance]);

    // Handle Active File Change (Reuse Models)
    useEffect(() => {
        if (editorRef.current && monacoRef.current && activeFile) {
            try {
                const uri = monacoRef.current.Uri.parse(`file:///${activeFile.name}`);
                let model = monacoRef.current.editor.getModel(uri);
                if (!model) {
                    model = monacoRef.current.editor.createModel(activeFile.content, activeFile.language, uri);
                }
                if (editorRef.current.getModel() !== model) {
                    editorRef.current.setModel(model);
                }
                editorRef.current.focus();
            } catch (e) {
                console.warn("Neural Node Transition: Deferred model binding.");
            }
        }
    }, [activeFileId]);

    // v6: Safety Cleanup on Unmount
    useEffect(() => {
        return () => {
            if (editorRef.current) {
                // Do not call dispose() here as it might break concurrent React 18 renders
                // Instead, clear global instances to signify 'offline'
                editorRef.current = null;
                monacoRef.current = null;
                setEditorInstance(null);
                setMonacoInstance(null);
            }
        };
    }, [setEditorInstance, setMonacoInstance]);

    // Sync models with files silently in background
    useEffect(() => {
        if (!monacoRef.current || !files.length) return;
        files.forEach(file => {
            try {
                if (!monacoRef.current) return;
                const uri = monacoRef.current.Uri.parse(`file:///${file.name}`);
                const model = monacoRef.current.editor.getModel(uri);
                if (model && !model.isDisposed() && model.getValue() !== file.content) {
                    // Only update if not dirty to prevent losing user edits
                    if (!dirtyFiles.includes(file.id)) {
                        model.pushEditOperations([], [{ range: model.getFullModelRange(), text: file.content }], () => null);
                    }
                } else if (!model) {
                    monacoRef.current.editor.createModel(file.content, file.language, uri);
                }
            } catch (e) {
                console.warn("Deferred background sync.", e);
            }
        });
    }, [files, dirtyFiles]);

    useEffect(() => {
        if (activeProject) {
            terminalSyncFiles(activeProject.name, files);
        }
    }, [activeProject, files, terminalSyncFiles]);

    const handleCreateModule = useCallback(async () => {
        const name = prompt('Enter module name (e.g. index.html, style.css, App.jsx):');
        if (name) {
            const ext = name.split('.').pop();
            const languageMap = { js: 'javascript', jsx: 'javascript', css: 'css', html: 'html', ts: 'typescript', tsx: 'typescript', py: 'python' };
            try {
                const newFile = await useProjectStore.getState().createFile(id, name, '', languageMap[ext] || 'javascript');

                // Immediate Activation Rule
                if (monacoRef.current) {
                    const uri = monacoRef.current.Uri.parse(`file:///${newFile.name}`);
                    if (!monacoRef.current.editor.getModel(uri)) {
                        monacoRef.current.editor.createModel('', languageMap[ext] || 'javascript', uri);
                    }
                }
                useEditorStore.getState().openFile(newFile);
            } catch (err) {
                console.error('Core Execution Failure:', err);
            }
        }
    }, [id]);

    const handleSaveAll = async () => {
        if (saveStatus === 'saving') return;
        setSaveStatus('saving');

        try {
            const currentDirty = useEditorStore.getState().dirtyFiles;
            const currentFiles = useProjectStore.getState().files;

            for (const fileId of currentDirty) {
                const file = currentFiles.find(f => f.id === fileId);
                if (file && monacoRef.current) {
                    const uri = monacoRef.current.Uri.parse(`file:///${file.name}`);
                    const model = monacoRef.current.editor.getModel(uri);
                    if (model) {
                        const content = model.getValue();
                        await updateFile(fileId, content);
                        setFileDirty(fileId, false);
                    }
                }
            }
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Neural Persistence Failure:', err);
            setSaveStatus('idle');
        }
    };

    const handleDownloadProject = async () => {
        if (!activeProject || isDownloading) return;
        setIsDownloading(true);

        try {
            const zip = new JSZip();
            const currentFiles = useProjectStore.getState().files;

            // Rule 9: Sync Monaco models -> file store before ZIP
            if (monacoRef.current) {
                for (const file of currentFiles) {
                    const uri = monacoRef.current.Uri.parse(`file:///${file.name}`);
                    const model = monacoRef.current.editor.getModel(uri);
                    if (model) {
                        file.content = model.getValue();
                    }
                }
            }

            // Create flat or nested structure based on file names
            currentFiles.forEach(file => {
                if (file.content !== undefined) {
                    zip.file(file.name, file.content);
                }
            });

            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${activeProject.name.replace(/\s+/g, '_')}_source.zip`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export sequence failure:", error);
            alert("Neural export failed. Check console.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDeleteProject = async () => {
        try {
            // v6: MONACO SAFE CLEANUP
            if (editorRef.current) {
                const model = editorRef.current.getModel();
                if (model) model.dispose();
                editorRef.current.dispose();
            }

            // State Reset
            await useProjectStore.getState().deleteProject(id);
            useEditorStore.getState().resetEditor();
            resetTerminal();
            resetAI();

            navigate('/dashboard');
        } catch (error) {
            console.error("Project purge failed:", error);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    useEffect(() => {
        const handleKeys = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(prev => !prev);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSaveAll();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                handleCreateModule();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [activeFileId, dirtyFiles, handleSaveAll, handleCreateModule]);

    const handleToggleExplorer = () => {
        setExplorerVisible(prev => !prev);
        setCommandPaletteOpen(false);
    };

    const handleToggleAgent = () => {
        setAgentVisible(prev => !prev);
        setCommandPaletteOpen(false);
    };

    if (!isLoaded) {
        return (
            <div className="h-screen w-full bg-[#0D0F12] flex items-center justify-center">
                <Zap className="w-8 h-8 text-[#00E0B8] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#0D0F12] text-[#E6EDF3] flex flex-col overflow-hidden select-none tracking-tight">
            <AnimatePresence>
                {commandPaletteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCommandPaletteOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} className="w-full max-w-xl bg-[#151821] border border-[#1F2430] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.7)] overflow-hidden z-[101]">
                            <div className="p-4 border-b border-[#1F2430] flex items-center gap-3">
                                <Search className="w-4 h-4 text-[#00E0B8]" />
                                <input autoFocus placeholder="Identify system operation..." className="bg-transparent border-none outline-none text-white w-full text-[14px] font-medium placeholder-[#3B4252]" />
                            </div>
                            <div className="p-2 space-y-1">
                                {[
                                    { label: 'Save Sync', icon: Save, kbd: '⌘ S', action: handleSaveAll, color: '#00E0B8' },
                                    { label: 'Create New Module', icon: Plus, kbd: '⌘ N', action: () => { setCommandPaletteOpen(false); handleCreateModule(); }, color: '#00E0B8' },
                                    { label: 'Toggle Explorer', icon: Folder, kbd: '⌘ E', action: handleToggleExplorer },
                                    { label: 'Neural Core Chat', icon: MessageSquare, kbd: '⌘ I', action: handleToggleAgent },
                                    { label: 'Terminal Access', icon: TerminalIcon, kbd: '`', action: () => { setIsTerminalOpen(!isTerminalOpen); setCommandPaletteOpen(false); } }
                                ].map((item, i) => (
                                    <button key={i} onClick={item.action} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-all group">
                                        <div className="flex items-center gap-4">
                                            <item.icon className="w-4 h-4 text-[#57606A] group-hover:text-white transition-colors" style={{ color: item.color }} />
                                            <span className="text-[13px] font-semibold text-[#9DA5B4] group-hover:text-white transition-colors">{item.label}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#3B4252] group-hover:text-[#57606A]">{item.kbd}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="p-3 bg-black/20 border-t border-[#1F2430] text-[10px] font-black tracking-widest text-[#3B4252] flex justify-between uppercase">
                                <span>Agent K v1.0 Production</span>
                                <span>Esc to close</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <header className="w-full h-12 border-b border-[#1F2430] flex items-center justify-between px-4 shrink-0 bg-[#0D0F12] z-[60]">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="hover:text-white text-[#57606A] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white/5 rounded-md flex items-center justify-center border border-white/10 shadow-sm"><img src="/logo.png" className="w-4 h-4 object-contain" alt="Agent K" /></div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white leading-none">{activeProject?.name || 'Workbench'}</span>
                            <span className="text-[9px] font-bold text-[#00E0B8] uppercase tracking-widest mt-0.5 opacity-80">Agent K Production</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00E0B8] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#9DA5B4]">Neural Active</span>
                    </div>
                    <div className="h-8 w-[1px] bg-[#1F2430] mx-1 hidden md:block" />
                    <button
                        onClick={() => setPreviewOpen(!isPreviewOpen)}
                        className="h-8 px-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-md flex items-center gap-2 bg-[#1F2430] text-white hover:bg-[#2D333B] border border-white/5"
                    >
                        <Play className="w-3 h-3 text-[#00E0B8]" />
                        Preview
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={saveStatus === 'saving'}
                        className={cn(
                            "h-8 px-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-md flex items-center gap-2",
                            saveStatus === 'success' ? "bg-[#00E0B8]/10 text-[#00E0B8] border border-[#00E0B8]/20" : "bg-[#00E0B8] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,224,184,0.2)]"
                        )}
                    >
                        {saveStatus === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save All'}
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full flex overflow-hidden relative">
                <aside className="hidden md:flex w-[64px] border-r border-[#1F2430] bg-[#111317] flex-col items-center py-4 gap-4 shrink-0 z-50">
                    {[
                        { id: 'files', icon: Folder },
                        { id: 'agent', icon: MessageSquare },
                        { id: 'terminal', icon: TerminalIcon },
                        { id: 'settings', icon: Settings }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'files') { setExplorerVisible(!explorerVisible); setSettingsVisible(false); }
                                if (item.id === 'agent') setAgentVisible(!agentVisible);
                                if (item.id === 'terminal') setIsTerminalOpen(!isTerminalOpen);
                                if (item.id === 'settings') { setSettingsVisible(!settingsVisible); setExplorerVisible(false); }
                            }}
                            className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-all relative group",
                                (item.id === 'files' ? explorerVisible : item.id === 'agent' ? agentVisible : item.id === 'terminal' ? isTerminalOpen : item.id === 'settings' ? settingsVisible : activeSidebarIcon === item.id)
                                    ? "bg-[#00E0B8]/10 text-[#00E0B8]"
                                    : "text-[#57606A] hover:bg-white/5 hover:text-[#9DA5B4]"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                        </button>
                    ))}
                </aside>

                <AnimatePresence>
                    {explorerVisible && (
                        <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-r border-[#1F2430] bg-[#111317] flex flex-col h-full overflow-hidden shrink-0 z-40">
                            <FileExplorer projectId={id} />
                        </motion.aside>
                    )}
                    {settingsVisible && (
                        <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-r border-[#1F2430] bg-white flex flex-col h-full overflow-hidden shrink-0 z-40 shadow-2xl">
                            <div className="p-6 flex flex-col h-full">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0F172A] mb-8">Project Settings</h2>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleDownloadProject}
                                        disabled={isDownloading}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#00E0B8] transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isDownloading ? <Loader2 className="w-4 h-4 text-[#00E0B8] animate-spin" /> : <Download className="w-4 h-4 text-[#64748B] group-hover:text-[#00E0B8]" />}
                                            <span className="text-[13px] font-bold text-[#0F172A]">Download Project</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-red-100 bg-red-50/30 hover:bg-red-50 hover:border-red-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                            <span className="text-[13px] font-bold text-red-600">Remove Project</span>
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Logical Identifier</span>
                                    <span className="text-[10px] font-mono text-[#475569] break-all">{id}</span>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0D0F12]">
                    <TabBar />
                    <div className="flex-1 w-full flex flex-col overflow-hidden relative p-1">
                        <div className="flex-1 overflow-hidden relative rounded-xl border border-[#1F2430] bg-[#0F1115] flex">
                            {/* Editor Container */}
                            <div className={cn("h-full relative transition-all duration-300", isPreviewOpen ? "w-1/2 border-r border-[#1F2430]" : "w-full")}>
                                {activeFileId ? (
                                    <Editor
                                        height="100%"
                                        theme="speed-dark"
                                        beforeMount={handleEditorWillMount}
                                        onMount={handleEditorDidMount}
                                        language={activeFile?.language || 'javascript'}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            fontFamily: '"JetBrains Mono", monospace',
                                            automaticLayout: true,
                                            cursorBlinking: 'smooth',
                                            cursorSmoothCaretAnimation: "on",
                                            scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                                            lineHeight: 22,
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                                        <div className="w-20 h-20 bg-[#151821] border border-[#1F2430] rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-[#00E0B8]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <img src="/logo.png" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" alt="Agent K" />
                                        </div>
                                        <h3 className="text-[14px] font-black uppercase tracking-[0.5em] text-white">Agent K</h3>
                                        <p className="text-[13px] text-[#57606A] max-w-xs leading-relaxed font-medium">System awaiting core distribution. Load module from explorer to begin architectural updates.</p>
                                    </div>
                                )}
                            </div>

                            {/* Live Preview Pane */}
                            <AnimatePresence>
                                {isPreviewOpen && (
                                    <WebBrowserPanel projectId={id} />
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {isTerminalOpen && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 280 }} exit={{ height: 0 }} className="border-t border-[#1F2430] relative bg-[#0B0D11] z-30 overflow-hidden">
                                    <Terminal projectId={id} />
                                    <button className="absolute top-3 right-5 text-[#57606A] hover:text-white transition-colors p-1" onClick={() => setIsTerminalOpen(false)}>
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <footer className="h-7 border-t border-[#1F2430] bg-[#111317] flex items-center px-4 justify-between shrink-0">
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-[#57606A]">
                                <div className="flex items-center gap-2 text-[#00E0B8]">
                                    <div className="w-1 h-1 rounded-full bg-current shadow-[0_0_8px_#00E0B8]" />
                                    AGENT_K_IDE_V1
                                </div>
                                <span className="opacity-50 tracking-tighter">/home/user/projects/{activeProject?.name?.toLowerCase().replace(/\s+/g, '_') || ''}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-[#57606A]">
                                <button className={cn("hover:text-white transition-colors", isTerminalOpen && "text-white")} onClick={() => setIsTerminalOpen(!isTerminalOpen)}>Terminal</button>
                                <span className="opacity-40 text-[#00E0B8]">AGENT_NODE_1.0</span>
                            </div>
                        </footer>
                    </div>
                </main>

                <AnimatePresence>
                    {agentVisible && (
                        <motion.aside
                            initial={{ width: 0, x: 20 }}
                            animate={{ width: 380, x: 0 }}
                            exit={{ width: 0, x: 20 }}
                            className="border-l border-[#1F2430] bg-[#151821] flex flex-col h-full overflow-hidden shrink-0 z-50 shadow-[-15px_0_40_rgba(0,0,0,0.4)]"
                        >
                            <AIChat projectId={id} />
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-[0_32px_120px_rgba(0,0,0,0.5)] relative z-10 border border-white/20"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase text-center mb-4">Delete Project?</h2>
                            <p className="text-[#64748B] text-center font-medium leading-relaxed mb-10">
                                This action cannot be undone. All engineering nodes and file hierarchies will be permanently purged.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteProject}
                                    className="w-full py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                                >
                                    Confirm Purge
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="w-full py-4 bg-[#F8FAFC] text-[#64748B] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-[#0F172A] transition-all"
                                >
                                    Abort Operation
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectEditor;
