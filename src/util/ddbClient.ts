import * as vscode from 'vscode';
import * as path from 'path';



const fs = require('fs');
const readline = require('readline');

export async function getConnection(settingsPath: string | null | undefined = null): Promise<any> {
    const { DuckDBConnection } = require("@duckdb/node-api");
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

async function executeFileLineByLine(filePath: string, connection: any) {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity // Recognize all instances of CR LF as a single newline
    });

    for await (const line of rl) {
        connection.run(line);
    }
}

export const executeQuery: any = async (connection: any, query: string) => {
    const result = await connection.streamAndReadUntil(query, 1000);
    return result.getRowObjects();
};

export async function ensureDbFile(context: vscode.ExtensionContext): Promise<string> {
    const storagePath = context.globalStorageUri.fsPath;

    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }

    const cacheFilePath = path.join(storagePath, 'duckdb.db');

    return cacheFilePath;
}

export function wrapQueryWithCopyTo(query: string, destination: string, format: string): string {
    query = query.replace(/;/g, '');
    return `COPY (${query}) TO '${destination}/vs-quack.${format}';`;
}

export function createQueryFromPath(uri: string){
    const query = `SELECT * FROM '${uri}'`;
    return query;
}