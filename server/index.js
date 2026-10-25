require("dotenv").config();
const express = require("express");
const { hashPassword, checkPassword } = require("./passwords");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const pool = require("./db");
const crypto = require("crypto");
const { error } = require("console");

const app = express();
app.use(express.json());
app.use(cors({ origin: ["http://127.0.0.1:5500", "http://localhost:5500"] }));
const PORT = 3000;
const RESET_MINUTES = 5;
const APP_URL = "http://127.0.0.1:5500/index.html";


app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
     return res.status(400).json({error: "Please enter your email."})
  }
  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query("SELECT id FROM users WHERE email = $1", [cleanEmail]);
    if (result.rows.length > 0) {
      const userId = result.rows[0].id;
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await pool.query("UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [userId]);
      const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
      await pool.query("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [userId, tokenHash, expiresAt])
      console.log("RESET LINK (development only):", APP_URL + "?reset=" + token);
    }
    res.json({ message: "If that email is registered, a reset link has been sent."})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
})

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
app.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) {
     return res.status(404).json({error:"A valid link and a new password of at least 8 characters are required"})
  }
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const claim = await pool.query("UPDATE password_resets SET used_at = NOW() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW() RETURNING user_id", [tokenHash])
    if (claim.rows.length === 0) {
      return res.status(400).json({error: "This link has expired or was already used. Please request a new one"})
    }
    const passwordHash = await hashPassword(password)
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, claim.rows[0].user_id])
    res.json({ message: "Your password has been changed. You can now sign in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error:"Something went wrong. Please try again."})
  }
})

app.listen(PORT, function () {
  console.log("Duesly server listening on http://localhost:" + PORT);

});



