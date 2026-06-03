import { resolveLanguage } from './languageResolver';
import { runJavaScript } from '../runtimes/jsRuntime';
import { runPython } from '../runtimes/pythonRuntime';
import { runHTML } from '../runtimes/htmlRuntime';
import {
    isOnlineCompilerConfigured,
    isRunnableOnOnlineCompiler,
    runProjectFile,
} from '../services/onlineCompiler';

export async function executeFile(file, allFiles = [], cwd = '/') {
    if (!file || !file.name) return 'No file selected for execution.';

    const language = resolveLanguage(file.name);
    const code = file.content || '';

    if (isOnlineCompilerConfigured() && isRunnableOnOnlineCompiler(file.name)) {
        const result = await runProjectFile(file);
        if (result.formatted) return result.formatted.replace(/\x1b\[[0-9;]*m/g, '');
        return result.error || result.output || 'Execution finished.';
    }

    try {
        switch (language) {
            case 'javascript':
            case 'typescript':
                return await runJavaScript(code);

            case 'python':
                return await runPython(code, allFiles, cwd);

            case 'html':
                return await runHTML(code);

            case 'cpp':
            case 'rust':
            case 'java':
            case 'go':
            case 'csharp':
            case 'php':
            case 'ruby':
                if (!isOnlineCompilerConfigured()) {
                    return `Set VITE_ONLINE_COMPILER_API_KEY in .env to run .${file.name.split('.').pop()} via OnlineCompiler.io (api.onlinecompiler.io).`;
                }
                return `Language .${file.name.split('.').pop()} requires OnlineCompiler API key.`;

            default:
                return `Execution for .${file.name.split('.').pop()} is not supported. Use preview for HTML/React or OnlineCompiler for backend languages.`;
        }
    } catch (err) {
        return `Runtime Error: ${err.message}`;
    }
}

/** Quick compile check for agent quality warnings */
export async function verifyFileExecutes(fileName, content) {
    if (!isOnlineCompilerConfigured() || !isRunnableOnOnlineCompiler(fileName)) {
        return [];
    }
    const snippet = (content || '').trim();
    if (snippet.length < 8) return [];

    const result = await runProjectFile({ name: fileName, content: snippet });
    if (result.ok) return [];
    const msg = (result.error || result.output || 'compile/run failed').slice(0, 200);
    return [`OnlineCompiler: ${msg}`];
}
