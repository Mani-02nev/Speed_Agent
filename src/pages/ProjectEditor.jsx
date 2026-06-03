import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { useAuthStore } from '../store/authStore';
import { useTerminalStore } from '../store/terminalStore';
import { useAIStore } from '../store/aiStore';
import { BRAND } from '../constants/brand';
import {
    Files,
    MessageSquare,
    Terminal as TerminalIcon,
    Settings,
    ChevronLeft,
    Search,
    Plus,
    X,
    Save,
    Play,
    Folder,
    CheckCircle2,
    Download,
    Trash2,
    AlertTriangle,
    Loader2,
    Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { isRunnableOnOnlineCompiler } from '../services/onlineCompiler';
import { cn } from '../utils/cn';
import Editor from '@monaco-editor/react';
import FileExplorer from '../editor/FileExplorer';
import AIChat from '../agent/AIChat';
import TabBar from '../editor/TabBar';
import Terminal from '../editor/Terminal';
import WebBrowserPanel from '../components/WebBrowserPanel';

const ProjectEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const fetchFiles = useProjectStore((s) => s.fetchFiles);
    const files = useProjectStore((s) => s.files);
    const projects = useProjectStore((s) => s.projects);
    const fetchProjects = useProjectStore((s) => s.fetchProjects);
    const updateFile = useProjectStore((s) => s.updateFile);

    const activeFileId = useEditorStore((s) => s.activeFileId);
    const tabs = useEditorStore((s) => s.tabs);
    const setFileDirty = useEditorStore((s) => s.setFileDirty);
    const dirtyFiles = useEditorStore((s) => s.dirtyFiles);
    const setEditorInstance = useEditorStore((s) => s.setEditorInstance);
    const setMonacoInstance = useEditorStore((s) => s.setMonacoInstance);
    const isPreviewOpen = useEditorStore((s) => s.isPreviewOpen);
    const setPreviewOpen = useEditorStore((s) => s.setPreviewOpen);

    const init = useAuthStore((s) => s.init);
    const terminalUpdateState = useTerminalStore((s) => s.updateState);
    const terminalSyncFiles = useTerminalStore((s) => s.syncProjectFiles);
    const resetTerminal = useTerminalStore((s) => s.resetTerminal);
    const resetAI = useAIStore((s) => s.resetAI);

    const [explorerVisible, setExplorerVisible] = useState(true);
    const [agentVisible, setAgentVisible] = useState(true);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [runTrigger, setRunTrigger]         = useState(0); // bump to trigger run
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [activeProject, setActiveProject] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const monacoRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            init();
            useEditorStore.getState().resetEditor();
            setPreviewOpen(false);
            await fetchProjects();
            await fetchFiles(id);
            setIsLoaded(true);
        };
        load();
    }, [id, fetchFiles, fetchProjects, init, setPreviewOpen]);

    useEffect(() => {
        const p = projects.find((proj) => proj.id === id);
        setActiveProject(p);
        if (p) {
            const projectPath = `/home/user/projects/${p.name.toLowerCase().replace(/\s+/g, '_')}`;
            terminalUpdateState({ currentDirectory: projectPath });
        }
    }, [projects, id, terminalUpdateState]);

    const activeFile = tabs.find((t) => t.id === activeFileId);

    const handleEditorWillMount = useCallback((monaco) => {
        monacoRef.current = monaco;
        files.forEach((file) => {
            const uri = monaco.Uri.parse(`file:///${file.name}`);
            if (!monaco.editor.getModel(uri)) {
                monaco.editor.createModel(file.content, file.language, uri);
            }
        });

        monaco.editor.defineTheme('mrk-glass', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: 'C4B5FD', fontStyle: 'bold' },
                { token: 'string', foreground: 'A5F3FC' },
                { token: 'function', foreground: '7DD3FC' },
                { token: 'number', foreground: 'FDBA74' },
                { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
            ],
            colors: {
                'editor.background': '#0c0e1400',
                'editor.foreground': '#E2E8F0',
                'editorCursor.foreground': '#7DD3FC',
                'editor.lineHighlightBackground': '#ffffff08',
                'editorLineNumber.foreground': '#475569',
                'editorLineNumber.activeForeground': '#94A3B8',
                'editor.selectionBackground': '#7dd3fc33',
                'editorWidget.background': '#12141c',
                'editorWidget.border': '#ffffff14',
            },
        });
    }, [files]);

    const handleEditorDidMount = useCallback(
        (editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            setEditorInstance(editor);
            setMonacoInstance(monaco);

            const disposable = editor.onDidChangeModelContent(() => {
                const model = editor.getModel();
                if (!model) return;
                const fileName = model.uri.path.split('/').pop();
                const file = useProjectStore.getState().files.find((f) => f.name === fileName);
                if (file) useEditorStore.getState().setFileDirty(file.id, true);
            });

            return () => {
                disposable.dispose();
                editorRef.current = null;
                setEditorInstance(null);
            };
        },
        [setEditorInstance, setMonacoInstance]
    );

    useEffect(() => {
        if (!editorRef.current || !monacoRef.current || !activeFile) return;
        try {
            const uri = monacoRef.current.Uri.parse(`file:///${activeFile.name}`);
            let model = monacoRef.current.editor.getModel(uri);
            if (!model) {
                model = monacoRef.current.editor.createModel(
                    activeFile.content,
                    activeFile.language,
                    uri
                );
            }
            if (editorRef.current.getModel() !== model) editorRef.current.setModel(model);
            editorRef.current.focus();
        } catch {
            /* deferred bind */
        }
    }, [activeFileId, activeFile]);

    useEffect(() => {
        if (!monacoRef.current || !files.length) return;
        files.forEach((file) => {
            try {
                const uri = monacoRef.current.Uri.parse(`file:///${file.name}`);
                const model = monacoRef.current.editor.getModel(uri);
                if (model && !model.isDisposed() && model.getValue() !== file.content) {
                    if (!dirtyFiles.includes(file.id)) {
                        model.pushEditOperations(
                            [],
                            [{ range: model.getFullModelRange(), text: file.content }],
                            () => null
                        );
                    }
                } else if (!model) {
                    monacoRef.current.editor.createModel(file.content, file.language, uri);
                }
            } catch {
                /* sync */
            }
        });
    }, [files, dirtyFiles]);

    useEffect(() => {
        if (activeProject) terminalSyncFiles(activeProject.name, files);
    }, [activeProject, files, terminalSyncFiles]);

    const handleCreateModule = useCallback(async () => {
        const name = prompt('File name (e.g. App.jsx, index.html):');
        if (!name) return;
        const ext = name.split('.').pop();
        const languageMap = {
            js: 'javascript',
            jsx: 'javascript',
            css: 'css',
            html: 'html',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            md: 'markdown',
        };
        try {
            const newFile = await useProjectStore
                .getState()
                .createFile(id, name, '', languageMap[ext] || 'javascript');
            if (monacoRef.current) {
                const uri = monacoRef.current.Uri.parse(`file:///${newFile.name}`);
                if (!monacoRef.current.editor.getModel(uri)) {
                    monacoRef.current.editor.createModel('', languageMap[ext] || 'javascript', uri);
                }
            }
            useEditorStore.getState().openFile(newFile);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    const handleSaveAll = async () => {
        if (saveStatus === 'saving') return;
        setSaveStatus('saving');
        try {
            const currentDirty = useEditorStore.getState().dirtyFiles;
            const currentFiles = useProjectStore.getState().files;
            for (const fileId of currentDirty) {
                const file = currentFiles.find((f) => f.id === fileId);
                if (file && monacoRef.current) {
                    const uri = monacoRef.current.Uri.parse(`file:///${file.name}`);
                    const model = monacoRef.current.editor.getModel(uri);
                    if (model) {
                        await updateFile(fileId, model.getValue());
                        setFileDirty(fileId, false);
                    }
                }
            }
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('idle');
        }
    };

    const handleDownloadProject = async () => {
        if (!activeProject || isDownloading) return;
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const currentFiles = useProjectStore.getState().files;
            if (monacoRef.current) {
                for (const file of currentFiles) {
                    const uri = monacoRef.current.Uri.parse(`file:///${file.name}`);
                    const model = monacoRef.current.editor.getModel(uri);
                    if (model) file.content = model.getValue();
                }
            }
            currentFiles.forEach((file) => {
                if (file.content !== undefined) zip.file(file.name, file.content);
            });
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${activeProject.name.replace(/\s+/g, '_')}.zip`;
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDeleteProject = async () => {
        try {
            await useProjectStore.getState().deleteProject(id);
            useEditorStore.getState().resetEditor();
            resetTerminal();
            resetAI();
            navigate('/dashboard');
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    useEffect(() => {
        const handleKeys = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen((p) => !p);
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
    }, [handleCreateModule]);

    if (!isLoaded) {
        return (
            <div className="h-screen w-full bg-[var(--app-bg)] flex flex-col items-center justify-center gap-4">
                <Sparkles className="w-8 h-8 text-[var(--accent-primary)] animate-pulse" />
                <span className="text-[12px] font-medium text-white/50">{BRAND.name}</span>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)] select-none">
            {commandPaletteOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-md"
                        onClick={() => setCommandPaletteOpen(false)}
                    />
                    <div className="w-full max-w-lg glass-shell rounded-2xl overflow-hidden z-[101] shadow-2xl">
                        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
                            <Search className="w-4 h-4 text-[var(--accent-primary)]" />
                            <input
                                autoFocus
                                placeholder="Command palette…"
                                className="bg-transparent border-none outline-none text-white w-full text-[14px] placeholder:text-white/30"
                            />
                        </div>
                        <div className="p-2">
                            {[
                                { label: 'Save all', icon: Save, kbd: '⌘S', action: () => { handleSaveAll(); setCommandPaletteOpen(false); } },
                                { label: 'New file', icon: Plus, kbd: '⌘N', action: () => { setCommandPaletteOpen(false); handleCreateModule(); } },
                                { label: 'Toggle explorer', icon: Folder, action: () => { setExplorerVisible((v) => !v); setCommandPaletteOpen(false); } },
                                { label: 'Toggle agent', icon: MessageSquare, action: () => { setAgentVisible((v) => !v); setCommandPaletteOpen(false); } },
                                { label: 'Terminal', icon: TerminalIcon, action: () => { setIsTerminalOpen((v) => !v); setCommandPaletteOpen(false); } },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={item.action}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.06] transition-colors"
                                >
                                    <span className="flex items-center gap-3 text-[13px] text-white/80">
                                        <item.icon className="w-4 h-4 text-[var(--accent-primary)]" />
                                        {item.label}
                                    </span>
                                    {item.kbd && <span className="text-[10px] text-white/30 font-mono">{item.kbd}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <header className="glass-header h-12 flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate leading-tight">
                            {activeProject?.name || 'Workspace'}
                        </p>
                        <p className="text-[10px] text-[var(--accent-primary)]/80 font-medium">
                            {BRAND.name} · {BRAND.eco}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Run button — only for backend files */}
                    {activeFile && isRunnableOnOnlineCompiler(activeFile.name) && (
                        <button
                            type="button"
                            onClick={() => { setIsTerminalOpen(true); setRunTrigger(t => t + 1); }}
                            className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all"
                            style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#34D399' }}
                            title={`Run ${activeFile.name}`}
                        >
                            <Play className="w-3.5 h-3.5" />
                            Run
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setPreviewOpen(!isPreviewOpen)}
                        className={cn(
                            'h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all',
                            isPreviewOpen
                                ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        )}
                    >
                        <Play className="w-3.5 h-3.5" />
                        Preview
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={saveStatus === 'saving'}
                        className={cn(
                            'h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all',
                            saveStatus === 'success'
                                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25'
                                : 'bg-[var(--accent-primary)] text-slate-900 hover:brightness-110'
                        )}
                    >
                        {saveStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'success' ? 'Saved' : 'Save'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="hidden md:flex w-14 glass-sidebar flex-col items-center py-3 gap-2 shrink-0">
                    {[
                        { id: 'files', icon: Folder, on: () => { setExplorerVisible((v) => !v); setSettingsVisible(false); }, active: explorerVisible },
                        { id: 'agent', icon: MessageSquare, on: () => setAgentVisible((v) => !v), active: agentVisible },
                        { id: 'terminal', icon: TerminalIcon, on: () => setIsTerminalOpen((v) => !v), active: isTerminalOpen },
                        { id: 'settings', icon: Settings, on: () => { setSettingsVisible((v) => !v); setExplorerVisible(false); }, active: settingsVisible },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={item.on}
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                                item.active ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]' : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                        </button>
                    ))}
                </aside>

                {explorerVisible && (
                    <aside className="w-[220px] glass-sidebar flex flex-col shrink-0 overflow-hidden">
                        <FileExplorer projectId={id} />
                    </aside>
                )}

                {settingsVisible && (
                    <aside className="w-[240px] glass-sidebar flex flex-col p-4 shrink-0">
                        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-4">Project</h2>
                        <button
                            type="button"
                            onClick={handleDownloadProject}
                            disabled={isDownloading}
                            className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 text-[13px] text-white/90 mb-2"
                        >
                            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download ZIP
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="w-full flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-400"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete project
                        </button>
                    </aside>
                )}

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden p-2 gap-2">
                    <TabBar />
                    <div className="flex-1 flex flex-col min-h-0 gap-2">
                        <div className="flex-1 flex min-h-0 gap-2">
                            <div
                                className={cn(
                                    'glass-editor-frame flex flex-col min-h-0 transition-[width] duration-200',
                                    isPreviewOpen ? 'w-1/2' : 'w-full'
                                )}
                            >
                                {activeFileId ? (
                                    <Editor
                                        height="100%"
                                        theme="mrk-glass"
                                        beforeMount={handleEditorWillMount}
                                        onMount={handleEditorDidMount}
                                        language={activeFile?.language || 'javascript'}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            fontFamily: '"JetBrains Mono", monospace',
                                            automaticLayout: true,
                                            smoothScrolling: true,
                                            cursorBlinking: 'smooth',
                                            cursorSmoothCaretAnimation: 'on',
                                            padding: { top: 12 },
                                            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                                            lineHeight: 22,
                                        }}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                        <div className="w-16 h-16 rounded-2xl glass-shell flex items-center justify-center mb-5">
                                            <Files className="w-8 h-8 text-[var(--accent-primary)]" />
                                        </div>
                                        <h3 className="text-[15px] font-semibold text-white mb-2">{BRAND.name}</h3>
                                        <p className="text-[13px] text-white/45 max-w-xs leading-relaxed">
                                            Open a file from the explorer or ask the agent to create your production app.
                                        </p>
                                    </div>
                                )}
                            </div>
                            {isPreviewOpen && <WebBrowserPanel projectId={id} />}
                        </div>

                        {isTerminalOpen && (
                            <div className="h-[240px] glass-editor-frame relative shrink-0">
                                <Terminal projectId={id} runTrigger={runTrigger} />
                                <button
                                    type="button"
                                    className="absolute top-2 right-3 p-1 text-white/40 hover:text-white"
                                    onClick={() => setIsTerminalOpen(false)}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <footer className="glass-footer h-7 flex items-center justify-between px-3 text-[10px] text-white/35 font-medium shrink-0 rounded-lg">
                        <span>{BRAND.name} v{BRAND.version}</span>
                        <button
                            type="button"
                            className={cn('hover:text-white/60', isTerminalOpen && 'text-[var(--accent-primary)]')}
                            onClick={() => setIsTerminalOpen((v) => !v)}
                        >
                            Terminal
                        </button>
                    </footer>
                </main>

                {agentVisible && (
                    <aside className="w-[min(400px,38vw)] shrink-0 border-l border-white/[0.06] overflow-hidden">
                        <AIChat projectId={id} />
                    </aside>
                )}
            </div>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="glass-shell rounded-3xl p-8 max-w-md w-full relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white text-center mb-2">Delete project?</h2>
                        <p className="text-[13px] text-white/50 text-center mb-6">
                            This permanently removes all files and chat history.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleDeleteProject}
                                className="w-full py-3 rounded-xl bg-red-500 text-white text-[13px] font-semibold"
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full py-3 rounded-xl bg-white/5 text-white/60 text-[13px] font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectEditor;
