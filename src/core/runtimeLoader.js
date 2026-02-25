/**
 * Runtime Loader for browser-native execution engines (Pyodide, WASM, etc.)
 */

export async function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export async function loadPyodideRuntime() {
    if (window.loadPyodide) return window.loadPyodide;

    await loadScript("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");
    return window.loadPyodide;
}
