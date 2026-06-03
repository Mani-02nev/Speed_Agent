import React, { useMemo } from 'react';
import {
    FileText, Hammer, CheckCircle2, ShieldAlert, ShieldCheck,
    ShieldOff, Zap, FilePlus, FilePen, Trash2, BarChart2,
} from 'lucide-react';
import { renderPlanMarkdown } from '../utils/planMarkdownRender';
import {
    extractConfidence,
    extractRiskLevel,
    extractFileChangeCounts,
} from '../utils/planParser';
import { cn } from '../utils/cn';

const RISK_CONFIG = {
    Low:      { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: ShieldCheck },
    Medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: ShieldAlert },
    High:     { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: ShieldOff  },
    Critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.18)',  icon: ShieldOff  },
};

export default function PlanPreview({ markdown, isWorking, planApproved, onApprove, onBuildStep1 }) {
    const html       = useMemo(() => renderPlanMarkdown(markdown), [markdown]);
    const confidence = useMemo(() => extractConfidence(markdown), [markdown]);
    const riskLevel  = useMemo(() => extractRiskLevel(markdown), [markdown]);
    const fileCounts = useMemo(() => extractFileChangeCounts(markdown), [markdown]);

    if (!markdown?.trim()) return null;

    const risk   = RISK_CONFIG[riskLevel] || null;
    const RiskIcon = risk?.icon || ShieldCheck;
    const totalFiles = fileCounts.created + fileCounts.modified + fileCounts.deleted;

    return (
        <div className="plan-preview-card mx-1 my-2 shrink-0">

            {/* Header */}
            <div className="plan-preview-card__header flex items-center gap-2">
                <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="text-[12px] font-semibold text-white">Implementation Plan</span>
                {planApproved ? (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--success)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                ) : (
                    <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>Review & approve</span>
                )}
            </div>

            {/* Metrics bar */}
            {(confidence !== null || riskLevel || totalFiles > 0) && (
                <div className="flex items-stretch gap-px border-b" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.2)' }}>

                    {/* Confidence */}
                    {confidence !== null && (
                        <div className="flex-1 flex flex-col gap-1.5 px-3 py-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                    Confidence
                                </span>
                                <span className="text-[11px] font-bold" style={{
                                    color: confidence >= 80 ? '#10B981' : confidence >= 60 ? '#F59E0B' : '#EF4444'
                                }}>
                                    {confidence}%
                                </span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="h-full rounded-full transition-all duration-700" style={{
                                    width: `${confidence}%`,
                                    background: confidence >= 80 ? '#10B981' : confidence >= 60 ? '#F59E0B' : '#EF4444',
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Risk */}
                    {risk && (
                        <div className="flex items-center gap-1.5 px-3 py-2.5 border-l" style={{ borderColor: 'var(--border)' }}>
                            <RiskIcon className="w-3.5 h-3.5 shrink-0" style={{ color: risk.color }} />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Risk</span>
                                <span className="text-[11px] font-bold" style={{ color: risk.color }}>{riskLevel}</span>
                            </div>
                        </div>
                    )}

                    {/* File counts */}
                    {totalFiles > 0 && (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 border-l" style={{ borderColor: 'var(--border)' }}>
                            {fileCounts.created > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#10B981' }}>
                                    <FilePlus className="w-3 h-3" />+{fileCounts.created}
                                </span>
                            )}
                            {fileCounts.modified > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--accent-text)' }}>
                                    <FilePen className="w-3 h-3" />~{fileCounts.modified}
                                </span>
                            )}
                            {fileCounts.deleted > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#EF4444' }}>
                                    <Trash2 className="w-3 h-3" />-{fileCounts.deleted}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Plan body */}
            <div
                className="plan-preview-card__body plan-preview-card__body--rendered custom-scrollbar"
                dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Actions */}
            <div className="plan-preview-card__actions">
                {!planApproved ? (
                    <button
                        type="button"
                        disabled={isWorking}
                        onClick={onApprove}
                        className="btn-agent-primary w-full flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Plan
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={isWorking}
                        onClick={onBuildStep1}
                        className="btn-agent-primary w-full flex items-center justify-center gap-2"
                    >
                        <Hammer className="w-4 h-4" />
                        Build Step 1
                    </button>
                )}
            </div>

            <p className="text-[10px] px-3 pb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {planApproved
                    ? 'Plan approved. Click Build Step 1 to generate production files.'
                    : 'Review the plan above. Ask for changes in chat, or click Approve to proceed.'}
            </p>
        </div>
    );
}
