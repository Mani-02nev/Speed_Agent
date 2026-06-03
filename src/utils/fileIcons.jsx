/**
 * VS Code–style file icons as inline SVGs.
 * Each icon returns a sized <svg> element matching the extension.
 */

import React from 'react';

const Svg = ({ size = 16, children, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} {...props}>
        {children}
    </svg>
);

// ── Language icons ─────────────────────────────────────────────────────────

export const IconPython = ({ size = 16 }) => (
    <Svg size={size}>
        {/* Python blue/yellow — simplified snake logo */}
        <path d="M8 1.5C5.5 1.5 4 2.8 4 4.5V6h4v.5H2.5C1.4 6.5 0.5 7.4 0.5 8.5v3C0.5 12.6 1.4 13.5 2.5 13.5H4v-1.5c0-1.1.9-2 2-2h4c1.1 0 2-.9 2-2V4.5C12 2.8 10.5 1.5 8 1.5z" fill="#3B82F6"/>
        <path d="M8 14.5c2.5 0 4-1.3 4-3V10H8v-.5h5.5c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2H12v1.5c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v3c0 1.7 1.5 3 4 3z" fill="#FACC15"/>
        <circle cx="6.2" cy="4" r=".8" fill="white"/>
        <circle cx="9.8" cy="12" r=".8" fill="white"/>
    </Svg>
);

export const IconJavaScript = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#FACC15"/>
        <path d="M4.5 11.5c.3.5.7.9 1.5.9.7 0 1.2-.4 1.2-1.1V7H8.5v4.3c0 1.5-.9 2.2-2.1 2.2-1.1 0-1.8-.6-2.1-1.3l1.2-.7zM9.5 11.3c.4.6.9 1.1 1.8 1.1.8 0 1.3-.4 1.3-.9 0-.6-.5-.9-1.3-1.2l-.5-.2c-1.2-.5-2-.9-2-2.1 0-1.1.8-1.9 2.2-1.9 1 0 1.6.3 2.1 1.1l-1.1.7c-.2-.4-.6-.7-1-.7-.5 0-.8.3-.8.7 0 .5.3.7 1.1 1l.5.2c1.4.6 2.1 1.1 2.1 2.3 0 1.3-1 2.1-2.5 2.1-1.4 0-2.3-.7-2.7-1.6l1.3-.6z" fill="#1A1A1A"/>
    </Svg>
);

export const IconTypeScript = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#3B82F6"/>
        <path d="M2 8.5h5V10H5.5v5H4V10H2V8.5zM8.5 12.8c.2.4.6.8 1.3.8.6 0 1-.3 1-.8 0-.5-.3-.7-1-1l-.3-.1c-1-.4-1.6-.9-1.6-1.9 0-1 .8-1.7 1.9-1.7.8 0 1.4.3 1.8 1l-1 .6c-.2-.4-.5-.6-.8-.6s-.6.2-.6.6c0 .4.2.6.9.9l.3.1c1.2.5 1.8 1 1.8 2 0 1.1-.9 1.8-2.2 1.8-1.2 0-2-.6-2.3-1.4l1.1-.5z" fill="white"/>
    </Svg>
);

export const IconReact = ({ size = 16 }) => (
    <Svg size={size}>
        {/* React atom */}
        <ellipse cx="8" cy="8" rx="7" ry="3" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(0 8 8)"/>
        <ellipse cx="8" cy="8" rx="7" ry="3" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(60 8 8)"/>
        <ellipse cx="8" cy="8" rx="7" ry="3" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(120 8 8)"/>
        <circle cx="8" cy="8" r="1.5" fill="#61DAFB"/>
    </Svg>
);

