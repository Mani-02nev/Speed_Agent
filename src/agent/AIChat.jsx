import React, { useState, useEffect, useRef } from 'react';
import { useAIStore } from '../store/aiStore';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { generateAIResponse } from '../services/ai';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, Sparkles, Check, X, FileCode, ArrowUpRight, User } from 'lucide-react';
import { cn } from '../utils/cn';

const AIChat = ({ projectId }) => {
    const { messages, addMessage, fetchMessages, isTyping, setIsTyping, pendingPatches, setPendingPatches, clearPendingPatches } = useAIStore();
    const { files } = useProjectStore();
    const { activeFileId, tabs } = useEditorStore();
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchMessages(projectId);
    }, [projectId, fetchMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, pendingPatches]);

    const activeFile = tabs.find(t => t.id === activeFileId);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input;
        setInput('');
        setIsTyping(true);

        try {
            await addMessage(projectId, 'user', userMessage);

            const projectStructure = files.map(f => f.name).join(', ');

            // v6: Production Context Pruning (Limit to last 6 exchanges, Strip Code)
            const prunedHistory = messages.slice(-6).map(m => {
                if (m.role === 'assistant') {
                    // Extract only the description, ignore the raw code blocks to save 90% tokens
                    const cleanText = m.content.split(/(?:#\s*File:|```)/i)[0].trim();
                    return { role: m.role, content: cleanText || "Project updated." };
                }
                return { role: m.role, content: m.content.substring(0, 500) }; // Limit user message length in context
            });

            const context = [
                {
                    role: 'system',
                    content: `WORKSPACE: ${projectStructure}\nACTIVE: ${activeFile?.name || 'None'}`
                },
                ...prunedHistory
            ];

            const response = await generateAIResponse({
                prompt: userMessage,
                context,
            });

            // Handle Structured Error
            if (response && response.status === 'quota_exceeded') {
                await addMessage(projectId, 'assistant', "AI service temporarily unavailable (Quota reached). Please retry in a few moments.");
                return;
            }

            if (response && response.status === 'error') {
                await addMessage(projectId, 'assistant', `Neural Signal Interrupted: ${response.message}`);
                return;
            }

            // v6: Parse patches instead of auto-applying
            const { parsePatches } = await import('../services/agent');
            await parsePatches(projectId, response);

            // Hide raw code from bubble via render logic
            await addMessage(projectId, 'assistant', response);

        } catch (error) {
            console.error("Neural Node Failure:", error);
            await addMessage(projectId, 'assistant', "Node connection loss. Initializing recovery...");
        } finally {
            setIsTyping(false);
        }
    };

    const handleAcceptPatch = async (patch) => {
        const { applyPatch } = await import('../services/agent');
        await applyPatch(projectId, patch);
    };

    const handleRejectPatch = (patch) => {
        setPendingPatches(pendingPatches.filter(p => p !== patch));
    };

    const renderMessage = (m, key) => {
        const isUser = m.role === 'user';
        // v6: Intelligent display - Hide structured code blocks from chat bubble
        let displayContent = m.content;
        const fileIndex = m.content.search(/(?:#\s*File:|#File:|File:|FILE:)/i);
        if (fileIndex !== -1) {
            displayContent = m.content.substring(0, fileIndex).trim();
        } else {
            // If it's just a code block without a marker, show a summary instead of raw code
            if (m.content.includes('```')) {
                displayContent = m.content.split('```')[0].trim() || "Generated system module instructions.";
            }
        }

        displayContent = displayContent || (m.role === 'assistant' ? "Architecting solution..." : "...");

        return (
            <motion.div
                key={m.id || key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex flex-col gap-2 w-full", isUser ? "items-end" : "items-start")}
            >
                <div className="flex items-center gap-2 px-1">
                    {!isUser && <div className="w-5 h-5 rounded bg-[#00E0B8]/10 flex items-center justify-center border border-[#00E0B8]/20"><Cpu className="w-3 h-3 text-[#00E0B8]" /></div>}
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isUser ? "text-[#57606A]" : "text-[#00E0B8]")}>
                        {isUser ? 'Client Node' : 'Agent Core'}
                    </span>
                    {isUser && <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center border border-white/5"><User className="w-3 h-3 text-[#57606A]" /></div>}
                </div>
                <div className={cn(
                    "p-4 text-[13px] leading-relaxed font-medium max-w-[85%] rounded-2xl shadow-xl whitespace-pre-wrap",
                    isUser ? "bg-[#1F2430] text-[#E6EDF3] rounded-tr-none border border-white/5" : "bg-[#0D0F12] text-[#9DA5B4] italic rounded-tl-none border border-[#1F2430]"
                )}>
                    {displayContent}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#151821]">
            <div className="p-4 border-b border-[#1F2430] bg-[#111317]/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#00E0B8] shadow-[0_0_8px_#00E0B8]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural Hub</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-[#00E0B8]/10 border border-[#00E0B8]/20 text-[8px] font-black text-[#00E0B8] uppercase tracking-widest">
                    v6.0 Enterprise
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#0D0F12]/20">
                {messages.map((m, i) => renderMessage(m, i))}

                {/* Patch Approval UI */}
                <AnimatePresence>
                    {pendingPatches.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                            <div className="px-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#00E0B8]">Pending System Modification</div>
                            {pendingPatches.map((patch, idx) => (
                                <div key={idx} className="bg-[#0D0F12] border border-[#1F2430] rounded-xl p-3 flex flex-col gap-3 shadow-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileCode className="w-4 h-4 text-[#57606A]" />
                                            <span className="text-[12px] font-bold text-white">{patch.fileName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-[#00E0B8]">+{patch.added}</span>
                                            <span className="text-[10px] font-black text-red-500">-{patch.removed}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleAcceptPatch(patch)} className="flex-1 h-8 bg-[#00E0B8] text-black rounded-lg text-[11px] font-black uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                                            <Check className="w-3.5 h-3.5" /> Accept
                                        </button>
                                        <button onClick={() => handleRejectPatch(patch)} className="h-8 w-12 bg-white/5 text-[#57606A] rounded-lg border border-white/5 flex items-center justify-center hover:text-white transition-all">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {isTyping && <div className="text-[9px] font-black text-[#00E0B8] uppercase tracking-widest animate-pulse px-1">Constructing neural sequence...</div>}
            </div>

            <div className="p-4 bg-[#111317] border-t border-[#1F2430]">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Push system update instructions..."
                        className="w-full bg-[#0D0F12] border border-[#1F2430] rounded-xl pl-4 pr-12 py-3 text-[13px] font-medium text-white focus:outline-none focus:border-[#00E0B8]/40 transition-all"
                        disabled={isTyping}
                    />
                    <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 p-2 rounded-lg text-[#3B4252] disabled:opacity-50">
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChat;
