import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const users = new Map(); // username → socket

app.use(express.static("public")); // serve your HTML/CSS/JS in a 'public' folder

wss.on("connection", ws => {
  ws.on("message", msg => {
    const data = JSON.parse(msg);

    // User joins
    if (data.type === "join") {
      users.set(data.name, ws);
      broadcastUsers();
    }

    // Message
    if (data.type === "message") {
      const target = users.get(data.to);
      if (target && target.readyState === target.OPEN) {
        target.send(JSON.stringify({
          type: "message",
          from: data.from,
          text: data.text
        }));
      }
    }

    // Disconnect
    ws.on("close", () => {
      for (const [name, socket] of users.entries()) {
        if (socket === ws) users.delete(name);
      }
      broadcastUsers();
    });
  });
});

function broadcastUsers() {
  const list = Array.from(users.keys());
  for (const ws of users.values()) {
    ws.send(JSON.stringify({ type: "users", list }));
  }
}

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
