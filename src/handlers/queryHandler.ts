import * as vscode from 'vscode';
import { executeQuery, wrapQueryWithCopyTo } from '../util/ddbClient';
import { saveQueryToHistory } from './historyHandler';
import { DuckDBConnection } from '@duckdb/node-api';

const PREVIEW_ROWS_START = 200;
const PREVIEW_ROWS_END = 200;
const DOT_ROWS = 5; // number of rows of dots to show in the middle

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
    if (!fullResult) return null;

    const totalRows = fullResult.length;
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

    // First N rows
    for (let i = 0; i < Math.min(PREVIEW_ROWS_START, totalRows); i++) {
        preview.push(normalizeRow(fullResult[i]));
    }

    // Add multiple "..." rows if truncated
    if (totalRows > PREVIEW_ROWS_START + PREVIEW_ROWS_END) {
        const firstRowKeys = Object.keys(fullResult[0] || {});

        for (let d = 0; d < DOT_ROWS; d++) {
            const ellipsisRow: any = {};
            firstRowKeys.forEach(key => ellipsisRow[key] = '...');
            preview.push(ellipsisRow);
        }

        // Last N rows
        for (let i = totalRows - PREVIEW_ROWS_END; i < totalRows; i++) {
            preview.push(normalizeRow(fullResult[i]));
        }

        vscode.window.showWarningMessage(
            `Query returned ${totalRows} rows, previewing first ${PREVIEW_ROWS_START} and last ${PREVIEW_ROWS_END} rows.`
        );
    } else if (totalRows > PREVIEW_ROWS_START) {
        // Total rows between PREVIEW_ROWS_START and PREVIEW_ROWS_START + PREVIEW_ROWS_END
        for (let i = PREVIEW_ROWS_START; i < totalRows; i++) {
            preview.push(normalizeRow(fullResult[i]));
        }
    }

    await saveQueryToHistory(context, message.query);

    return preview;
}
