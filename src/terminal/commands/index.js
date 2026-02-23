import { resolvePath, getParentNode } from '../filesystem';

// --- Helper Functions ---
const checkPermission = (node, user, mode) => {
    // Mode: 'r', 'w', 'x'
    // Simple check: if root, always true. If owner, check owner bits. Else check others.
    if (user === 'root') return true;
    if (node.owner === user) {
        if (mode === 'r') return node.permissions[0] === 'r';
        if (mode === 'w') return node.permissions[1] === 'w';
        if (mode === 'x') return node.permissions[2] === 'x';
    } else {
        // Others bits: index 6, 7, 8 (for r-x type strings)
        if (mode === 'r') return node.permissions[6] === 'r';
        if (mode === 'w') return node.permissions[7] === 'w';
        if (mode === 'x') return node.permissions[8] === 'x';
    }
    return true; // Default true for this simulation simplicity
};

// --- Command Implementations ---

// 1. pwd
export const pwd = async (parsed, state) => {
    return state.cwd;
};

// 2. ls
export const ls = async (parsed, state) => {
    const showHidden = parsed.options.includes('a');
    const longFormat = parsed.options.includes('l');
    const reverse = parsed.options.includes('r');

    let targetPath = parsed.args[0] || ".";
    const { node } = resolvePath(targetPath, state.cwd, state.fs);

    if (!node) return `ls: cannot access '${targetPath}': No such file or directory`;
    if (node.type === "file") return node.name;

    let entries = Object.keys(node.children);
    if (!showHidden) entries = entries.filter(e => !e.startsWith("."));
    if (reverse) entries.reverse();
    entries.sort();

    if (longFormat) {
        return entries.map(name => {
            const n = node.children[name];
            return `${n.permissions}  ${n.owner}  ${n.type === 'directory' ? '4096' : (n.content?.length || 0)}  ${name}`;
        }).join("\n");
    }

    return entries.join("  ");
};

// 3. cd
export const cd = async (parsed, state, setState) => {
    const target = parsed.args[0] || "~";
    const { node, fullPath } = resolvePath(target, state.cwd, state.fs);

    if (!node) return `cd: ${target}: No such file or directory`;
    if (node.type !== "directory") return `cd: ${target}: Not a directory`;

    setState({ ...state, cwd: fullPath });
    return "";
};

// 4. mkdir
export const mkdir = async (parsed, state, setState) => {
    if (parsed.args.length === 0) return "mkdir: missing operand";

    const useP = parsed.options.includes('p');
    const results = [];

    for (const path of parsed.args) {
        const parts = path.split("/").filter(p => p);
        let currentLevel = path.startsWith("/") ? state.fs : resolvePath(".", state.cwd, state.fs).node;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!currentLevel.children[part]) {
                if (i === parts.length - 1 || useP) {
                    currentLevel.children[part] = {
                        type: "directory",
                        name: part,
                        owner: state.user,
                        permissions: "rwxr-xr-x",
                        children: {}
                    };
                } else {
                    return `mkdir: cannot create directory ‘${path}’: No such file or directory`;
                }
            }
            currentLevel = currentLevel.children[part];
        }
    }

    setState({ ...state, fs: { ...state.fs } });
    return results.join("\n");
};

// 5. rmdir
export const rmdir = async (parsed, state, setState) => {
    if (parsed.args.length === 0) return "rmdir: missing operand";

    for (const path of parsed.args) {
        const { node } = resolvePath(path, state.cwd, state.fs);
        if (!node) return `rmdir: failed to remove '${path}': No such file or directory`;
        if (node.type !== "directory") return `rmdir: failed to remove '${path}': Not a directory`;
        if (Object.keys(node.children).length > 0) return `rmdir: failed to remove '${path}': Directory not empty`;

        const { node: parentNode } = getParentNode(path, state.cwd, state.fs);
        const baseName = path.split("/").pop();
        delete parentNode.children[baseName];
    }

    setState({ ...state, fs: { ...state.fs } });
    return "";
};

// 6. touch
export const touch = async (parsed, state, setState) => {
    if (parsed.args.length === 0) return "touch: missing file operand";

    for (const path of parsed.args) {
        const { node } = resolvePath(path, state.cwd, state.fs);
        if (node) continue; // Already exists

        const { node: parentNode } = getParentNode(path, state.cwd, state.fs);
        if (!parentNode) return `touch: cannot touch '${path}': No such file or directory`;

        const baseName = path.split("/").pop();
        parentNode.children[baseName] = {
            type: "file",
            name: baseName,
            owner: state.user,
            permissions: "rw-r--r--",
            content: ""
        };
    }

    setState({ ...state, fs: { ...state.fs } });
    return "";
};

// 7. rm
export const rm = async (parsed, state, setState) => {
    if (parsed.args.length === 0) return "rm: missing operand";
    const recursive = parsed.options.includes('r');
    const force = parsed.options.includes('f');

    for (const path of parsed.args) {
        const { node } = resolvePath(path, state.cwd, state.fs);
        if (!node) {
            if (force) continue;
            return `rm: cannot remove '${path}': No such file or directory`;
        }

        if (node.type === "directory" && !recursive) {
            return `rm: cannot remove '${path}': Is a directory`;
        }

        const { node: parentNode } = getParentNode(path, state.cwd, state.fs);
        const baseName = path.split("/").pop();
        delete parentNode.children[baseName];
    }

    setState({ ...state, fs: { ...state.fs } });
    return "";
};

