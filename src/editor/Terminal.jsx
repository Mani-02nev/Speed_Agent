import React, { useState, useEffect, useRef } from 'react';
import { useTerminalStore } from '../store/terminalStore';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { cn } from '../utils/cn';

const Terminal = ({ projectId }) => {
    const history = useTerminalStore(state => state.history);
    const currentDirectory = useTerminalStore(state => state.currentDirectory);
    const executeCommand = useTerminalStore(state => state.executeCommand);
    const setPreviewOpen = useEditorStore(state => state.setPreviewOpen);
    const setBrowserUrl = useEditorStore(state => state.setBrowserUrl);
    const files = useProjectStore(state => state.files);
    const deleteFile = useProjectStore(state => state.deleteFile);

    const [input, setInput] = useState('');
    const [isDevServerRunning, setIsDevServerRunning] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const lastEntry = history[history.length - 1];
        if (!lastEntry || lastEntry.type !== 'output') {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            return;
        }

        // RUN_DEV_SERVER
        if (lastEntry.content === 'RUN_DEV_SERVER') {
            setIsDevServerRunning(true);
            setBrowserUrl('localhost:5173');
            setPreviewOpen(true);
            useTerminalStore.setState(prev => {
                const newHistory = [...prev.history];
                newHistory[newHistory.length - 1] = {
                    type: 'output',
                    content: `> vite\n\n  VITE v5.0.0  ready in 122 ms\n\n  ➜  Local:   http://localhost:5173/\n\nPress 'c' and hit Enter to stop.`
                };
                return { history: newHistory };
            });
        }

        // DELETE_ALL_FILES — rm *
        if (lastEntry.content === 'DELETE_ALL_FILES') {
            const currentFiles = useProjectStore.getState().files;
            Promise.all(currentFiles.map(f => deleteFile(f.id))).then(() => {
                useTerminalStore.setState(prev => {
                    const newHistory = [...prev.history];
                    newHistory[newHistory.length - 1] = {
                        type: 'output',
                        content: `Removed ${currentFiles.length} file(s). Project directory cleared.`
                    };
                    return { history: newHistory };
                });
            }).catch(err => {
                useTerminalStore.setState(prev => {
                    const newHistory = [...prev.history];
                    newHistory[newHistory.length - 1] = { type: 'error', content: `rm: Error deleting files: ${err.message}` };
                    return { history: newHistory };
                });
            });
        }

        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, setBrowserUrl, setPreviewOpen, deleteFile]);

    const handleCommand = (e) => {
        e.preventDefault();
        const cmd = input.trim();
        if (!cmd) return;

        if (isDevServerRunning && (cmd.toLowerCase() === 'c' || cmd.toLowerCase() === 'stop')) {
            setIsDevServerRunning(false);
            setPreviewOpen(false);
            useTerminalStore.setState(prev => ({
                history: [...prev.history, { type: 'input', content: cmd, cwd: prev.currentDirectory }, { type: 'output', content: 'Server stopped.' }]
            }));
            setInput('');
            return;
        }

        executeCommand(projectId, cmd);
        setInput('');
    };


    // Clean display for path
    const displayPath = currentDirectory.replace('/home/user', '~');

    return (
        <div className="flex flex-col h-full bg-[#0B0D11] mono-text text-[12px] relative overflow-hidden group">
            <div className="flex-1 overflow-y-auto p-4 relative z-20 custom-scrollbar" ref={scrollRef}>
                {history.map((line, i) => (
                    <div key={i} className="mb-2">
                        {line.type === 'input' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[#00E0B8] font-black tracking-tight">user@speed</span>
                                <span className="text-[#57606A]">:</span>
                                <span className="text-[#7C5CFF] font-bold">{line.cwd?.replace('/home/user', '~') || '~'}</span>
                                <span className="text-white opacity-30">$</span>
                                <span className="text-[#E6EDF3] font-medium">{line.content}</span>
                            </div>
                        ) : (
                            <div className={cn(
                                "whitespace-pre-wrap pl-4 border-l border-[#1F2430] py-1 mt-1",
                                line.type === 'error' ? "text-[#FF4D4F] border-[#FF4D4F]/30" : "text-[#9DA5B4]"
                            )}>
                                {line.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleCommand} className="flex items-center gap-2 px-4 py-3 bg-[#0B0D11] border-t border-[#1F2430] relative z-20">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#00E0B8] font-black tracking-tight">user@speed</span>
                    <span className="text-[#57606A]">:</span>
                    <span className="text-[#7C5CFF] font-bold">{displayPath}</span>
                    <span className="text-white opacity-30">$</span>
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[#E6EDF3] p-0 font-medium"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                />
            </form>
        </div>
    );
};

export default Terminal;
