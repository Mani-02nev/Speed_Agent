export function resolveLanguage(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();

    switch (ext) {
        case 'js':
        case 'mjs':
        case 'cjs':
            return 'javascript';
        case 'ts':
            return 'typescript';
        case 'py':
            return 'python';
        case 'html':
        case 'htm':
            return 'html';
        case 'css':
            return 'css';
        case 'cpp':
        case 'cc':
        case 'cxx':
        case 'c':
            return 'cpp';
        case 'rs':
            return 'rust';
        case 'java':
            return 'java';
        case 'go':
            return 'go';
        case 'cs':
            return 'csharp';
        case 'php':
            return 'php';
        case 'rb':
            return 'ruby';
        case 'hs':
            return 'haskell';
        case 'fs':
            return 'fsharp';
        default:
            return 'unsupported';
    }
}
