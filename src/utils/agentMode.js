/** Resolve plan vs build from user approval and prompt intent */

const BUILD_INTENT_RE =
    /\b(implement|build step|create (every )?file|ship code|write (the )?code|generate (all )?files|start build)\b/i;

export function resolveAgentMode({ planApproved, promptText, forceMode }) {
    if (forceMode === 'build') return planApproved ? 'build' : 'plan';
    if (forceMode === 'plan') return 'plan';
    if (!planApproved) return 'plan';
    return 'build';
}
