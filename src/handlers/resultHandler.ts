import * as vscode from 'vscode';
import { getResultsHtml } from '../views/getResultsHtml';

export function handleResult(result: any){
    if (!result) {
        return;
    }
    let resultPanel: vscode.WebviewPanel | null = null;
    resultPanel = vscode.window.createWebviewPanel(
        'queryResult',
        'Query Results',
        vscode.ViewColumn.Two, // Split screen
        { enableScripts: true }
    );

    resultPanel.onDidDispose(() => {
        resultPanel = null; // Reset when closed
    });
    resultPanel.webview.html = getResultsHtml(result);
}