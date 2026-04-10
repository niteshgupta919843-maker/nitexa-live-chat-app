require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL Connected");
    conn.release();
  } catch (err) {
    console.log("DB Error:", err.message);
  }
})();

const users = {};

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", async (socket) => {
  console.log("CONNECTED:", socket.id);

  try {
    const [rows] = await pool.query(
      "SELECT username, text, timestamp FROM messages ORDER BY id DESC LIMIT 50"
    );
    socket.emit("message-history", rows.reverse());
  } catch (err) {
    console.log("FETCH ERROR:", err.message);
  }

  socket.on("user-join", async (username) => {  
    if (!username) return;


    
    users[socket.id] = username;
    console.log("JOIN:", username);

try {
  await pool.query(
    "INSERT IGNORE INTO users (username) VALUES (?)",
    [username]
  );
} catch (err) {
  console.log("USER INSERT ERROR:", err.message);
}
    socket.broadcast.emit("system-message", {
      text: `${username} joined the chat`,
      timestamp: getTime(),
    });

    socket.emit("join-confirmed", username);
  });

  socket.on("send-message", async (data) => {
    const username = users[socket.id];

    console.log("SEND:", { username, text: data?.text });

    if (!username || !data?.text) return;

    const time = getTime();

    try {
      const [result] = await pool.query(
        "INSERT INTO messages (username, text, timestamp) VALUES (?, ?, ?)",
        [username, data.text, time]
      );

      console.log("INSERT ID:", result.insertId);
    } catch (err) {
      console.log("INSERT ERROR:", err.message);
      return;
    }

    io.emit("receive-message", {
      username,
      text: data.text,
      timestamp: time,
    });
  });

  socket.on("typing", () => {
    const username = users[socket.id];
    if (username) socket.broadcast.emit("user-typing", username);
  });

  socket.on("stop-typing", () => {
    socket.broadcast.emit("user-stop-typing");
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];

    if (username) {
      console.log("LEFT:", username);

      io.emit("system-message", {
        text: `${username} left the chat`,
        timestamp: getTime(),
      });

      delete users[socket.id];
    }
  });
});

function getTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});