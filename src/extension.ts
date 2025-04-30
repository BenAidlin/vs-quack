import * as vscode from 'vscode';
import { executeQuery, wrapQueryWithCopyTo } from './util/ddbClient';
import { getResultsHtml } from './views/getResultsHtml';
import { getQueryEditorHtml } from './views/getQueryEditorHtml';

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
                            if (message.type){
                                const destination = await vscode.window.showOpenDialog({
                                    canSelectMany: false,
                                    openLabel: 'Select destination folder',
                                    canSelectFolders: true,
                                    filters: {
                                        'All Files': ['*']
                                    }
                                });
                                if (!destination || destination.length === 0) {
                                    vscode.window.showWarningMessage('No destination selected.');
                                    return;
                                }
                                message.query = wrapQueryWithCopyTo(message.query, destination[0].fsPath, message.type);
                            }
                            const result = await executeQuery(
								context,
                                message.query,
                                context.globalState.get('duckDbSettingsPath', null)
                            );
                            // Ensure result is stringified for display
                            for (let r of result) {
                                for (let k in r) {
                                    if (
                                        typeof r[k] !== "string" &&
                                        typeof r[k] !== "number" &&
                                        typeof r[k] !== "boolean"
                                    ) {
                                        r[k] = r[k].toString();
                                    }
                                }
                            }

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
