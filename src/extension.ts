import * as vscode from 'vscode';
import { executeQuery } from './util/ddbClient';
import { getQueryEditorHtml } from './views/queryEditorHtml';

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

		panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'runQuery':
                        try {
                            const result = await executeQuery(
                                message.query,
                                context.globalState.get('duckDbSettingsPath', null)
                            );
							for (let r of result) {
								for (let k in r) {
									if (typeof r[k] !== "string" && typeof r[k] !== "number" && typeof r[k] !== "boolean") {
										r[k] = r[k].toString();
									}
								}
							}
							panel.webview.postMessage({ command: 'queryResult', result });
                        } catch (error: any) {
                            panel.webview.postMessage({ command: 'queryError', error: error.message });
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

export function deactivate() {}
