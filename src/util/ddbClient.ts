import * as vscode from 'vscode';
import * as path from 'path';
import { DuckDBConnection } from '@duckdb/node-api';
import { DuckDBInstance,  } from '@duckdb/node-api';


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


async function getConnection(context: vscode.ExtensionContext, settingsPath: string | null | undefined = null): Promise<DuckDBConnection> {
    const dbPath = await ensureDbFile(context);
    // const instance = await DuckDBInstance.create(dbPath);
    const instance = await DuckDBInstance.fromCache(dbPath, {
        
    });
    const connection = await instance.connect();
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

export const executeQuery: any = async (context: vscode.ExtensionContext, query: string, settingsPath: string | null = null) => {
    const connection = await getConnection(context, settingsPath);
    const result = await connection.runAndReadAll(query);
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