const express = require("express");
const pool = require("./db");
const app = express();
const PORT = 3000;

app.get("/health", function (req, res) {
  res.json({ status: "ok", name: "duesly-server" });
});

app.get("/health/db", async function (req, res) {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ status: "ok", databaseTime: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", message: "Cannot reach the database" });
  }
});

app.listen(PORT, function () {
  console.log("Duesly server listening on http://localhost:" + PORT);
});



