import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { useAIStore } from '../store/aiStore';
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Globe,
    X,
    Maximize2,
    Minimize2,
    Lock,
    AlertCircle,
    Terminal,
    Search,
    ShieldAlert,
    Loader2,
    Wand2,
    CheckCircle2,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";

const WebBrowserPanel = ({ projectId }) => {
    const files = useProjectStore(state => state.files);
    const previewRootPath = useProjectStore(state => state.previewRootPath);
    const setPreviewOpen = useEditorStore(state => state.setPreviewOpen);
    const browserUrl = useEditorStore(state => state.browserUrl);

    const [url, setUrl] = useState('agent://welcome');
    const [displayUrl, setDisplayUrl] = useState('agent://welcome');
    const [history, setHistory] = useState(['agent://welcome']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState(null);

    const iframeRef = useRef(null);
    const [isFixingError, setIsFixingError] = useState(false);
    const [fixSteps, setFixSteps] = useState([]);
    const addMessage = useAIStore(state => state.addMessage);
    const setIsTyping = useAIStore(state => state.setIsTyping);

    const handleFixErrors = async (errorContext) => {
        if (isFixingError) return;
        setIsFixingError(true);
        setFixSteps(['Analyzing error...']);

        try {
            const errorSummary = errorContext || (error ? `${error.code}: ${error.message}` : 'preview error');
            const fileList = files.map(f => `${f.name}:\n${f.content?.substring(0, 300)}`).join('\n\n---\n\n');

            const prompt = `The web preview is showing an error. Please diagnose and fix it step by step.\n\nError: ${errorSummary}\n\nProject files:\n${fileList}\n\nFix all errors, ensure exports are correct, and make the app render properly.`;

            setFixSteps(['Sending to AI...']);
            await addMessage(projectId, 'user', prompt);
            setFixSteps(['AI is working on a fix...']);
            // The AIChat component will pick this up and process it
        } catch (err) {
            console.error('[FIX ERRORS] Failed:', err);
        } finally {
            setTimeout(() => {
                setIsFixingError(false);
                setFixSteps([]);
            }, 3000);
        }
    };

    // v6 Sync with global store for programmatic navigation
    useEffect(() => {
        if (browserUrl && browserUrl !== url) {
            navigateTo(browserUrl);
        }
    }, [browserUrl]);

    // Virtual Routing Logic
    const resolveUrl = (browserUrl) => {
        let target = browserUrl.trim().toLowerCase();

        // Protocol normalization
        const cleanTarget = target.replace(/^https?:\/\//, '');

        // Aliases
        if (cleanTarget === 'react') return { type: 'react', url: 'http://localhost:5173' };
        if (target === 'agent://welcome') return { type: 'welcome' };

        // Terminal Only Check (Block scripts)
        const terminalExtensions = ['.py', '.js', '.cpp', '.c', '.rs', '.go', '.rb'];
        if (terminalExtensions.some(ext => cleanTarget.endsWith(ext))) {
            return { type: 'error', code: 'TERMINAL_ONLY', message: "Script files execute in Terminal only. Preview is for visual output." };
        }

        // React / Dev Server (Localhost)
        if (cleanTarget.startsWith('localhost:5173')) {
            const hasPackageJson = files.some(f => f.name.toLowerCase() === 'package.json');
            if (!hasPackageJson) {
                return { type: 'error', code: 'DEV_SERVER_OFF', message: "Live dev server is not active. Run 'run project' or initialize a web template." };
            }
            return { type: 'react', url: 'http://localhost:5173' };
        }

        // Internal Files (speed.local or direct filename)
        let filePath = cleanTarget.replace('speed.local/', '');
        if (filePath === '') filePath = 'index.html';

        const file = files.find(f => f.name.toLowerCase() === filePath);

        if (file) {
            if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
                let injectedContent = file.content;

                // Inject internal CSS
                injectedContent = injectedContent.replace(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
                    if (match.toLowerCase().includes('stylesheet') || href.endsWith('.css')) {
                        const cssFile = files.find(f => f.name.endsWith(href.split('/').pop())); // Simple match by filename
                        if (cssFile) {
                            return `<style>\n${cssFile.content}\n</style>`;
                        }
                    }
                    return match;
                });

                // Inject internal JS
                injectedContent = injectedContent.replace(/<script([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi, (match, prefix, src, suffix) => {
                    const jsFile = files.find(f => f.name.endsWith(src.split('/').pop()));
                    if (jsFile) {
                        return `<script${prefix}${suffix}>\n${jsFile.content}\n</script>`;
                    }
                    return match;
                });

                return { type: 'internal', content: injectedContent, fileName: file.name };
            } else {
                return { type: 'error', code: 'TERMINAL_ONLY', message: "Non-HTML files must be viewed via the editor or executed in terminal." };
            }
        }

        // External Block
        if (target.includes('.') || target.includes('://')) {
            return { type: 'error', code: 'BLOCKED', message: "Security Policy: Access to external engineering domains across the firewall is restricted." };
        }

        return { type: 'error', code: '404', message: `The node '${filePath}' could not be resolved in the current project hierarchy.` };
    };

    const navigateTo = (newUrl) => {
        setIsLoading(true);
        const resolved = resolveUrl(newUrl);

        setTimeout(() => {
            setUrl(newUrl);
            setDisplayUrl(newUrl);
            if (resolved.type === 'error') {
                setError(resolved);
            } else {
                setError(null);
            }
            setIsLoading(false);

            // Update History
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newUrl);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }, 300);
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            const prevUrl = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            setUrl(prevUrl);
            setDisplayUrl(prevUrl);
            const resolved = resolveUrl(prevUrl);
            setError(resolved.type === 'error' ? resolved : null);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const nextUrl = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            setUrl(nextUrl);
            setDisplayUrl(nextUrl);
            const resolved = resolveUrl(nextUrl);
            setError(resolved.type === 'error' ? resolved : null);
        }
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        navigateTo(displayUrl);
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            document.querySelector('.webBrowserContainer')?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        setIsFullscreen(!isFullscreen);
    };

    const resolved = resolveUrl(url);

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="webBrowserContainer h-full bg-[#0D0F12] flex flex-col relative overflow-hidden shrink-0 border-l border-[#1F2430] shadow-2xl"
        >
            {/* Browser Chrome */}
            <div className="h-12 border-b border-[#1F2430] flex items-center px-4 gap-4 bg-[#111317] shrink-0 z-30">
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} disabled={historyIndex === 0} className="p-1.5 rounded-md hover:bg-white/5 text-[#57606A] disabled:opacity-20 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={handleForward} disabled={historyIndex === history.length - 1} className="p-1.5 rounded-md hover:bg-white/5 text-[#57606A] disabled:opacity-20 transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={handleRefresh} className={cn("p-1.5 rounded-md hover:bg-white/5 text-[#57606A] transition-all", isLoading && "animate-spin text-[#00E0B8]")}>
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center bg-[#0B0D11] border border-[#1F2430] rounded-lg px-3 py-1.5 group focus-within:border-[#00E0B8]/40 transition-all shadow-inner">
                    <div className="flex items-center gap-2 mr-2 opacity-40 group-focus-within:opacity-100 transition-opacity">
                        {url.includes('localhost') ? <Lock className="w-3 h-3 text-[#00E0B8]" /> : <Globe className="w-3 h-3 text-[#57606A]" />}
                    </div>
                    <input
                        type="text"
                        value={displayUrl}
                        onChange={(e) => setDisplayUrl(e.target.value)}
                        className="bg-transparent border-none outline-none text-[12px] text-[#E6EDF3] w-full font-medium"
                        placeholder="Enter URL or internal file..."
                    />
                    {isLoading && <Loader2 className="w-3 h-3 text-[#00E0B8] animate-spin ml-2" />}
                </form>

                <div className="flex items-center gap-2">
                    <button onClick={toggleFullscreen} className="p-2 rounded-md hover:bg-white/5 text-[#57606A] hover:text-white transition-all">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setPreviewOpen(false)} className="p-2 rounded-md hover:bg-red-500/10 text-[#57606A] hover:text-red-400 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Viewport content */}
            <div className="flex-1 w-full bg-[#0D0F12] relative flex flex-col overflow-hidden min-h-0">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0D0F12] z-50 flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="w-16 h-16 border-2 border-[#00E0B8]/20 border-t-[#00E0B8] rounded-full animate-spin mb-6" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E0B8] animate-pulse">Establishing Secure Tunnel...</span>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-0 bg-[#0B0D11] z-40 flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                                {error.code === 'BLOCKED' ? <ShieldAlert className="w-10 h-10 text-red-500" /> : <AlertCircle className="w-10 h-10 text-red-500" />}
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">
                                {error.code === '404' ? '404 Node Not Found' : error.code === 'BLOCKED' ? 'Secure Firewall Block' : 'System Restriction'}
                            </h2>
                            <p className="text-[#9DA5B4] text-[13px] leading-relaxed max-w-sm font-medium italic mb-8">
                                {error.message}
                            </p>
                            {error.code === 'DEV_SERVER_OFF' && (
                                <div className="bg-[#151821] border border-[#1F2430] p-4 rounded-xl flex items-center gap-3 mb-8">
                                    <Terminal className="w-4 h-4 text-[#00E0B8]" />
                                    <code className="text-[12px] font-mono text-[#00E0B8]">run project</code>
                                </div>
                            )}
                            <AnimatePresence>
                                {isFixingError && fixSteps.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="mb-6 flex flex-col gap-2 items-center"
                                    >
                                        {fixSteps.map((step, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-[#00E0B8] uppercase tracking-widest">
                                                <Zap className="w-3 h-3 animate-pulse" />
                                                {step}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                {error.code !== '404' && error.code !== 'BLOCKED' && error.code !== 'DEV_SERVER_OFF' && (
                                    <button
                                        onClick={() => handleFixErrors()}
                                        disabled={isFixingError}
                                        className="w-full flex items-center justify-center gap-2.5 py-3 px-6 bg-[#00E0B8] text-black font-black text-[11px] uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,224,184,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isFixingError ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                        {isFixingError ? 'Fixing...' : 'Fix Errors with AI'}
                                    </button>
                                )}
                                <button
                                    onClick={() => setDisplayUrl('localhost:5173') || navigateTo('localhost:5173')}
                                    className="w-full py-2.5 px-6 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                                >
                                    Back to Localhost
                                </button>
                            </div>
                        </motion.div>
                    ) : resolved.type === 'react' ? (
                        <div key="react" className="flex-1 w-full h-full bg-[#0D0F12] p-4 flex flex-col overflow-hidden [&_.sp-wrapper]:flex-1 [&_.sp-wrapper]:flex [&_.sp-wrapper]:flex-col [&_.sp-wrapper]:min-h-0 [&_.sp-layout]:flex-1 [&_.sp-layout]:!rounded-xl [&_.sp-layout]:!border [&_.sp-layout]:!border-[#1F2430] [&_.sp-layout]:overflow-hidden [&_.sp-layout]:shadow-2xl [&_.sp-preview-container]:flex-1 [&_.sp-preview-container]:flex [&_.sp-preview-container]:flex-col [&_iframe]:flex-1 [&_iframe]:!h-full [&_iframe]:w-full [&_iframe]:block [&_iframe]:border-none">
                            {(() => {
                                const sandpackFiles = {};
                                const previewRoot = previewRootPath;

                                files.forEach(f => {
                                    if (!f.name || !f.content) return;
                                    let path = f.name;
                                    if (previewRoot) {
                                        if (path.startsWith(previewRoot + '/')) path = path.substring(previewRoot.length);
                                        else if (path !== previewRoot && !path.startsWith(previewRoot + '/')) return;
                                    }
                                    if (!path.startsWith('/')) path = '/' + path;

                                    // Auto-Heal Vite File Paths
                                    if (path === '/src/index.jsx' || path === '/index.jsx') {
                                        path = path.replace('index.jsx', 'main.jsx');
                                    }

                                    // Auto-Heal AI Typos for React Entrypoints
                                    let content = f.content;
                                    if (path.endsWith('.jsx') || path.endsWith('.tsx') || path.endsWith('.js')) {
                                        content = content.replace(/<React\.Strict>/g, '<React.StrictMode>');
                                        content = content.replace(/<\/React\.Strict>/g, '</React.StrictMode>');
                                    }

                                    // Auto-Heal missing App export
                                    if (path === '/src/App.jsx' || path === '/App.jsx') {
                                        if (content.includes('function App') && !content.includes('export default')) {
                                            content += '\n\nexport default App;\n';
                                        }
                                    }

                                    // Block Sandpack crashes from malformed package.json
                                    if (path.endsWith('package.json')) {
                                        try {
                                            if (content.trim()) JSON.parse(content);
                                        } catch (err) {
                                            console.error("[SANDPACK] package.json syntax error auto-healed:", err);
                                            content = JSON.stringify({
                                                name: "speed-app-recovered",
                                                dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" }
                                            });
                                        }
                                    }

                                    sandpackFiles[path] = content;
                                });

                                // Template Detection
                                let envTemplate = "vanilla";
                                let hasReact = false;
                                let hasTs = false;
                                Object.keys(sandpackFiles).forEach(pf => {
                                    if (pf.endsWith('.tsx') || pf.endsWith('.ts')) hasTs = true;
                                    if (pf.endsWith('.jsx') || pf.endsWith('.tsx')) hasReact = true;
                                });
                                if (hasReact && hasTs) envTemplate = "vite-react-ts";
                                else if (hasReact) envTemplate = "vite-react";
                                else if (hasTs) envTemplate = "vanilla-ts";
                                else envTemplate = "static";

                                // Entrypoint
                                let entryPoint = "/index.js";
                                if (hasReact) {
                                    const reactEntries = ['/src/main.jsx', '/src/main.js', '/src/index.jsx', '/src/index.js', '/main.jsx', '/index.jsx'];
                                    entryPoint = reactEntries.find(e => sandpackFiles[e]) || '/src/main.jsx';
                                }

                                if (!sandpackFiles['/index.html']) {
                                    sandpackFiles['/index.html'] = `<!DOCTYPE html><html><body><div id="root"></div><script type="module" src="${entryPoint}"></script></body></html>`;
                                } else {
                                    // Auto-Heal index.html script tag
                                    sandpackFiles['/index.html'] = sandpackFiles['/index.html'].replace(/<script.+src=["'].*?["'].*?>/i, `<script type="module" src="${entryPoint}"></script>`);
                                    // Auto-Heal missing root div
                                    if (!sandpackFiles['/index.html'].includes('id="root"')) {
                                        sandpackFiles['/index.html'] = sandpackFiles['/index.html'].replace(/<body>/i, '<body>\n    <div id="root"></div>');
                                    }
                                }

                                return (
                                    <div className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
                                        <SandpackProvider
                                            template={envTemplate}
                                            files={sandpackFiles}
                                            theme="dark"
                                            customSetup={{ dependencies: hasReact ? { "react-router-dom": "^6.20.0", "lucide-react": "^0.292.0", "framer-motion": "^10.16.4" } : {} }}
                                            options={{
                                                classes: {
                                                    "sp-wrapper": "custom-sp-wrapper",
                                                    "sp-layout": "custom-sp-layout",
                                                    "sp-pane": "custom-sp-pane",
                                                }
                                            }}
                                        >
                                            <SandpackLayout style={{ height: "100%", width: "100%" }}>
                                                <SandpackPreview
                                                    style={{ height: "100%", width: "100%", minHeight: "100%" }}
                                                    showNavigator={false}
                                                    showOpenInCodeSandbox={false}
                                                    showRefreshButton={false}
                                                />
                                            </SandpackLayout>
                                        </SandpackProvider>
                                        {/* Floating AI Fix Button for Sandpack errors */}
                                        <button
                                            onClick={() => handleFixErrors('Sandpack preview error - possible missing exports, incorrect imports, or JSX syntax errors')}
                                            disabled={isFixingError}
                                            title="Fix code errors with AI"
                                            className="absolute bottom-4 right-4 z-30 flex items-center gap-2 px-3 py-2 bg-[#00E0B8] text-black text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(0,224,184,0.4)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                                        >
                                            {isFixingError ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                            {isFixingError ? 'Fixing...' : 'Fix with AI'}
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : resolved.type === 'internal' ? (
                        <div key="internal" className="flex-1 w-full flex flex-col overflow-hidden bg-[#0D0F12] p-4">
                            <div className="flex-1 w-full h-full rounded-xl border border-[#1F2430] overflow-hidden shadow-2xl flex flex-col">
                                <iframe
                                    srcDoc={resolved.content}
                                    className="flex-1 w-full h-full border-none bg-white m-0 p-0 block"
                                    title="internal-preview"
                                />
                            </div>
                        </div>
                    ) : resolved.type === 'welcome' ? (
                        <div key="welcome" className="flex-1 bg-[#0B0D11] flex flex-col items-center justify-center p-12 text-center w-full min-h-0 overflow-hidden">
                            <div className="w-24 h-24 bg-[#151821] border border-[#1F2430] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[#00E0B8]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src="/logo.png" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(0,224,184,0.3)]" alt="Agent K" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Agent K Browser</h2>
                            <p className="text-[#57606A] text-[14px] leading-relaxed max-w-sm font-medium mb-10">
                                This is the integrated high-speed web node. Run your server in the terminal or initialize a module to establish a tunnel.
                            </p>

                            <div className="flex gap-4">
                                <button className="px-6 py-2.5 bg-[#00E0B8]/10 border border-[#00E0B8]/20 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#00E0B8] opacity-80 cursor-default">
                                    Tunnel Awaiting Target...
                                </button>
                                <button onClick={() => setDisplayUrl('localhost:5173') || navigateTo('localhost:5173')} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                                    Load Localhost
                                </button>
                            </div>
                        </div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Browser Footer */}
            <div className="h-8 border-t border-[#1F2430] bg-[#111317] flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#57606A]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E0B8] animate-pulse" />
                    Secure Local Tunnel
                </div>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-[#57606A]">
                    <span className="opacity-40">Agent K Browser v1.0</span>
                </div>
            </div>
        </motion.div>
    );
};

export default WebBrowserPanel;
