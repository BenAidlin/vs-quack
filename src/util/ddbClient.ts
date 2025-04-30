import { DuckDBConnection } from '@duckdb/node-api';

export const executeQuery: any = async (query: string) => {
    const connection = await DuckDBConnection.create();
    const result = await connection.runAndReadAll(query);
    return result.getRowObjects();
};