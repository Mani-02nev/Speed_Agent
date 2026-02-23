/**
 * Parses terminal input into command, arguments, and options
 * @param {string} input 
 */
export function parseInput(input) {
    if (!input.trim()) return null;

    // Handle redirects (basic support for > and >>)
    let redirect = null;
    let targetFile = null;

    if (input.includes(">>")) {
        const parts = input.split(">>");
        input = parts[0];
        redirect = "append";
        targetFile = parts[1].trim();
    } else if (input.includes(">")) {
        const parts = input.split(">");
        input = parts[0];
        redirect = "overwrite";
        targetFile = parts[1].trim();
    }

    const tokens = [];
    let currentToken = "";
    let inQuotes = false;
    let quoteChar = "";

    // Simple tokenization that respects quotes
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if ((char === '"' || char === "'") && (i === 0 || input[i - 1] !== '\\')) {
            if (inQuotes && char === quoteChar) {
                inQuotes = false;
                tokens.push(currentToken);
                currentToken = "";
            } else if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else {
                currentToken += char;
            }
        } else if (char === " " && !inQuotes) {
            if (currentToken) {
                tokens.push(currentToken);
                currentToken = "";
            }
        } else {
            currentToken += char;
        }
    }
    if (currentToken) tokens.push(currentToken);

    const command = tokens[0];
    const args = tokens.slice(1).filter(t => !t.startsWith("-"));
    const options = tokens.slice(1).filter(t => t.startsWith("-")).map(o => o.replace(/^-+/, ""));

    // Flatten short options like -la to l, a
    const flatOptions = [];
    options.forEach(opt => {
        if (opt.length > 1 && !opt.startsWith("-")) {
            opt.split("").forEach(char => flatOptions.push(char));
        } else {
            flatOptions.push(opt);
        }
    });

    return { command, args, options: flatOptions, redirect, targetFile };
}
