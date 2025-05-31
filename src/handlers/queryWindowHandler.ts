import * as vscode from 'vscode';
import { getQueryEditorHtml } from '../views/getQueryEditorHtml';
import { handleQuery } from './queryHandler';
import { handleResult } from './resultHandler';
import { DuckDBConnection } from '@duckdb/node-api';

export function openQueryWindow(context: vscode.ExtensionContext, connection: DuckDBConnection, queryText: string | null = null){
    const panel = vscode.window.createWebviewPanel(
        'queryEditor',
        'Query Editor',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    panel.webview.html = getQueryEditorHtml(queryText);

    panel.webview.onDidReceiveMessage(
        async (message) => {
            switch (message.command) {
                case 'runQuery':
                    try {
                        const result = await handleQuery(context, message, connection);
                        await handleResult(result);
                        panel.webview.postMessage({ command: 'queryResult' });
                    } catch (error: any) {
                        panel.webview.postMessage({ command: 'queryError', error: error.message });
                        vscode.window.showErrorMessage(`Error executing query: ${error.message}`);
                    }
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}