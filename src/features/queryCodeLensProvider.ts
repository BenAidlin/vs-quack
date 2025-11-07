import * as vscode from 'vscode';
import { getDebugVariableValue } from '../util/debuggingUtil';

export class QueryCodeLensProvider implements vscode.CodeLensProvider {

    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        if (!vscode.debug.activeDebugSession) {
            return []; // skip if not debugging
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.document.uri.toString() !== document.uri.toString()) {
            return []; // skip if not the active document
        }
        const codeLenses: vscode.CodeLens[] = [];
        // Determine the last debugged line
        const editor = vscode.window.activeTextEditor;
        const debugLine = editor?.selection.active.line ?? Number.MAX_SAFE_INTEGER;
        let lastMatchVar: string | null = null;
        let lastMatchLine: number | null = null;

        for (let i = 0; i <= debugLine; i++) {
            const lineText = document.lineAt(i).text;
            const match = lineText.match(/\b([a-zA-Z_]*(query|sql)[a-zA-Z0-9_]*)\b/i);
            if (match) {
                lastMatchLine = i;
                lastMatchVar = match[1];
            }
        }

        // Only one CodeLens for the last match
        if (lastMatchVar !== null && lastMatchLine !== null) {
            const range = new vscode.Range(lastMatchLine, 0, lastMatchLine, document.lineAt(lastMatchLine).text.length);
            const codeLens = new vscode.CodeLens(range);
            (codeLens as any).variableName = lastMatchVar;
            return [codeLens];
        }

        return codeLenses;
    }
    public async resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        if (!vscode.debug.activeDebugSession) { return codeLens; }

        const variableName = (codeLens as any).variableName as string;
        if (!variableName) { return codeLens; }

        const val = await getDebugVariableValue(variableName);

        if (!val || val.trim().length === 0) { return codeLens; }
        const cleaned = String(val)
            .replace(/^['"]|['"]$/g, '')
            .replace(/\\r/g, ' ')
            .replace(/\\n/g, ' ')
            .trim();

        if (!/^(SELECT|INSERT|DROP|CREATE)/i.test(cleaned)) {
            return codeLens;
        }

        codeLens.command = {
            title: '▶ Evaluate with DuckDb',
            command: 'vs-quack.runCurrentVariableQueryOnVariable',
            arguments: [cleaned]
        };

        return codeLens;
    }

}
