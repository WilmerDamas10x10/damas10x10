// =========================================
// src/ui/pages/SoploLibre/lib/state.js
// Estado + persistencia + lógica bilateral (mock)
// Listo para enchufar eventos de red (WebSocket/RTC) después
// =========================================

export const STORAGE_KEY = "soploLibre.session.v1";

// Utilidad segura localStorage
function safe(fn, fallback = null) {
  try { return fn(); } catch { return fallback; }
}

export function createSoploState({
  // piezas
  readPieces,     // () => [{x,y,color,kind}]
  writePieces,    // (pieces[]) => void
  // UI hooks
  onStatus,       // (msg:string) => void
  onTurnText,     // (turnStr:"ROJO"|"NEGRO") => void
  onUIUpdate,     // () => void  (habilitar/deshabilitar botones)
}) {
  // ---- Estado base ----
  const state = {
    turn: "ROJO",
    revision: { active: false, confirm: { rojo: false, negro: false } },
    pause:    { active: false, confirm: { rojo: false, negro: false }, onHold: false },
    draw:     { active: false, confirm: { rojo: false, negro: false }, agreed: false },
    result:   null, // "ROJO"|"NEGRO"|"EMPATE"|null
    zoom: 1,        // lo persistimos para recordarlo al volver
    rot:  0,        // idem
  };

  // ---- Persistencia ----
  function save() {
    safe(() => {
      const payload = {
        active: true,
        turn: state.turn,
        zoom: state.zoom,
        rot:  state.rot,
        pieces: readPieces(),
        revision: state.revision,
        pause: state.pause,
        draw: state.draw,
        result: state.result,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    });
  }

  function load() {
    return safe(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }, null);
  }

  function clear() {
    safe(() => localStorage.removeItem(STORAGE_KEY));
  }

  function restoreOrInit(populateInitialPieces) {
    const sess = load();
    if (!sess || !sess.active) {
      populateInitialPieces();
      save();
      onUIUpdate?.();
      return;
    }
    state.turn = sess.turn || "ROJO";
    state.zoom = typeof sess.zoom === "number" ? sess.zoom : 1;
    state.rot  = typeof sess.rot === "number"  ? sess.rot  : 0;
    state.revision = sess.revision || state.revision;
    state.pause    = sess.pause    || state.pause;
    state.draw     = sess.draw     || state.draw;
    state.result   = sess.result   ?? null;

    writePieces(sess.pieces || []);
    onTurnText?.(state.turn);
    onStatus?.("Sesión restaurada");
    onUIUpdate?.();
  }

  // ---- Utilidades de juego ----
  function changeTurn() {
    state.turn = state.turn === "ROJO" ? "NEGRO" : "ROJO";
    onTurnText?.(state.turn);
    save();
  }

  function setZoomRot({ zoom, rot }) {
    if (typeof zoom === "number") state.zoom = zoom;
    if (typeof rot === "number")  state.rot  = rot;
    save();
  }

  function setPieces(pieces) {
    writePieces(pieces);
    save();
  }

  // ---- Revisión (bilateral) ----
  function revisionStart() {
    state.revision.active = true;
    state.revision.confirm = { rojo: false, negro: false };
    onStatus?.("Solicitud de revisión iniciada. Esperando confirmaciones…");
    onUIUpdate?.(); save();
    // TODO socket: send({type:"revision:request"})
  }
  function revisionConfirm(side) {
    if (!state.revision.active) return;
    state.revision.confirm[side] = true;
    const both = state.revision.confirm.rojo && state.revision.confirm.negro;
    onStatus?.(both ? "¡Revisión acordada por ambos!" : `Confirmó ${side.toUpperCase()}. Falta el otro lado…`);
    onUIUpdate?.(); save();
    // TODO socket: send({type:"revision:confirm", side})
  }
  function revisionApply() {
    if (!(state.revision.confirm.rojo && state.revision.confirm.negro)) return;
    onStatus?.("Retroceder 1 jugada (pendiente de motor)");
    // TODO socket: send({type:"revision:apply"})
  }
  function revisionCancel() {
    state.revision.active = false;
    state.revision.confirm = { rojo: false, negro: false };
    onStatus?.("Revisión cerrada.");
    onUIUpdate?.(); save();
    // TODO socket: send({type:"revision:cancel"})
  }

  // ---- Pausa (bilateral) ----
  function pauseStart() {
    state.pause.active = true;
    state.pause.onHold = false;
    state.pause.confirm = { rojo: false, negro: false };
    onStatus?.("Pausa solicitada. Esperando confirmaciones…");
    onUIUpdate?.(); save();
    // TODO socket: send({type:"pause:request"})
  }
  function pauseConfirm(side) {
    if (!state.pause.active) return;
    state.pause.confirm[side] = true;
    const both = state.pause.confirm.rojo && state.pause.confirm.negro;
    if (both) {
      state.pause.onHold = true;
      onStatus?.("⏸ Pausa activa (confirmada por ambos).");
    } else {
      onStatus?.(`Confirmó ${side.toUpperCase()}. Falta el otro lado…`);
    }
    onUIUpdate?.(); save();
    // TODO socket: send({type:"pause:confirm", side})
  }
  function pauseResume() {
    if (!state.pause.onHold) return;
    state.pause.active = false;
    state.pause.onHold = false;
    state.pause.confirm = { rojo: false, negro: false };
    onStatus?.("▶ Reanudado.");
    onUIUpdate?.(); save();
    // TODO socket: send({type:"pause:resume"})
  }
  function pauseCancel() {
    state.pause.active = false;
    state.pause.onHold = false;
    state.pause.confirm = { rojo: false, negro: false };
    onStatus?.("Pausa cancelada.");
    onUIUpdate?.(); save();
    // TODO socket: send({type:"pause:cancel"})
  }

  // ---- Empate (bilateral) ----
  function drawStart() {
    state.draw.active = true;
    state.draw.agreed = false;
    state.draw.confirm = { rojo: false, negro: false };
    onStatus?.("Empate propuesto. Esperando aceptación…");
    onUIUpdate?.(); save();
    // TODO socket: send({type:"draw:request"})
  }
  function drawConfirm(side) {
    if (!state.draw.active) return;
    state.draw.confirm[side] = true;
    const both = state.draw.confirm.rojo && state.draw.confirm.negro;
    if (both) {
      state.draw.agreed = true;
      state.result = "EMPATE";
      onStatus?.("🤝 ¡Empate acordado!");
    } else {
      onStatus?.(`Aceptó ${side.toUpperCase()}. Falta el otro lado…`);
    }
    onUIUpdate?.(); save();
    // TODO socket: send({type:"draw:confirm", side})
  }
  function drawCancel() {
    state.draw.active = false;
    state.draw.agreed = false;
    state.draw.confirm = { rojo: false, negro: false };
    onStatus?.("Propuesta de empate cancelada.");
    onUIUpdate?.(); save();
    // TODO socket: send({type:"draw:cancel"})
  }

  // ---- Rendición (unilateral) ----
  function resign() {
    const side = state.turn;
    const opp  = side === "ROJO" ? "NEGRO" : "ROJO";
    const ok = confirm(`¿Seguro que ${side} se rinde? Victoria para ${opp}.`);
    if (!ok) return;
    state.result = opp;
    onStatus?.(`🏳️ ${side} se rinde. ¡Victoria de ${opp}!`);
    save();
    // TODO socket: send({type:"resign", winner: opp})
  }

  // ---- Reset total (mantiene estructura) ----
  function resetAll(populateInitialPieces) {
    state.turn = "ROJO";
    state.revision = { active:false, confirm:{rojo:false,negro:false} };
    state.pause    = { active:false, confirm:{rojo:false,negro:false}, onHold:false };
    state.draw     = { active:false, confirm:{rojo:false,negro:false}, agreed:false };
    state.result   = null;
    onTurnText?.(state.turn);
    onStatus?.("Tablero reiniciado");
    populateInitialPieces?.();
    save();
    onUIUpdate?.();
  }

  return {
    state,
    // persistencia
    save, load, clear, restoreOrInit,
    // turn/zoom/rot
    changeTurn, setZoomRot, setPieces,
    // revisión
    revisionStart, revisionConfirm, revisionApply, revisionCancel,
    // pausa
    pauseStart, pauseConfirm, pauseResume, pauseCancel,
    // empate
    drawStart, drawConfirm, drawCancel,
    // rendición
    resign,
    // reset
    resetAll,
  };
}
