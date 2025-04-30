export function getQueryEditorHtml(): string {
    const styles = `
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            textarea {
                width: 100%;
                height: 150px;
                padding: 10px;
                font-family: monospace;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-sizing: border-box;
            }
            button {
                margin-top: 10px;
                padding: 10px 20px;
                font-size: 14px;
                cursor: pointer;
            }
        </style>
    `;

    const scripts = `
        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('runQueryButton').addEventListener('click', () => {
                const query = document.getElementById('queryInput').value;
                vscode.postMessage({ command: 'runQuery', query });
            });
        </script>
    `;

    const body = `
        <body>
            <h1>Query Editor</h1>
            <textarea id="queryInput" placeholder="Enter your SQL query here..."></textarea>
            <button id="runQueryButton">Run Query</button>
        </body>
    `;

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Query Editor</title>
            ${styles}
        </head>
        ${body}
        ${scripts}
        </html>
    `;
}
