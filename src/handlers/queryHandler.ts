import * as vscode from 'vscode';
import { executeQuery, wrapQueryWithCopyTo } from '../util/ddbClient';
import { saveQueryToHistory } from './historyHandler';
import { DuckDBConnection } from '@duckdb/node-api';

export async function handleQuery(
    context: vscode.ExtensionContext,
    message: any,
    connection: DuckDBConnection
): Promise<any> {
    // If user requested CSV/JSON export, wrap query with COPY
    if (message.type) {
        const destination = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select destination folder',
            canSelectFolders: true,
            filters: { 'All Files': ['*'] }
        });

        if (!destination || destination.length === 0) {
            vscode.window.showWarningMessage('No destination selected.');
            return;
        }

        message.query = wrapQueryWithCopyTo(message.query, destination[0].fsPath, message.type);
        await executeQuery(connection, message.query);
        await saveQueryToHistory(context, message.query);

        return { message: `Query exported to ${destination[0].fsPath}` };
    }

    // Regular query
    const fullResult = await executeQuery(connection, message.query);
    if (!fullResult) { return null; }

    const totalRows = Math.min(fullResult.length, 500);
    const preview: any[] = [];

    // Helper to normalize row values
    const normalizeRow = (row: any) => {
        const copy = { ...row };
        for (let k in copy) {
            if (typeof copy[k] !== "string" && typeof copy[k] !== "number" && typeof copy[k] !== "boolean") {
                try { copy[k] = copy[k].toString(); } catch { }
            }
        }
        return copy;
    };

    for (let i = 0; i < totalRows; i++) {
        preview.push(normalizeRow(fullResult[i]));
    }

    await saveQueryToHistory(context, message.query);

    return preview;
}
