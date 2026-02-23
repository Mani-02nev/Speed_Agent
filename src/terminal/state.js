import { initialFileSystem } from './filesystem';

export const createInitialTerminalState = () => ({
    fs: JSON.parse(JSON.stringify(initialFileSystem)),
    cwd: "/home/user",
    user: "user",
    history: [],
});

/**
 * Persists terminal state to localStorage (optional but good for UX)
 */
export const saveTerminalState = (state) => {
    localStorage.setItem('speed_terminal_state', JSON.stringify(state));
};

export const loadTerminalState = () => {
    const saved = localStorage.getItem('speed_terminal_state');
    return saved ? JSON.parse(saved) : createInitialTerminalState();
};
