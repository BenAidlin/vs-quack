import { DuckDBConnection } from '@duckdb/node-api';
import * as vscode from 'vscode';

let runningQueryCount = 0;
export async function showBusyWarning<T>(connection: DuckDBConnection, fn: () => Promise<T>): Promise<T> {
    if (runningQueryCount > 0) {
        const choice = await vscode.window.showWarningMessage(
            'DuckDB is currently executing a query. Query is queued.',
            'Interrupt'
        );
    
        if (choice === 'Interrupt') {
            connection.interrupt();
        }
    }
    runningQueryCount++;
    try {
        return await fn();
    } finally {
        runningQueryCount--;
    }
}
