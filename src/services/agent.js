import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { useAIStore } from '../store/aiStore';

/**
 * Agent K Core v6 - Enterprise Patch Engine
 */

export const parsePatches = async (projectId, fullResponseText) => {
    const projectStore = useProjectStore.getState();
    const patches = [];

    // Step 1: Detect explicit file markers (standard format)
    const fileBlockRegex = /(?:FILE|File|# File|#File|#file):\s*([^\s\n\(\)]+\.[^\s\n\(\)]+)\s*([\s\S]*?)(?=(?:FILE|File|# File|#File|#file):\s*[^\s\n\(\)]+\.[^\s\n\(\)]+|$)/gi;
    let match;
    const matchedFiles = new Set();

    while ((match = fileBlockRegex.exec(fullResponseText)) !== null) {
        const fileName = match[1].trim();
        let rawContent = match[2];
        const codeMatch = /```(?:\w+)?\n([\s\S]*?)```/.exec(rawContent);
        const newContent = codeMatch ? codeMatch[1].trim() : rawContent.replace(/^```(?:\w+)?\n?/i, '').replace(/```$/i, '').trim();

        if (newContent) {
            matchedFiles.add(fileName.toLowerCase());
            const existingFile = projectStore.files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
            const oldLines = existingFile ? existingFile.content.split('\n').length : 0;
            const newLines = newContent.split('\n').length;

            patches.push({
                fileName,
                newContent,
                added: newLines > oldLines ? newLines - oldLines : newLines,
                removed: oldLines > newLines ? oldLines - newLines : 0,
                isNew: !existingFile
            });
        }
    }

    // Step 2: Emergency Fallback - Search for orphaned code blocks
    if (patches.length === 0) {
        const fallbackRegex = /```([\w-]+)?\n([\s\S]*?)```/g;
        let fbMatch;
        while ((fbMatch = fallbackRegex.exec(fullResponseText)) !== null) {
            const lang = fbMatch[1] || 'js';
            const content = fbMatch[2].trim();
            const ext = lang === 'python' ? 'py' : (lang === 'javascript' ? 'js' : lang);
            const inferredName = `ai_node_${patches.length + 1}.${ext}`;

            patches.push({
                fileName: inferredName,
                newContent: content,
                added: content.split('\n').length,
                removed: 0,
                isNew: true
            });
        }
    }

    useAIStore.getState().setPendingPatches(patches);
    return patches;
};

export const applyPatch = async (projectId, patch) => {
    const projectStore = useProjectStore.getState();
    const editorStore = useEditorStore.getState();

    let file = projectStore.files.find(f => f.name.toLowerCase() === patch.fileName.toLowerCase());

    if (!file) {
        const language = patch.fileName.split('.').pop() || 'javascript';
        file = await projectStore.createFile(projectId, patch.fileName, '', language);
    }

    // Load into editor
    editorStore.openFile(file);
    const editor = editorStore.editorInstance;
    const monaco = editorStore.monacoInstance;

    if (editor && monaco) {
        const uri = monaco.Uri.parse(`file:///${file.name}`);
        let model = monaco.editor.getModel(uri);

        if (!model) {
            model = monaco.editor.createModel('', file.language, uri);
        }

        try {
            if (model && !model.isDisposed()) {
                // We no longer blindly call editor.setModel() synchronously because 
                // the DOM instance may be mid-unmount. The ProjectEditor.jsx `useEffect` handles it.

                // Rule 13: Live Typing Mode
                const fullText = patch.newContent;
                const chunkSize = 150; // High performance speed

                for (let i = 0; i <= fullText.length; i += chunkSize) {
                    if (model.isDisposed()) break; // Break if model destroyed, don't break if editor is null

                    const chunk = fullText.slice(0, i);
                    model.pushEditOperations(
                        [],
                        [{ range: model.getFullModelRange(), text: chunk }],
                        () => null
                    );
                    projectStore.setStreamingContent(file.id, chunk);
                    await new Promise(r => setTimeout(r, 16));
                }

                if (!model.isDisposed()) {
                    // Final Snap
                    model.pushEditOperations(
                        [],
                        [{ range: model.getFullModelRange(), text: fullText }],
                        () => null
                    );

                    // Re-acquire editor dynamically just in case React just mounted it
                    const currentEditor = useEditorStore.getState().editorInstance;

                    if (currentEditor && currentEditor.getModel() === model) {
                        try {
                            currentEditor.setPosition({ lineNumber: 1, column: 1 });
                            currentEditor.revealLineInCenterIfOutsideViewport(1);

                            // Decoration Rule: Highlight
                            const decorations = currentEditor.deltaDecorations([], [{
                                range: new monaco.Range(1, 1, model.getLineCount(), 1),
                                options: {
                                    isWholeLine: true,
                                    className: 'ai-contribution-highlight',
                                    linesDecorationsClassName: 'ai-contribution-gutter'
                                }
                            }]);

                            setTimeout(() => {
                                try {
                                    const latestEditor = useEditorStore.getState().editorInstance;
                                    if (latestEditor && latestEditor.getModel() === model && !model.isDisposed()) {
                                        latestEditor.deltaDecorations(decorations, []);
                                    }
                                } catch (e) { }
                            }, 1500);
                        } catch (e) { console.warn("Decoration suppressed due to lifecycle.") }
                    }
                }
            }
        } catch (error) {
            console.warn("Neural Node Transition: Deferred model binding due to lifecycle state.", error);
        }
    }

    // Persist to DB
    await projectStore.updateFile(file.id, patch.newContent);
    await projectStore.fetchFiles(projectId);

    // Clear the specific patch from pending
    const currentPending = useAIStore.getState().pendingPatches;
    useAIStore.getState().setPendingPatches(currentPending.filter(p => p !== patch));
};
