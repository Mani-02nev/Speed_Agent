import React, { useState, useEffect, useRef } from 'react';
import { useTerminalStore } from '../store/terminalStore';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import {
    isOnlineCompilerConfigured,
    isRunnableOnOnlineCompiler,
    runCodeSync,
    resolveCompilerForFileName,
    formatRunResult,
} from '../services/onlineCompiler';
import { Play, Square, Terminal as TermIcon, X, ChevronRight, Send } from 'lucide-react';
import { cn } from '../utils/cn';
import { getFileIcon } from '../utils/fileIcons';
import { motion, AnimatePresence } from 'framer-motion';

// Files that need stdin input (interactive programs)
const NEEDS_STDIN = /\.(py|cpp|cc|cxx|c|java|go|rs|cs|rb|php|ts)$/i;

const Terminal = ({ projectId, runTrigger = 0 }) => {
    const history          = useTerminalStore(s => s.history);
    const currentDirectory = useTerminalStore(s => s.currentDirectory);
    const executeCommand   = useTerminalStore(s => s.executeCommand);
    const setPreviewOpen   = useEditorStore(s => s.setPreviewOpen);
    const setBrowserUrl    = useEditorStore(s => s.setBrowserUrl);
    const files            = useProjectStore(s => s.files);
    const deleteFile       = useProjectStore(s => s.deleteFile);

    const [input, setInput]           = useState('');
    const [isRunning, setIsRunning]   = useState(false);
    const [isDevServer, setIsDevServer] = useState(false);

    // Stdin modal
    const [stdinModal, setStdinModal] = useState({ open: false, file: null });
    const [stdinValue, setStdinValue] = useState('');

    const scrollRef  = useRef(null);
    const inputRef   = useRef(null);
    const stdinRef   = useRef(null);

    const displayPath = currentDirectory.replace('/home/user', '~');

    const pushHistory = (type, content) => {
        useTerminalStore.setState(prev => ({
            history: [...prev.history, { type, content }]
        }));
    };

    const replaceLastHistory = (type, content) => {
        useTerminalStore.setState(prev => {
            const h = [...prev.history];
            h[h.length - 1] = { type, content };
            return { history: h };
        });
    };

    // ── Run a file with optional stdin ──────────────────────────────────
    const runFile = async (file, stdin = '') => {
        if (!file) return;

        // Get latest Monaco content
        const { monacoInstance } = useEditorStore.getState();
        if (monacoInstance) {
            const uri   = monacoInstance.Uri.parse(`file:///${file.name}`);
            const model = monacoInstance.editor.getModel(uri);
            if (model && !model.isDisposed()) file = { ...file, content: model.getValue() };
        }

        if (!isOnlineCompilerConfigured()) {
            pushHistory('error', 'Set VITE_ONLINE_COMPILER_API_KEY in .env (api.onlinecompiler.io → API Keys), then restart.');
            return;
        }

        if (!isRunnableOnOnlineCompiler(file.name)) {
            pushHistory('output', `${file.name} — use Preview for HTML/React/JS.\nOnlineCompiler supports: py cpp c java go rs ts php rb cs hs`);
            return;
        }

        setIsRunning(true);
        pushHistory('output', `▶ Compiling & running ${file.name}…`);

        try {
            const compiler = resolveCompilerForFileName(file.name);
            const result   = await runCodeSync(compiler, file.content || '', stdin);
            const out      = formatRunResult(result, file.name).replace(/\x1b\[[0-9;]*m/g, '');
            replaceLastHistory(result.ok ? 'output' : 'error', out);
        } catch (err) {
            replaceLastHistory('error', `Run failed: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    // Auto-trigger run when runTrigger bumps (from editor header Run button)
    useEffect(() => {
        if (runTrigger === 0) return;
        handleRunClick();
    }, [runTrigger]); // eslint-disable-line

    // ── Run button click — show stdin modal if needed ───────────────────
    const handleRunClick = () => {
        const { activeFileId } = useEditorStore.getState();
        const projectFiles     = useProjectStore.getState().files;
        const file             = projectFiles.find(f => f.id === activeFileId);

        if (!file) {
            pushHistory('error', 'No file open. Open a file in the editor first.');
            return;
        }

        if (!isRunnableOnOnlineCompiler(file.name)) {
            pushHistory('output', `${file.name} — use Preview for HTML/React/JS.`);
            return;
        }

        if (NEEDS_STDIN.test(file.name)) {
            setStdinValue('');
            setStdinModal({ open: true, file });
            setTimeout(() => stdinRef.current?.focus(), 50);
        } else {
            runFile(file, '');
        }
    };

    const handleStdinSubmit = (e) => {
        e?.preventDefault();
        const file = stdinModal.file;
        setStdinModal({ open: false, file: null });
        runFile(file, stdinValue);
    };

    const handleStdinSkip = () => {
        const file = stdinModal.file;
        setStdinModal({ open: false, file: null });
        runFile(file, '');
    };

    // ── Terminal command handler ────────────────────────────────────────
    useEffect(() => {
        const last = history[history.length - 1];
        if (!last || last.type !== 'output') {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            return;
        }

        if (last.content === 'RUN_DEV_SERVER') {
            setIsDevServer(true);
            setBrowserUrl('localhost:5173');
            setPreviewOpen(true);
            replaceLastHistory('output', `> vite\n\n  VITE v5.0.0  ready in 122 ms\n\n  ➜  Local:   http://localhost:5173/\n\nPress 'c' and hit Enter to stop.`);
        }

        if (typeof last.content === 'string' && last.content.startsWith('RUN_ONLINE_COMPILER:')) {
            const parts     = last.content.slice('RUN_ONLINE_COMPILER:'.length).split(':::');
            const target    = parts[0] || '__active__';
            const stdinData = parts[1] || '';

            (async () => {
                const { activeFileId } = useEditorStore.getState();
                const projectFiles     = useProjectStore.getState().files;
                let file = target === '__active__'
                    ? projectFiles.find(f => f.id === activeFileId)
                    : projectFiles.find(f =>
                        f.name === target ||
                        f.name.endsWith('/' + target) ||
                        f.name.toLowerCase() === target.toLowerCase()
                    );

                if (!file) {
                    replaceLastHistory('error', target === '__active__'
                        ? 'run: open a file in the editor first, or: run main.cpp'
                        : `run: '${target}' not found in project.`);
                    return;
                }

                await runFile(file, stdinData);
                // runFile handles its own history push
            })();
        }

        if (last.content === 'DELETE_ALL_FILES') {
            const cur = useProjectStore.getState().files;
            Promise.all(cur.map(f => deleteFile(f.id))).then(() => {
                replaceLastHistory('output', `Removed ${cur.length} file(s). Project cleared.`);
            }).catch(err => {
                replaceLastHistory('error', `rm: ${err.message}`);
            });
        }

        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [history]); // eslint-disable-line

    const handleCommand = (e) => {
        e.preventDefault();
        const cmd = input.trim();
        if (!cmd) return;

        if (isDevServer && (cmd === 'c' || cmd === 'stop')) {
            setIsDevServer(false);
            setPreviewOpen(false);
            useTerminalStore.setState(prev => ({
                history: [...prev.history,
                    { type: 'input', content: cmd, cwd: prev.currentDirectory },
                    { type: 'output', content: 'Server stopped.' }
                ]
            }));
            setInput('');
            return;
        }

        executeCommand(projectId, cmd);
        setInput('');
    };

    // ── Active file info for Run button label ───────────────────────────
    const activeFile = (() => {
        const { activeFileId } = useEditorStore.getState();
        return files.find(f => f.id === activeFileId) || null;
    })();
    const canRun = activeFile && isRunnableOnOnlineCompiler(activeFile?.name || '');

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0A0A0A' }}>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b shrink-0"
                style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <TermIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider flex-1" style={{ color: 'var(--text-muted)' }}>
                    Terminal
                </span>

                {/* Run button */}
                {activeFile && (
                    <button
                        onClick={handleRunClick}
                        disabled={isRunning || !canRun}
                        title={canRun ? `Run ${activeFile.name}` : `${activeFile?.name} — use Preview for web files`}
                        className="flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[10px] font-semibold transition-all disabled:opacity-40"
                        style={{
                            background: canRun ? 'var(--accent-dim)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${canRun ? 'var(--accent-border)' : 'var(--border)'}`,
                            color: canRun ? 'var(--accent-text)' : 'var(--text-muted)',
                            cursor: canRun ? 'pointer' : 'not-allowed',
                        }}>
                        {isRunning
                            ? <Square className="w-2.5 h-2.5 animate-pulse" />
                            : <Play className="w-2.5 h-2.5" />
                        }
                        <span className="flex items-center gap-1">
                            {getFileIcon(activeFile.name, 11)}
                            {isRunning ? 'Running…' : activeFile.name}
                        </span>
                    </button>
                )}

                {/* Clear */}
                <button
                    onClick={() => useTerminalStore.setState({ history: [] })}
                    className="p-1 rounded transition-colors hover:text-white"
                    style={{ color: 'var(--text-muted)' }}
                    title="Clear terminal">
                    <X className="w-3 h-3" />
                </button>
            </div>

            {/* ── Output ── */}
            <div ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 custom-scrollbar mono-text text-[12px]"
                style={{ color: '#9DA5B4' }}
                onClick={() => inputRef.current?.focus()}>

                {history.length === 0 && (
                    <div className="py-4 space-y-1" style={{ color: 'var(--text-muted)' }}>
                        <p className="text-[11px]">▶ Click the <span style={{ color: 'var(--accent-text)' }}>Run</span> button to execute the active file.</p>
                        <p className="text-[11px]">▶ Or type: <span style={{ color: 'var(--accent-text)' }}>run main.py</span> · <span style={{ color: 'var(--accent-text)' }}>run main.cpp &lt;&lt;&lt; "5 + 3"</span></p>
                    </div>
                )}

                {history.map((line, i) => (
                    <div key={i} className="mb-1.5">
                        {line.type === 'input' ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold" style={{ color: '#10B981' }}>
                                    {line.cwd?.replace('/home/user', '~') || '~'}
                                </span>
                                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                <span style={{ color: '#E2E8F0' }}>{line.content}</span>
                            </div>
                        ) : (
                            <pre className={cn(
                                'whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed pl-2 border-l',
                                line.type === 'error'
                                    ? 'border-red-500/40 text-red-400'
                                    : 'border-transparent text-[#9DA5B4]'
                            )}>
                                {line.content}
                            </pre>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Command input ── */}
            <form onSubmit={handleCommand}
                className="flex items-center gap-2 px-3 py-2 border-t shrink-0"
                style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                <span className="font-semibold text-[11px] shrink-0" style={{ color: '#10B981' }}>
                    {displayPath}
                </span>
                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none mono-text text-[12px]"
                    style={{ color: '#E2E8F0' }}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="run main.py   ·   run main.cpp <<< &quot;5+3&quot;"
                />
            </form>

            {/* ── Stdin Modal ── */}
            <AnimatePresence>
                {stdinModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-50"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, y: 8 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 8 }}
                            className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>

                            {/* Header */}
                            <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                                    <Play className="w-3.5 h-3.5" style={{ color: 'var(--accent-text)' }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-white">Runtime Input</p>
                                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                                        {stdinModal.file?.name}
                                    </p>
                                </div>
                                <button onClick={() => setStdinModal({ open: false, file: null })}
                                    className="ml-auto p-1 rounded-lg transition-colors hover:text-white"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleStdinSubmit} className="p-4 space-y-3">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5"
                                        style={{ color: 'var(--text-muted)' }}>
                                        stdin / program input
                                    </label>
                                    <textarea
                                        ref={stdinRef}
                                        value={stdinValue}
                                        onChange={e => setStdinValue(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && e.ctrlKey) handleStdinSubmit(e);
                                        }}
                                        rows={4}
                                        placeholder={"Enter input your program reads from stdin…\n\nExamples:\n  5 + 3\n  10\n  hello world"}
                                        className="w-full rounded-xl resize-none mono-text text-[12px] p-3 outline-none transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid var(--border)',
                                            color: '#E2E8F0',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                                        Ctrl+Enter to run · Each line = one input value
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleStdinSkip}
                                        className="flex-1 h-9 rounded-xl text-[12px] font-medium transition-colors"
                                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                        Run without input
                                    </button>
                                    <button type="submit"
                                        className="flex-[2] h-9 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                                        style={{ background: 'var(--accent)', color: '#fff' }}>
                                        <Play className="w-3.5 h-3.5" />
                                        Run with input
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Terminal;
