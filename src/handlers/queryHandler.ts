import * as vscode from 'vscode';
import { executeQuery, wrapQueryWithCopyTo } from '../util/ddbClient';
import { saveQueryToHistory } from './historyHandler';
import { DuckDBConnection } from '@duckdb/node-api';

export async function handleQuery(
    context: vscode.ExtensionContext,
    message: any,
    connection: DuckDBConnection
): Promise<any> {
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
        connection,
        message.query,
    );
    if (!result) {
        return null;
    }
    // Ensure result is stringified for display
    for (let r of result) {
        for (let k in r) {
            if (
                typeof r[k] !== "string" &&
                typeof r[k] !== "number" &&
                typeof r[k] !== "boolean"
            ) {
                try{
                    r[k] = r[k].toString();
                } catch (e) {
                    
                }
            }
        }
    }
    await saveQueryToHistory(context, message.query);
    return result;

}