export async function runHTML(code) {
    // For HTML, "execution" means rendering in a preview iframe.
    // We return the code and a type so the engine/UI knows what to do.
    return {
        type: 'html',
        content: code
    };
}
