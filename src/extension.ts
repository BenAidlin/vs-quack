import * as vscode from 'vscode';
import { getQueryEditorHtml } from './views/getQueryEditorHtml';
import { handleQuery } from './handlers/queryHandler';
import { createQueryFromPath } from './util/ddbClient';
import { handleResult } from './handlers/resultHandler';

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
    
    const runSelectedTextQueryCommand = vscode.commands.registerCommand('vs-quack.runTextSelectionQuery', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (selectedText.trim()) {
            // Perform your query logic here
            vscode.window.showInformationMessage(`Running query: ${selectedText}`);
            try{
                const result = await handleQuery(context, {query: selectedText});
                await handleResult(result);
            }
            catch (error: any) {
                vscode.window.showErrorMessage(`Error executing query: ${error.message}`);
                return;
            }
            
        } else {
            vscode.window.showErrorMessage('No text selected.');
        }
    
    });

    const runQueryOnFileCommand = vscode.commands.registerCommand('vs-quack.runQueryOnExplorer', async (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('No file selected.');
            return;
        }
        try{
            const query = createQueryFromPath(uri.fsPath);
            const result = await handleQuery(context, {query: query});
            await handleResult(result);

        } catch (error: any) {
            vscode.window.showErrorMessage(`Error executing query: ${error.message}`);
            return;
        }
    });

    context.subscriptions.push(runQueryDisposable);
    context.subscriptions.push(setDuckDbSettings);
    context.subscriptions.push(runSelectedTextQueryCommand);
    context.subscriptions.push(runQueryOnFileCommand);
    
}
