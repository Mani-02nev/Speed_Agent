/** Sanitization + validation for AI-generated patches */

const PLACEHOLDER_RE =
    /<!--\s*[^>]*(populate|placeholder|todo|fixme|will be)[^>]*-->|\/\/\s*(no script|todo)|\/\*\s*todo\s*\*\//i;

const HEADING_FIX_RE = /([^<])(h[1-6])>/gi;

export function hasPlaceholderContent(content) {
    return PLACEHOLDER_RE.test(content || '');
}

/** Parse plan.md file tree lines into path strings */
export function pathsFromPlanTree(planMd) {
    if (!planMd) return [];
    const fence = planMd.match(/##\s*File Structure[\s\S]*?```[\s\S]*?\n([\s\S]*?)```/i);
    const block = fence?.[1] || '';
    const lines = (block || planMd).split('\n');
    const paths = [];
    for (const line of lines) {
        const cleaned = line
            .replace(/^[\s│├└─*]+/, '')
            .replace(/\(.*\)$/, '')
            .trim();
        if (cleaned && /\.[a-z0-9]+$/i.test(cleaned) && !cleaned.includes(' ')) {
            paths.push(cleaned.replace(/\\/g, '/'));
        }
    }
    return [...new Set(paths)];
}

export function sanitizeFileContent(fileName, content, planPaths = []) {
    if (!content) return content;
    let out = content;
    const lower = fileName.toLowerCase();

    if (lower.endsWith('.html')) {
        out = out.replace(HEADING_FIX_RE, '$1<$2>');
        out = out.replace(/<\/(h[1-6])(?![\s>])/gi, '</$1>');
        if (!/<!DOCTYPE/i.test(out) && lower.includes('index.html')) {
            out = `<!DOCTYPE html>\n${out}`;
        }
        if (!/<html[\s>]/i.test(out) && lower.includes('index.html')) {
            out = out.replace(/<!DOCTYPE html>\s*/i, '$&\n<html lang="en">');
            if (!/<\/html>/i.test(out)) out += '\n</html>';
        }
        if (planPaths.includes('styles/main.css')) {
            out = out.replace(/href=["']styles\.css["']/gi, 'href="styles/main.css"');
        }
        for (const p of planPaths.filter((x) => x.startsWith('components/') && x.endsWith('.css'))) {
            const base = p.split('/').pop();
            const wrong = `href="${base}"`;
            if (out.includes(wrong) && !out.includes(`href="${p}"`)) {
                out = out.replace(new RegExp(`href=["']${base}["']`, 'gi'), `href="${p}"`);
            }
        }
    }

    if (lower.endsWith('.css')) {
        out = out.replace(/^\s*-color:\s*#/gm, '    background-color: #');
        out = out.replace(/([^:{}\n])\s*color\s+(#[0-9a-f]{3,8}|rgb)/gi, '$1 color: $2');
        out = out.replace(/#:\s*hover/g, '#cta:hover');
        out = out.replace(/#([a-z][\w-]*):\s*hover/g, '#$1:hover');
        out = out.replace(/(background-color|color):\s*#\s*;/g, '$1: #1a1a2e;');
    }

    if (lower.endsWith('.js')) {
        out = out.replace(/\/\/\s*No script code yet.*\n?/gi, '');
    }

    return out.trim();
}

export function validatePatch(fileName, content, planPaths = []) {
    const issues = [];
    if (!content?.trim()) issues.push('empty file');
    if (hasPlaceholderContent(content)) issues.push('placeholders — need full content');

    const lower = fileName.toLowerCase();

    if (lower === 'styles.css' && planPaths.includes('styles/main.css')) {
        issues.push('wrong file — plan uses styles/main.css');
    }

    if (lower.endsWith('.html')) {
        if (!/<html[\s>]/i.test(content)) issues.push('missing <html>');
        if (/<h[1-6](?![^>]*>)/i.test(content)) issues.push('broken heading tags');
        if (/href=["']styles\.css["']/i.test(content) && planPaths.includes('styles/main.css')) {
            issues.push('link should be styles/main.css');
        }
        if (lower.includes('index.html') && !/<main[\s>]/i.test(content) && !/<section/i.test(content)) {
            issues.push('add semantic sections (main/section)');
        }
    }

    if (lower.endsWith('.css')) {
        if (/[^;{]\s*color\s+#/i.test(content)) issues.push('CSS typo (color needs colon)');
        if (/(background-color|color):\s*#\s*;/i.test(content)) issues.push('empty color value');
        if (/#:\s*hover/i.test(content)) issues.push('invalid # :hover selector');
    }

    if (lower.endsWith('.js')) {
        if (/no script code yet/i.test(content)) issues.push('empty script');
        if (content.trim().length < 40 && !/addEventListener|querySelector|getElementById/i.test(content)) {
            issues.push('script looks incomplete');
        }
    }

    return issues;
}

export function hasCriticalQualityIssues(patches) {
    return patches.some((p) => (p.qualityWarnings?.length || 0) > 0);
}