export const IconTSX = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#818CF8"/>
        <ellipse cx="8" cy="8" rx="5.5" ry="2.2" stroke="white" strokeWidth="1" fill="none"/>
        <ellipse cx="8" cy="8" rx="5.5" ry="2.2" stroke="white" strokeWidth="1" fill="none" transform="rotate(60 8 8)"/>
        <ellipse cx="8" cy="8" rx="5.5" ry="2.2" stroke="white" strokeWidth="1" fill="none" transform="rotate(120 8 8)"/>
        <circle cx="8" cy="8" r="1.2" fill="white"/>
    </Svg>
);

export const IconHTML = ({ size = 16 }) => (
    <Svg size={size}>
        <path d="M2 1l1.2 13L8 15.5l4.8-1.5L14 1H2z" fill="#E44D26"/>
        <path d="M8 14.3l3.9-1.1.8-9.2H8v10.3z" fill="#F16529"/>
        <path d="M8 6.5H5.5l.2 2H8v-2zM8 10.5l-2-.5-.1-1.5H4.3l.3 3L8 12.6v-2.1z" fill="#EBEBEB"/>
        <path d="M8 6.5v2h2.1l-.2 2.3L8 11.4v2.1l3.7-1.1.3-3.3.3-2.6H8z" fill="white"/>
    </Svg>
);

export const IconCSS = ({ size = 16 }) => (
    <Svg size={size}>
        <path d="M2 1l1.2 13L8 15.5l4.8-1.5L14 1H2z" fill="#1572B6"/>
        <path d="M8 14.3l3.9-1.1.8-9.2H8v10.3z" fill="#33A9DC"/>
        <path d="M8 6.5H5.3l.1 1.5H8v-1.5zM8 10.2l-1.9-.5-.1-1.3H4.4l.3 2.8L8 12.4v-2.2z" fill="#EBEBEB"/>
        <path d="M8 6.5v1.5h2l-.2 2.1L8 11v2.1l3.7-1.1.3-5.5H8z" fill="white"/>
    </Svg>
);

export const IconJSON = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M4.5 5c-.8 0-1.3.5-1.3 1.2v1.3c0 .5-.3.8-.7.9.4.1.7.4.7.9v1.3c0 .7.5 1.2 1.3 1.2" stroke="#FACC15" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        <path d="M11.5 5c.8 0 1.3.5 1.3 1.2v1.3c0 .5.3.8.7.9-.4.1-.7.4-.7.9v1.3c0 .7-.5 1.2-1.3 1.2" stroke="#FACC15" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        <circle cx="6.5" cy="8" r=".8" fill="#FACC15"/>
        <circle cx="8" cy="8" r=".8" fill="#FACC15"/>
        <circle cx="9.5" cy="8" r=".8" fill="#FACC15"/>
    </Svg>
);

export const IconMarkdown = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M2.5 11V5h1.5l2 3 2-3H9.5v6H8V7.5L6 10.5h-.5L3.5 7.5V11H2.5zM11 11L9 8h1.5V5h1.5v3H13.5L11 11z" fill="#94A3B8"/>
    </Svg>
);

export const IconRust = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M8 2.5l.4.8H9l-.5.4.2.8-.7-.4-.7.4.2-.8L7 3.3h.6L8 2.5z" fill="#F97316"/>
        <circle cx="8" cy="8" r="4.5" stroke="#F97316" strokeWidth="1.2" fill="none"/>
        <circle cx="8" cy="8" r="2" fill="#F97316"/>
        <path d="M3.5 6.5h9M3.5 9.5h9" stroke="#F97316" strokeWidth=".8" opacity=".5"/>
    </Svg>
);

export const IconGo = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M2 7.5c0-.5.2-.8.7-.8h4.8v1.6H4.8c.2.8.8 1.3 1.6 1.3 1.2 0 1.8-.9 1.8-2s-.7-2-1.8-2C5.3 5.6 4.6 6.2 4.4 7H2.7C3 5.4 4.3 4.2 6.4 4.2c2.2 0 3.6 1.4 3.6 3.4s-1.4 3.4-3.6 3.4C4.2 11 2.8 9.6 2.5 8c-.1-.2-.5-.2-.5-.5zM10.5 6h1.5v1.7c0 .8.3 1.3 1 1.3s1-.5 1-1.3V6H15.5v1.8c0 1.4-.8 2.2-2 2.2s-2-.8-2-2.2V6z" fill="#00ACD7"/>
    </Svg>
);

