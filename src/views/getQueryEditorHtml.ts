import * as fs from 'fs';
import * as path from 'path';

export function getQueryEditorHtml(query: string | null): string {
    const htmlPath = path.join(__dirname, 'queryEditor.html');
    try {
        let html = fs.readFileSync(htmlPath, 'utf-8');
        return html.replace('{query}', query ?? '');
    } catch (error) {
        console.error(`Failed to load HTML file: ${error}`);
        return `<h1>Error loading Query Editor</h1>`;
    }
}
