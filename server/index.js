const express = require("express");

const app = express();
const PORT = 3000;

app.get("/health", function (req, res) {
  res.json({ status: "ok", name: "duesly-server" });
});

app.listen(PORT, function () {
  console.log("Duesly server listening on http://localhost:" + PORT);
});
