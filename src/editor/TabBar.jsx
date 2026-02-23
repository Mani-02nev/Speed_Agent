import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { X, Globe, Code2, Palette, Box, File } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

const TabBar = () => {
    const tabs = useEditorStore(state => state.tabs);
    const activeFileId = useEditorStore(state => state.activeFileId);
    const setActiveFile = useEditorStore(state => state.setActiveFile);
    const closeFile = useEditorStore(state => state.closeFile);
    const dirtyFiles = useEditorStore(state => state.dirtyFiles);

    // Note: files from useProjectStore is actually not used in the render, 
    // but if it was, we should use a selector for it too.
    // const files = useProjectStore(state => state.files);

    if (tabs.length === 0) return (
        <div className="h-9 w-full border-b border-[#1F2430] bg-[#0D0F12]" />
    );

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'html': return <Globe className="w-3 h-3 text-[#E34F26]" />;
            case 'css': return <Palette className="w-3 h-3 text-[#1572B6]" />;
            case 'js':
            case 'jsx': return <Code2 className="w-3 h-3 text-[#F7DF1E]" />;
            case 'json': return <Box className="w-3 h-3 text-[#F5CF11]" />;
            default: return <File className="w-3 h-3 text-[#57606A]" />;
        }
    };

    return (
        <div className="flex h-9 w-full border-b border-[#1F2430] bg-[#0D0F12] overflow-x-auto custom-scrollbar shrink-0 no-scrollbar">
            {tabs.map((file) => {
                const isDirty = dirtyFiles.includes(file.id);
                return (
                    <div
                        key={file.id}
                        onClick={() => setActiveFile(file.id)}
                        className={cn(
                            "flex items-center gap-2.5 px-4 h-full border-r border-[#1F2430] cursor-pointer speed-transition min-w-[140px] max-w-[220px] group relative",
                            activeFileId === file.id
                                ? "bg-[#0F1115] text-white"
                                : "bg-[#0D0F12] text-[#57606A] hover:bg-[#111317] hover:text-[#9DA5B4]"
                        )}
                    >
                        <div className="shrink-0">
                            {getFileIcon(file.name)}
                        </div>

                        <span className="text-[11px] font-bold tracking-tight truncate flex-1 leading-none pt-0.5">
                            {file.name}
                        </span>

                        <div className="flex items-center justify-center w-4 h-4 relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeFile(file.id);
                                }}
                                className={cn(
                                    "rounded p-0.5 hover:bg-white/10 transition-all z-10",
                                    (isDirty && activeFileId !== file.id) ? "opacity-0 group-hover:opacity-100" : (activeFileId === file.id ? "opacity-100" : "opacity-0 group-hover:opacity-100")
                                )}
                            >
                                <X className="w-3 h-3" />
                            </button>
                            {isDirty && (
                                <div className={cn(
                                    "absolute w-2 h-2 rounded-full bg-[#FFB020] shadow-[0_0_8px_rgba(255,176,32,0.5)] transition-opacity",
                                    activeFileId === file.id ? "opacity-0 group-hover:opacity-0" : "opacity-100 group-hover:opacity-0"
                                )} />
                            )}
                        </div>

                        {activeFileId === file.id && (
                            <motion.div
                                layoutId="tab-active-accent"
                                className="absolute top-0 left-0 right-0 h-[2px] bg-[#00E0B8] shadow-[0_2px_10px_rgba(0,224,184,0.4)]"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TabBar;
