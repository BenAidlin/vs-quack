import * as fs from 'fs';
import * as path from 'path';

export function getResultsHtml(result: any[]): string {
    const htmlPath = path.join(__dirname, 'results.html');
    let html = '';

    try {
        html = fs.readFileSync(htmlPath, 'utf-8');
    } catch (error) {
        console.error(`Failed to load HTML file: ${error}`);
        return `<h1>Error loading Results HTML</h1>`;
    }

    const headers = Object.keys(result[0] || {})
        .map(key => `<th onclick="sortTable('${key}')">${key} &#9650;&#9660;</th>`)
        .join('');

    const rows = result
        .map(row => {
            // Check if this is an ellipsis row
            const isEllipsisRow = Object.values(row).every(val => val === '...');
            const rowClass = isEllipsisRow ? ' class="ellipsis-row"' : '';
            const cells = Object.values(row)
                .map(value => `<td>${value}</td>`)
                .join('');
            return `<tr${rowClass}>${cells}</tr>`;
        })
        .join('');

    html = html.replace('{headers}', headers).replace('{rows}', rows);

    return html;
}


export function getLoadingHtml(): string {
    return `
    <html>
    <head>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: var(--vscode-editor-background, #1e1e1e);
                color: var(--vscode-editor-foreground, #d4d4d4);
                font-family: 'Fira Code', monospace;
            }

            .spinner {
                border: 6px solid #444;
                border-top: 6px solid #ddd;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            h2 {
                margin-top: 20px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div>
            <div class="spinner"></div>
            <h2>Running query…</h2>
        </div>
    </body>
    </html>
    `;
}
