import * as vscode from 'vscode';
import { getLoadingHtml, getResultsHtml } from '../views/getResultsHtml';

let resultPanel: vscode.WebviewPanel | null = null;

export async function handleResult(resultPromise: Promise<any>) {
    if (!resultPanel) {
        resultPanel = vscode.window.createWebviewPanel(
            'queryResult',
            'Query Results',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        resultPanel.onDidDispose(() => (resultPanel = null));
    }

    resultPanel.reveal(vscode.ViewColumn.Two);

    resultPanel.webview.html = getLoadingHtml();

    let result: any;
    try {
        result = await resultPromise;
    } catch (err: any) {
        resultPanel.webview.html = `<h1>Error</h1><pre>${err}</pre>`;
        return;
    }

    if (!result) {
        resultPanel.webview.html = `<h1>No results</h1>`;
        return;
    }
    resultPanel.webview.html = getResultsHtml(result);
}
