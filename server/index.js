require("dotenv").config();
const express = require("express");
const { hashPassword, checkPassword } = require("./passwords");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
app.use(express.json());
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
app.post("/auth/signup", async (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: "Full name, email and a password of at least 8 characters are required" });
  }
 
  try {
    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, role",
      [full_name.trim(), cleanEmail, passwordHash],
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({token, user});
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "This email is already registered. Try signing in instead." });
    }
    console.error(error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
})
app.post("/auth/signin", async (req, res) => {
   const { email, password } = req.body;
   if (!email || !password) {
     return res.status(401).json({ error: "Email and password are required" });
   }
   try {
     const result = await pool.query("SELECT * FROM users WHERE email = $1", [
       email.trim().toLowerCase(),
     ]);
     const user = result.rows[0];
     if (!user) {
       return res.status(401).json({ error: "Wrong email or password" });
     }
     const passwordOk = await checkPassword(password, user.password_hash);
     if (!passwordOk) {
       return res.status(401).json({ error: "Wrong email or password" });
     }
     const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
     res.json({  token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
   } catch (error) {
     console.error(error);
     res.status(500).json({ error: "Something went wrong. Please try again." });
   }
 });


function requireLogin(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please sign in first" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Your session has expired or is not valid. Please sign in again." })
  }
}
  app.get("/auth/me", requireLogin, async (req, res) => {
    try {
      const result = await pool.query("SELECT id, full_name, email, role FROM users WHERE id = $1", [req.user.id])
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" })
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong. Please try again." })
    }
  });
app.listen(PORT, function () {
  console.log("Duesly server listening on http://localhost:" + PORT);

});



