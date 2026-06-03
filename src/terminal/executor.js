import { resolvePath, getParentNode } from './filesystem';
import * as commands from './commands';

/**
 * Executes a parsed command
 * @param {object} parsed 
 * @param {object} state { fs, cwd, user, history }
 * @param {function} setState Updates the terminal state
 */
export async function executeCommand(parsed, state, setState) {
    if (!parsed) return "";

    const commandFn = commands[parsed.command];

    if (commandFn) {
        try {
            const result = await commandFn(parsed, state, setState);

            // Handle output redirection if any
            if (parsed.redirect && result) {
                return handleRedirection(parsed, result, state, setState);
            }

            return result;
        } catch (error) {
            return `${parsed.command}: ${error.message}`;
        }
    }

    if (parsed.command === "npm" && parsed.args[0] === "run" && parsed.args[1] === "dev") {
        return "RUN_DEV_SERVER";
    }

    // run / run dev / run script.py / run main.cpp <<< "stdin"
    if (parsed.command === 'run') {
        if (parsed.args[0] === 'dev' || parsed.args[0] === 'project') return 'RUN_DEV_SERVER';
        const hereIdx = parsed.args.indexOf('<<<');
        const target  = (hereIdx > 0 ? parsed.args[0] : parsed.args[0]) || '__active__';
        const stdin   = hereIdx !== -1 ? parsed.args.slice(hereIdx + 1).join(' ').replace(/^"|"$/g, '').replace(/^'|'$/g, '') : '';
        return `RUN_ONLINE_COMPILER:${target}:::${stdin}`;
    }

    // rm * — delete all files signal
    if (parsed.command === "rm") {
        const target = parsed.args.join(' ').trim();
        if (target === '*' || target === '-rf *' || target === '-f *') {
            return "DELETE_ALL_FILES";
        }
    }

    // git commands — simulated responses
    if (parsed.command === "git") {
        const sub = parsed.args[0];
        if (sub === "add") {
            return `\x1b[32m✔ Staged:\x1b[0m ${parsed.args.slice(1).join(' ') || '.'} — ready for commit.`;
        }
        if (sub === "commit") {
            const msgIndex = parsed.args.indexOf('-m');
            const msg = msgIndex !== -1 ? parsed.args[msgIndex + 1] : 'Update';
            return `\x1b[32m[main]\x1b[0m ${msg}\n 1 file changed, commit recorded to local node.`;
        }
        if (sub === "push") {
            return `\x1b[32mPushing to origin/main...\nmain → 🔗 github.com/repo (simulated)\nDone.\x1b[0m`;
        }
        if (sub === "status") {
            return `On branch main\nYour branch is up to date with 'origin/main'.\nnothing to commit, working tree clean`;
        }
        if (sub === "init") {
            return `Initialized empty Git repository in /project/.git/`;
        }
        if (sub === "log") {
            return `commit a1b2c3d (HEAD -> main)\nAuthor: user <user@agent-k.local>\nDate:   ${new Date().toUTCString()}\n\n    Project checkpoint`;
        }
        return `git: '${sub}' is not a git command. See 'git help'.`;
    }

    return `${parsed.command}: command not found`;
}

function handleRedirection(parsed, content, state, setState) {
    const { fs, cwd } = state;
    const fileName = parsed.targetFile;
    const { node: parentNode, fullPath: parentPath } = getParentNode(fileName, cwd, fs);

    if (!parentNode || parentNode.type !== "directory") {
        return `bash: ${fileName}: No such file or directory`;
    }

    const baseName = fileName.split("/").pop();
    const fileNode = parentNode.children[baseName];

    if (parsed.redirect === "overwrite") {
        parentNode.children[baseName] = {
            type: "file",
            name: baseName,
            owner: state.user,
            permissions: "rw-r--r--",
            content: content + "\n"
        };
    } else if (parsed.redirect === "append") {
        if (fileNode && fileNode.type === "file") {
            fileNode.content += content + "\n";
        } else {
            parentNode.children[baseName] = {
                type: "file",
                name: baseName,
                owner: state.user,
                permissions: "rw-r--r--",
                content: content + "\n"
            };
        }
    }

    setState({ ...state, fs: { ...fs } });
    return "";
}
