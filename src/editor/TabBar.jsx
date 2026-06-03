import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { X } from 'lucide-react';
import { getFileIcon } from '../utils/fileIcons';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

const TabBar = () => {
    const tabs        = useEditorStore(s => s.tabs);
    const activeFileId= useEditorStore(s => s.activeFileId);
    const setActiveFile= useEditorStore(s => s.setActiveFile);
    const closeFile   = useEditorStore(s => s.closeFile);
    const dirtyFiles  = useEditorStore(s => s.dirtyFiles);

    if (!tabs.length) return (
        <div className="h-9 shrink-0 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} />
    );

    return (
        <div className="flex h-9 shrink-0 overflow-x-auto border-b no-scrollbar custom-scrollbar"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            {tabs.map(file => {
                const active = activeFileId === file.id;
                const dirty  = dirtyFiles.includes(file.id);
                return (
                    <div key={file.id} onClick={() => setActiveFile(file.id)}
                        className="relative flex items-center gap-2 px-3 h-full border-r cursor-pointer group shrink-0 min-w-[120px] max-w-[200px] transition-colors"
                        style={{
                            borderColor: 'var(--border)',
                            background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                            color: active ? '#fff' : 'var(--text-muted)',
                        }}>

                        {active && (
                            <motion.div layoutId="tab-accent"
                                className="absolute top-0 left-0 right-0 h-[2px] rounded-b"
                                style={{ background: 'var(--accent)' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            />
                        )}

                        <span className="shrink-0">{getFileIcon(file.name, 13)}</span>
                        <span className="text-[11px] font-medium truncate flex-1">{file.name}</span>

                        <div className="w-4 h-4 flex items-center justify-center relative shrink-0">
                            <button
                                onClick={e => { e.stopPropagation(); closeFile(file.id); }}
                                className={cn(
                                    'rounded p-0.5 transition-all z-10',
                                    active ? 'opacity-60 hover:opacity-100 hover:bg-white/10'
                                           : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-white/10'
                                )}>
                                <X className="w-2.5 h-2.5" />
                            </button>
                            {dirty && (
                                <div className={cn(
                                    'absolute w-1.5 h-1.5 rounded-full transition-opacity',
                                    active ? 'opacity-0 group-hover:opacity-0' : 'opacity-100 group-hover:opacity-0'
                                )} style={{ background: 'var(--warning)' }} />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TabBar;
