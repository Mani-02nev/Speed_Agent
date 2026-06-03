import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { Folder, FolderOpen, Plus, Search, Trash2, Play, Copy, ExternalLink } from 'lucide-react';
import { getFileIcon } from '../utils/fileIcons';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const TreeNode = ({ node, level = 0, openFile, activeFileId, onDelete, onDeleteFolder, onRun, previewRootPath, onContextMenu }) => {
    const [open, setOpen] = React.useState(true);

    if (!node.isFolder) {
        const active = activeFileId === node.id;
        return (
            <div
                onClick={() => openFile(node)}
                onContextMenu={e => onContextMenu(e, node)}
                style={{ paddingLeft: `${level * 14 + 10}px` }}
                className={cn(
                    'flex items-center gap-2 py-[5px] pr-2 cursor-pointer group relative transition-colors rounded-none',
                    active ? 'text-white' : 'text-[#6B7280] hover:text-[#D1D5DB]'
                )}
                style={{ paddingLeft: `${level * 14 + 10}px`, background: active ? 'rgba(59,130,246,0.08)' : undefined }}>
                {active && <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r" style={{ background: 'var(--accent)' }} />}
                {getFileIcon(node.name, 14)}
                <span className="text-[12px] font-medium truncate flex-1">{node.name}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                    <button onClick={e => { e.stopPropagation(); onRun(e, node.path || node.name); }}
                        className="p-1 rounded transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                        <Play className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(e, node.id); }}
                        className="p-1 rounded transition-colors hover:text-red-400" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    }

    const children = Object.values(node.children).sort((a, b) => {
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div>
            {node.name !== 'root' && (
                <div
                    onClick={() => setOpen(v => !v)}
                    onContextMenu={e => onContextMenu(e, node)}
                    style={{ paddingLeft: `${level * 14 + 10}px` }}
                    className="flex items-center gap-2 py-[5px] pr-2 cursor-pointer group transition-colors hover:text-[#D1D5DB]"
                    style={{ paddingLeft: `${level * 14 + 10}px`, color: 'var(--text-secondary)' }}>
                    {open
                        ? <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-text)' }} />
                        : <Folder     className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    }
                    <span className="text-[12px] font-medium truncate flex-1">{node.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                        <button onClick={e => { e.stopPropagation(); onDeleteFolder(e, node.path); }}
                            className="p-1 rounded transition-colors hover:text-red-400" style={{ color: 'var(--text-muted)' }}>
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
            {open && children.map(child => (
                <TreeNode key={child.isFolder ? child.path : child.id}
                    node={child}
                    level={node.name !== 'root' ? level + 1 : level}
                    openFile={openFile}
                    activeFileId={activeFileId}
                    onDelete={onDelete}
                    onDeleteFolder={onDeleteFolder}
                    onRun={onRun}
                    previewRootPath={previewRootPath}
                    onContextMenu={onContextMenu}
                />
            ))}
        </div>
    );
};

const FileExplorer = ({ projectId }) => {
    const files        = useProjectStore(s => s.files);
    const createFile   = useProjectStore(s => s.createFile);
    const deleteFile   = useProjectStore(s => s.deleteFile);
    const setPreviewRootPath = useProjectStore(s => s.setPreviewRootPath);
    const previewRootPath    = useProjectStore(s => s.previewRootPath);

    const activeFileId = useEditorStore(s => s.activeFileId);
    const openFile     = useEditorStore(s => s.openFile);
    const closeFile    = useEditorStore(s => s.closeFile);
    const setPreviewOpen = useEditorStore(s => s.setPreviewOpen);
    const setBrowserUrl  = useEditorStore(s => s.setBrowserUrl);

    const [search, setSearch] = React.useState('');
    const [ctx, setCtx] = React.useState({ visible: false, x: 0, y: 0, node: null });

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm('Delete file?')) { await deleteFile(id); closeFile(id); }
    };
    const handleDeleteFolder = async (e, path) => {
        e.stopPropagation();
        if (confirm('Delete folder and all contents?')) {
            for (const f of files.filter(f => f.name.startsWith(path + '/'))) {
                await deleteFile(f.id); closeFile(f.id);
            }
        }
    };
    const handleRun = (e, path) => {
        if (e) e.stopPropagation();
        let runPath = path;
        const f = files.find(f => f.name === path);
        if (f && path.includes('/')) runPath = path.substring(0, path.lastIndexOf('/'));
        else if (f) runPath = '';
        setPreviewRootPath(runPath);
        setPreviewOpen(true);
    };
    const handleCreate = async () => {
        const name = prompt('File name (e.g. main.py, index.html):');
        if (!name) return;
        const ext = name.split('.').pop();
        const langMap = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', css: 'css', html: 'html', py: 'python', md: 'markdown' };
        await createFile(projectId, name, '', langMap[ext] || 'javascript');
    };

    React.useEffect(() => {
        const hide = () => setCtx(c => ({ ...c, visible: false }));
        window.addEventListener('click', hide);
        return () => window.removeEventListener('click', hide);
    }, []);

    const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    // Build tree
    const root = { name: 'root', isFolder: true, children: {}, path: '' };
    filtered.forEach(file => {
        const parts = file.name.split('/');
        let cur = root;
        parts.forEach((part, i) => {
            if (i === parts.length - 1) {
                cur.children[part] = { ...file, isFolder: false, name: part };
            } else {
                if (!cur.children[part])
                    cur.children[part] = { name: part, isFolder: true, children: {}, path: parts.slice(0, i + 1).join('/') };
                cur = cur.children[part];
            }
        });
    });

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>

            {/* Header */}
            <div className="px-3 pt-3 pb-2 space-y-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Explorer
                    </span>
                    <button onClick={handleCreate}
                        className="p-1 rounded-md transition-colors hover:text-white"
                        style={{ color: 'var(--text-muted)' }} title="New file">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                        className="input-glass h-7 pl-7 text-[11px]"
                        placeholder="Search…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                {filtered.length === 0 ? (
                    <div className="py-10 text-center px-4">
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {files.length === 0 ? 'No files yet. Use + or ask the agent.' : 'No matches.'}
                        </p>
                    </div>
                ) : (
                    <TreeNode
                        node={root}
                        openFile={openFile}
                        activeFileId={activeFileId}
                        onDelete={handleDelete}
                        onDeleteFolder={handleDeleteFolder}
                        onRun={handleRun}
                        previewRootPath={previewRootPath}
                        onContextMenu={(e, node) => { e.preventDefault(); setCtx({ visible: true, x: e.clientX, y: e.clientY, node }); }}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {files.length} file{files.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Context Menu */}
            <AnimatePresence>
                {ctx.visible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={{ top: ctx.y, left: ctx.x, position: 'fixed', zIndex: 200 }}
                        className="w-44 rounded-xl overflow-hidden p-1 glass"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => { navigator.clipboard.writeText(ctx.node?.name || ''); setCtx(c => ({ ...c, visible: false })); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium rounded-lg transition-colors hover:text-white"
                            style={{ color: 'var(--text-secondary)' }}>
                            <Copy className="w-3.5 h-3.5" />Copy Path
                        </button>
                        {ctx.node?.name?.match(/\.(html|htm)$/i) && (
                            <button onClick={() => { handleRun(null, ctx.node.name); setCtx(c => ({ ...c, visible: false })); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium rounded-lg transition-colors"
                                style={{ color: 'var(--accent-text)' }}>
                                <ExternalLink className="w-3.5 h-3.5" />Open Preview
                            </button>
                        )}
                        <div className="h-px my-1" style={{ background: 'var(--border)' }} />
                        <button onClick={e => {
                            ctx.node?.isFolder
                                ? handleDeleteFolder(e, ctx.node.path)
                                : handleDelete(e, ctx.node.id);
                            setCtx(c => ({ ...c, visible: false }));
                        }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium rounded-lg transition-colors hover:text-red-400"
                            style={{ color: '#EF444488' }}>
                            <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FileExplorer;