export const IconJava = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M6.2 10.5s-.5.3.4.4c1 .1 1.5.1 2.6-.1 0 0 .3.2.7.3-2.4 1-5.4-.1-3.7-.6zM5.9 9s-.6.4.5.5c1.2.1 2.2.1 3.8-.2 0 0 .2.2.5.3C7.9 10.4 4.5 9.6 5.9 9z" fill="#EA2D2E"/>
        <path d="M8.3 5.5c.9 1-1 2.7-1 2.7S9.2 7 8.8 6c-.4-1-3.7-2.8 0-.5z" fill="#EA2D2E"/>
        <path d="M9.8 11.5s.4.3-.4.5c-1.4.4-5.7.5-6.9 0-.4-.2.4-.4.7-.5.1 0 .3 0 .3 0C2.3 11 1.2 11.5 2 12c2.4.8 7.6.4 8.2-1 0 0-.2.3-.4.5zM6.5 7.8s-2.3.5-1 .7c.5.1 1.5 0 2.4-.1.7-.1 1.5-.3 1.5-.3s-.3.1-.5.2C7 8.8 4 9 3.8 8.5c-.3-.5 2.7-.7 2.7-.7zM9.3 10s-3.3.7-1.2.9c.8.1 2.4 0 3.9-.2 0 0 .4.2.6.3C10.8 11.5 7 11.2 6.2 11c-.7-.2 3.1-.8 3.1-1z" fill="#EA2D2E"/>
        <path d="M10.1 3.5s1.3 1.3-1.2 3.3c-2 1.6-.5 2.5 0 3.5-1.2-1-2-1.9-1.5-2.8.7-1.3 2.8-2 2.7-4z" fill="#EA2D2E"/>
    </Svg>
);

export const IconCPP = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M8 2.5C5 2.5 2.5 5 2.5 8S5 13.5 8 13.5c1.7 0 3.2-.8 4.2-2l-1.3-.8C10.2 11.7 9.2 12.2 8 12.2c-2.3 0-4.2-1.9-4.2-4.2S5.7 3.8 8 3.8c1.2 0 2.3.5 3 1.4l1.3-.8C11.3 3.2 9.8 2.5 8 2.5z" fill="#649AD2"/>
        <path d="M13.5 6.5v1H12v1.5h-1V7.5h-1.5v-1H11V5h1v1.5h1.5zM15.5 6.5v1H14v1.5h-1V7.5h-1.5v-1H13V5h1v1.5h1.5z" fill="#649AD2"/>
    </Svg>
);

export const IconC = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M8.5 2.5C5.2 2.5 2.5 5 2.5 8S5.2 13.5 8.5 13.5c1.9 0 3.5-.9 4.6-2.2l-1.4-.9C11 11.4 9.8 12 8.5 12 6.2 12 4.2 10.2 4.2 8S6.2 4 8.5 4c1.3 0 2.5.7 3.2 1.6l1.4-.9C12 3.4 10.4 2.5 8.5 2.5z" fill="#649AD2"/>
    </Svg>
);

export const IconShell = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M3 5l3.5 3L3 11" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M8 11h5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
);

export const IconYAML = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M3 4h10M3 8h10M3 12h6" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="11" cy="12" r="1.5" fill="#FB923C"/>
    </Svg>
);

export const IconEnv = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M3 5h4M3 8h6M3 11h4" stroke="#FACC15" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="12" cy="8" r="2.5" stroke="#FACC15" strokeWidth="1.2" fill="none"/>
        <circle cx="12" cy="8" r=".8" fill="#FACC15"/>
    </Svg>
);

