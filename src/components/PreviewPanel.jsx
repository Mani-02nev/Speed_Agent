import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, RefreshCcw, Maximize2, Minimize2 } from 'lucide-react';
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";

const PreviewPanel = ({
    isPreviewOpen,
    setPreviewOpen,
    previewKey,
    setPreviewKey,
    files,
    previewRootPath
}) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const sandpackConfig = useMemo(() => {
        const sandpackFiles = {};
        const previewRoot = previewRootPath;

        files.forEach(f => {
            if (!f.name || f.content === undefined || f.content === null) return;
            let path = f.name;

            if (previewRoot) {
                if (path.startsWith(previewRoot + '/')) {
                    path = path.substring(previewRoot.length);
                } else if (path !== previewRoot && !path.startsWith(previewRoot + '/')) {
                    return;
                }
            }

            if (!path.startsWith('/')) path = '/' + path;
            sandpackFiles[path] = f.content;
        });

        let envTemplate = "static";
        let hasReact = false;
        let hasTs = false;
        let hasWebFiles = false;

        Object.keys(sandpackFiles).forEach(pf => {
            const content = sandpackFiles[pf] || "";
            if (pf.endsWith('.tsx') || pf.endsWith('.ts')) hasTs = true;
            if (pf.endsWith('.jsx') || pf.endsWith('.tsx')) hasReact = true;
            if (pf.endsWith('.html') || pf.endsWith('.css') || pf.endsWith('.js')) hasWebFiles = true;

            if (content.includes('from "react"') || content.includes("from 'react'") || content.includes('import React')) hasReact = true;
        });

        // Sanitize package.json to prevent Sandpack crashes
        if (sandpackFiles['/package.json']) {
            try {
                const pkg = JSON.parse(sandpackFiles['/package.json']);
                if (JSON.stringify(pkg).includes('"react"')) hasReact = true;
            } catch (e) {
                console.warn("Malformed package.json detected, resetting to default.");
                delete sandpackFiles['/package.json'];
            }
        }

        if (hasReact && hasTs) envTemplate = "vite-react-ts";
        else if (hasReact) envTemplate = "vite-react";
        else if (hasTs) envTemplate = "vanilla-ts";
        else envTemplate = "static";

        if (!sandpackFiles['/package.json']) {
            if (hasReact) {
                sandpackFiles['/package.json'] = JSON.stringify({
                    dependencies: { "react": "^18.2.0", "react-dom": "^18.2.0", "react-router-dom": "^6.20.0", "lucide-react": "^0.292.0" }
                }, null, 2);
            } else {
                sandpackFiles['/package.json'] = JSON.stringify({ dependencies: {} }, null, 2);
            }
        }

        let entryPoint = "/index.js";
        if (hasReact) {
            const entryPoints = ['/src/main.jsx', '/src/main.js', '/src/index.jsx', '/src/index.js', '/main.jsx', '/main.js', '/index.jsx', '/App.js'];
            entryPoint = entryPoints.find(ep => sandpackFiles[ep]) || '/src/main.jsx';
        } else {
            const entryPoints = ['/main.js', '/script.js', '/index.js', '/src/main.js'];
            entryPoint = entryPoints.find(ep => sandpackFiles[ep]) || '/index.js';
        }

        if (!sandpackFiles['/index.html']) {
            const hasEntry = sandpackFiles[entryPoint] !== undefined;
            sandpackFiles['/index.html'] = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Speed Agent Preview</title>
    <style>
        body { 
            margin: 0; 
            background: #0E1117; 
            color: white; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    ${hasEntry ? `<script type="module" src="${entryPoint}"></script>` : ''}
</body>
</html>`;
        }

        return { sandpackFiles, envTemplate, entryPoint, hasReact };
    }, [files, previewRootPath]);

    const defaultUrl = useMemo(() => {
        return sandpackConfig.envTemplate.includes('vite') ? 'http://localhost:5173' : 'http://speed.local/index.html';
    }, [sandpackConfig.envTemplate]);

    const [addressBar, setAddressBar] = React.useState(defaultUrl);

    // Update address bar when template changes
    React.useEffect(() => {
        setAddressBar(defaultUrl);
    }, [defaultUrl]);

    const handleAddressSubmit = (e) => {
        if (e.key === 'Enter') {
            const val = addressBar.trim();
            if (val.includes('localhost') || val.includes('speed.local')) {
                setPreviewKey(k => k + 1);
            } else {
                alert("Only internal virtual domains (localhost, speed.local) are accessible in Speed Agent OS sandbox.");
                setAddressBar(defaultUrl);
            }
        }
    };

    return (
        <AnimatePresence>
            {isPreviewOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                        width: isFullscreen ? "100%" : "50%",
                        opacity: 1,
                        position: isFullscreen ? "fixed" : "relative",
                        inset: isFullscreen ? 0 : "auto",
                        zIndex: isFullscreen ? 100 : 40
                    }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full bg-[#0E1117] flex flex-col relative overflow-hidden shrink-0 border-l border-[#1F2430]"
                >
                    {/* Mini Chrome Header */}
                    <div className="h-12 border-b border-[#1F2430] flex items-center px-4 gap-4 bg-[#0B0D11] shrink-0 z-10">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm" />
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm" />
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm" />
                        </div>

                        <div className="flex items-center gap-2 text-[#57606A]">
                            <button className="hover:text-white transition-colors p-1"><ChevronLeft className="w-4 h-4" /></button>
                            <button className="hover:text-white transition-colors p-1"><ChevronRight className="w-4 h-4" /></button>
                            <button onClick={() => setPreviewKey(k => k + 1)} className="hover:text-white transition-colors p-1 ml-1"><RefreshCcw className="w-3.5 h-3.5" /></button>
                        </div>

                        <div className="flex-1 max-w-2xl bg-[#0E1117] border border-[#1F2430]/50 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-inner group focus-within:border-[#00E0B8]/30 transition-all">
                            <span className="text-[#00E0B8] opacity-50 group-hover:opacity-100 transition-opacity"><RefreshCcw className="w-3 h-3" /></span>
                            <input
                                type="text"
                                value={addressBar}
                                onChange={(e) => setAddressBar(e.target.value)}
                                onKeyDown={handleAddressSubmit}
                                className="w-full bg-transparent border-none outline-none text-[11px] text-[#9DA5B4] font-mono truncate placeholder-[#3B4252] focus:text-white"
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="text-[#57606A] hover:text-white transition-colors p-2 bg-white/5 rounded-md hover:bg-white/10"
                                title={isFullscreen ? "Minimize" : "Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => { setIsFullscreen(false); setPreviewOpen(false); }}
                                className="text-[#57606A] hover:text-white transition-colors p-2 bg-white/5 rounded-md hover:bg-white/10"
                                title="Close Preview"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative group">
                        <SandpackProvider
                            key={`${previewKey}-${sandpackConfig.envTemplate}`}
                            template={sandpackConfig.envTemplate}
                            files={sandpackConfig.sandpackFiles}
                            theme="dark"
                        >
                            <SandpackLayout style={{ height: "100%", width: "100%", border: "none", borderRadius: 0, overflow: "hidden" }}>
                                <SandpackPreview
                                    style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
                                    showNavigator={false}
                                    showRefreshButton={false}
                                    showOpenInCodeSandbox={false}
                                    startRoute={(() => {
                                        if (addressBar.includes('speed.local')) {
                                            try {
                                                const url = new URL(addressBar.startsWith('http') ? addressBar : `http://${addressBar}`);
                                                return url.pathname;
                                            } catch (e) {
                                                return "/index.html";
                                            }
                                        }
                                        return undefined; // Default for localhost/vite
                                    })()}
                                />
                            </SandpackLayout>
                        </SandpackProvider>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PreviewPanel;
