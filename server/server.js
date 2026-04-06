
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
 
const app = express();
const server = http.createServer(app); 
const io = new Server(server);
 

 
const users = {}; 
const messageHistory = []; 

app.use(express.static(path.join(__dirname, "../public")));
 

io.on("connection", (socket) => {
  console.log(`🟢 New connection: ${socket.id}`);
 
  socket.emit("message-history", messageHistory);
 

  socket.on("user-join", (username) => {
    users[socket.id] = username;
    console.log(`👤 ${username} joined`);
 
    socket.broadcast.emit("system-message", {
      text: `${username} joined the chat`,
      timestamp: getTime(),
    });
 
    socket.emit("join-confirmed", username);
  });
 
 
  socket.on("send-message", (data) => {
    const username = users[socket.id];
    const message = {
      id: Date.now(),
      username,
      text: data.text,
      timestamp: getTime(),
    };
 
  
    messageHistory.push(message);
    if (messageHistory.length > 50) messageHistory.shift();
 
  
    io.emit("receive-message", message);
    console.log(`💬 [${username}]: ${data.text}`);
  });
 
  
  socket.on("typing", () => {
    const username = users[socket.id];
    socket.broadcast.emit("user-typing", username);
  });
 
  socket.on("stop-typing", () => {
    socket.broadcast.emit("user-stop-typing");
  });
 
 

  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      console.log(`🔴 ${username} left`);
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
 



const PORT =  process.env.PORT || 5000;

server.listen(PORT , ()=>{
  console.log(`Server rrunning on port ${PORT}`)
} );