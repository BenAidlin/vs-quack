import * as fs from 'fs';
import * as path from 'path';

export function getQueryEditorHtml(): string {
    const htmlPath = path.join(__dirname, 'queryEditor.html');
    try {
        return fs.readFileSync(htmlPath, 'utf-8');
    } catch (error) {
        console.error(`Failed to load HTML file: ${error}`);
        return `<h1>Error loading Query Editor</h1>`;
    }
}
