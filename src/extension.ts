import * as vscode from 'vscode';
import { handleQuery } from './handlers/queryHandler';
import { createQueryFromPath, getConnection } from './util/ddbClient';
import { handleResult } from './handlers/resultHandler';
import { openQueryWindow } from './handlers/queryWindowHandler';
import { getQueryHistory } from './handlers/historyHandler';
import { getDebugVariableValue } from './util/debuggingUtil';
import { performance } from "perf_hooks";
import SampleSerializer from './features/notebookSerializer';
import { getResultsHtml } from './views/getResultsHtml';
import { setupDuckDBInNodeModules } from './features/duckdbModuleSetup';

export async function activate(context: vscode.ExtensionContext) {
    setupDuckDBInNodeModules(context);
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

        try{
            //openQueryWindow(context, connection, selectedText);
            const start = performance.now();
            const result = handleQuery(context, { query: selectedText }, connection);
            await handleResult(context, result, start, selectedText);
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
            const start = performance.now();
            const result = handleQuery(context, { query: query }, connection);
            await handleResult(context, result, start, query);

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

    const runOnVariableHelper = async (variableValue: string) => {
        // Many adapters return strings quoted, so strip quotes if present
        const cleaned = String(variableValue)
            .replace(/^['"]|['"]$/g, '')   // remove wrapping quotes
            .replace(/\\r/g, ' ')          // replace literal \r
            .replace(/\\n/g, ' ')          // replace literal \n
            .trim();                        // remove leading/trailing whitespace
        const start = performance.now();
        const result = handleQuery(context, { query: cleaned }, connection);
        await handleResult(context, result, start, cleaned);
    };

    const runCurrentVariableQuery = vscode.commands.registerCommand('vs-quack.runCurrentVariableQuery', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;


        const selection = editor.selection;
        const wordRange = editor.document.getWordRangeAtPosition(selection.active);
        const variableName = editor.document.getText(wordRange);

        if (!variableName) {
            vscode.window.showWarningMessage('No variable selected.');
            return;
        }

        try {
            const val = await getDebugVariableValue(variableName);
            return await runOnVariableHelper(val);
        } catch (err: any) {
            vscode.window.showErrorMessage(err.message || String(err));
        }
    });

    const runCurrentVariableQueryOnVariable = vscode.commands.registerCommand('vs-quack.runCurrentVariableQueryOnVariable', async (variableValue?: string) => {
        try {
            if (!variableValue) {
                vscode.window.showWarningMessage('No variable provided.');
                return;
            }
            return await runOnVariableHelper(variableValue);
        } catch (err: any) {
            vscode.window.showErrorMessage(err.message || String(err));
        }
    });


    const runQueryOnFileDialog = vscode.commands.registerCommand('vs-quack.runQueryOnFileDialog', async () => {
        // Let user pick a file
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select a file to query',
            canSelectFiles: true,
            filters: { 'All Files': ['*'] }
        });

        if (!fileUri || fileUri.length === 0) {
            vscode.window.showWarningMessage('No file selected.');
            return;
        }

        const filePath = fileUri[0].fsPath;
        const query = createQueryFromPath(filePath); // generate SELECT * FROM 'file'

        try {
            const start = performance.now();
            const result = handleQuery(context, { query: query }, connection);
            await handleResult(context, result, start, query);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Error executing query: ${err.message || err}`);
        }
    });

    context.subscriptions.push(runQueryDisposable);
    context.subscriptions.push(setDuckDbSettings);
    context.subscriptions.push(runSelectedTextQueryCommand);
    context.subscriptions.push(runQueryOnFileCommand);
    context.subscriptions.push(showHistoryCommand);
    context.subscriptions.push(runCurrentVariableQuery);
    context.subscriptions.push(runCurrentVariableQueryOnVariable);
    context.subscriptions.push(runQueryOnFileDialog);

    // -------------------------
    // Notebook Controller
    // -------------------------
    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer('vs-quack-notebook', new SampleSerializer())
    );

    const controller = vscode.notebooks.createNotebookController(
        'vs-quack-notebook-controller',
        'vs-quack-notebook',
        'VS Quack DuckDB Notebook'
    );

    controller.supportedLanguages = ['sql']; // optional, highlight SQL
    controller.executeHandler = async (cells, notebook, controller) => {
        for (const cell of cells) {
            const execution = controller.createNotebookCellExecution(cell);
            execution.start(Date.now());

            try {
                const startTime = performance.now();
                const result = await handleQuery(context, { query: cell.document.getText() }, connection);

                if (result.data && result.data.length >= 40) {
                    const firstPart = result.data.slice(0, 20);
                    const placeholder: any = {};
                    const keys = Object.keys(result.data[0]);
                    keys.forEach(key => {
                        placeholder[key] = '...';
                    });
                    result.data = [...firstPart, placeholder];
                }
                const resultHtml = getResultsHtml(result.data, false, (performance.now() - startTime) / 1000);

                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.text(resultHtml, 'text/html')
                    ])
                ]);
            } catch (err: any) {
                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.error(err)
                    ])
                ]);
            }

            execution.end(true);
        }
    };

    context.subscriptions.push(controller);

}
