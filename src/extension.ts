import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vs-quack" is now active!');
	const disposable = vscode.commands.registerCommand('vs-quack.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vs-quack!');
	});

	context.subscriptions.push(disposable);
}
export function deactivate() {}
