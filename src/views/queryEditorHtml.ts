export function getQueryEditorHtml(): string {
    const styles = `
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            textarea {
                width: 100%;
                height: 150px;
                padding: 10px;
                font-family: monospace;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-sizing: border-box;
            }
            button {
                margin-top: 10px;
                padding: 10px 20px;
                font-size: 14px;
                cursor: pointer;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f4f4f4;
                cursor: pointer;
            }
            input[type="text"] {
                margin-bottom: 10px;
                padding: 8px;
                width: 100%;
                box-sizing: border-box;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
        </style>
    `;

    const scripts = `
        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('runQueryButton').addEventListener('click', () => {
                const query = document.getElementById('queryInput').value;
                vscode.postMessage({ command: 'runQuery', query });
            });

            window.addEventListener('message', (event) => {
                const message = event.data;

                if (message.command === 'queryResult') {
                    renderTable(message.result);
                } else if (message.command === 'queryError') {
                    document.getElementById('resultContainer').innerHTML =
                        '<p style="color: red;">Error: ' + message.error + '</p>';
                }
            });

            function renderTable(data) {
                const resultContainer = document.getElementById('resultContainer');
                if (!Array.isArray(data) || data.length === 0) {
                    resultContainer.innerHTML = '<h2>No Results</h2>';
                    return;
                }

                const headers = Object.keys(data[0]);
                const headerRow = headers.map(header =>
                    '<th onclick="sortTable(\\'' + header + '\\')">' + header + ' &#9650;&#9660;</th>'
                ).join('');

                const rows = data.map(row => {
                    const cells = headers.map(header => '<td>' + row[header] + '</td>').join('');
                    return '<tr>' + cells + '</tr>';
                }).join('');

                resultContainer.innerHTML = \`
                    <input type="text" id="searchBox" placeholder="Search..." onkeyup="filterTable()">
                    <table id="resultsTable">
                        <thead>
                            <tr>\${headerRow}</tr>
                        </thead>
                        <tbody>
                            \${rows}
                        </tbody>
                    </table>
                \`;
            }

            function filterTable() {
                const input = document.getElementById('searchBox').value.toLowerCase();
                const table = document.getElementById('resultsTable');
                const rows = table.getElementsByTagName('tr');

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const cells = row.getElementsByTagName('td');
                    let match = false;

                    for (let j = 0; j < cells.length; j++) {
                        const cell = cells[j];
                        if (cell && cell.textContent.toLowerCase().includes(input)) {
                            match = true;
                            break;
                        }
                    }

                    row.style.display = match ? '' : 'none';
                }
            }

            let sortOrder = {};
            function sortTable(column) {
                const table = document.getElementById('resultsTable');
                const rows = Array.from(table.getElementsByTagName('tr')).slice(1);
                const columnIndex = Array.from(table.getElementsByTagName('th'))
                    .findIndex(th => th.textContent.includes(column));

                if (sortOrder[column] === undefined) {
                    sortOrder[column] = true;
                } else {
                    sortOrder[column] = !sortOrder[column];
                }

                rows.sort((a, b) => {
                    const cellA = a.getElementsByTagName('td')[columnIndex]?.textContent || '';
                    const cellB = b.getElementsByTagName('td')[columnIndex]?.textContent || '';

                    if (!isNaN(cellA) && !isNaN(cellB)) {
                        return sortOrder[column]
                            ? Number(cellA) - Number(cellB)
                            : Number(cellB) - Number(cellA);
                    }

                    return sortOrder[column]
                        ? cellA.localeCompare(cellB)
                        : cellB.localeCompare(cellA);
                });

                const tbody = table.getElementsByTagName('tbody')[0];
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));
            }
        </script>
    `;

    const body = `
        <body>
            <h1>Query Editor</h1>
            <textarea id="queryInput" placeholder="Enter your SQL query here..."></textarea>
            <button id="runQueryButton">Run Query</button>
            <div id="resultContainer"></div>
        </body>
    `;

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Query Editor</title>
            ${styles}
        </head>
        ${body}
        ${scripts}
        </html>
    `;
}
