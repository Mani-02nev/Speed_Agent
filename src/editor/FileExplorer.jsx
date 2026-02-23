import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { File, Folder, Plus, Search, MoreVertical, Globe, Code2, Palette, Box, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

const FileExplorer = ({ projectId }) => {
    const files = useProjectStore(state => state.files);
    const createFile = useProjectStore(state => state.createFile);
    const deleteFile = useProjectStore(state => state.deleteFile);

    const activeFileId = useEditorStore(state => state.activeFileId);
    const openFile = useEditorStore(state => state.openFile);
    const closeFile = useEditorStore(state => state.closeFile);
    const [searchQuery, setSearchQuery] = useState('');

    const handleDeleteFile = async (e, fileId) => {
        e.stopPropagation();
        if (confirm('Delete this module permanently?')) {
            try {
                await deleteFile(fileId);
                closeFile(fileId);
            } catch (err) {
                console.error('Delete failed:', err);
            }
        }
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'html': return <Globe className="w-3.5 h-3.5 text-[#E34F26]" />;
            case 'css': return <Palette className="w-3.5 h-3.5 text-[#1572B6]" />;
            case 'js':
            case 'jsx': return <Code2 className="w-3.5 h-3.5 text-[#F7DF1E]" />;
            case 'json': return <Box className="w-3.5 h-3.5 text-[#F5CF11]" />;
            default: return <File className="w-3.5 h-3.5 text-[#9DA5B4]" />;
        }
    };

    const handleCreateFile = async () => {
        const name = prompt('File name:');
        if (name) {
            const ext = name.split('.').pop();
            const languageMap = { js: 'javascript', jsx: 'javascript', css: 'css', html: 'html' };
            await createFile(projectId, name, '', languageMap[ext] || 'javascript');
        }
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-[#111317]">
            {/* Header / Actions */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#57606A]">Project Source</span>
                    <div className="flex items-center gap-1">
                        <button onClick={handleCreateFile} className="p-1 rounded hover:bg-[#1F2430] text-[#57606A] hover:text-white transition-all">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 rounded hover:bg-[#1F2430] text-[#57606A] hover:text-white transition-all">
                            <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#3B4252] group-focus-within:text-[#00E0B8] transition-colors" />
                    <input
                        type="search"
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 bg-[#0D0F12] border border-[#1F2430] rounded-lg pl-8 pr-3 text-[11px] font-medium text-[#E6EDF3] placeholder-[#3B4252] focus:outline-none focus:border-[#00E0B8]/40 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                <div className="space-y-0.5">
                    {filteredFiles.map((file) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => openFile(file)}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer group speed-transition relative",
                                activeFileId === file.id
                                    ? "bg-[#00E0B8]/5 text-white"
                                    : "text-[#9DA5B4] hover:bg-white/[0.03] hover:text-[#E6EDF3]"
                            )}
                        >
                            {activeFileId === file.id && (
                                <motion.div
                                    layoutId="file-active-indicator"
                                    className="absolute left-0 w-0.5 h-4 bg-[#00E0B8] rounded-r-full shadow-[0_0_10px_rgba(0,224,184,0.3)]"
                                />
                            )}
                            <div className="shrink-0">
                                {getFileIcon(file.name)}
                            </div>
                            <span className="text-[12px] font-semibold truncate flex-1 tracking-tight">
                                {file.name}
                            </span>

                            <button
                                onClick={(e) => handleDeleteFile(e, file.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-[#57606A] hover:text-red-400 transition-all z-10"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </motion.div>
                    ))}

                    {filteredFiles.length === 0 && (
                        <div className="py-12 text-center space-y-2">
                            <Box className="w-8 h-8 text-[#1F2430] mx-auto opacity-20" strokeWidth={1} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#3B4252]">No modules found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Explorer Footer */}
            <div className="p-4 border-t border-[#1F2430] bg-[#0D0F12]/30">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[#3B4252]">
                    <span className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-[#00E0B8]" />
                        {files.length} Nodes
                    </span>
                    <span className="opacity-40">Ready</span>
                </div>
            </div>
        </div>
    );
};

export default FileExplorer;
