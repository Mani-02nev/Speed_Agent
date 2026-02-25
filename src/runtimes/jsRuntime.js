export async function runJavaScript(code) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const logs = [];
        const originalLog = console.log;

        iframe.contentWindow.console.log = (...args) => {
            logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };

        iframe.contentWindow.console.error = (...args) => {
            logs.push('Error: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };

        try {
            const script = iframe.contentDocument.createElement('script');
            script.type = 'module';
            script.textContent = `
                try {
                    ${code}
                } catch (err) {
                    console.error(err.message);
                }
            `;
            iframe.contentDocument.body.appendChild(script);

            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                resolve(logs.join('\n') || 'Program executed with no output.');
            }, 500);
        } catch (err) {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
            resolve('Execution Error: ' + err.message);
        }
    });
}
