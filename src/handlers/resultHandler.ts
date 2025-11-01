import * as vscode from 'vscode';
import { getResultsHtml } from '../views/getResultsHtml';

let resultPanel: vscode.WebviewPanel | null = null; // Keep this outside the function

export function handleResult(result: any) {
    if (!result) { return; }

    // If panel already exists, just update its HTML
    if (resultPanel) {
        resultPanel.reveal(vscode.ViewColumn.Two);
        resultPanel.webview.html = getResultsHtml(result);
        return;
    }

    // Otherwise, create a new panel
    resultPanel = vscode.window.createWebviewPanel(
        'queryResult',
        'Query Results',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    resultPanel.onDidDispose(() => {
        resultPanel = null; // Reset when closed
    });

    resultPanel.webview.html = getResultsHtml(result);
}
