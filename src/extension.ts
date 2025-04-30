import * as vscode from 'vscode';
import { executeQuery } from './util/ddbClient';
import { getHtmlForTable } from './views/tableHtml';

export function activate(context: vscode.ExtensionContext) {
    const runQueryDisposable = vscode.commands.registerCommand('vs-quack.runQuery', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Enter your SQL query',
            placeHolder: 'SELECT * FROM table_name',
        });

        if (!query) {
            vscode.window.showWarningMessage('Query was canceled or empty.');
            return;
        }

        try {
            const result = await executeQuery(query, context.globalState.get('duckDbSettingsPath', null));
            
			// Create and show a Webview panel to display the results
			const panel = vscode.window.createWebviewPanel(
				'queryResults', // Identifier for the webview
				'Query Results', // Title of the webview
				vscode.ViewColumn.One, // Editor column to display in
				{ enableScripts: true } // Enable JavaScript in the webview
			);

			// Render the HTML content for the table
			panel.webview.html = getHtmlForTable(result);
        } catch (error: any) {
            console.error('Error executing query:', error);
            vscode.window.showErrorMessage(`Error executing query: ${error.message}`);
        }
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
