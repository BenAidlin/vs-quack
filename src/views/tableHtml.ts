export function getHtmlForTable(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
        return `<html>
            <body>
                <h2>No Results</h2>
            </body>
        </html>`;
    }

    // Extract table headers
    const headers = Object.keys(data[0]);

    // Generate table headers
    const headerRow = headers
        .map(header => `<th onclick="sortTable('${header}')">${header} &#9650;&#9660;</th>`)
        .join('');

    // Generate table rows
    const rows = data
        .map(row => {
            const cells = headers.map(header => `<td>${row[header]}</td>`).join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
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
            </head>
            <body>
                <h1>Query Results</h1>
                <input type="text" id="searchBox" placeholder="Search..." onkeyup="filterTable()">
                <table id="resultsTable">
                    <thead>
                        <tr>${headerRow}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <script>
                    // Function to filter table rows based on input
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

                    // Function to sort table rows by a column
                    let sortOrder = {};
                    function sortTable(column) {
                        const table = document.getElementById('resultsTable');
                        const rows = Array.from(table.getElementsByTagName('tr')).slice(1); // Exclude header row
                        const columnIndex = Array.from(table.getElementsByTagName('th'))
                            .findIndex(th => th.textContent.includes(column));

                        if (sortOrder[column] === undefined) {
                            sortOrder[column] = true; // Initial sort order is ascending
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
            </body>
        </html>`;
}
