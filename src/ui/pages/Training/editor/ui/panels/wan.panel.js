// src/ui/pages/Training/editor/ui/panels/wan.panel.js
/* eslint-disable no-console */

function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}
function sanitizeRoom(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "") || "sala1";
}
function defaultServer() {
  // Usa SIEMPRE tu gateway seguro en Render (WSS):
  // (copia EXACTAMENTE tu URL que Render mostró al quedar "Live")
  return "wss://wilmerchdamas10x10-ws.onrender.com";
}
function parseQuery() {
  const q = new URLSearchParams(location.search);
  // Acepta ?server= o ?ws= (prioriza server)
  const qServer = (q.get("server") || q.get("ws") || "").trim();
  return {
    room: sanitizeRoom(q.get("room") || "sala1"),
    server: qServer,
  };
}


function getBoardHost() {
  return document.getElementById("board");
}
function setOrientationWhiteBottom(room) {
  const host = getBoardHost();
  if (!host) return;
  host.classList.remove("view-negro");
  try { localStorage.setItem(`editor:orientation:${room || "default"}`, "white"); } catch {}
}
function setOrientationBlackBottom(room) {
  const host = getBoardHost();
  if (!host) return;
  host.classList.add("view-negro");
  try { localStorage.setItem(`editor:orientation:${room || "default"}`, "black"); } catch {}
}

/* ---------- UI template ---------- */
function paneTemplate({ room, server, disabled }) {
  const dis = disabled ? 'disabled aria-disabled="true"' : "";
  return `
<div class="wan-pane" style="margin-top:.5rem; padding:.5rem; border:1px solid rgba(0,0,0,0.1); border-radius:10px; font:14px/1.2 system-ui" data-editor-root>
  <div style="display:flex; gap:.5rem; align-items:center; flex-wrap:wrap">
    <strong>WAN</strong>
    <span id="wan-status" style="padding:.1rem .5rem; border-radius:999px; background:#777; color:#fff;">OFF</span>
    <small id="wan-hint" style="opacity:.8">${disabled ? "Bridge no disponible" : ""}</small>
  </div>
  <div style="display:flex; gap:.5rem; align-items:center; margin-top:.5rem; flex-wrap:wrap">
    <label>Room:
      <input id="wan-room" value="${room}" style="width:9rem; padding:.25rem .4rem" ${dis}/>
    </label>
    <label>Server:
      <input id="wan-server" value="${server}" style="min-width:18rem; padding:.25rem .4rem" ${dis}/>
    </label>
    <button id="wan-connect" style="padding:.35rem .7rem" ${dis}>Conectar</button>
    <button id="wan-disconnect" style="padding:.35rem .7rem" ${dis}>Desconectar</button>
    
  </div>
</div>`;
}

/* --------------------------------------------------------------------
 * Panel WAN que usa el bridge YA CREADO por Editor.js (getBridge()).
 * -------------------------------------------------------------------- */
export function installEditorWANPanel(container, opts = {}) {
  if (!container) {
    console.warn("[wan.panel] container no provisto; abortando montaje.");
    return null;
  }

  const wsBridge = (typeof opts.getBridge === "function") ? opts.getBridge() : (window.__editorWS || null);
  const hasBridge = !!wsBridge;
  try { wsBridge?.disconnect?.(); } catch {}

  const q = parseQuery();
  const initialRoom = q.room;
  const initialServer = q.server || defaultServer();

  const pane = el(paneTemplate({ room: initialRoom, server: initialServer, disabled: !hasBridge }));
  const group = container.querySelector("#group-save-load-local");
  if (group) {
    group.insertAdjacentElement("afterend", pane);
  } else {
    const leftDock = container.querySelector("#turn-dock") || container.querySelector(".dock-turno");
    if (leftDock) leftDock.appendChild(pane);
    else container.appendChild(pane);
  }

  const $status = pane.querySelector("#wan-status");
  const $hint   = pane.querySelector("#wan-hint");
  const $room   = pane.querySelector("#wan-room");
  const $server = pane.querySelector("#wan-server");
  const $btnConnect    = pane.querySelector("#wan-connect");
  const $btnDisconnect = pane.querySelector("#wan-disconnect");
  

  if (!hasBridge) {
    pane.setAttribute("aria-disabled", "true");
    $status.textContent = "OFF";
    $status.style.background = "#777";
    $hint.textContent = "Bridge no disponible (Editor.js aún)";
    return pane;
  }

  function setStatus(s) {
    const map = {
      off:  ["OFF", "#777"],
      on:   ["ON",  "#2b8747"],
      wait: ["...", "#b28a2a"],
      error:["ERR", "#b84a3a"],
    };
    const [text, bg] = map[s] || map.off;
    $status.textContent = text;
    $status.style.background = bg;
  }

  function toast(msg) {
    console.log("[WAN]", msg);
  }

  async function connectIfNeeded(room, server) {
    try {
      if (wsBridge.isOpen?.()) return true;
      setStatus("wait");
      $hint.textContent = "Conectando…";
      await wsBridge.connect?.({ room, wsUrl: server });
      setStatus("on");
      $hint.textContent = "Conectado";
      return true;
    } catch (err) {
      console.warn(err);
      setStatus("error");
      $hint.textContent = "Error de conexión";
      return false;
    }
  }

$btnConnect.addEventListener("click", async () => {
  const room = sanitizeRoom($room.value);
  let server = ($server.value || "").trim() || defaultServer();

  // Forzar WSS y quitar puertos/rutas locales si alguien pegó algo raro
  if (!/^wss:\/\//i.test(server)) {
    // si vino como ws:// o sin esquema, lo pasamos a wss://
    server = server.replace(/^ws:\/\//i, "wss://");
    if (!/^wss:\/\//i.test(server)) server = "wss://" + server;
  }
  // Evita :3001 y /ws heredados de local
  server = server.replace(/:3001\/?$/i, "").replace(/\/ws\/?$/i, "");

  await connectIfNeeded(room, server);
});


  $btnDisconnect.addEventListener("click", async () => {
    try { await wsBridge.disconnect?.(); } catch {}
    setStatus("off");
    $hint.textContent = "Desconectado";
  });

  const onCopyFEN = async () => {
    const room = sanitizeRoom($room.value);
    const server = ($server.value || "").trim() || defaultServer();

    const okConn = await connectIfNeeded(room, server);
    if (!okConn) {
      console.warn("[wan.panel] No se pudo conectar al compartir FEN.");
      setStatus("error");
      return;
    }
    try {
      setOrientationWhiteBottom(room);
      await wsBridge.sendSnapshot?.("copy_fen");
      toast("FEN compartido.");
      setStatus("on");
    } catch (err) {
      console.warn(err);
      setStatus("error");
      $hint.textContent = "No se pudo enviar el FEN";
    }
  };

  window.addEventListener("editor:share", onCopyFEN);
  return pane;
}
