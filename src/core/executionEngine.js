import { resolveLanguage } from './languageResolver';
import { runJavaScript } from '../runtimes/jsRuntime';
import { runPython } from '../runtimes/pythonRuntime';
import { runHTML } from '../runtimes/htmlRuntime';

export async function executeFile(file, allFiles = [], cwd = '/') {
    if (!file || !file.name) return 'No file selected for execution.';

    const language = resolveLanguage(file.name);
    const code = file.content || '';

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
                return 'WASM Compilation for C++/Rust is under development. Use JS/Python for now.';

            default:
                return `Execution for .${file.name.split('.').pop()} is not supported natively yet.`;
        }
    } catch (err) {
        return `Runtime Error: ${err.message}`;
    }
}
