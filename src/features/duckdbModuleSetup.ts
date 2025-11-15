import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * Copies the correct DuckDB binaries for the current platform into node_modules
 * so that require("@duckdb/node-api") works at runtime.
 */
export function setupDuckDBInNodeModules(context: vscode.ExtensionContext) {
    const extensionRoot = context.extensionPath;
    const duckdbNativeRoot = path.join(extensionRoot, "out", "duckdb-native");

    // Compute platform folder dynamically at runtime
    const platformFolder = `${os.platform()}-${os.arch()}`;
    const duckdbSource = path.join(duckdbNativeRoot, platformFolder, "@duckdb");

    if (!fs.existsSync(duckdbSource)) {
        throw new Error(
            `DuckDB binaries not found for current platform: ${platformFolder}. ` +
            `Expected folder: ${duckdbSource}`
        );
    }

    const nodeModulesDir = path.join(extensionRoot, "out", "node_modules");
    const duckdbDest = path.join(nodeModulesDir, "@duckdb");

    // Skip if already copied
    if (fs.existsSync(duckdbDest)) {return;}

    // Ensure node_modules exists
    if (!fs.existsSync(nodeModulesDir)) {
        fs.mkdirSync(nodeModulesDir, { recursive: true });
    }

    // Copy the DuckDB folder recursively
    copyFolderRecursiveSync(duckdbSource, duckdbDest);
}

/**
 * Recursively copy a folder from source to target.
 */
function copyFolderRecursiveSync(source: string, target: string) {
    if (!fs.existsSync(source)) {return;}

    const stats = fs.statSync(source);
    if (stats.isDirectory()) {
        if (!fs.existsSync(target)) {fs.mkdirSync(target);}
        for (const entry of fs.readdirSync(source)) {
            const srcPath = path.join(source, entry);
            const destPath = path.join(target, entry);
            copyFolderRecursiveSync(srcPath, destPath);
        }
    } else {
        fs.copyFileSync(source, target);
    }
}
