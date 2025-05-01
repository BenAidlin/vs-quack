import * as vscode from 'vscode';
import { getResultsHtml } from './views/getResultsHtml';
import { getQueryEditorHtml } from './views/getQueryEditorHtml';
import { handleQuery } from './handlers/queryHandler';

export function activate(context: vscode.ExtensionContext) {
    const runQueryDisposable = vscode.commands.registerCommand('vs-quack.runQuery', async () => {
        const panel = vscode.window.createWebviewPanel(
            'queryEditor',
            'Query Editor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.webview.html = getQueryEditorHtml();

        let resultPanel: vscode.WebviewPanel | null = null;

        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'runQuery':
                        try {
                            const result = await handleQuery(context, message);
                            if (!resultPanel) {
                                resultPanel = vscode.window.createWebviewPanel(
                                    'queryResult',
                                    'Query Results',
                                    vscode.ViewColumn.Two, // Split screen
                                    { enableScripts: true }
                                );
                    
                                resultPanel.onDidDispose(() => {
                                    resultPanel = null; // Reset when closed
                                });
                            }
                            resultPanel.webview.html = getResultsHtml(result);
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
    });

    const setDuckDbSettings = vscode.commands.registerCommand('vs-quack.setSettings', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Settings File',
            canSelectFiles: true,
            filters: {
                'All Files': ['*']
            }
        });

        if (!fileUri || fileUri.length === 0) {
            vscode.window.showWarningMessage('No file selected.');
            return;
        }

        const selectedPath = fileUri[0].fsPath;
        context.globalState.update('duckDbSettingsPath', selectedPath);
        vscode.window.showInformationMessage(`Settings file selected: ${selectedPath}`);
    });

    context.subscriptions.push(runQueryDisposable);
    context.subscriptions.push(setDuckDbSettings);
}
