# ⚡ Agent K

Enterprise-ready AI coding & automation platform. Clean, minimal, and scalable.

## 🧱 Tech Stack
-   **Frontend:** React + Vite
-   **State:** Zustand
-   **Database/Auth:** Supabase Client SDK
-   **Storage:** Supabase Storage
-   **Editor:** Monaco Editor
-   **UI:** TailwindCSS v4 + Radix UI
-   **Animation:** Framer Motion

## 🚀 Features
-   **Multi-Model Switcher:** Support for OpenAI, Gemini, Groq, and OpenRouter.
-   **Cursor-style Editor:** Multi-tab file system with Monaco Editor.
-   **Agent Capabilities:** AI can create and modify files directly based on chat instructions.
-   **Project Management:** Dashboard for organizing multiple coding projects.
-   **SaaS Architecture:** Complete Auth system and RLS-protected database.

## 🛠 Setup Guide

### 1. Requirements
-   Node.js 18+
-   Supabase Account

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_KEY=your_openai_api_key
VITE_GROQ_KEY=your_groq_api_key
VITE_OPENROUTER_KEY=your_openrouter_api_key
VITE_GEMINI_KEY=your_gemini_api_key
```

### 3. Database Setup
Run the SQL script provided in `supabase_schema.sql` in your Supabase SQL Editor. This will create all necessary tables and RLS policies.

### 4. Installation
```bash
npm install
```

### 5. Start Development
```bash
npm run dev
```

## 📦 Deployment

### Vercel
1.  Connect your GitHub repository to Vercel.
2.  Configure the environment variables in the Vercel Dashboard.
3.  Deploy!

## 🧪 AI Command Instructions
To have Agent K create or modify a file, use the following format in the chat:
```jsx
// filename: src/components/App.jsx
import React from 'react';
// ... rest of the code ...
```
The agent will automatically parse this and apply the changes to your project.
