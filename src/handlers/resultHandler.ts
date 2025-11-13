import * as vscode from 'vscode';
import { getLoadingHtml, getResultsHtml } from '../views/getResultsHtml';
import { performance } from "perf_hooks";

let resultPanel: vscode.WebviewPanel | null = null;

export async function handleResult(resultPromise: Promise<any>, startQuery?: number | null, queryText?: string | null) {
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
    let durationSeconds: number | null = null;
    try {
        result = await resultPromise;
        if (startQuery) {
            const end = performance.now();
            durationSeconds = (end - startQuery) / 1000;
        }
    } catch (err: any) {
        resultPanel.webview.html = `<h1>Error</h1><pre>${err}</pre>`;
        return;
    }

    if (!result.data) {
        resultPanel.webview.html = `<h1>No results</h1>`;
        return;
    }
    resultPanel.webview.html = getResultsHtml(result.data, result.moreRows, durationSeconds, queryText);
}
