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
        case 'c':
            return 'cpp';
        case 'rs':
            return 'rust';
        default:
            return 'unsupported';
    }
}
