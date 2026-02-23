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

    // Handle 'run' as a special case for Piston API integration
    if (parsed.command === "run") {
        return "RUN_PISTON_API"; // Special signal for the Terminal component
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
