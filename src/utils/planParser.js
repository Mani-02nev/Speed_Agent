/** Extract and parse structured plan sections from agent response */

const PLAN_MARKERS = /#+\s*(Analysis|Overview|File Structure|Build Steps|Tech Stack|Architecture|Design|Risk|Quality Checklist|Approval|File Changes)/i;

export function extractPlanMarkdown(text) {
    if (!text) return null;

    const blockMatch = text.match(
        /#\s*File:\s*plan\.md\s*[\s\S]*?```(?:markdown|md)?\s*\n([\s\S]*?)```/i
    );
    if (blockMatch?.[1]) return blockMatch[1].trim();

    const fileAlt = text.match(
        /(?:^|\n)(?:#?\s*)?(?:FILE|File):\s*plan\.md\s*[\s\S]*?```(?:markdown|md)?\s*\n([\s\S]*?)```/im
    );
    if (fileAlt?.[1]) return fileAlt[1].trim();

    const looseMatch = text.match(/```(?:markdown|md)?\s*\n([\s\S]*?)```/i);
    if (looseMatch?.[1] && PLAN_MARKERS.test(looseMatch[1])) return looseMatch[1].trim();

    const anyFence = text.match(/```\s*\n([\s\S]*?)```/);
    if (anyFence?.[1] && PLAN_MARKERS.test(anyFence[1]) && anyFence[1].length > 80)
        return anyFence[1].trim();

    const idx = text.search(/^##\s+(Overview|Analysis)/im);
    if (idx !== -1) {
        const slice = text.slice(idx).replace(/```[\s\S]*$/, '').trim();
        if (slice.length > 80) return slice;
    }

    return null;
}

/** Extract confidence score 0-100 from plan markdown */
export function extractConfidence(planMd) {
    if (!planMd) return null;
    const m = planMd.match(/\*\*Confidence[:\*]*\s*(\d+)%/i) || planMd.match(/Confidence[:\s]+(\d+)%/i);
    return m ? parseInt(m[1], 10) : null;
}

/** Extract risk level from plan markdown */
export function extractRiskLevel(planMd) {
    if (!planMd) return null;
    const m = planMd.match(/\*\*Risk Level[:\*]*\s*(Low|Medium|High|Critical)/i) || planMd.match(/Risk Level[:\s]+(Low|Medium|High|Critical)/i);
    return m ? m[1] : null;
}

/** Extract file change counts: { created, modified, deleted } */
export function extractFileChangeCounts(planMd) {
    if (!planMd) return { created: 0, modified: 0, deleted: 0 };
    const created  = parseInt(planMd.match(/\*\*New Files[:\*]*\s*(\d+)/i)?.[1]  || planMd.match(/New Files:\s*(\d+)/i)?.[1]  || '0');
    const modified = parseInt(planMd.match(/\*\*Modified[:\*]*\s*(\d+)/i)?.[1]   || planMd.match(/Modified:\s*(\d+)/i)?.[1]   || '0');
    const deleted  = parseInt(planMd.match(/\*\*Deleted[:\*]*\s*(\d+)/i)?.[1]    || planMd.match(/Deleted:\s*(\d+)/i)?.[1]    || '0');
    return { created, modified, deleted };
}

/** Extract the Analysis section text */
export function extractAnalysisSection(planMd) {
    if (!planMd) return '';
    const m = planMd.match(/##\s*Analysis\n([\s\S]*?)(?=\n---|\n##|$)/i);
    return m?.[1]?.trim() || '';
}

/** Extract list of risks as string array */
export function extractRisks(planMd) {
    if (!planMd) return [];
    const section = planMd.match(/##\s*Risk Assessment\n([\s\S]*?)(?=\n---|\n##|$)/i)?.[1] || '';
    return section.match(/^[-•]\s*(.+)/gm)?.map(l => l.replace(/^[-•]\s*/, '')) || [];
}

export function extractBriefSummary(text) {
    if (!text) return '';
    const idx = text.search(/(?:#\s*File:|```)/i);
    const head = idx !== -1 ? text.substring(0, idx) : text;
    return head.trim().replace(/\n+/g, ' ').slice(0, 300);
}

export function hasPlanFile(files) {
    return files?.some((f) => f.name.toLowerCase() === 'plan.md');
}

export function getPlanContentFromProject(files) {
    const plan = files?.find((f) => f.name.toLowerCase() === 'plan.md');
    return plan?.content?.trim() || null;
}

export function extractPlanFromMessages(messages) {
    if (!messages?.length) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role !== 'assistant') continue;
        const plan = extractPlanMarkdown(messages[i].content);
        if (plan) return plan;
    }
    return null;
}

export function extractPlanStepsSnippet(planMd, maxLen = 1400) {
    if (!planMd) return '';
    const idx = planMd.search(/##\s*Build Steps/i);
    const slice = idx !== -1 ? planMd.slice(idx) : planMd;
    return slice.slice(0, maxLen);
}

export function extractFileStructureSnippet(planMd, maxLen = 1200) {
    if (!planMd) return '';
    const fence = planMd.match(/##\s*File Structure[\s\S]*?```[\s\S]*?\n([\s\S]*?)```/i);
    if (fence?.[1]) return fence[1].trim().slice(0, maxLen);
    const idx = planMd.search(/##\s*File Structure/i);
    if (idx !== -1) return planMd.slice(idx, idx + maxLen);
    return '';
}

export function createPlanPatch(planMd, files) {
    if (!planMd) return null;
    return {
        fileName: 'plan.md',
        newContent: planMd,
        added: planMd.split('\n').length,
        removed: 0,
        isNew: !files?.some((f) => f.name.toLowerCase() === 'plan.md'),
        qualityWarnings: [],
    };
}
