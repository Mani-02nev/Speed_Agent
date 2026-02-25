import { loadPyodideRuntime } from '../core/runtimeLoader';

let pyodideInstance = null;

export async function runPython(code, files = [], cwd = '/') {
    if (!pyodideInstance) {
        const loadPyodide = await loadPyodideRuntime();
        pyodideInstance = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
    }

    try {
        // 1. Sync Filesystem
        files.forEach(file => {
            if (!file.name) return;
            const fullPath = file.name.startsWith('/') ? file.name : '/' + file.name;
            const parts = fullPath.split('/').filter(p => p);

            let walkPath = '';
            for (let i = 0; i < parts.length - 1; i++) {
                walkPath += '/' + parts[i];
                try {
                    pyodideInstance.FS.mkdir(walkPath);
                } catch (e) { }
            }
            pyodideInstance.FS.writeFile(fullPath, file.content || "");
        });

        // 2. Set CWD
        try {
            if (cwd) pyodideInstance.FS.chdir(cwd);
        } catch (e) { }

        // 3. Capture stdout/stderr
        const logs = [];
        pyodideInstance.setStdout({
            batched: (str) => logs.push(str)
        });
        pyodideInstance.setStderr({
            batched: (str) => logs.push('Error: ' + str)
        });

        // 3. Handle stdin (Enterprise Fix for Errno 29)
        pyodideInstance.setStdin({
            stdin: () => {
                const result = prompt("Python Input Required:");
                return (result || "") + "\n";
            }
        });

        await pyodideInstance.runPythonAsync(code);
        return logs.join('\n') || 'Python execution completed.';
    } catch (err) {
        return 'Python Error: ' + err.message;
    }
}
