/* src/ui/pages/Training/editor/bridge/ws.bridge.js */
/* eslint-disable no-console */

const PROTO_V = 1;

/* ---------------------- Utils ---------------------- */
function sanitizeRoom(s) {
  return String(s || "sala1")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "") || "sala1";
}

function defaultServer() {
  // Siempre gateway WSS en producción (evita Mixed Content en HTTPS)
  return "wss://wilmerchdamas10x10-ws.onrender.com";
}

function normalizeWS(url) {
  let s = (url || "").trim();
  if (!s) return defaultServer();

  // Forzar esquema seguro y limpiar puertos/sufijos locales
  s = s.replace(/^http(s?):\/\//i, "wss://");
  s = s.replace(/^ws:\/\//i, "wss://");
  s = s.replace(/:3001\b/i, "");
  s = s.replace(/\/ws\b/i, "");
  if (!/^wss:\/\//i.test(s)) s = "wss://" + s;
  s = s.replace(/\/+$/g, "");

  try {
    if (location.protocol === "https:" && !/^wss:\/\//i.test(s)) {
      s = s.replace(/^ws:\/\//i, "wss://");
    }
  } catch {}
  return s || defaultServer();
}

function parseQuery() {
  const q = new URLSearchParams(location.search);
  // Acepta ?server= o ?ws= (prioriza server) y normaliza a WSS
  const qServer = normalizeWS(q.get("server") || q.get("ws") || "");
  return {
    room: sanitizeRoom(q.get("room") || "sala1"),
    server: qServer || defaultServer(),
  };
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ---------------------- Bridge ---------------------- */
/**
 *  Puente WS directo para el Editor
 *  - Handshake: {t:"join"} y {t:"state_req"} al abrir
 *  - Soporta: "state" (snapshot), "fen" (cadena FEN), "ui" (notificaciones de efectos)
 *  - Reintentos sobre variantes de la MISMA base (ya normalizada)
 */
export function createEditorWSBridge(api) {
  const clientId = uid();

  let ws = null;
  let currentRoom = "sala1";
  let connected = false;
  let statusCb = null;

  let attemptToken = 0;

  function notify(state, extra) {
    try { statusCb?.({ state, room: currentRoom, ...extra }); } catch {}
  }

  function safeSend(obj) {
    try { ws?.readyState === 1 && ws.send(JSON.stringify(obj)); } catch {}
  }

  function withWsPath(base)    { return base.replace(/\/?$/,"") + "/ws"; }
  function withoutWsPath(base) { return base.replace(/\/ws\b/i, ""); }

  function buildAttempts(base) {
    const preferWs = withWsPath(base);
    const plain    = withoutWsPath(base);
    const attempts = [preferWs, plain];
    const seen = new Set();
    return attempts.filter(u => (seen.has(u) ? false : (seen.add(u), true)));
  }

  // ======= NUEVO: construir y enviar snapshot =======
  function sendState() {
    try {
      const board = api?.getBoard?.();
      const turn  = api?.getTurn?.();
      const payload = { board, turn };
      const baseMsg = { v: PROTO_V, room: currentRoom, clientId, ts: Date.now() };
      safeSend({ ...baseMsg, t: "state", payload });
      return true;
    } catch (e) {
      console.warn("[editor-ws] sendState error:", e);
      return false;
    }
  }

  async function sendSnapshot(kind = "state_req") {
    // compat: mantiene API anterior && agrega 'state_push'
    if (kind === "copy_fen") {
      try {
        const fen = api?.getFEN?.();
        if (!fen) throw new Error("FEN vacío");
        const baseMsg = { v: PROTO_V, room: currentRoom, clientId, ts: Date.now() };
        safeSend({ ...baseMsg, t: "fen", payload: { fen } });
        return true;
      } catch (e) {
        console.warn("[editor-ws] sendSnapshot(copy_fen) error:", e);
        return false;
      }
    }
    if (kind === "state_push") {
      return sendState();
    }
    // por defecto: pedir estado al otro
    try {
      const baseMsg = { v: PROTO_V, room: currentRoom, clientId, ts: Date.now() };
      safeSend({ ...baseMsg, t: "state_req" });
      return true;
    } catch (e) {
      console.warn("[editor-ws] sendSnapshot(state_req) error:", e);
      return false;
    }
  }
  // ===================================================

  function connect(opts) {
    const cfg = parseQuery();
    currentRoom = sanitizeRoom(opts?.room || cfg.room || "sala1");

    const base = normalizeWS(opts?.wsUrl || cfg.server || defaultServer());
    const attemptList = buildAttempts(base);

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
        // Pedimos estado y, apenas haya un cambio local, empujaremos nuestro snapshot
        safeSend({ ...baseMsg, t: "state_req" });
        connected = true;
      };

      ws.onmessage = (ev) => {
        if (myToken !== attemptToken) return;
        let msg = null;
        try { msg = JSON.parse(ev.data); } catch {}
        if (!msg || typeof msg !== "object") return;
        handleMessage(msg);
      };

      ws.onerror = () => {
        if (myToken !== attemptToken) return;
        console.warn("[editor-ws] error");
        notify("error");
      };

      ws.onclose = () => {
        if (myToken !== attemptToken) return;
        connected = false;
        notify("closed");
        if (!opened) return nextAttempt("close-before-open");
      };
    };

    function nextAttempt(reason) {
      if (myToken !== attemptToken) return;
      const prev = attemptList[idx] || "(none)";
      idx++;
      const next = attemptList[idx];
      if (!next) {
        console.warn("[editor-ws] agotados todos los intentos de conexión.");
        notify("closed");
        return;
      }
      console.log("[editor-ws] retry (", reason, ") →", next, "(prev:", prev, ")");
      notify("retrying", { attempt: idx+1, wsUrl: next });
      setTimeout(() => startAttempt(next), 400);
    }

    startAttempt(attemptList[0]);
  }

  function disconnect() {
    try { ws?.close?.(); } catch {}
    connected = false;
    notify("closed");
  }

  function handleMessage(msg) {
    if (!msg || typeof msg !== "object") return;

    switch (msg.t) {
      case "state": {
        const { board, turn } = msg.payload || {};
        try {
          if (board) api.setBoard?.(board);
          if (typeof turn !== "undefined") api.setTurn?.(turn);
          api.repaint?.();
        } catch (e) { console.warn("[editor-ws] apply state error:", e); }
        break;
      }

      case "state_req": {
        // ►► Responder con nuestro snapshot actual
        sendState();
        break;
      }

      case "fen": {
        const fen = msg.payload?.fen || "";
        try {
          api.applyFEN?.(fen);
          api.repaint?.();
          // Tras aplicar FEN, empuja estado para que quede parejo
          sendState();
        } catch (e) {
          console.warn("[editor-ws] apply fen error:", e);
        }
        break;
      }

      case "ui": {
        try { api.onRemoteUI?.(msg); } catch (e) { console.warn("[editor-ws] onRemoteUI error:", e); }
        break;
      }

      default: {
        // Si recibimos algo desconocido, pedimos estado al otro
        sendSnapshot("state_req");
        break;
      }
    }
  }

  return {
    connect,
    disconnect,
    onStatus: (fn) => { statusCb = fn; },
    isOpen: () => connected,
    safeSend,
    sendSnapshot,     // acepta: "state_req" | "state_push" | "copy_fen"
    // opcional: exposición directa
    sendState,
  };
}
