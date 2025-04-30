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
            const cells = Object.values(row)
                .map(value => `<td>${value}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    html = html.replace('{headers}', headers).replace('{rows}', rows);

    return html;
}
