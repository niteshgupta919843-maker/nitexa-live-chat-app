
const joinScreen      = document.getElementById("joinScreen");
const chatScreen      = document.getElementById("chatScreen");
const usernameInput   = document.getElementById("usernameInput");
const joinBtn         = document.getElementById("joinBtn");
const joinHint        = document.getElementById("joinHint");
const messagesArea    = document.getElementById("messagesArea");
const messageInput    = document.getElementById("messageInput");
const sendBtn         = document.getElementById("sendBtn");
const sidebarUsername = document.getElementById("sidebarUsername");
const typingIndicator = document.getElementById("typingIndicator");
 

let myUsername = ""; 
let typingTimeout = null; 

const socket = io();
 

joinBtn.addEventListener("click", handleJoin);
 

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleJoin();
});
 
function handleJoin() {
  const name = usernameInput.value.trim();
 

  if (!name) {
    joinHint.textContent = "Naam toh daalo yaar 😅";
    return;
  }
  if (name.length < 2) {
    joinHint.textContent = "Thoda lamba naam chahiye (min 2 chars)";
    return;
  }
 

  socket.emit("user-join", name);
}
 

socket.on("join-confirmed", (username) => {
  myUsername = username;
  sidebarUsername.textContent = username;
 
  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
 

  messageInput.focus();
});
 
socket.on("message-history", (history) => {
  history.forEach((msg) => renderMessage(msg));
});

 

sendBtn.addEventListener("click", sendMessage);
 

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
 
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !myUsername) return;
 

  socket.emit("send-message", { text });
 

  messageInput.value = "";
 

  socket.emit("stop-typing");
  clearTimeout(typingTimeout);
}
 

socket.on("receive-message", (msg) => {
  renderMessage(msg);
  scrollToBottom();
});

socket.on("system-message", ({ text, timestamp }) => {
  const el = document.createElement("div");
  el.classList.add("system-message");
  el.textContent = `${text} · ${timestamp}`;
  messagesArea.appendChild(el);
  scrollToBottom();
});
 

messageInput.addEventListener("input", () => {
  
  if (messageInput.value.trim()) {
    socket.emit("typing");
  }
 

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stop-typing");
  }, 2000);
});
 
socket.on("user-typing", (username) => {
  typingIndicator.textContent = `${username} is typing...`;
});
 
socket.on("user-stop-typing", () => {
  typingIndicator.textContent = "";
});
 

function renderMessage(msg) {
  const isSelf = msg.username === myUsername;
 

  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper", isSelf ? "self" : "other");
 

  const meta = document.createElement("div");
  meta.classList.add("msg-meta");
 
  const nameEl = document.createElement("span");
  nameEl.classList.add("msg-username");
  nameEl.textContent = isSelf ? "You" : msg.username;
 
  const timeEl = document.createElement("span");
  timeEl.classList.add("msg-time");
  timeEl.textContent = msg.timestamp;

  if (isSelf) {
    meta.appendChild(timeEl);
    meta.appendChild(nameEl);
  } else {
    meta.appendChild(nameEl);
    meta.appendChild(timeEl);
  }
 

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.textContent = msg.text;
 
  wrapper.appendChild(meta);
  wrapper.appendChild(bubble);
  messagesArea.appendChild(wrapper);
}
 

function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}
 

socket.on("connect_error", () => {
  joinHint.textContent = "Server se connect nahi ho pa raha. Try again!";
  joinHint.style.color = "#ff4444";
});

