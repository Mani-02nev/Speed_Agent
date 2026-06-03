# Mr K Agent — Sample test prompts

Copy any prompt below into the agent panel inside a project (`/project/:id`).

**Workflow:** Describe project → read full **implementation plan** → **Approve plan** (no code yet) → **Build step 1** (or type "implement step 1").

**Groq free tier:** Keep prompts short (~6000 tokens/min limit). Clear chat if you hit rate errors. Build one step at a time.

**Preview:** React + HTML/CSS/JS → Sandpack browser preview.

**Run code:** `VITE_ONLINE_COMPILER_API_KEY` from [api.onlinecompiler.io](https://api.onlinecompiler.io) → terminal `run` or `run script.py` (Python, C/C++, Java, Go, Rust, TypeScript, etc.).

---

## Quick smoke test (vanilla web)

**Step 1 — paste in chat (gets plan.md preview)**

```
Production portfolio for Mr K — Agent for Mr'K Eco.

Sections: hero (name, role, CTA "View Projects"), projects grid (3 cards with title, description, link), contact (email + social).

Stack: vanilla HTML/CSS/JS only. File tree MUST be:
index.html
styles/main.css
components/hero.css
components/projects.css
components/contact.css
script.js
images/ (logo.png, project1-3.jpg placeholders as paths only)

Dark glass UI, responsive, accessible. Real copy — no lorem, no HTML comments like "populate here".

Output only plan.md with Build Step 1 = all core files fully specified.
```

**Step 2 — Click Approve plan** (saves plan.md only; no HTML/CSS/JS files yet)

**Step 3 — Click Build step 1** or paste:

```
Implement Step 1 from plan.md: every file with complete valid code. Exact paths styles/main.css and components/*.css. Full hero, 3 projects in JS/HTML, working contact links. No placeholders.
```

**Step 3 — if needed**

```
Implement Step 2 from plan.md. Polish styles and responsive layout. Complete files only.
```

---

## React + Vite app

**Plan mode**

```
Plan a production-ready React 19 + Vite app: task manager.
Features: add/edit/delete tasks, filter (all/active/done), localStorage persistence,
clean UI with Tailwind-style CSS in a single global.css (no Tailwind install required).
Include full folder tree and numbered build steps. Output only plan.md.
```

**Build mode**

```
Implement the next pending step in plan.md with complete, runnable files. No TODOs or placeholder text.
```

---

## E-commerce landing (production polish)

**Plan mode**

```
Design a deployable landing page for "Mr'K Eco Store":
product hero, 4 product cards with price and "Add to cart" buttons (cart state in JS),
testimonials strip, footer with links.
Stack: vanilla HTML, CSS, JavaScript. Mobile-first, semantic HTML, meta tags for SEO.
Output only plan.md with phases from structure → styles → interactions.
```

---

## Dashboard / SaaS UI

**Plan mode**

```
Create an implementation plan for a SaaS analytics dashboard (React + Vite):
sidebar nav, top bar with user menu, main area with 3 stat cards and a simple bar chart (CSS or canvas),
settings page route. Use react-router-dom. Production-quality components, no lorem ipsum.
Output only plan.md.
```

**Build mode (full continuation)**

```
Continue implementing all remaining steps in plan.md with production-quality code.
```

---

## Fix / iterate prompts

Use these after you already have files in the project:

**Plan mode**

```
Review the current workspace files and update plan.md with a new step to add dark/light theme toggle
and improve mobile navigation. Output only the updated plan.md.
```

**Build mode**

```
Fix any broken imports and make the preview work. Update only the files that need changes.
```

```
Improve accessibility: focus states, aria labels on buttons, and color contrast. Apply minimal targeted edits.
```

---

## One-shot description (minimal)

**Plan mode**

```
Portfolio for a freelance developer named Alex Chen. Modern, minimal, deployable tonight. plan.md only.
```

**Build mode**

```
Build step 1 from plan.md now.
```

---

## Tips

| Mode   | Use when |
|--------|----------|
| **Plan** | You want `plan.md` only — no code files yet |
| **Build** | `plan.md` exists and you want real files |

- Be specific about stack: *"vanilla HTML"*, *"React + Vite"*, or *"Vue 3 + Vite"*.
- Say *"production-ready"* or *"no placeholders"* if you want complete copy and styling.
- After each agent reply, use **Apply** on `plan.md` first, then switch to **Build** for code steps.
- Open **Preview** once `index.html` or the Vite entry exists.

---

*Mr K Agent · a product of Mr'K Eco*
