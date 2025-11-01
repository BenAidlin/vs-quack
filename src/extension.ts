import * as vscode from 'vscode';
import { handleQuery } from './handlers/queryHandler';
import { createQueryFromPath, getConnection } from './util/ddbClient';
import { handleResult } from './handlers/resultHandler';
import { openQueryWindow } from './handlers/queryWindowHandler';
import { getQueryHistory } from './handlers/historyHandler';

export async function activate(context: vscode.ExtensionContext) {
    const connection = await getConnection(context.globalState.get('duckDbSettingsPath', null));
    const runQueryDisposable = vscode.commands.registerCommand('vs-quack.runQuery', async () => {
        openQueryWindow(context, connection);
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
        
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('No text selected.');
            return;
        }
        // Perform your query logic here
        vscode.window.showInformationMessage(`Running query: ${selectedText}`);
        try{
            //openQueryWindow(context, connection, selectedText);
            const result = await handleQuery(context, {query: selectedText}, connection);
            await handleResult(result);
        }
        catch (error: any) {
            vscode.window.showErrorMessage(`Error executing query: ${error.message}`);
            return;
        }
    });

    const runQueryOnFileCommand = vscode.commands.registerCommand('vs-quack.runQueryOnExplorer', async (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('No file selected.');
            return;
        }
        try{
            const query = createQueryFromPath(uri.fsPath);
            openQueryWindow(context, connection, query);
            const result = await handleQuery(context, {query: query}, connection);
            await handleResult(result);

        } catch (error: any) {
            vscode.window.showErrorMessage(`Error executing query: ${error.message}`);
            return;
        }
    });

    const showHistoryCommand = vscode.commands.registerCommand('vs-quack.showQueryHistory', async () => {
        const history = getQueryHistory(context);
        if (history.length === 0) {
            vscode.window.showInformationMessage('Query history is empty.');
            return;
        }
    
        const selectedQuery = await vscode.window.showQuickPick(
            history.map((query, index) => ({ label: `Query ${index + 1}`, description: query })),
            {
                placeHolder: 'Filter and select a query',
                matchOnDescription: true,
            }
        );
    
        if (selectedQuery && selectedQuery.description) {
            openQueryWindow(context, connection, selectedQuery.description);
        }
    });
    

    context.subscriptions.push(runQueryDisposable);
    context.subscriptions.push(setDuckDbSettings);
    context.subscriptions.push(runSelectedTextQueryCommand);
    context.subscriptions.push(runQueryOnFileCommand);
    context.subscriptions.push(showHistoryCommand);
    
}
