# vs-quack

vs-quack is a lightweight, fast, and convenient DuckDB-powered data exploration and processing extension for Visual Studio Code.  
Run SQL queries, preview data files, inspect variables during debugging, and view query history — all backed by DuckDB.

<div style="text-align: center;">
    <img src="images/demo3.gif" alt="Demo GIF" height="300">
</div>

---

## Features

### 🔧 [Optionally] Configure DuckDB (Required for S3)

If you already use DuckDB with a `.duckdbrc` or other config file, load your settings via:  
**`vs-quack: Set DuckDb Settings`** (Command Palette)

**Why this matters:**  
This loads your DuckDB configuration (e.g., `httpfs`, AWS credentials, S3 endpoints, access keys).  
✔ **You must do this if you want to query files stored in S3.**  
<br>Once configured, vs-quack can query S3 paths directly, such as:<br><br>
`SELECT * FROM 's3://my-bucket/data.parquet';`

You can also perform cross-file and cross-format operations, like joining a CSV with a Parquet file:<br>

```
SELECT * FROM 'local_file.csv' AS a
JOIN 's3://bucket/data.parquet' AS b
ON a.id = b.id;
```

For more information about duckdb's cloud integrations visit:<br>

* https://duckdb.org/docs/stable/core_extensions/httpfs/s3api
* https://duckdb.org/docs/stable/guides/network_cloud_storage/gcs_import
* https://duckdb.org/docs/stable/core_extensions/azure

---


You can execute queries in multiple ways — pick whichever suits your workflow:

#### 1️⃣ Run a query from a prompt

Open the **Command Palette** →  
**`vs-quack: Run DuckDb Query`**  
Type your SQL query and select between execute, or export in different formats.

> 💡 Perfect for ad-hoc queries or testing small snippets, as well as data importing.

#### 2️⃣ Run selected text as a query in the editor

Highlight the SQL text in your editor → Right-click →  
**`vs-quack: Run Selected Text as Query`**

> 🔹 Great for working within scripts or notebooks.

#### 3️⃣ Run a query on a file via Explorer

Right-click a file in the **Explorer** →  
**`vs-quack: Run Query on Explorer`**

> 🗄️ Instantly query CSV, Parquet, JSON, or any DuckDB-supported file.

#### 4️⃣ Quick preview with “Choose File”

Use **`vs-quack: Choose File`** → select a file → opens a blank query ready to run.

> 👀 Ideal for inspecting data files without writing queries first.

---


Create a .duckdbnb file and run queries in a VS Code notebook powered by DuckDB:
* Each cell can contain SQL queries (default cell type: sql)
* Execute individual cells or the entire notebook
* View query results inline, with full support for large datasets
* Perfect for exploratory data analysis across multiple files
>💡 Notebooks make it easy to mix queries, visualizations, and notes in one place.

---


Evaluate SQL stored in variables during debugging:

Right-click → **`vs-quack: Evaluate Variable`**

---


Use **`vs-quack: Choose File`** to select a data file and open it with an empty query.  
Useful for quickly previewing CSV, Parquet, JSON, and other structured formats.

---


View your last 50 executed queries, filter them, and reopen them in the editor with:  
**`vs-quack: Show Query History`**

---

## Requirements

- Visual Studio Code **v1.97.0 or higher**

---

## Known Issues

- Windows is currently unsupported
- No internal DuckDB limit on database size (when creating tables)
- No memory or CPU limits enforced by the extension  
   → You can control these through your DuckDB settings file

---

## Release Notes


- Updated to DuckDB 1.4.1
- Results view styling updated to match VS Code UI
- Only one results panel remains open at a time
- Limited results to top 200 + bottom 200 rows
- Disabled auto-open when running queries from editor selection

---


- Added evaluation of query variables during debugging
- Added “Choose File” feature
- Moved row limitation into the reader (top 500 rows)

---


- Visual improvements (warnings, executed query, progress indicator)
- Added query execution time to results window
- Increased result preview limit to **999 rows**
- Introduced notebook support — interactive SQL notebooks with inline results

---