// 11. cat
export const cat = async (parsed, state) => {
    if (parsed.args.length === 0) return "";
    const results = [];
    for (const path of parsed.args) {
        const { node } = resolvePath(path, state.cwd, state.fs);
        if (!node) results.push(`cat: ${path}: No such file or directory`);
        else if (node.type === "directory") results.push(`cat: ${path}: Is a directory`);
        else results.push(node.content);
    }
    return results.join("\n");
};

// 12. echo
export const echo = async (parsed) => {
    return parsed.args.join(" ");
};

// 16. whoami
export const whoami = async (parsed, state) => {
    return state.user;
};

// 17. uname
export const uname = async (parsed) => {
    if (parsed.options.includes('a')) return "Linux speed-agent 5.15.0-v8+ #1 SMP PREEMPT aarch64 GNU/Linux";
    return "Linux";
};

// 18. date
export const date = async () => {
    return new Date().toString();
};

// 19. history
export const history = async (parsed, state) => {
    return state.history.map((cmd, i) => `  ${i + 1}  ${cmd}`).join("\n");
};

// 20. clear
export const clear = async () => {
    return "CLEAR_TERMINAL_SCREEN";
};

// 23. grep
export const grep = async (parsed, state) => {
    if (parsed.args.length < 2) return "grep: pattern and file required";
    const pattern = parsed.args[0];
    const fileName = parsed.args[1];
    const ignoreCase = parsed.options.includes('i');
    const showLines = parsed.options.includes('n');

    const { node } = resolvePath(fileName, state.cwd, state.fs);
    if (!node || node.type !== "file") return `grep: ${fileName}: No such file`;

    const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
    const lines = node.content.split("\n");
    const results = [];

    lines.forEach((line, i) => {
        if (regex.test(line)) {
            results.push(`${showLines ? (i + 1) + ':' : ''}${line}`);
        }
    });

    return results.join("\n");
};

// 26. help
export const help = async () => {
    const commands = [
        "pwd", "ls", "cd", "mkdir", "rmdir", "touch", "rm", "cat", "echo",
        "whoami", "uname", "date", "history", "clear", "grep", "head", "tail",
        "wc", "cp", "mv", "find", "chmod", "chown", "sort", "uniq", "help", "run"
    ];
    return "Available commands:\n" + commands.sort().join("  ") + "\n\nType 'run' to execute your active code file.";
};
export const cp = async () => "cp: Not fully implemented in simulation";
export const mv = async () => "mv: Not fully implemented in simulation";
export const find = async () => "find: Not fully implemented in simulation";
export const head = async (parsed, state) => {
    const file = parsed.args[0];
    const n = parseInt(parsed.options.find(o => o.startsWith('n'))?.slice(1)) || 10;
    const { node } = resolvePath(file, state.cwd, state.fs);
    if (!node || node.type !== 'file') return "head: cannot open file";
    return node.content.split("\n").slice(0, n).join("\n");
};
export const tail = async (parsed, state) => {
    const file = parsed.args[0];
    const n = parseInt(parsed.options.find(o => o.startsWith('n'))?.slice(1)) || 10;
    const { node } = resolvePath(file, state.cwd, state.fs);
    if (!node || node.type !== 'file') return "tail: cannot open file";
    const lines = node.content.split("\n");
    return lines.slice(Math.max(0, lines.length - n)).join("\n");
};
export const wc = async (parsed, state) => {
    const file = parsed.args[0];
    const { node } = resolvePath(file, state.cwd, state.fs);
    if (!node || node.type !== 'file') return "wc: cannot open file";
    const lines = node.content.split("\n").length;
    const words = node.content.split(/\s+/).filter(w => w).length;
    const chars = node.content.length;
    if (parsed.options.includes('l')) return lines.toString();
    if (parsed.options.includes('w')) return words.toString();
    if (parsed.options.includes('c')) return chars.toString();
    return `${lines} ${words} ${chars} ${file}`;
};
export const chmod = async () => "chmod: Permissions updated in VFS (simulated)";
export const chown = async () => "chown: Owner updated in VFS (simulated)";
export const sort = async (parsed, state) => {
    const file = parsed.args[0];
    const { node } = resolvePath(file, state.cwd, state.fs);
    if (!node || node.type !== 'file') return "sort: cannot open file";
    let lines = node.content.split("\n").filter(l => l);
    lines.sort();
    if (parsed.options.includes('r')) lines.reverse();
    return lines.join("\n");
};
export const uniq = async (parsed, state) => {
    const file = parsed.args[0];
    const { node } = resolvePath(file, state.cwd, state.fs);
    if (!node || node.type !== 'file') return "uniq: cannot open file";
    const lines = node.content.split("\n").filter(l => l);
    const uniqLines = [...new Set(lines)];
    return uniqLines.join("\n");
};
