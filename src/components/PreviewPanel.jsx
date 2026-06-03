import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, RefreshCcw, Maximize2, Minimize2 } from 'lucide-react';
import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react';
import { buildSandpackProject } from '../utils/sandpackProject';
import { getSandpackProviderOptions, getSandpackCustomSetup } from '../services/sandpackPreview';

const PreviewPanel = ({
    isPreviewOpen,
    setPreviewOpen,
    previewKey,
    setPreviewKey,
    files,
    previewRootPath,
}) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const sandpackConfig = useMemo(
        () => buildSandpackProject(files, previewRootPath),
        [files, previewRootPath]
    );

    const sandpackOptions = useMemo(() => getSandpackProviderOptions(), []);

    const defaultUrl = useMemo(() => {
        return sandpackConfig.envTemplate.includes('vite')
            ? 'http://localhost:5173'
            : 'http://speed.local/index.html';
    }, [sandpackConfig.envTemplate]);

    const [addressBar, setAddressBar] = React.useState(defaultUrl);

    React.useEffect(() => {
        setAddressBar(defaultUrl);
    }, [defaultUrl]);

    const handleAddressSubmit = (e) => {
        if (e.key === 'Enter') {
            const val = addressBar.trim();
            if (val.includes('localhost') || val.includes('speed.local')) {
                setPreviewKey((k) => k + 1);
            } else {
                alert(
                    'Only internal virtual domains (localhost, speed.local) are accessible in Mr K Agent preview.'
                );
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
                        width: isFullscreen ? '100%' : '50%',
                        opacity: 1,
                        position: isFullscreen ? 'fixed' : 'relative',
                        inset: isFullscreen ? 0 : 'auto',
                        zIndex: isFullscreen ? 100 : 40,
                    }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full bg-[#0E1117] flex flex-col relative overflow-hidden shrink-0 border-l border-[#1F2430]"
                >
                    <div className="h-12 border-b border-[#1F2430] flex items-center px-4 gap-4 bg-[#0B0D11] shrink-0 z-10">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm" />
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm" />
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm" />
                        </div>

                        <div className="flex items-center gap-2 text-[#57606A]">
                            <button type="button" className="hover:text-white transition-colors p-1">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button type="button" className="hover:text-white transition-colors p-1">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewKey((k) => k + 1)}
                                className="hover:text-white transition-colors p-1 ml-1"
                            >
                                <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex-1 max-w-2xl bg-[#0E1117] border border-[#1F2430]/50 rounded-lg px-4 py-1.5 flex items-center gap-3 shadow-inner group focus-within:border-[#00E0B8]/30 transition-all">
                            <span className="text-[#00E0B8] opacity-50 group-hover:opacity-100 transition-opacity">
                                <RefreshCcw className="w-3 h-3" />
                            </span>
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
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#57606A] hidden sm:inline">
                                {sandpackConfig.envTemplate}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="text-[#57606A] hover:text-white transition-colors p-2 bg-white/5 rounded-md hover:bg-white/10"
                                title={isFullscreen ? 'Minimize' : 'Fullscreen'}
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFullscreen(false);
                                    setPreviewOpen(false);
                                }}
                                className="text-[#57606A] hover:text-white transition-colors p-2 bg-white/5 rounded-md hover:bg-white/10"
                                title="Close Preview"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative group min-h-0">
                        <SandpackProvider
                            key={`${previewKey}-${sandpackConfig.envTemplate}`}
                            template={sandpackConfig.envTemplate}
                            files={sandpackConfig.sandpackFiles}
                            theme="dark"
                            options={sandpackOptions}
                            customSetup={getSandpackCustomSetup(sandpackConfig.hasReact)}
                        >
                            <SandpackLayout
                                style={{ height: '100%', width: '100%', border: 'none', borderRadius: 0, overflow: 'hidden' }}
                            >
                                <SandpackPreview
                                    style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                                    showNavigator={false}
                                    showRefreshButton={false}
                                    showOpenInCodeSandbox={false}
                                    startRoute={(() => {
                                        if (addressBar.includes('speed.local')) {
                                            try {
                                                const url = new URL(
                                                    addressBar.startsWith('http') ? addressBar : `http://${addressBar}`
                                                );
                                                return url.pathname;
                                            } catch {
                                                return sandpackConfig.startRoute || '/index.html';
                                            }
                                        }
                                        return sandpackConfig.startRoute;
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
