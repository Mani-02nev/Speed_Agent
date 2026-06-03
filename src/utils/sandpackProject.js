/**
 * Build Sandpack file map + template from project files (React, static, TS)
 */

function normalizePath(file, previewRoot) {
    if (!file?.name || file.content == null) return null;
    let path = file.name;
    let content = file.content ?? '';

    if (previewRoot) {
        if (path.startsWith(previewRoot + '/')) path = path.substring(previewRoot.length);
        else if (path !== previewRoot && !path.startsWith(previewRoot + '/')) return null;
    }

    if (!path.startsWith('/')) path = '/' + path;

    if (path === '/src/index.jsx' || path === '/index.jsx') {
        path = path.replace('index.jsx', 'main.jsx');
    }

    if (path.endsWith('.jsx') || path.endsWith('.tsx') || path.endsWith('.js')) {
        content = content
            .replace(/<React\.Strict>/g, '<React.StrictMode>')
            .replace(/<\/React\.Strict>/g, '</React.StrictMode>');
    }

    if (path === '/src/App.jsx' || path === '/App.jsx') {
        if (content.includes('function App') && !content.includes('export default')) {
            content += '\n\nexport default App;\n';
        }
    }

    if (path.endsWith('package.json') && content.trim()) {
        try {
            JSON.parse(content);
        } catch {
            content = JSON.stringify(
                { name: 'mr-k-preview', dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' } },
                null,
                2
            );
        }
    }

    return { path, content };
}

function detectStack(sandpackFiles) {
    let hasReact = false;
    let hasTs = false;
    let hasVue = false;

    for (const [pf, content] of Object.entries(sandpackFiles)) {
        if (pf.endsWith('.tsx') || pf.endsWith('.ts')) hasTs = true;
        if (pf.endsWith('.jsx') || pf.endsWith('.tsx')) hasReact = true;
        if (pf.endsWith('.vue')) hasVue = true;
        if (
            content.includes('from "react"') ||
            content.includes("from 'react'") ||
            content.includes('import React')
        ) {
            hasReact = true;
        }
    }

    if (sandpackFiles['/package.json']) {
        try {
            if (JSON.stringify(JSON.parse(sandpackFiles['/package.json'])).includes('"react"')) {
                hasReact = true;
            }
        } catch {
            /* */
        }
    }

    let envTemplate = 'static';
    if (hasVue) envTemplate = 'vue-vite';
    else if (hasReact && hasTs) envTemplate = 'vite-react-ts';
    else if (hasReact) envTemplate = 'vite-react';
    else if (hasTs) envTemplate = 'vanilla-ts';
    else envTemplate = 'static';

    return { hasReact, hasTs, hasVue, envTemplate };
}

/** Ensure index.html links all CSS/JS files present in the project */
function healStaticIndexHtml(sandpackFiles) {
    const cssPaths = Object.keys(sandpackFiles).filter((p) => p.endsWith('.css') && p !== '/styles.css');
    const jsPaths = Object.keys(sandpackFiles).filter(
        (p) => (p.endsWith('.js') || p.endsWith('.mjs')) && !p.includes('node_modules')
    );

    let html = sandpackFiles['/index.html'] || '';
    const isNew = !html;

    if (!html) {
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
</head>
<body>
  <main id="app"></main>
</body>
</html>`;
    }

    if (!html.includes('<!DOCTYPE')) html = `<!DOCTYPE html>\n${html}`;

    const headClose = html.indexOf('</head>');
    const insertPoint = headClose !== -1 ? headClose : html.indexOf('<body');
    let headLinks = '';

    for (const cssPath of cssPaths) {
        const href = cssPath.startsWith('/') ? cssPath.slice(1) : cssPath;
        const tag = `href="${href}"`;
        if (!html.includes(tag)) {
            headLinks += `  <link rel="stylesheet" href="${href}" />\n`;
        }
    }

    if (headLinks && insertPoint !== -1) {
        html = html.slice(0, insertPoint) + headLinks + html.slice(insertPoint);
    }

    const scriptPath =
        jsPaths.find((p) => /\/script\.js$|\/main\.js$/.test(p)) ||
        jsPaths.find((p) => !p.includes('vite')) ||
        jsPaths[0];

    if (scriptPath) {
        const src = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
        if (!html.includes(`src="${src}"`)) {
            html = html.replace(/<\/body>/i, `  <script src="${src}" defer></script>\n</body>`);
        }
    }

    sandpackFiles['/index.html'] = html;
    return { html, isNew };
}

function healReactEntry(sandpackFiles, hasReact) {
    if (!hasReact) return '/index.js';

    const entryPoints = [
        '/src/main.jsx',
        '/src/main.tsx',
        '/src/main.js',
        '/src/index.jsx',
        '/src/index.js',
        '/main.jsx',
        '/main.js',
        '/index.jsx',
        '/App.jsx',
    ];
    const entryPoint = entryPoints.find((ep) => sandpackFiles[ep]) || '/src/main.jsx';

    if (!sandpackFiles['/package.json']) {
        sandpackFiles['/package.json'] = JSON.stringify(
            {
                name: 'mr-k-preview',
                private: true,
                dependencies: {
                    react: '^18.2.0',
                    'react-dom': '^18.2.0',
                },
            },
            null,
            2
        );
    }

    if (!sandpackFiles['/index.html']) {
        sandpackFiles['/index.html'] = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Preview</title></head>
<body><div id="root"></div><script type="module" src="${entryPoint}"></script></body>
</html>`;
    } else {
        if (!sandpackFiles['/index.html'].includes('id="root"')) {
            sandpackFiles['/index.html'] = sandpackFiles['/index.html'].replace(
                /<body[^>]*>/i,
                (m) => `${m}\n    <div id="root"></div>`
            );
        }
        if (!sandpackFiles['/index.html'].includes(entryPoint)) {
            sandpackFiles['/index.html'] = sandpackFiles['/index.html'].replace(
                /<script[^>]*src=["'][^"']*["'][^>]*>\s*<\/script>/i,
                `<script type="module" src="${entryPoint}"></script>`
            );
            if (!sandpackFiles['/index.html'].includes(entryPoint)) {
                sandpackFiles['/index.html'] = sandpackFiles['/index.html'].replace(
                    /<\/body>/i,
                    `  <script type="module" src="${entryPoint}"></script>\n</body>`
                );
            }
        }
    }

    if (!sandpackFiles[entryPoint] && entryPoint === '/src/main.jsx') {
        sandpackFiles['/src/main.jsx'] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
`;
    }

    if (!sandpackFiles['/src/App.jsx'] && !sandpackFiles['/App.jsx']) {
        sandpackFiles['/src/App.jsx'] = `export default function App() {
  return <main style={{ padding: 24, fontFamily: "system-ui" }}><h1>Preview ready</h1></main>;
}
`;
    }

    return entryPoint;
}

/**
 * @param {Array<{ name: string, content: string }>} files
 * @param {string} [previewRootPath]
 */
export function buildSandpackProject(files, previewRootPath = '') {
    const sandpackFiles = {};

    for (const f of files) {
        const normalized = normalizePath(f, previewRootPath);
        if (!normalized) continue;
        sandpackFiles[normalized.path] = normalized.content;
    }

    const { hasReact, hasTs, envTemplate } = detectStack(sandpackFiles);

    let entryPoint;
    if (hasReact) {
        entryPoint = healReactEntry(sandpackFiles, true);
    } else {
        healStaticIndexHtml(sandpackFiles);
        entryPoint =
            ['/script.js', '/main.js', '/index.js', '/src/main.js'].find((ep) => sandpackFiles[ep]) ||
            '/index.html';
    }

    return {
        sandpackFiles,
        envTemplate,
        entryPoint,
        hasReact,
        hasTs,
        startRoute: hasReact ? undefined : '/index.html',
    };
}
