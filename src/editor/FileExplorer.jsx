import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { File, Folder, Plus, Search, MoreVertical, Globe, Code2, Palette, Box, Trash2, Play } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

const getFileIcon = (fileName) => {
    if (!fileName) return <File className="w-3.5 h-3.5 text-[#9DA5B4]" />;
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

const TreeNode = ({ node, level = 0, openFile, activeFileId, handleDeleteFile, handleDeleteFolder, handleRunFolder, previewRootPath }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!node.isFolder) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => openFile(node)}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
                className={cn(
                    "flex items-center gap-2.5 py-1.5 pr-3 cursor-pointer group relative speed-transition hover:bg-white/[0.03]",
                    activeFileId === node.id ? "bg-[#00E0B8]/5 text-white" : "text-[#9DA5B4]"
                )}
            >
                {activeFileId === node.id && (
                    <motion.div
                        layoutId="file-active-indicator"
                        className="absolute left-0 w-[3px] h-full bg-[#00E0B8] rounded-r shadow-[0_0_10px_rgba(0,224,184,0.3)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
                <div className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {getFileIcon(node.name)}
                </div>
                <span className="text-[12px] font-medium truncate flex-1 tracking-tight group-hover:text-[#E6EDF3] transition-colors">
                    {node.name}
                </span>

                <div className="opacity-0 group-hover:opacity-100 flex items-center z-10">
                    <button
                        onClick={(e) => handleRunFolder(e, node.path)}
                        title="Run this file in preview"
                        className="p-1 rounded hover:bg-[#00E0B8]/10 text-[#57606A] hover:text-[#00E0B8] transition-all"
                    >
                        <Play className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => handleDeleteFile(e, node.id)}
                        title="Delete file"
                        className="p-1 rounded hover:bg-red-500/10 text-[#57606A] hover:text-red-400 transition-all"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </motion.div>
        );
    }

    const children = Object.values(node.children).sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
    });

    return (
        <div className="flex flex-col">
            {node.name !== 'root' && (
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                    className={cn(
                        "flex items-center gap-2 py-1.5 pr-3 cursor-pointer text-[#8B949E] hover:text-[#E6EDF3] hover:bg-white/[0.02] group transition-colors relative",
                        previewRootPath === node.path && "bg-[#00E0B8]/5 text-white"
                    )}
                >
                    {previewRootPath === node.path && (
                        <div className="absolute left-0 w-[2px] h-full bg-[#00E0B8] shadow-[0_0_10px_rgba(0,224,184,0.3)]" />
                    )}
                    <Folder className={cn("w-3.5 h-3.5 transition-colors drop-shadow-sm shrink-0", isOpen ? "text-[#00E0B8]" : "text-[#57606A] group-hover:text-[#00E0B8]")} fill={isOpen ? "rgba(0, 224, 184, 0.1)" : "transparent"} />
                    <span className="text-[12px] font-bold tracking-tight flex-1 truncate">{node.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center z-10">
                        <button
                            onClick={(e) => handleRunFolder(e, node.path)}
                            title="Set as Preview Root"
                            className="p-1 rounded hover:bg-[#00E0B8]/10 text-[#57606A] hover:text-[#00E0B8] transition-all"
                        >
                            <Play className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => handleDeleteFolder(e, node.path)}
                            title="Delete folder and contents"
                            className="p-1 rounded hover:bg-red-500/10 text-[#57606A] hover:text-red-400 transition-all"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
            {isOpen && (
                <div className="flex flex-col">
                    {children.map(child => (
                        <TreeNode
                            key={child.isFolder ? child.path : child.id}
                            node={child}
                            level={node.name !== 'root' ? level + 1 : level}
                            openFile={openFile}
                            activeFileId={activeFileId}
                            handleDeleteFile={handleDeleteFile}
                            handleDeleteFolder={handleDeleteFolder}
                            handleRunFolder={handleRunFolder}
                            previewRootPath={previewRootPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

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

    const handleDeleteFolder = async (e, folderPath) => {
        e.stopPropagation();
        if (confirm('Delete this folder and all its contents permanently?')) {
            const filesToDelete = files.filter(f => f.name.startsWith(folderPath + '/'));
            for (const f of filesToDelete) {
                try {
                    await deleteFile(f.id);
                    closeFile(f.id);
                } catch (err) {
                    console.error('Delete failed for file in folder:', err);
                }
            }
        }
    };

    const setPreviewRootPath = useProjectStore(state => state.setPreviewRootPath);
    const previewRootPath = useProjectStore(state => state.previewRootPath);
    const setPreviewOpen = useEditorStore(state => state.setPreviewOpen);

    const handleRunFolder = (e, path) => {
        e.stopPropagation();
        // If they click on file, find its parent dir. Else set folder directly.
        let runPath = path;
        const matchingFile = files.find(f => f.name === path);
        if (matchingFile && !path.includes('/')) {
            runPath = ''; // Root level file
        } else if (matchingFile) {
            runPath = path.substring(0, path.lastIndexOf('/'));
        }

        setPreviewRootPath(runPath);
        setPreviewOpen(true);
    };

    const handleCreateFile = async () => {
        const name = prompt('File name:');
        if (name) {
            const ext = name.split('.').pop();
            const languageMap = { js: 'javascript', jsx: 'javascript', css: 'css', html: 'html' };
            await createFile(projectId, name, '', languageMap[ext] || 'javascript');
        }
    };

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
            <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                {(() => {
                    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (filteredFiles.length === 0) {
                        return (
                            <div className="py-12 text-center space-y-2">
                                <Box className="w-8 h-8 text-[#1F2430] mx-auto opacity-20" strokeWidth={1} />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#3B4252]">No modules found</p>
                            </div>
                        );
                    }

                    const root = { name: 'root', isFolder: true, children: {}, path: '' };
                    filteredFiles.forEach(file => {
                        const parts = file.name.split('/');
                        let current = root;
                        parts.forEach((part, index) => {
                            if (index === parts.length - 1) {
                                current.children[part] = { ...file, isFolder: false, name: part };
                            } else {
                                if (!current.children[part]) {
                                    current.children[part] = { name: part, isFolder: true, children: {}, path: parts.slice(0, index + 1).join('/') };
                                }
                                current = current.children[part];
                            }
                        });
                    });

                    return <TreeNode node={root} openFile={openFile} activeFileId={activeFileId} handleDeleteFile={handleDeleteFile} handleDeleteFolder={handleDeleteFolder} handleRunFolder={handleRunFolder} previewRootPath={previewRootPath} />;
                })()}
            </div>

            {/* Explorer Footer */}
            <div className="p-4 border-t border-[#1F2430] bg-[#0D0F12]/30">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#3B4252]">
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
