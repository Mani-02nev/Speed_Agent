/** Safe lightweight markdown → HTML for plan preview */

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderPlanMarkdown(markdown) {
    if (!markdown?.trim()) return '';

    const blocks = [];
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    let inCode = false;
    let codeBuf = [];
    let listBuf = [];

    const flushList = () => {
        if (!listBuf.length) return;
        blocks.push(`<ul class="plan-md-ul">${listBuf.map((l) => `<li>${l}</li>`).join('')}</ul>`);
        listBuf = [];
    };

    const flushCode = () => {
        if (!codeBuf.length) return;
        blocks.push(`<pre class="plan-md-pre"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeBuf = [];
    };

    for (const raw of lines) {
        const line = raw.trimEnd();

        if (line.startsWith('```')) {
            if (inCode) {
                flushCode();
                inCode = false;
            } else {
                flushList();
                inCode = true;
            }
            continue;
        }

        if (inCode) {
            codeBuf.push(raw);
            continue;
        }

        if (/^[-*]\s+/.test(line)) {
            listBuf.push(escapeHtml(line.replace(/^[-*]\s+/, '')));
            continue;
        }
        flushList();

        if (/^####\s+/.test(line)) {
            blocks.push(`<h4 class="plan-md-h4">${escapeHtml(line.slice(5))}</h4>`);
        } else if (/^###\s+/.test(line)) {
            blocks.push(`<h3 class="plan-md-h3">${escapeHtml(line.slice(4))}</h3>`);
        } else if (/^##\s+/.test(line)) {
            blocks.push(`<h2 class="plan-md-h2">${escapeHtml(line.slice(3))}</h2>`);
        } else if (/^#\s+/.test(line)) {
            blocks.push(`<h1 class="plan-md-h1">${escapeHtml(line.slice(2))}</h1>`);
        } else if (line === '') {
            blocks.push('<div class="plan-md-spacer"></div>');
        } else {
            blocks.push(`<p class="plan-md-p">${escapeHtml(line)}</p>`);
        }
    }

    flushList();
    flushCode();

    return blocks.join('');
}
