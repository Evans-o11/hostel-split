require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function runMigrations() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const folder = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".sql"))
    .sort();
    console.log("Found files:", files);
    for (const file of files) { 
        const done = await pool.query("SELECT 1 FROM  schema_migrations WHERE name = $1", [file]); 
        if (done.rows.length > 0) {
      console.log("Skipping", file);
      continue;
        }
        const sql = fs.readFileSync(path.join(folder, file), "utf8");
         await pool.query(sql);
    await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    console.log("Applied", file);
    }
  await pool.end();
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
