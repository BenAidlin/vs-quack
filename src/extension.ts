import * as vscode from 'vscode';
import { executeQuery } from './util/ddbClient';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('vs-quack.runQuery', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Enter your SQL query',
            placeHolder: 'SELECT * FROM table_name',
        });

        if (!query) {
            vscode.window.showWarningMessage('Query was canceled or empty.');
            return;
        }

        try {
            const result = await executeQuery(query);
            console.log('Query result:', result);
            vscode.window.showInformationMessage(`Query result: ${JSON.stringify(result)}`);
        } catch (error: any) {
            console.error('Error executing query:', error);
            vscode.window.showErrorMessage(`Error executing query: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