export const IconDocker = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M2.5 8.5h11c.3-1-.1-2.5-1.5-3.2-.4-.2-.9-.3-1.4-.2C10.2 3.8 9 3 7.5 3c-.6 0-1.2.2-1.7.6A2.8 2.8 0 003.8 7c-.8.3-1.4 1-.8 1.5z" fill="#2496ED"/>
        <rect x="4" y="6" width="2" height="2" rx=".3" fill="white"/>
        <rect x="7" y="6" width="2" height="2" rx=".3" fill="white"/>
        <rect x="10" y="6" width="2" height="2" rx=".3" fill="white"/>
        <rect x="4" y="3.5" width="2" height="2" rx=".3" fill="white"/>
        <rect x="7" y="3.5" width="2" height="2" rx=".3" fill="white"/>
    </Svg>
);

export const IconGit = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <circle cx="5" cy="4.5" r="1.5" stroke="#F05032" strokeWidth="1.2" fill="none"/>
        <circle cx="5" cy="11.5" r="1.5" stroke="#F05032" strokeWidth="1.2" fill="none"/>
        <circle cx="11" cy="7.5" r="1.5" stroke="#F05032" strokeWidth="1.2" fill="none"/>
        <path d="M5 6v4M5 6c0-1 .5-1.5 1.5-1.5H9a1.5 1.5 0 011.5 1.5v1" stroke="#F05032" strokeWidth="1.2" fill="none"/>
    </Svg>
);

export const IconSQL = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <ellipse cx="8" cy="5.5" rx="4.5" ry="1.8" stroke="#60A5FA" strokeWidth="1.1" fill="none"/>
        <path d="M3.5 5.5v5c0 1 2 1.8 4.5 1.8s4.5-.8 4.5-1.8v-5" stroke="#60A5FA" strokeWidth="1.1" fill="none"/>
        <path d="M3.5 8c0 1 2 1.8 4.5 1.8S12.5 9 12.5 8" stroke="#60A5FA" strokeWidth="1.1" fill="none"/>
    </Svg>
);

export const IconTailwind = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M4 8c.5-2 2-3 3.5-2.5C8.8 6 8.5 7.5 10 7.5c1.5 0 2-1 2.5-2C12 7.5 11 9.5 9.5 9.5 8 9.5 7.5 8 6 8c-1.5 0-2 1-2.5 2C4 8.8 4 8.5 4 8z" fill="#38BDF8"/>
        <path d="M7.5 10.5c.5-2 2-3 3.5-2.5 1.3.5 1 2 2.5 2 .8 0 1.3-.4 1.6-.9-.5 2-1.5 3.4-3 3.4-1.5 0-2-1.5-3.5-1.5-.8 0-1.3.4-1.6.9.2-.5.3-.9.5-1.4z" fill="#38BDF8" opacity=".7"/>
    </Svg>
);

export const IconVite = ({ size = 16 }) => (
    <Svg size={size}>
        <path d="M14.5 2L8.5 13.5 2.5 2h3L8.5 8 11 2h3.5z" fill="#FACC15"/>
        <path d="M8.5 2.5L6.5 6h4L8.5 2.5z" fill="#818CF8"/>
    </Svg>
);

export const IconTOML = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M3 4h10M3 7h7M3 10h5M3 13h8" stroke="#A78BFA" strokeWidth="1.3" strokeLinecap="round"/>
    </Svg>
);

export const IconXML = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M4.5 5.5L2.5 8l2 2.5M11.5 5.5L13.5 8l-2 2.5" stroke="#FB923C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M9.5 5l-3 6" stroke="#FB923C" strokeWidth="1.3" strokeLinecap="round"/>
    </Svg>
);

