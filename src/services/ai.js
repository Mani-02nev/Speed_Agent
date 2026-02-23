const GROQ_KEYS = [
    import.meta.env.VITE_GROQ_KEY_1,
    import.meta.env.VITE_GROQ_KEY_2,
    import.meta.env.VITE_GROQ_KEY_3
].filter(Boolean);

let currentKeyIndex = 0;

export const generateAIResponse = async ({ prompt, context, onChunk }) => {
    if (GROQ_KEYS.length === 0) {
        return { status: "error", message: "AI service temporarily unavailable: Missing credentials." };
    }

    const systemPrompt = {
        role: 'system',
        content: `🎯 SPEED AGENT IDE V1.0
You are a senior full-stack SaaS architect. Your goal is to write high-quality, production-ready code.

FORMATTING RULE:
For EVERY code block, you MUST provide a file header.
Example:
# File: filename.ext
\`\`\`language
code
\`\`\`

RULES:
1. Suggest full file contents for new or modified files.
2. MINIMAL CHAT: Output 1 sentence description, then the code block.
3. NEVER print raw source code directly without the # File: marker.
4. Focus only on requested changes to save tokens.`
    };

    const messages = [systemPrompt, ...context, { role: 'user', content: prompt }];

    // Rotation System
    for (let attempts = 0; attempts < GROQ_KEYS.length; attempts++) {
        const key = GROQ_KEYS[currentKeyIndex];
        try {
            return await callGroqStream(key, messages, onChunk);
        } catch (error) {
            // Rotate on Quota (429) or Payload Large (413) or System Error
            if (error.message.includes('Quota exceeded') || error.message.includes('Payload too large') || error.message.includes('500')) {
                currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
                console.warn(`Speed Agent: Node ${currentKeyIndex + 1} transition...`);
                if (attempts === GROQ_KEYS.length - 1) {
                    return { status: "quota_exceeded", message: "AI service temporarily unavailable (All nodes exhausted)." };
                }
                continue;
            }
            return { status: "error", message: error.message };
        }
    }
};

async function callGroqStream(key, messages, onChunk) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages,
            temperature: 0.1, // Max precision
            max_tokens: 4096, // Reduced for 413 safety
            stream: true,
        }),
    });

    if (!response.ok) {
        if (response.status === 429) throw new Error('Quota exceeded.');
        if (response.status === 413) throw new Error('Payload too large.');
        throw new Error(`System Error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') break;
                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices[0]?.delta?.content || "";
                        if (content) {
                            fullText += content;
                            if (onChunk) onChunk(content, fullText);
                        }
                    } catch (e) { }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    return fullText;
}
