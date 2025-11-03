import * as vscode from 'vscode';

/**
 * Try to resolve a variable value from the active debug session.
 * Requires the debugger to be paused and the variable to be in-scope.
 *
 * Returns the value as a string, or throws an informative error.
 */
export async function getDebugVariableValue(variableName: string): Promise<string> {
    if (!vscode.debug.activeDebugSession) {
        throw new Error('No active debug session.');
    }
    const session = vscode.debug.activeDebugSession;

    // Helper to try evaluate with a context. Returns result string or null.
    async function tryEvaluate(context: 'repl' | 'watch' | 'hover'): Promise<string | null> {
        try {
            const resp: any = await session.customRequest('evaluate', {
                expression: variableName,
                context
            });
            if (resp && typeof resp.result === 'string' && resp.result.length > 0) {
                return resp.result;
            }
            // some adapters return result in a different shape, attempt to use resp
            if (resp && typeof resp === 'string') {
                return resp;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // 1) Try repl (works well for Python)
    const rep = await tryEvaluate('repl');
    if (rep) {
        return rep;
    }

    // 2) Try watch
    const w = await tryEvaluate('watch');
    if (w) {
        return w;
    }

    // 3) Try hover (some adapters)
    const h = await tryEvaluate('hover');
    if (h) {
        return h;
    }

    // 4) Fallback: use threads -> stackTrace -> scopes -> variables
    try {
        const threadsResp: any = await session.customRequest('threads', {});
        const threads = threadsResp && threadsResp.threads ? threadsResp.threads : [];
        if (!threads.length) {
            throw new Error('No threads reported by debug adapter.');
        }

        // Pick a thread to inspect. Prefer first thread; better approach would inspect all stopped threads.
        for (const thread of threads) {
            const threadId = thread.id;
            // Get stack trace for this thread (top frame)
            let stackResp: any;
            try {
                stackResp = await session.customRequest('stackTrace', { threadId, startFrame: 0, levels: 20 });
            } catch (e) {
                continue; // try next thread
            }
            const frames = stackResp && stackResp.stackFrames ? stackResp.stackFrames : [];
            if (!frames.length) {
                continue;
            }

            // Iterate frames (top-down)
            for (const frame of frames) {
                const frameId = frame.id;
                // Get scopes for the frame
                let scopesResp: any;
                try {
                    scopesResp = await session.customRequest('scopes', { frameId });
                } catch (e) {
                    continue; // next frame
                }
                const scopes = scopesResp && scopesResp.scopes ? scopesResp.scopes : [];
                // For each scope, fetch variables and search for variableName
                for (const scope of scopes) {
                    const variablesReference = scope.variablesReference;
                    if (!variablesReference) {
                        continue;
                    }
                    // request variables (may need paging; request many)
                    let varsResp: any;
                    try {
                        varsResp = await session.customRequest('variables', { variablesReference });
                    } catch (e) {
                        continue;
                    }
                    const vars = varsResp && varsResp.variables ? varsResp.variables : [];
                    // Search direct variables for matching name
                    for (const v of vars) {
                        // Different adapters expose name and value; some include evaluateName
                        if (v.name === variableName || v.evaluateName === variableName) {
                            // return stringified value
                            return String(v.value ?? '');
                        }
                    }
                    // For complex variables (objects), you might want to expand children: you could search recursively.
                } // end scopes loop
            } // end frames loop
        } // end threads loop

        throw new Error(`Variable '${variableName}' not found in any visible scope.`);
    } catch (err: any) {
        // Provide a helpful message
        throw new Error(
            `Failed to read variable '${variableName}'. Ensure the debugger is paused and the variable is in scope. (${err.message || err})`
        );
    }
}
