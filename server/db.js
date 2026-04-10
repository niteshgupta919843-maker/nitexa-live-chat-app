
const mysql = require("mysql2/promise");


const pool = mysql.createPool({
  host: "localhost",
  user: "root",          
  database: "nitexa_chat",
  waitForConnections: true,
  connectionLimit: 10,
});


async function saveUser(username) {

  const [existing] = await pool.query(
    "SELECT id FROM users WHERE username = ?", [username]
  );
  if (existing.length > 0) return existing[0].id;


  const [result] = await pool.query(
    "INSERT INTO users (username) VALUES (?)", [username]
  );
  return result.insertId;
}

async function saveMessage(userId, username, text, timestamp) {
  await pool.query(
    "INSERT INTO messages (user_id, username, text, timestamp) VALUES (?, ?, ?, ?)",
    [userId, username, text, timestamp]
  );
}


async function getMessages() {
  const [rows] = await pool.query(
    "SELECT username, text, timestamp FROM messages ORDER BY created_at DESC LIMIT 50"
  );
  return rows.reverse(); 
}

module.exports = { saveUser, saveMessage, getMessages };