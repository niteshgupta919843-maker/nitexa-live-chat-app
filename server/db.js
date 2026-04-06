// server/db.js
const mysql = require("mysql2/promise");

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",          // apna MySQL username
  password: "haxer@12",  // apna MySQL password
  database: "nitexa_chat",
  waitForConnections: true,
  connectionLimit: 10,
});

// Save or get existing user
async function saveUser(username) {
  // Pehle check karo user exist karta hai kya
  const [existing] = await pool.query(
    "SELECT id FROM users WHERE username = ?", [username]
  );
  if (existing.length > 0) return existing[0].id;

  // Naya user insert karo
  const [result] = await pool.query(
    "INSERT INTO users (username) VALUES (?)", [username]
  );
  return result.insertId;
}

// Save message to DB
async function saveMessage(userId, username, text, timestamp) {
  await pool.query(
    "INSERT INTO messages (user_id, username, text, timestamp) VALUES (?, ?, ?, ?)",
    [userId, username, text, timestamp]
  );
}

// Get last 50 messages (history ke liye)
async function getMessages() {
  const [rows] = await pool.query(
    "SELECT username, text, timestamp FROM messages ORDER BY created_at DESC LIMIT 50"
  );
  return rows.reverse(); // purane pehle dikhao
}

module.exports = { saveUser, saveMessage, getMessages };