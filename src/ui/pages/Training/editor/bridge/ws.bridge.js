/* src/ui/pages/Training/editor/bridge/ws.bridge.js */
/* eslint-disable no-console */

const PROTO_V = 1;

/* ---------------------- Utils ---------------------- */
function parseQuery() {
  const q = new URLSearchParams(location.search);
  return {
    room: sanitizeRoom(q.get("room") || "sala1"),
    server: (q.get("server") || "").trim(),
  };
}
function sanitizeRoom(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "") || "sala1";
}
function defaultServer() {
  const host = location.hostname || "localhost";
  // Preferimos /ws
  return `ws://${host}:3001/ws`;
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function toWS(url) {
  return url.replace(/^http(s?):\/\//i, (_m, https) => (https ? "wss://" : "ws://"));
}
function withWsPath(url) {
  const u = url.replace(/\/+$/, "");
  return /(\/ws)$/i.test(u) ? u : `${u}/ws`;
}
function withoutWsPath(url) {
  return url.replace(/\/+$/, "").replace(/\/ws$/i, "");
}
function swapLocalhost(url) {
  return url.replace("://localhost", "://127.0.0.1");
}

/* Emitidor centralizado para SFX/FX del Editor (lado remoto) */
function emitApplied(kind, extra = {}) {
  try {
    window.dispatchEvent(
      new CustomEvent("editor:applied", {
        detail: { kind, remote: true, ...extra },
      }),
    );
  } catch {}
}

/* Normaliza op para mensajes 'ui' entrantes */
function normalizeOp(op) {
  if (!op || typeof op !== "string") return "";
  return op.trim().toLowerCase();
}


/* ---------------------------------------------------
 *  Puente WS directo para el Editor
 *  - Handshake: {t:"join"} y {t:"state_req"} al abrir
 *  - Soporta mensajes: "state" (snapshot), "fen" (cadena FEN) y "ui" (notificaciones de efectos)
 *  - Reintentos URL: /ws → / → 127.0.0.1/ws → 127.0.0.1/
 *  - Anti-doble conexión (token)
 * --------------------------------------------------- */
export function createEditorWSBridge(api) {
  const clientId = uid();

  let ws = null;
  let currentRoom = "sala1";
  let connected = false;
  let statusCb = null;
  let firstStateReceived = false;

  // Para invalidar handlers viejos
  let attemptToken = 0;

  const notify = (s) => {
    connected = (s === "open");
    try { statusCb?.(s); } catch {}
  };

  function connect(init = {}) {
    const { room: qRoom, server: qServer } = parseQuery();
    currentRoom = sanitizeRoom(init.room || qRoom);

    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      console.log("[editor-ws] connect() ignorado: ya hay socket", ws.readyState === WebSocket.OPEN ? "OPEN" : "CONNECTING");
      return ws;
    }

    firstStateReceived = false;

    let base = (init.server || qServer || "").trim();
    if (!base) base = defaultServer();
    base = toWS(base);

    const preferWs    = withWsPath(base);
    const plain       = withoutWsPath(base);
    const base127     = swapLocalhost(base);
    const preferWs127 = withWsPath(base127);
    const plain127    = withoutWsPath(base127);

    const attempts = [preferWs, plain];
    if (base127 !== base) attempts.push(preferWs127, plain127);

    const seen = new Set();
    const tryList = attempts.filter(u => (seen.has(u) ? false : (seen.add(u), true)));

    try { ws?.close?.(); } catch {}
    ws = null;

    let idx = 0;
    const myToken = ++attemptToken;

    const startAttempt = (url) => {
      if (myToken !== attemptToken) return;
      console.log("[editor-ws] connecting →", { room: currentRoom, wsUrl: url });
      notify("connecting");

      let opened = false;

      try {
        ws = new WebSocket(url);
      } catch (e) {
        console.warn("[editor-ws] WS ctor error:", e);
        return nextAttempt("ctor-error");
      }

      ws.onopen = () => {
        if (myToken !== attemptToken) return;
        opened = true;
        console.log("[editor-ws] open ✓", { urlTried: url });
        notify("open");
        const baseMsg = { v: PROTO_V, room: currentRoom, clientId, ts: Date.now() };
        safeSend({ ...baseMsg, t: "join" });
        safeSend({ ...baseMsg, t: "state_req" });
      };

      ws.onclose = (ev) => {
        if (myToken !== attemptToken) return;
        console.warn("[editor-ws] close:", { code: ev.code, reason: ev.reason || "", wasClean: ev.wasClean, urlTried: url });
        if (!opened) return nextAttempt("closed-before-open");
        notify("closed");
      };

      ws.onerror = (err) => {
        if (myToken !== attemptToken) return;
        console.warn("[editor-ws] error:", err, { urlTried: url });
        if (opened) notify("error");
      };

      ws.onmessage = (ev) => {
        if (myToken !== attemptToken) return;
        let msg;
        try { msg = JSON.parse(typeof ev.data === "string" ? ev.data : String(ev.data)); }
        catch { return; }
        handleMessage(msg);
      };
    };

    const nextAttempt = (why) => {
      if (myToken !== attemptToken) return;
      if (idx < tryList.length - 1) {
        const prev = tryList[idx];
        idx += 1;
        const alt = tryList[idx];
        console.log(`[editor-ws] retry (${why}) →`, alt, "(prev:", prev, ")");
        setTimeout(() => startAttempt(alt), 120);
      } else {
        console.warn("[editor-ws] agotados todos los intentos de conexión.");
        notify("error");
      }
    };

    return startAttempt(tryList[idx]);
  }

  function disconnect() {
    attemptToken++;
    try { ws?.close?.(); } catch {}
    ws = null;
    notify("closed");
  }

  function isConnected() { return connected; }
  function onStatus(cb) { statusCb = cb; }

  function safeSend(obj) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try { ws.send(JSON.stringify(obj)); return true; }
    catch { return false; }
  }

  function sendSnapshot(reason = "manual") {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      const board = api.getBoard?.();
      const turn  = api.getTurn?.();
      if (!board) return false;
      const msg = {
        v: PROTO_V,
        t: "state",
        room: currentRoom,
        clientId,
        ts: Date.now(),
        payload: { board, turn, reason: String(reason || "manual") },
      };
      return safeSend(msg);
    } catch (e) {
      console.warn("[editor-ws] sendSnapshot error:", e);
      return false;
    }
  }

  // 🆕 enviar FEN crudo (cadena) — útil para compatibilidad
  function sendFEN(fen, reason = "fen") {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      if (!fen || typeof fen !== "string") return false;
      const msg = {
        v: PROTO_V,
        t: "fen",
        room: currentRoom,
        clientId,
        ts: Date.now(),
        payload: { fen, reason: String(reason || "fen") },
      };
      return safeSend(msg);
    } catch (e) {
      console.warn("[editor-ws] sendFEN error:", e);
      return false;
    }
  }

  function handleMessage(msg) {
    if (!msg || typeof msg !== "object") return;

    switch (msg.t) {
      case "state": {
        const { board, turn } = msg.payload || {};
        if (board) {
          try {
            api.setBoard?.(board);
            if (typeof turn !== "undefined") api.setTurn?.(turn);
            api.repaint?.();
            api.rebuildHints?.();

            // 🔔 Unifica SFX al aplicar snapshot remoto
            emitApplied("move", { src: "wan", via: "state" });

            if (!firstStateReceived) {
              firstStateReceived = true;
              try { window.dispatchEvent(new CustomEvent("wan:received-first-state")); } catch {}
            }
          } catch (e) {
            console.warn("[editor-ws] aplicar snapshot remoto falló:", e);
          }
        }
        break;
      }

      // 🆕 cuando llegue un FEN crudo, lo delegamos al Editor (evento)
      case "fen": {
        const fen = msg?.payload?.fen;
        if (fen && typeof fen === "string") {
          try {
            window.dispatchEvent(new CustomEvent("wan:fen", {
              detail: { fen, reason: msg?.payload?.reason || "fen" }
            }));
          } catch (e) {
            console.warn("[editor-ws] evento wan:fen falló:", e);
          }
        }
        break;
      }

      // 🆕 notificación liviana de UI para reproducir efectos remotos
      case "ui": {
        try {
          // Pasar el mensaje crudo al Editor para que haga los FX/SFX
          api?.onRemoteUI?.(msg);
        } catch {}
        
        // 🔔 Emite SFX estándar según 'op' para unificar sonidos remotos
        const op = normalizeOp(msg?.op || msg?.payload?.op);
        switch (op) {
          case "move":
          case "applymove":
            emitApplied("move",   { src: "wan", via: "ui" }); break;
          case "capture":
          case "applycapture":
            emitApplied("capture",{ src: "wan", via: "ui" }); break;
          case "crown":
          case "promote":
            emitApplied("crown",  { src: "wan", via: "ui" }); break;
          case "invalid":
            emitApplied("invalid",{ src: "wan", via: "ui" }); break;
          default: break;
        }
        return; // no tocar estado/turno
      }

      case "state_req": {
        // otro par pide nuestro estado actual
        sendSnapshot("state_req");
        break;
      }

      default:
        break;
    }
  }

  return {
    connect,
    disconnect,
    isConnected,
    onStatus,
    sendSnapshot,
    sendFEN, // 🆕
    // 🆕 helper opcional para enviar UI (por si se requiere desde algún panel)
    sendUI(op, payload = {}) {
      return safeSend({ v: PROTO_V, t: "ui", op: String(op || "select"), payload });
    },
    // expone la room actual (por si lo necesita el UI)
    get room() { return currentRoom; },
    // opcionalmente exponer safeSend para depurar
    safeSend,
  };
}
