import { create } from 'zustand';

export const useEditorStore = create((set) => ({
    activeFileId: null,
    openFiles: [], // list of file IDs
    tabs: [], // list of file objects

    dirtyFiles: [], // list of file IDs that have unsaved changes
    editorInstance: null,
    monacoInstance: null,

    setEditorInstance: (instance) => set({ editorInstance: instance }),
    setMonacoInstance: (instance) => set({ monacoInstance: instance }),

    setActiveFile: (fileId) => set({ activeFileId: fileId }),

    setFileDirty: (fileId, isDirty) => set((state) => {
        if (isDirty) {
            if (state.dirtyFiles.includes(fileId)) return state;
            return { dirtyFiles: [...state.dirtyFiles, fileId] };
        } else {
            return { dirtyFiles: state.dirtyFiles.filter(id => id !== fileId) };
        }
    }),

    openFile: (file) => set((state) => {
        if (state.openFiles.includes(file.id)) {
            return { activeFileId: file.id };
        }
        return {
            openFiles: [...state.openFiles, file.id],
            tabs: [...state.tabs, file],
            activeFileId: file.id,
        };
    }),

    closeFile: (fileId) => set((state) => {
        const newTabs = state.tabs.filter((t) => t.id !== fileId);
        const newOpenFiles = state.openFiles.filter((id) => id !== fileId);
        let newActiveId = state.activeFileId;

        if (newActiveId === fileId) {
            newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }

        return {
            tabs: newTabs,
            openFiles: newOpenFiles,
            activeFileId: newActiveId,
        };
    }),

    resetEditor: () => set({
        activeFileId: null,
        openFiles: [],
        tabs: [],
        dirtyFiles: [],
    }),
}));
