import * as vscode from 'vscode';
import { DuckDBConnection } from '@duckdb/node-api';

const fs = require('fs');
const readline = require('readline');

async function executeFileLineByLine(filePath: string, connection: DuckDBConnection) {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity // Recognize all instances of CR LF as a single newline
    });

    for await (const line of rl) {
        connection.run(line);
    }
}


async function getConnection(settingsPath: string | null | undefined = null): Promise<DuckDBConnection> {
    const connection = await DuckDBConnection.create();
    if (settingsPath){
        try {
            await executeFileLineByLine(settingsPath, connection).catch(console.error);
        }
        catch (error) {
            vscode.window.showWarningMessage('Could not load or execute settings file properly.');
        }
    }
    return connection;
};

export const executeQuery: any = async (query: string, settingsPath: string | null = null) => {
    const connection = await getConnection(settingsPath);
    const result = await connection.runAndReadAll(query);
    return result.getRowObjects();
};