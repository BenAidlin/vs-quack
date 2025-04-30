
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
    const headerRow = headers.map(header => `<th>${header}</th>`).join('');

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
                    }
                </style>
            </head>
            <body>
                <h1>Query Results</h1>
                <table>
                    <thead>
                        <tr>${headerRow}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </body>
        </html>`;
}