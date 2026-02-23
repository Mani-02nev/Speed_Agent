// Virtual File System (VFS) Logic - v6 Enterprise
export const initialFileSystem = {
    type: "directory",
    name: "/",
    permissions: "rwxr-xr-x",
    owner: "root",
    children: {
        home: {
            type: "directory",
            name: "home",
            permissions: "rwxr-xr-x",
            owner: "root",
            children: {
                user: {
                    type: "directory",
                    name: "user",
                    permissions: "rwxr-xr-x",
                    owner: "user",
                    children: {
                        projects: {
                            type: "directory",
                            name: "projects",
                            permissions: "rwxr-xr-x",
                            owner: "user",
                            children: {} // Active projects live here
                        }
                    }
                }
            }
        },
        tmp: { type: "directory", name: "tmp", permissions: "rwxrwxrwx", owner: "root", children: {} }
    }
};

export function resolvePath(path, currentPath, fs) {
    if (!path) return { node: null, fullPath: currentPath };
    if (path === "/") return { node: fs, fullPath: "/" };

    let parts;
    if (path.startsWith("/")) {
        parts = path.split("/").filter(p => p);
    } else if (path.startsWith("~")) {
        parts = ["home", "user", ...path.slice(1).split("/").filter(p => p)];
    } else {
        const currentParts = currentPath.split("/").filter(p => p);
        const targetParts = path.split("/").filter(p => p);
        parts = [...currentParts, ...targetParts];
    }

    const finalParts = [];
    for (const part of parts) {
        if (part === "..") finalParts.pop();
        else if (part !== "." && part !== "") finalParts.push(part);
    }

    let workingNode = fs;
    for (const part of finalParts) {
        if (workingNode.children && workingNode.children[part]) {
            workingNode = workingNode.children[part];
        } else {
            return { node: null, fullPath: "/" + finalParts.join("/") };
        }
    }

    return { node: workingNode, fullPath: "/" + finalParts.join("/") || "/" };
}

export function getParentNode(path, currentPath, fs) {
    const parts = path.split("/").filter(p => p);
    if (parts.length <= 1 && !path.startsWith("/")) {
        return resolvePath(".", currentPath, fs);
    }
    const parentPath = path.startsWith("/")
        ? "/" + parts.slice(0, -1).join("/")
        : parts.slice(0, -1).join("/");
    return resolvePath(parentPath || ".", currentPath, fs);
}