export const IconScss = ({ size = 16 }) => (
    <Svg size={size}>
        <rect width="16" height="16" rx="2" fill="#1E1E1E"/>
        <path d="M8 3.5c2.2 0 4 .8 4 1.8 0 .7-.8 1.3-2 1.7-1.6.5-2 .8-2 1.3 0 .6.8.9 1.6.9.6 0 1.1-.1 1.6-.4l.5 1.2c-.7.4-1.4.5-2.1.5C7.3 10.5 6 9.7 6 8.3c0-1 .7-1.7 2.2-2.2 1.2-.4 1.5-.7 1.5-1.1 0-.5-.6-.8-1.5-.8-.6 0-1.2.1-1.8.4L5.8 3.4C6.4 3.1 7.2 3.5 8 3.5z" fill="#CF649A"/>
        <path d="M5.5 11.5c.3.5.8.8 1.5 1 .8.2 2 .2 2.8-.2.6-.3.7-.7.4-1-.2-.3-.7-.4-1.3-.5-.5-.1-1.2-.2-1.7-.6-.4-.3-.5-.8-.2-1.2" stroke="#CF649A" strokeWidth=".8" fill="none"/>
    </Svg>
);

export const IconFile = ({ size = 16 }) => (
    <Svg size={size}>
        <path d="M3 2h7l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2z" stroke="#4B5563" strokeWidth="1.2" fill="none"/>
        <path d="M10 2v3h3" stroke="#4B5563" strokeWidth="1.2" fill="none"/>
        <path d="M5 7h6M5 9.5h6M5 12h4" stroke="#4B5563" strokeWidth="1" strokeLinecap="round" opacity=".5"/>
    </Svg>
);

// ── Icon map ───────────────────────────────────────────────────────────────

const ICON_MAP = {
    // Web
    html:       IconHTML,
    htm:        IconHTML,
    css:        IconCSS,
    scss:       IconScss,
    sass:       IconScss,
    // JavaScript
    js:         IconJavaScript,
    mjs:        IconJavaScript,
    cjs:        IconJavaScript,
    jsx:        IconReact,
    // TypeScript
    ts:         IconTypeScript,
    tsx:        IconTSX,
    // Python
    py:         IconPython,
    pyw:        IconPython,
    // Data / Config
    json:       IconJSON,
    jsonc:      IconJSON,
    yaml:       IconYAML,
    yml:        IconYAML,
    toml:       IconTOML,
    xml:        IconXML,
    env:        IconEnv,
    // Docs
    md:         IconMarkdown,
    mdx:        IconMarkdown,
    txt:        IconMarkdown,
    // Systems
    rs:         IconRust,
    go:         IconGo,
    java:       IconJava,
    cpp:        IconCPP,
    cc:         IconCPP,
    cxx:        IconCPP,
    c:          IconC,
    h:          IconC,
    // Shell
    sh:         IconShell,
    bash:       IconShell,
    zsh:        IconShell,
    // Other
    sql:        IconSQL,
    dockerfile: IconDocker,
    gitignore:  IconGit,
    // Tooling
    'vite.config': IconVite,
    'tailwind.config': IconTailwind,
};

/**
 * Returns the right icon component for a filename.
 * Checks full filename first (e.g. "Dockerfile"), then extension.
 */
export function getFileIcon(name, size = 16) {
    if (!name) return <IconFile size={size} />;
    const lower = name.toLowerCase();
    // Special full-name matches
    if (lower === 'dockerfile')            return <IconDocker size={size} />;
    if (lower === '.gitignore' || lower === '.gitattributes') return <IconGit size={size} />;
    if (lower === '.env' || lower.startsWith('.env.')) return <IconEnv size={size} />;
    if (lower.startsWith('vite.config'))   return <IconVite size={size} />;
    if (lower.startsWith('tailwind.config')) return <IconTailwind size={size} />;
    // Extension match
    const ext = lower.split('.').pop();
    const IconComp = ICON_MAP[ext];
    return IconComp ? <IconComp size={size} /> : <IconFile size={size} />;
}
