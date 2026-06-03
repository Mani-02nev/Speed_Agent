/**
 * In-browser preview — Sandpack / CodeSandbox bundler (React, static HTML, Vite)
 */

const DEFAULT_BUNDLER = 'https://sandpack-bundler.codesandbox.io';

export function getSandpackProviderOptions() {
    return {
        bundlerURL: DEFAULT_BUNDLER,
        bundlerTimeOut: 120000,
        recompileMode: 'immediate',
        recompileDelay: 300,
    };
}

export function getSandpackCustomSetup(hasReact) {
    if (!hasReact) return {};
    return {
        dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            'react-router-dom': '^6.20.0',
            'lucide-react': '^0.292.0',
            'framer-motion': '^10.16.4',
        },
    };
}

export function getSandpackPreviewStatus() {
    return {
        runtime: 'Sandpack (CodeSandbox bundler)',
        bundler: DEFAULT_BUNDLER,
    };
}
