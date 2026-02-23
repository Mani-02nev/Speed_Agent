import { create } from 'zustand';
import { initialFileSystem, resolvePath, getParentNode } from '../terminal/filesystem';
import { parseInput } from '../terminal/parser';
import { executeCommand } from '../terminal/executor';

const createInitialTerminalState = () => ({
    fs: JSON.parse(JSON.stringify(initialFileSystem)),
    currentDirectory: "/home/user",
    user: "user",
    history: [],
});

const loadTerminalState = () => {
    const saved = localStorage.getItem('speed_terminal_state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.cwd) {
                data.currentDirectory = data.cwd;
                delete data.cwd;
            }
            return data;
        } catch (e) {
            return createInitialTerminalState();
        }
    }
    return createInitialTerminalState();
};

export const useTerminalStore = create((set, get) => ({
    ...loadTerminalState(),

    executeCommand: async (projectId, input) => {
        const state = get();
        const legacyState = { ...state, cwd: state.currentDirectory };
        const parsed = parseInput(input);

        set(prev => ({
            history: [...prev.history, { type: 'input', content: input, cwd: prev.currentDirectory }]
        }));

        if (!parsed) return;

        const terminalSetter = (newState) => {
            const updated = { ...newState, currentDirectory: newState.cwd };
            delete updated.cwd;
            set(updated);
            localStorage.setItem('speed_terminal_state', JSON.stringify(updated));
        };

        const result = await executeCommand(parsed, legacyState, terminalSetter);

        if (result === "CLEAR_TERMINAL_SCREEN") {
            set({ history: [] });
        } else if (result) {
            set(prev => ({
                history: [...prev.history, { type: 'output', content: result }]
            }));
        }

        localStorage.setItem('speed_terminal_state', JSON.stringify(get()));
    },

    // v6 Unified VFS Sync
    syncProjectFiles: (projectName, files) => {
        const state = get();
        // Deep clone to avoid mutating state directly
        let fs = JSON.parse(JSON.stringify(state.fs || initialFileSystem));
        const projectKey = projectName.toLowerCase().replace(/\s+/g, '_');

        // Helper to safely navigate/create directories
        const ensureDir = (parent, name) => {
            if (!parent.children) parent.children = {};
            if (!parent.children[name]) {
                parent.children[name] = {
                    type: "directory",
                    name: name,
                    owner: "user",
                    permissions: "rwxr-xr-x",
                    children: {}
                };
            }
            return parent.children[name];
        };

        try {
            const home = ensureDir(fs, 'home');
            const user = ensureDir(home, 'user');
            const projects = ensureDir(user, 'projects');
            const projectDir = ensureDir(projects, projectKey);

            projectDir.children = {}; // Clear for fresh sync

            files.forEach(f => {
                projectDir.children[f.name] = {
                    type: "file",
                    name: f.name,
                    owner: "user",
                    permissions: "rw-r--r-x",
                    content: f.content
                };
            });

            set({ fs });
        } catch (err) {
            console.error("VFS Sync Critical Error:", err);
            // Fallback: Reset FS to initial if corrupted
            set({ fs: JSON.parse(JSON.stringify(initialFileSystem)) });
        }
    },

    clearHistory: () => set({ history: [] }),
    resetTerminal: () => {
        const initialState = createInitialTerminalState();
        set(initialState);
        localStorage.removeItem('speed_terminal_state');
    },
    updateState: (newState) => {
        set(newState);
        localStorage.setItem('speed_terminal_state', JSON.stringify(get()));
    }
}));
