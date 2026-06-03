/**
 * Mr K Agent — Groq AI service
 */

import { getPrompt } from '../constants/agentPrompts';

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_TPM_BUDGET = 5800;

const LIMITS = {
    plan:    { maxOutput: 2000, maxRequestChars: 7000,  historyTurns: 1, planSnippet: 0    },
    build:   { maxOutput: 8000, maxRequestChars: 10000, historyTurns: 0, planSnippet: 1400 },
    minimal: { maxOutput: 4000, maxRequestChars: 5500,  historyTurns: 0, planSnippet: 600  },
};

export function normalizeEnvKey(value) {
    if (value == null || typeof value !== 'string') return '';
    return value.trim().replace(/^['\"]|['\"]$/g, '');
}

export function isValidGroqKey(key) {
    return /^gsk_[0-9A-Za-z]{20,}$/.test(normalizeEnvKey(key));
}

function loadGroqKeys() {
    return [
        import.meta.env.VITE_GROQ_KEY_1,
        import.meta.env.VITE_GROQ_KEY_2,
        import.meta.env.VITE_GROQ_KEY_3,
        import.meta.env.VITE_GROQ_KEY,
    ].map(normalizeEnvKey).filter(isValidGroqKey);
}

let groqKeyIndex = 0;
const failedGroqKeys = new Set();

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export function getAIKeyStatus() {
    const groqCount = loadGroqKeys().length;
    return { provider: groqCount > 0 ? 'groq' : 'none', groqCount, geminiCount: 0, hasRejectedGeminiKeys: false, rejectedHint: null };
}
export function getGeminiKeyStatus() { return { validCount: 0, invalidCount: 0, hasInvalidOnly: false }; }
export function isValidGeminiApiKey() { return false; }

export function stripCodeBlocks(text, maxLen = 160) {
    if (!text) return '';
    const idx = text.search(/(?:#\s*File:|```)/i);
    const head = idx !== -1 ? text.substring(0, idx) : text;
    return head.trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

function isTokenLimitError(msg, status) {
    return status === 413 || status === 429 || /TPM|tokens per minute|too large|reduce your message/i.test(msg);
}

function estimateTokens(messages, maxOutput) {
    const chars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    return Math.ceil(chars / 3.2) + maxOutput;
}

function buildGroqMessages(systemText, context, prompt, planSnippet, fileStructure, limits) {
    const workspace = context.find((m) => m.role === 'system');
    let userContent = prompt.trim().slice(0, 600);

    if (planSnippet && limits.planSnippet > 0) {
        const parts = [];
        if (fileStructure) parts.push(`FILE TREE (use EXACT paths, no deviations):\n${fileStructure.slice(0, 1200)}`);
        parts.push(`BUILD STEPS:\n${planSnippet.slice(0, limits.planSnippet)}`);
        parts.push(
            `TASK: ${userContent}\n\nOutput EVERY file listed for this step. Each file must be 100% complete — no truncation, no placeholders, no stubs. Real working code only.`
        );
        userContent = parts.join('\n\n');
    } else if (workspace?.content) {
        userContent = `${workspace.content.slice(0, 300)}\n\n${userContent}`;
    }

    const history = context
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-limits.historyTurns)
        .map((m) => ({
            role: m.role,
            content: m.role === 'assistant'
                ? stripCodeBlocks(m.content, 160) || 'OK.'
                : String(m.content).slice(0, 400),
        }));

    const messages = [{ role: 'system', content: systemText }, ...history, { role: 'user', content: userContent }];

    let serialized = JSON.stringify(messages);
    while (serialized.length > limits.maxRequestChars && messages.length > 2) {
        messages.splice(1, 1);
        serialized = JSON.stringify(messages);
    }

    // Only trim if truly over budget — don't mangle build instructions
    for (const m of messages) {
        if (m.role === 'system' && m.content.length > 3000) m.content = m.content.slice(0, 3000) + '…';
        else if (m.role === 'user' && m.content.length > 2000) m.content = m.content.slice(0, 2000) + '…';
        else if (m.role === 'assistant' && m.content.length > 300) m.content = m.content.slice(0, 300) + '…';
    }

    return messages;
}

export const generateAIResponse = async ({ prompt, context, onChunk, agentMode = 'plan', planSnippet = '', fileStructure = '' }) => {
    const keys = loadGroqKeys();
    if (keys.length === 0) {
        return { status: 'error', message: 'Add VITE_GROQ_KEY_1=gsk_… to .env from https://console.groq.com/keys then restart npm run dev.' };
    }

    const knownModes = ['plan','build','debug','review','refactor','docs'];
    const mode = knownModes.includes(agentMode) ? agentMode : 'plan';
    const systemText = getPrompt(mode);
    let limits = agentMode === 'build' ? LIMITS.build : LIMITS.plan;
    let activeContext = context;
    let activeSnippet = agentMode === 'build' ? planSnippet : '';
    let activeFileTree = agentMode === 'build' ? fileStructure : '';
    let shrinkPass = 0;
    const temperature = agentMode === 'build' ? 0.05 : 0.10;

    for (let attempt = 0; attempt < keys.length * 3; attempt++) {
        const key = keys[groqKeyIndex];
        if (!key || failedGroqKeys.has(key)) {
            groqKeyIndex = (groqKeyIndex + 1) % keys.length;
            continue;
        }

        const messages = buildGroqMessages(systemText, activeContext, prompt, activeSnippet, activeFileTree, limits);
        const maxOut = limits.maxOutput;

        if (estimateTokens(messages, maxOut) > GROQ_TPM_BUDGET && shrinkPass < 2) {
            limits = LIMITS.minimal;
            activeContext = activeContext.filter((m) => m.role === 'system').slice(0, 1);
            activeSnippet = activeSnippet.slice(0, LIMITS.minimal.planSnippet);
            shrinkPass++;
            continue;
        }

        try {
            return await callGroqStream(key, messages, maxOut, temperature, onChunk);
        } catch (error) {
            const status = error.status || 0;
            const msg = error.message || '';

            if (status === 401 || /invalid.*api.*key/i.test(msg)) {
                failedGroqKeys.add(key);
                groqKeyIndex = (groqKeyIndex + 1) % keys.length;
                if (failedGroqKeys.size >= keys.length) return { status: 'error', message: 'Invalid Groq API key in .env.' };
                continue;
            }

            if (isTokenLimitError(msg, status)) {
                limits = LIMITS.minimal;
                activeContext = [];
                activeSnippet = activeSnippet.slice(0, 600);
                groqKeyIndex = (groqKeyIndex + 1) % keys.length;
                shrinkPass++;
                await sleep(1200);
                if (attempt < keys.length * 3 - 1) continue;
                return { status: 'error', message: 'Groq free tier limit. Clear chat or use a shorter prompt.' };
            }

            if (status === 429) {
                groqKeyIndex = (groqKeyIndex + 1) % keys.length;
                await sleep(1500);
                continue;
            }

            return { status: 'error', message: msg || 'Groq request failed' };
        }
    }

    return { status: 'error', message: 'Groq unavailable' };
};

async function callGroqStream(apiKey, messages, maxTokens, temperature, onChunk) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: GROQ_MODEL, messages, temperature, max_tokens: maxTokens, stream: true }),
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        let detail = errBody;
        try { detail = JSON.parse(errBody).error?.message || errBody; } catch { /* */ }
        const err = new Error(detail || `Groq HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of decoder.decode(value).split('\n')) {
                if (!line.startsWith('data: ')) continue;
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') break;
                try {
                    const content = JSON.parse(dataStr).choices?.[0]?.delta?.content || '';
                    if (content) { fullText += content; if (onChunk) onChunk(content, fullText); }
                } catch { /* */ }
            }
        }
    } finally {
        reader.releaseLock();
    }

    return fullText;
}
