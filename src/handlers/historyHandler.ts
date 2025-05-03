import * as vscode from 'vscode';
const QUERY_HISTORY_KEY = 'queryHistory';
const QUERY_HISTORY_LIMIT = 50;

export async function saveQueryToHistory(context: vscode.ExtensionContext, query: string): Promise<void> {
    const history = context.globalState.get<string[]>(QUERY_HISTORY_KEY, []);
    const updatedHistory = [query, ...history.filter(q => q !== query)];
    if (updatedHistory.length > QUERY_HISTORY_LIMIT) {
        updatedHistory.pop();
    }
    await context.globalState.update(QUERY_HISTORY_KEY, updatedHistory);
}

export function getQueryHistory(context: vscode.ExtensionContext): string[] {
    return context.globalState.get<string[]>(QUERY_HISTORY_KEY, []);
}