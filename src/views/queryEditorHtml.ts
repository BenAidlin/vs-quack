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
            button:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            #progressIndicator {
                margin-top: 10px;
                font-size: 14px;
                color: #0078d7;
                display: none;
            }
        </style>
    `;

    const scripts = `
        <script>
            const vscode = acquireVsCodeApi();
            let isLoading = false;

            document.getElementById('runQueryButton').addEventListener('click', () => {
                if (isLoading) return;

                const query = document.getElementById('queryInput').value;
                if (!query.trim()) {
                    alert('Query cannot be empty.');
                    return;
                }

                isLoading = true;
                document.getElementById('runQueryButton').disabled = true;
                document.getElementById('progressIndicator').style.display = 'block';

                vscode.postMessage({ command: 'runQuery', query });
            });

            window.addEventListener('message', (event) => {
                const message = event.data;

                if (message.command === 'queryResult' || message.command === 'queryError') {
                    // Clean up loading state
                    isLoading = false;
                    document.getElementById('runQueryButton').disabled = false;
                    document.getElementById('progressIndicator').style.display = 'none';

                    if (message.command === 'queryResult') {
                        alert('Query executed successfully!');
                    } else if (message.command === 'queryError') {
                        alert('Error: ' + message.error);
                    }
                }
            });
        </script>
    `;

    const body = `
        <body>
            <h1>Query Editor</h1>
            <textarea id="queryInput" placeholder="Enter your SQL query here..."></textarea>
            <button id="runQueryButton">Run Query</button>
            <div id="progressIndicator">Running query, please wait...</div>
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
