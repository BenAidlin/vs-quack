import * as fs from 'fs';
import * as path from 'path';

export function getResultsHtml(result: any[], moreRows: boolean, durationSeconds?: number | null, queryText?: string | null): string {
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


    let title = `<h1>Query Results</h1>`;

    let meta = `<div class="query-meta" style="margin-top:10px; font-size:14px; color:#aaa;">`;
    if (moreRows) {
        meta += `<em style="color:#ff5e4f;">Some rows are hidden for preview. <br>For full result use export via vs-quack: Run DuckDb Query.</em><br>`;
    }
    if (durationSeconds !== null && durationSeconds !== undefined) {
        meta += `Executed in ${durationSeconds.toFixed(2)} seconds`;
    }

    if (queryText) {
        const shortQuery = queryText.length > 200 ? queryText.slice(0, 200) + "..." : queryText;
        const escapedFull = queryText
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        meta += `
            <br>
            <div class="tooltip-query">
                ${shortQuery}
                <span class="tooltip-content">${escapedFull}</span>
            </div>
        `;
    }


    meta += `</div>`;

    html = html
        .replace('{title}', title + meta)
        .replace('{headers}', headers)
        .replace('{rows}', rows);

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
