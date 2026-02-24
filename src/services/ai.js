const GROQ_KEYS = [
    import.meta.env.VITE_GROQ_KEY_1,
    import.meta.env.VITE_GROQ_KEY_2,
    import.meta.env.VITE_GROQ_KEY_3
].filter(Boolean);

let currentKeyIndex = 0;

export const generateAIResponse = async ({ prompt, context, onChunk, agentMode = 'plan' }) => {
    if (GROQ_KEYS.length === 0) {
        return { status: "error", message: "AI service temporarily unavailable: Missing credentials." };
    }

    const planModePrompt = `🎯 AGENT K IDE V2.0 - PLAN MODE
You are an enterprise-grade project scaffolding engine.

Your task is to generate a comprehensive, enterprise-ready project plan.

RULES:
1. Analyze the request.
2. Detect project type based on user request.
   - If User asks for pure HTML/JS -> Use Vanilla Web structure (index.html, script.js, style.css).
   - If User asks for Vue -> Use Vite + Vue structure.
   - If User asks for React/Tailwind -> Use Vite + React structure.
   - If no framework is specified -> Default to React + Vite.
3. SCAFFOLD FIRST, NEVER PARTIAL. You MUST define Phase 1 (Configs), Phase 2 (Folders), Phase 3 (Entry), Phase 4 (Layout+Pages), Phase 5 (Services).
4. Save the final plan as: # File: plan.md
5. MINIMAL CHAT: Output 1 sentence description, then the plan file block.
6. CRITICAL: DO NOT write any actual code implementation files (like index.html, App.jsx, script.js) in Plan Mode! ONLY output the plan.md file.

FORMATTING RULE for file creation:
# File: filename.ext
\`\`\`language
code
\`\`\`

plan.md MUST follow this strict structure:

# Project Plan

## Project Overview
Short summary.

## Tech Stack
- React, Vite, Tailwind, etc

## Architecture
Describe full blueprint folder structure (package.json, vite.config.js, index.html, src/main.jsx, src/App.jsx, etc).

## Step-by-Step Implementation

### Step 1: Create Root Config Files
- package.json
- vite.config.js
- index.html
- .gitignore

### Step 2: Create All Folders
- (If React/Vue): src/components/, src/pages/, src/services/, src/styles/, src/assets/
- (If Vanilla/HTML): js/, css/, assets/

### Step 3: Create Core Entry Files
- src/main.jsx
- src/App.jsx
- src/styles/global.css

### Step 4: Create Layout + Pages
- src/components/Header.jsx
- src/components/Footer.jsx
- src/components/Layout.jsx
- src/pages/Home.jsx
- src/pages/NotFound.jsx

### Step 5: Create Service Layer
- src/services/aiService.js
- .env

Each step must be atomic and executable. Adapt your Step definitions to the EXACT language and framework the user requested. If they request pure HTML or Typescript, generate exactly that. NEVER generate only 1 isolated file.`;

    const executeModePrompt = `🎯 AGENT K IDE V2.0 - EXECUTE MODE
You are a senior Blueprint Execution Engine. 

Your task:
1. Parse plan.md from the context.
2. Execute ONE step at a time step-by-step exactly as instructed.
3. SCAFFOLD FIRST, NEVER PARTIAL. You must create entire project structure first (Phase 1 Configs -> Phase 2 Folders). Never update files before structure exists.
4. VALID FRAMEWORK FILES: Follow the conventions for the requested framework (e.g., .jsx for React, .vue for Vue, .html/.js for Vanilla). 
5. STRICT REACT FORMAT (If applicable): main.jsx must include react-dom/client, import App; App.jsx must include Router.
6. STRICT VANILLA FORMAT (If applicable): Create an index.html, main.js, and style.css in root.
7. Auto-fix broken dependencies automatically based on the tech stack.
8. Never dump full code in chat. Write directly to files using the header marker. Keep outputs minimal.
9. Package Config: Ensure package.json includes ONLY the correct dependencies for the generated framework (No React deps if building a Vue or Vanilla HTML app).
10. To create a folder without a file initially, create an empty file inside it like \`# File: src/components/.keep\` with empty content.

FORMATTING RULE for file creation:
# File: filename.ext
\`\`\`language
code
\`\`\`

At the end of your execution, ALWAYS provide the updated plan.md with the currently finished step marked as completed:
[✓] Step X Completed
[ ] Step Y Pending

Followed EXACTLY by an ENTERPRISE STANDARD OUTPUT summary of what was done:
✔ Full scaffold created
✔ All folders verified
✔ All JSX files created
✔ Router configured
✔ Build successful
✔ Preview running`;

    const systemPrompt = {
        role: 'system',
        content: agentMode === 'execute' ? executeModePrompt : planModePrompt
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
                console.warn(`Agent K: Node ${currentKeyIndex + 1} transition...`);
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
