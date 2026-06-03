import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAIStore } from '../store/aiStore';
import { useProjectStore } from '../store/projectStore';
import { generateAIResponse } from '../services/ai';
import { parsePatches, applyPatch, applyAllPatches, savePlanToProject } from '../services/agent';
import { BRAND } from '../constants/brand';
import PlanPreview from '../components/PlanPreview';
import {
    extractPlanMarkdown,
    extractBriefSummary,
    extractPlanStepsSnippet,
    extractFileStructureSnippet,
    extractPlanFromMessages,
    getPlanContentFromProject,
    createPlanPatch,
    extractConfidence,
    extractRiskLevel,
} from '../utils/planParser';
import { resolveAgentMode } from '../utils/agentMode';
import { Send, Sparkles, X, FileCode, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

const AIChat = ({ projectId }) => {
    const {
        messages,
        addMessage,
        fetchMessages,
        isWorking,
        setIsWorking,
        pendingPatches,
        setPendingPatches,
        planApproved,
        setPlanApproved,
        lastPlanMarkdown,
        setLastPlanMarkdown,
        deleteMessages,
    } = useAIStore();

    const { files } = useProjectStore();
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchMessages(projectId);
    }, [projectId, fetchMessages]);

    // Restore plan preview after reload / navigation
    useEffect(() => {
        if (planApproved) return;

        const fromMessages = extractPlanFromMessages(messages);
        const fromFile = getPlanContentFromProject(files);
        const planMd = fromMessages || fromFile || lastPlanMarkdown;

        if (!planMd) return;

        if (planMd !== lastPlanMarkdown) {
            setLastPlanMarkdown(planMd);
        }

        const hasPlanPatch = pendingPatches.some((p) => p.fileName.toLowerCase() === 'plan.md');
        if (!hasPlanPatch) {
            const patch = createPlanPatch(planMd, files);
            if (patch) setPendingPatches([patch, ...pendingPatches.filter((p) => p.fileName.toLowerCase() !== 'plan.md')]);
        }
    }, [messages, files, planApproved]); // eslint-disable-line react-hooks/exhaustive-deps

    const planPatch = pendingPatches.find((p) => p.fileName.toLowerCase() === 'plan.md');
    const codePatches = pendingPatches.filter((p) => p.fileName.toLowerCase() !== 'plan.md');

    const displayPlan = useMemo(() => {
        return (
            planPatch?.newContent ||
            lastPlanMarkdown ||
            getPlanContentFromProject(files) ||
            extractPlanFromMessages(messages) ||
            ''
        );
    }, [planPatch, lastPlanMarkdown, files, messages]);

    const phase = useMemo(() => {
        if (!planApproved && displayPlan) return 'review';
        if (!planApproved) return 'plan';
        return 'build';
    }, [planApproved, displayPlan]);

    const planMeta = useMemo(() => ({
        confidence: extractConfidence(displayPlan),
        risk: extractRiskLevel(displayPlan),
    }), [displayPlan]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isWorking, codePatches.length]);

    const buildContext = useCallback(() => {
        const projectStructure = files.map((f) => f.name).join(', ') || '(empty)';
        const prunedHistory = messages.slice(-2).map((m) => {
            if (m.role === 'assistant') {
                const s = extractBriefSummary(m.content) || 'Update.';
                return { role: m.role, content: s.slice(0, 100) };
            }
            return { role: m.role, content: m.content.substring(0, 280) };
        });

        return [
            {
                role: 'system',
                content: `Files: ${projectStructure.slice(0, 200)}\nPlan approved: ${planApproved ? 'yes' : 'no'}`,
            },
            ...prunedHistory,
        ];
    }, [files, messages, planApproved]);

    const submitPrompt = async (promptText, forceMode) => {
        if (!promptText.trim() || isWorking) return;

        const mode = resolveAgentMode({ planApproved, promptText, forceMode });
        setIsWorking(true);

        const planFile = files.find((f) => f.name.toLowerCase() === 'plan.md');
        const planContent = planFile?.content || lastPlanMarkdown || displayPlan || '';
        const planSnippet =
            mode === 'build' && planContent ? extractPlanStepsSnippet(planContent, 1200) : '';
        const fileStructure =
            mode === 'build' && planContent ? extractFileStructureSnippet(planContent, 900) : '';
        const planOnly = mode === 'plan';

        try {
            await addMessage(projectId, 'user', promptText);

            let fullResponse = '';
            const response = await generateAIResponse({
                prompt: promptText,
                context: buildContext(),
                agentMode: mode,
                planSnippet,
                fileStructure,
                onChunk: (_c, full) => {
                    fullResponse = full;
                    const streamingPlan = extractPlanMarkdown(full);
                    if (streamingPlan && planOnly) {
                        setLastPlanMarkdown(streamingPlan);
                    }
                },
            });

            if (response?.status === 'quota_exceeded') {
                await addMessage(
                    projectId,
                    'assistant',
                    'Groq limit reached. Wait 60 seconds, clear chat, or use a shorter prompt.'
                );
                return;
            }
            if (response?.status === 'error') {
                await addMessage(projectId, 'assistant', response.message);
                return;
            }

            const text = typeof response === 'string' ? response : fullResponse;
            const planMd = extractPlanMarkdown(text);
            if (planMd) setLastPlanMarkdown(planMd);

            await parsePatches(projectId, text, { planOnly });
            await addMessage(projectId, 'assistant', text);
        } catch (error) {
            console.error(error);
            try {
                await addMessage(
                    projectId,
                    'assistant',
                    'Could not reach Groq. Check VITE_GROQ_KEY_1=gsk_… in .env, restart npm run dev, or clear chat if the request was too large.'
                );
            } catch {
                /* */
            }
        } finally {
            setIsWorking(false);
        }
    };

    const handleSend = (e) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text) return;
        setInput('');
        submitPrompt(text);
    };

    const handleApprovePlan = async () => {
        const content = displayPlan;
        if (!content?.trim()) return;

        try {
            if (planPatch) {
                await applyPatch(projectId, planPatch);
            } else {
                await savePlanToProject(projectId, content);
            }
            setPlanApproved(true);
            setLastPlanMarkdown(content);
            setPendingPatches(pendingPatches.filter((p) => p.fileName.toLowerCase() !== 'plan.md'));
        } catch (err) {
            console.error('Approve plan failed:', err);
        }
    };

    const handleBuildStep1 = async () => {
        if (!planApproved) await handleApprovePlan();
        const fileList = files.find((f) => f.name.toLowerCase() === 'plan.md')
            ? '' : '';
        await submitPrompt(
            'Build Step 1: output EVERY file listed in the File Structure of plan.md. Each file must be 100% complete with real working code — no placeholders, no stubs, no truncation. Follow exact file paths from the plan.',
            'build'
        );
    };

    const showPlanPreview = Boolean(displayPlan?.trim());

    return (
        <div className="flex flex-col h-full glass-agent-panel">
            <header className="glass-agent-header px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{BRAND.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{BRAND.eco}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span
                        className={cn(
                            'agent-phase-pill',
                            phase === 'review' && 'agent-phase-pill--plan',
                            phase === 'build' && 'agent-phase-pill--build'
                        )}
                    >
                        {phase === 'plan'   && '① Analyze & Plan'}
                        {phase === 'review' && '② Review & Approve'}
                        {phase === 'build'  && '③ Build'}
                    </span>
                    <button
                        type="button"
                        onClick={() => deleteMessages(projectId)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-white/5"
                        title="Clear"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 custom-scrollbar">
                {showPlanPreview && (
                    <PlanPreview
                        markdown={displayPlan}
                        isWorking={isWorking}
                        planApproved={planApproved}
                        onApprove={handleApprovePlan}
                        onBuildStep1={handleBuildStep1}
                    />
                )}

                {messages.length === 0 && !isWorking && !showPlanPreview && (
                    <div className="flex flex-col items-center text-center py-10 px-6 gap-4">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[13px] font-semibold text-white">Multi-Agent Workflow</p>
                            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Describe your project. The agent will <span style={{ color: 'var(--accent-text)' }}>analyze → plan → wait for approval</span> before writing any code.
                            </p>
                        </div>
                        <div className="w-full space-y-1.5 pt-1">
                            {['① Analyze & plan your requirements', '② Show confidence score + risk level', '③ Wait for your approval', '④ Build production-quality files'].map((step) => (
                                <div key={step} className="flex items-center gap-2 text-left px-3 py-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => {
                    if (m.role === 'user') {
                        return (
                            <div key={m.id} className="flex justify-end">
                                <div className="agent-user-bubble max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-br-md text-[13px] leading-relaxed">
                                    {m.content}
                                </div>
                            </div>
                        );
                    }

                    const summary = extractBriefSummary(m.content);
                    if (!summary) return null;

                    return (
                        <p key={m.id} className="text-[12px] text-[var(--text-secondary)] px-1 leading-relaxed">
                            <Sparkles className="w-3 h-3 inline mr-1 text-[var(--accent-primary)] align-text-bottom" />
                            {summary}
                        </p>
                    );
                })}

                {isWorking && (
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex gap-1 shrink-0">
                            {[0,1,2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                                    background: 'var(--accent)',
                                    animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`
                                }} />
                            ))}
                        </div>
                        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                            {phase === 'build' ? 'Coding agents writing production files…' : 'Planner & Architect agents analyzing…'}
                        </span>
                    </div>
                )}

                {planApproved && codePatches.length > 0 && (
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-mint)]">
                                {codePatches.length} file{codePatches.length !== 1 ? 's' : ''} ready
                            </span>
                            <button
                                type="button"
                                onClick={() => applyAllPatches(projectId, codePatches)}
                                className="text-[10px] font-semibold text-[var(--accent-primary)] hover:underline"
                            >
                                Apply all
                            </button>
                        </div>
                        {codePatches.map((patch, idx) => (
                            <div key={`${patch.fileName}-${idx}`} className="flex flex-col gap-1">
                                <div className="patch-row">
                                    <FileCode className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[12px] font-medium text-white truncate">
                                            {patch.fileName}
                                        </span>
                                        <span className="text-[10px] font-mono">
                                            {patch.isNew
                                                ? <span className="text-[var(--accent-mint)]">NEW</span>
                                                : <span className="text-[var(--accent-primary)]">UPDATE</span>
                                            }
                                            {patch.added > 0 && <span className="text-emerald-400 ml-1">+{patch.added}</span>}
                                            {patch.removed > 0 && <span className="text-red-400 ml-1">-{patch.removed}</span>}
                                            <span className="text-[var(--text-muted)] ml-1">
                                                {patch.newContent.split('\n').length} lines
                                            </span>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => applyPatch(projectId, patch)}
                                        className="h-8 px-3 rounded-lg bg-[var(--accent-primary-dim)] border border-[rgba(125,211,252,0.25)] text-[var(--accent-primary)] text-[11px] font-semibold shrink-0"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPendingPatches(codePatches.filter((p) => p !== patch))}
                                        className="p-1.5 text-[var(--text-muted)] hover:text-white shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {patch.qualityWarnings?.length > 0 && (
                                    <p className="text-[10px] text-amber-400/90 px-2">
                                        ⚠ {patch.qualityWarnings.join(' · ')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-3 shrink-0 border-t border-[var(--glass-border-soft)]">
                <div className="agent-prompt-box flex items-end gap-2 p-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        rows={2}
                        disabled={isWorking}
                        placeholder={
                            planApproved
                                ? 'Refine plan, or type "implement step 1" to build…'
                                : showPlanPreview
                                  ? 'Ask to change the plan, then click Approve plan above…'
                                  : 'Describe your app (stack, pages, file structure)…'
                        }
                        className="flex-1 bg-transparent resize-none text-[14px] text-white placeholder:text-[var(--text-muted)] focus:outline-none px-2 py-2 max-h-28 leading-relaxed"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isWorking}
                        className="p-2.5 rounded-xl bg-gradient-to-b from-[#93c5fd] to-[#7dd3fc] text-[#0c1222] disabled:opacity-35 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 shrink-0 transition-opacity"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChat;
