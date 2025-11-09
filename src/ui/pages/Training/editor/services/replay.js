const WKEY = "__replayBuffer_v1";

function now() { return Date.now(); }

function getStore() {
  if (typeof window === "undefined") {
    if (!global[WKEY]) global[WKEY] = { version: "r1", createdAt: now(), events: [] };
    return global[WKEY];
  }
  if (!window[WKEY]) window[WKEY] = { version: "r1", createdAt: now(), events: [] };
  return window[WKEY];
}

export function startReplay() {
  // No resetea si ya existe: evita perder eventos tras HMR
  getStore();
}

export function clearReplay() {
  const s = getStore();
  s.version = "r1";
  s.createdAt = now();
  s.events = [];
}

export function pushMove(ev) {
  const s = getStore();
  s.events.push({ t: now(), type: "move", payload: ev });
}

export function pushTurnChange({ turn }) {
  const s = getStore();
  s.events.push({ t: now(), type: "turn", payload: { turn: (turn === "r" ? "ROJO" : "NEGRO") } });
}

export function pushUndo() {
  const s = getStore();
  s.events.push({ t: now(), type: "undo", payload: {} });
}

export function toJSONString() {
  const s = getStore();
  return JSON.stringify({ version: s.version, createdAt: s.createdAt, events: s.events });
}
