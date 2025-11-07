import * as vscode from 'vscode';

export class QueryCodeLensProvider implements vscode.CodeLensProvider {
    private regex = /\b([a-zA-Z_]*(query|sql)[a-zA-Z0-9_]*)\s*=\s*(?:\(+\s*)?(?:f|rf|fr)?\s*(?:(["']{1,3})[\s\S]*?\3(?:\s*\)+)?)/gi;

    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        if (!vscode.debug.activeDebugSession) {
            return []; // skip if not debugging
        }
        const text = document.getText();
        const codeLenses: vscode.CodeLens[] = [];
        let match;

        while ((match = this.regex.exec(text)) !== null) {
            const matchStart = document.positionAt(match.index);
            const matchEnd = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(matchStart, matchEnd);
            
            codeLenses.push(new vscode.CodeLens(range, {
                title: '▶ Run Query',
                command: 'vs-quack.runCurrentVariableQuery',
                arguments: [match[1]] // variable name
            }));
        }

        return codeLenses;
    }
}
