/**
 * OnlineCompiler.io — https://api.onlinecompiler.io
 * REST sync: POST /api/run-code-sync/
 * Auth header: Authorization: YOUR_API_KEY
 */

import { normalizeEnvKey } from './ai';

export const ONLINE_COMPILER_BASE = 'https://api.onlinecompiler.io';

/** Compiler id by file extension (see GET /api/compilers/) */
export const COMPILER_BY_EXTENSION = {
    py: 'python-3.14',
    c: 'gcc-15',
    cpp: 'g++-15',
    cc: 'g++-15',
    cxx: 'g++-15',
    java: 'openjdk-25',
    cs: 'dotnet-csharp-9',
    fs: 'dotnet-fsharp-9',
    php: 'php-8.5',
    rb: 'ruby-4.0',
    hs: 'haskell-9.12',
    go: 'go-1.26',
    rs: 'rust-1.93',
    ts: 'typescript-deno',
};

let compilersCache = null;
let compilersCacheAt = 0;
const CACHE_MS = 60 * 60 * 1000;

export function getOnlineCompilerApiKey() {
    return (
        normalizeEnvKey(import.meta.env.VITE_ONLINE_COMPILER_API_KEY) ||
        normalizeEnvKey(import.meta.env.VITE_COMPILER_API_KEY) ||
        normalizeEnvKey(import.meta.env.VITE_Compllier_API_KEY) ||
        normalizeEnvKey(import.meta.env.VITE_COMPLIER_API_KEY) ||
        ''
    );
}

export function isOnlineCompilerConfigured() {
    return getOnlineCompilerApiKey().length >= 16;
}

export function resolveCompilerForFileName(fileName) {
    if (!fileName) return null;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return COMPILER_BY_EXTENSION[ext] || null;
}

export function isRunnableOnOnlineCompiler(fileName) {
    return Boolean(resolveCompilerForFileName(fileName));
}

/**
 * @param {string} compiler
 * @param {string} code
 * @param {string} [input]
 */
export async function runCodeSync(compiler, code, input = '') {
    const apiKey = getOnlineCompilerApiKey();
    if (!apiKey) {
        return {
            ok: false,
            status: 'error',
            output: '',
            error: 'Add VITE_ONLINE_COMPILER_API_KEY to .env (from api.onlinecompiler.io → API Keys), then restart npm run dev.',
            exit_code: 1,
        };
    }

    if (!compiler) {
        return { ok: false, status: 'error', error: 'No compiler for this file type.', output: '', exit_code: 1 };
    }

    if (code.length > 100_000) {
        return { ok: false, status: 'error', error: 'Code exceeds 100KB limit.', output: '', exit_code: 1 };
    }

    const body = { compiler, code, input: input || '' };

    const attempt = async (authHeader) => {
        const response = await fetch(`${ONLINE_COMPILER_BASE}/api/run-code-sync/`, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        return response;
    };

    let response = await attempt(apiKey);
    if (response.status === 401) {
        response = await attempt(`Bearer ${apiKey}`);
    }

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        return {
            ok: false,
            status: 'error',
            output: '',
            error: text || `HTTP ${response.status}`,
            exit_code: response.status,
        };
    }

    if (response.status === 429) {
        return {
            ok: false,
            status: 'error',
            output: '',
            error: 'OnlineCompiler rate limit (max 4 sync requests). Wait and retry.',
            exit_code: 429,
        };
    }

    if (!response.ok) {
        return {
            ok: false,
            status: 'error',
            output: data.output || '',
            error: data.error || data.detail || `HTTP ${response.status}`,
            exit_code: data.exit_code ?? response.status,
        };
    }

    const success = data.status === 'success' && (data.exit_code === 0 || data.exit_code == null);
    return {
        ok: success,
        status: data.status || (success ? 'success' : 'error'),
        output: data.output ?? '',
        error: data.error ?? '',
        exit_code: data.exit_code ?? (success ? 0 : 1),
        signal: data.signal ?? null,
        time: data.time,
        total: data.total,
        memory: data.memory,
    };
}

/** Terminal-friendly formatted output */
export function formatRunResult(result, fileName = '') {
    const lines = [];
    if (fileName) lines.push(`\x1b[36m▶ OnlineCompiler\x1b[0m ${fileName}`);

    if (result.error?.trim()) {
        lines.push(`\x1b[31m${result.error.trim()}\x1b[0m`);
    }
    if (result.output?.trim()) {
        lines.push(result.output.trimEnd());
    }

    if (result.time != null || result.memory != null) {
        const stats = [];
        if (result.time != null) stats.push(`time ${result.time}s`);
        if (result.total != null) stats.push(`total ${result.total}s`);
        if (result.memory != null) stats.push(`mem ${result.memory}KB`);
        lines.push(`\x1b[90m${stats.join(' · ')} · exit ${result.exit_code ?? '?'}\x1b[0m`);
    } else if (result.exit_code != null && result.exit_code !== 0) {
        lines.push(`\x1b[90mexit code ${result.exit_code}\x1b[0m`);
    }

    if (lines.length === (fileName ? 1 : 0)) {
        lines.push(result.ok ? '\x1b[32m(success, no output)\x1b[0m' : '\x1b[31mExecution failed\x1b[0m');
    }

    return lines.join('\n');
}

export async function runProjectFile(file) {
    const compiler = resolveCompilerForFileName(file?.name);
    if (!compiler) {
        return {
            ok: false,
            error: `OnlineCompiler does not support .${file?.name?.split('.').pop()}. Supported: ${Object.keys(COMPILER_BY_EXTENSION).join(', ')}. Use preview for HTML/React.`,
        };
    }
    const result = await runCodeSync(compiler, file.content || '', '');
    return { ...result, formatted: formatRunResult(result, file.name) };
}

export async function fetchCompilersList() {
    if (compilersCache && Date.now() - compilersCacheAt < CACHE_MS) {
        return compilersCache;
    }
    try {
        const res = await fetch(`${ONLINE_COMPILER_BASE}/api/compilers/`);
        if (res.ok) {
            compilersCache = await res.json();
            compilersCacheAt = Date.now();
            return compilersCache;
        }
    } catch {
        /* use static map */
    }
    return Object.entries(COMPILER_BY_EXTENSION).map(([ext, id]) => ({ id, ext }));
}

export function getOnlineCompilerStatus() {
    return {
        configured: isOnlineCompilerConfigured(),
        baseUrl: ONLINE_COMPILER_BASE,
        languages: Object.keys(COMPILER_BY_EXTENSION).length,
        compilers: [...new Set(Object.values(COMPILER_BY_EXTENSION))],
    };
}
