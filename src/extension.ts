import * as vscode from 'vscode';
import { executeQuery } from './util/ddbClient';
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('vs-quack.helloWorld', () => {
		executeQuery("SELECT 'ben hagever' as col1;").then((result: any) => {
			console.log('Query result:', result);
			vscode.window.showInformationMessage(`Query result: ${JSON.stringify(result)}`);
		});
	});

	context.subscriptions.push(disposable);
}
export function deactivate() {}
