import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { useAIStore } from '../store/aiStore';
import {
    sanitizeFileContent,
    validatePatch,
    pathsFromPlanTree,
} from '../utils/codeQuality';
import { extractPlanMarkdown, createPlanPatch } from '../utils/planParser';
import { isOnlineCompilerConfigured, isRunnableOnOnlineCompiler } from './onlineCompiler';
import { verifyFileExecutes } from '../core/executionEngine';

function getPlanPathsFromProject(files) {
    const plan = files?.find((f) => f.name.toLowerCase() === 'plan.md');
    return pathsFromPlanTree(plan?.content || '');
}

export const parsePatches = async (projectId, fullResponseText, { planOnly = false } = {}) => {
    const projectStore = useProjectStore.getState();
    const planPaths = getPlanPathsFromProject(projectStore.files);
    const patches = [];

    const fileBlockRegex =
        /(?:FILE|File|# File|#File|#file):\s*([^\s\n()]+)\s*([\s\S]*?)(?=(?:FILE|File|# File|#File|#file):\s*[^\s\n()]+\s*|$)/gi;
    let match;

    while ((match = fileBlockRegex.exec(fullResponseText)) !== null) {
        let fileName = match[1].trim().replace(/^\/+/, '');
        let rawContent = match[2];
        const codeMatch = /```(?:\w+)?\n([\s\S]*?)```/.exec(rawContent);
        let newContent = codeMatch
            ? codeMatch[1].trim()
            : rawContent.replace(/^```(?:\w+)?\n?/i, '').replace(/```$/i, '').trim();

        newContent = sanitizeFileContent(fileName, newContent, planPaths);
        const issues = validatePatch(fileName, newContent, planPaths);

        if (!newContent || newContent.length < 5) continue;

        if (
            isOnlineCompilerConfigured() &&
            isRunnableOnOnlineCompiler(fileName) &&
            newContent.length < 8000 &&
            fileName.toLowerCase() !== 'plan.md'
        ) {
            try {
                const execIssues = await verifyFileExecutes(fileName, newContent);
                issues.push(...execIssues);
            } catch {
                /* network — skip */
            }
        }

        if (newContent || fileName.endsWith('.keep')) {
            const existingFile = projectStore.files.find(
                (f) => f.name.toLowerCase() === fileName.toLowerCase()
            );
            const oldLines = existingFile ? existingFile.content.split('\n').length : 0;
            const newLines = newContent ? newContent.split('\n').length : 0;

            patches.push({
                fileName,
                newContent: newContent || '',
                added: Math.max(0, newLines - oldLines),
                removed: Math.max(0, oldLines - newLines),
                isNew: !existingFile,
                qualityWarnings: issues,
            });
        }
    }

    if (!planOnly && patches.length === 0) {
        const fallbackRegex = /```([\w-]+)?\n([\s\S]*?)```/g;
        let fbMatch;
        while ((fbMatch = fallbackRegex.exec(fullResponseText)) !== null) {
            const lang = (fbMatch[1] || '').toLowerCase();
            const content = fbMatch[2].trim();
            if (!content || content.length < 20) continue;

            let fileName = 'script.js';
            if (lang === 'html') fileName = 'index.html';
            else if (lang === 'css') fileName = 'styles/main.css';
            else if (lang === 'javascript' || lang === 'js') fileName = 'script.js';
            else if (lang === 'python' || lang === 'py') fileName = 'main.py';
            else if (lang === 'typescript' || lang === 'ts') fileName = 'main.ts';
            else if (lang === 'java') fileName = 'Main.java';
            else if (lang === 'rust') fileName = 'main.rs';
            else if (lang === 'go') fileName = 'main.go';
            else if (lang === 'bash' || lang === 'sh') fileName = 'run.sh';
            else if (lang) fileName = `main.${lang}`;

            const sanitized = sanitizeFileContent(fileName, content, planPaths);
            if (!sanitized || sanitized.length < 10) continue;
            patches.push({
                fileName,
                newContent: sanitized,
                added: sanitized.split('\n').length,
                removed: 0,
                isNew: true,
                qualityWarnings: validatePatch(fileName, sanitized, planPaths),
            });
        }
    }

    if (planOnly) {
        let planOnlyPatches = patches.filter((p) => p.fileName.toLowerCase() === 'plan.md');
        if (planOnlyPatches.length === 0) {
            const planMd = extractPlanMarkdown(fullResponseText);
            const patch = createPlanPatch(planMd, projectStore.files);
            if (patch) planOnlyPatches = [patch];
        }
        useAIStore.getState().setPendingPatches(planOnlyPatches);
        return planOnlyPatches;
    }

    useAIStore.getState().setPendingPatches(patches);
    return patches;
};

export const applyPatch = async (projectId, patch) => {
    const projectStore = useProjectStore.getState();
    const editorStore = useEditorStore.getState();

    let file = projectStore.files.find(
        (f) => f.name.toLowerCase() === patch.fileName.toLowerCase()
    );

    if (!file) {
        const ext = patch.fileName.split('.').pop() || 'javascript';
        const langMap = { css: 'css', html: 'html', js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', md: 'markdown', py: 'python', java: 'java', go: 'go', rs: 'rust', sh: 'shell', json: 'json' };
        file = await projectStore.createFile(
            projectId,
            patch.fileName,
            patch.newContent,
            langMap[ext] || ext
        );
    }

    const editor = editorStore.editorInstance;
    const monaco = editorStore.monacoInstance;

    if (editor && monaco) {
        const uri = monaco.Uri.parse(`file:///${file.name}`);
        let model = monaco.editor.getModel(uri);

        if (!model) {
            model = monaco.editor.createModel(patch.newContent, file.language, uri);
        } else if (!model.isDisposed()) {
            model.pushEditOperations(
                [],
                [{ range: model.getFullModelRange(), text: patch.newContent }],
                () => null
            );
        }

        const currentEditor = useEditorStore.getState().editorInstance;
        if (currentEditor?.getModel() === model) {
            currentEditor.setPosition({ lineNumber: 1, column: 1 });
            currentEditor.revealLineInCenterIfOutsideViewport(1);
        }
    }

    await projectStore.updateFile(file.id, patch.newContent);
    await projectStore.fetchFiles(projectId);

    const currentPending = useAIStore.getState().pendingPatches;
    useAIStore.getState().setPendingPatches(currentPending.filter((p) => p !== patch));
};

export const applyAllPatches = async (projectId, patches) => {
    for (const patch of [...patches]) {
        await applyPatch(projectId, patch);
    }
};

/** Save plan.md to project (approve flow) */
export const savePlanToProject = async (projectId, content) => {
    const projectStore = useProjectStore.getState();
    const patch = createPlanPatch(content, projectStore.files);
    if (!patch) return null;
    await applyPatch(projectId, patch);
    return patch;
};
