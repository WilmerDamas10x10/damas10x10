// Servidor WS con salas y heartbeat (ESM)
// Ejecuta: npm run ws  (usa puerto 3001 por defecto)

import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.WS_PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WS gateway activo");
});

const wss = new WebSocketServer({ server });

// roomName -> Set<ws>
const rooms = new Map();
let nextId = 1;

function safeSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}

function joinRoom(ws, room) {
  const name = String(room || "sala1");

  // salir de sala previa
  if (ws.room && rooms.has(ws.room)) {
    rooms.get(ws.room).delete(ws);
    if (rooms.get(ws.room).size === 0) rooms.delete(ws.room);
  }

  // entrar a nueva
  ws.room = name;
  if (!rooms.has(name)) rooms.set(name, new Set());
  rooms.get(name).add(ws);

  safeSend(ws, { t: "join_ok", room: name, peers: rooms.get(name).size - 1 });
}

wss.on("connection", (ws) => {
  ws.id = `c${nextId++}`;
  ws.isAlive = true;

  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.t === "hello" || msg.t === "join") {
      joinRoom(ws, msg.room);
      return;
    }

    const room = ws.room || msg.room;
    if (!room || !rooms.has(room)) return;

    const out = { ...msg, serverTs: Date.now() };
    for (const peer of rooms.get(room)) {
      if (peer !== ws && peer.readyState === peer.OPEN) {
        safeSend(peer, out);
      }
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws);
      if (rooms.get(ws.room).size === 0) rooms.delete(ws.room);
    }
  });

  ws.on("error", () => {});
});

// Heartbeat para limpiar conexiones muertas
const interval = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, 30000);

wss.on("close", () => clearInterval(interval));

server.listen(PORT, () => {
  console.log(`[WS] Gateway escuchando en ws://localhost:${PORT}`);
});
