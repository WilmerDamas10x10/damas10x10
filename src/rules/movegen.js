// src/rules/movegen.js
import { SIZE, COLOR, DIAG, FORWARD } from "./constants.js";
import { esDama, dentro, clone, colorOf, valorPieza } from "./utils.js";

// Delegación canónica a módulos aislados por pieza (barril de pieces/)
import {
  genPawnMoves, genPawnCaptures,
  genQueenMoves, genQueenCaptures,
} from "./pieces/index.js";

// =============== Helpers de compatibilidad/seguridad =================
function safeArray(x) { return Array.isArray(x) ? x : []; }

function safeCall(fn, ...args) {
  try { return safeArray(fn?.(...args)); } catch { return []; }
}

// Acepta {to:[r,c]} o {dest:[r,c]} o {pos:[r,c]} → {to:[r,c]}
function normalizeMove(m) {
  if (!m || typeof m !== "object") return null;
  const to = m.to || m.dest || m.pos;
  if (Array.isArray(to) && to.length >= 2) return { to: [Number(to[0]), Number(to[1])] };
  return null;
}
function normalizeMoves(arr) {
  const out = [];
  for (const m of safeArray(arr)) {
    const n = normalizeMove(m);
    if (n) out.push(n);
  }
  return out;
}

// Rutas: acepta {path:[]}|{ruta:[]}|{steps:[]} y {captures:[]}|{eaten:[]}|{takes:[]}
function normalizeRoute(r) {
  if (!r || typeof r !== "object") return null;

  const path = r.path || r.ruta || r.steps;
  if (!Array.isArray(path) || path.length < 2) return null;

  // Capturas: permitir distintos nombres de campo
  const caps = r.captures || r.eaten || r.takes || [];
  const captures = [];
  for (const cap of safeArray(caps)) {
    // cap puede llegar como {r,c,cell} o {r,c,piece} o {r,c}
    let cell = cap.cell ?? cap.piece ?? null;
    captures.push({ r: Number(cap.r), c: Number(cap.c), cell });
  }

  return { path, captures };
}
function normalizeRoutes(arr) {
  const out = [];
  for (const r of safeArray(arr)) {
    const n = normalizeRoute(r);
    if (n) out.push(n);
  }
  return out;
}

// =================== Movimientos sin captura (legacy) =================
export function movimientosPeon(board, from) {
  const [r, c] = from;
  const me = board[r][c];
  if (!me) return [];
  const dir = FORWARD[colorOf(me)];
  const out = [];
  for (const dc of [-1, +1]) {
    const nr = r + dir, nc = c + dc;
    if (dentro(nr, nc) && !board[nr][nc]) out.push({ to: [nr, nc] });
  }
  return out;
}

export function movimientosDama(board, from) {
  const [r, c] = from;
  const me = board[r][c];
  if (!me) return [];
  const out = [];
  for (const [dr, dc] of DIAG) {
    let nr = r + dr, nc = c + dc;
    while (dentro(nr, nc) && !board[nr][nc]) {
      out.push({ to: [nr, nc] });
      nr += dr; nc += dc;
    }
  }
  return out;
}

// ================== Capturas completas (legacy, rutas) =================
// Peón: SOLO hacia delante (cadenas).
export function capturasPeon(board, from) {
  const [r, c] = from;
  const me = board[r][c];
  if (!me) return [];

  const my = colorOf(me);
  const dir = FORWARD[my];
  const rutas = [];
  const seenKey = (rr, cc) => `${rr},${cc}`;

  function dfs(b, rr, cc, tomados, path, caps) {
    let extendida = false;
    for (const dc of [-1, +1]) {
      const mr = rr + dir,   mc = cc + dc;     // enemigo
      const lr = rr + 2*dir, lc = cc + 2*dc;   // aterrizaje
      if (!dentro(mr, mc) || !dentro(lr, lc)) continue;
      const mid = b[mr][mc];
      if (mid && colorOf(mid) !== my && !tomados.has(seenKey(mr, mc)) && !b[lr][lc]) {
        const nb = clone(b);
        nb[rr][cc] = null;
        nb[mr][mc] = null;
        nb[lr][lc] = me;

        const nSet  = new Set(tomados); nSet.add(seenKey(mr, mc));
        const nCaps = [...caps, { r: mr, c: mc, cell: mid }];

        dfs(nb, lr, lc, nSet, [...path, [lr, lc]], nCaps);
        extendida = true;
      }
    }
    if (!extendida && caps.length) rutas.push({ path, captures: caps });
  }

  dfs(board, r, c, new Set(), [[r, c]], []);
  return rutas;
}

// Dama: “voladora”, multicaptura en todas las diagonales
// Restricción añadida: en una cadena NO puede cruzar ni aterrizar en
// casillas donde ya se detuvo antes (path).
export function capturasDama(board, from) {
  const [r, c] = from;
  const me = board[r][c];
  if (!me) return [];

  const my = colorOf(me);
  const rutas = [];
  const k = (rr, cc) => `${rr},${cc}`;

  // ¿Cruza alguna casilla "visitada" entre (sr,sc) EXCL. y (tr,tc) EXCL.?
  function cruzaVisitadas(sr, sc, tr, tc, dr, dc, visitadas) {
    let rr = sr + dr, cc = sc + dc;
    while (rr !== tr || cc !== tc) {
      if (visitadas.has(k(rr, cc))) return true;
      rr += dr; cc += dc;
    }
    return false;
  }

  function dfs(b, rr, cc, tomados, visitadas, path, caps) {
    let extendida = false;

    for (const [dr, dc] of DIAG) {
      // Avanzar hasta la PRIMERA pieza en esa diagonal
      let mr = rr + dr, mc = cc + dc;

      // Si en el trayecto vacío cruzamos una casilla visitada previamente, esta diagonal queda vetada
      while (dentro(mr, mc) && !b[mr][mc]) {
        if (visitadas.has(k(mr, mc))) { mr = -999; break; }
        mr += dr; mc += dc;
      }
      if (mr === -999) continue;

      if (dentro(mr, mc) && b[mr][mc] && colorOf(b[mr][mc]) !== my && !tomados.has(k(mr, mc))) {
        // También vetar si entre origen y la pieza hay alguna casilla visitada
        if (cruzaVisitadas(rr, cc, mr, mc, dr, dc, visitadas)) continue;

        // Para cada casilla de aterrizaje libre detrás del enemigo…
        let lr = mr + dr, lc = mc + dc;
        while (dentro(lr, lc) && !b[lr][lc]) {

          // No podemos aterrizar en una casilla ya visitada
          if (visitadas.has(k(lr, lc))) { lr += dr; lc += dc; continue; }

          // …ni cruzar una visitada entre la pieza capturada y el aterrizaje
          if (cruzaVisitadas(mr, mc, lr, lc, dr, dc, visitadas)) { lr += dr; lc += dc; continue; }

          // Aplicar la captura y continuar la cadena
          const nb  = clone(b);
          const mid = b[mr][mc];

          nb[rr][cc] = null;
          nb[mr][mc] = null;
          nb[lr][lc] = me;

          const nTom = new Set(tomados);    nTom.add(k(mr, mc));
          const nVis = new Set(visitadas);  nVis.add(k(lr, lc)); // registrar parada
          const nCap = [...caps, { r: mr, c: mc, cell: mid }];

          dfs(nb, lr, lc, nTom, nVis, [...path, [lr, lc]], nCap);
          extendida = true;

          lr += dr; lc += dc; // explorar más aterrizajes detrás del mismo enemigo
        }
      }
    }

    if (!extendida && caps.length) rutas.push({ path, captures: caps });
  }

  // Partimos con la casilla de origen marcada como visitada
  const visitadas0 = new Set([k(r, c)]);
  dfs(board, r, c, new Set(), visitadas0, [[r, c]], []);
  return rutas;
}




// ================== Selección: Cantidad > Puntos ==================
function puntuar(route) {
  const caps = route.captures || route.eaten || route.takes || [];
  const cantidad = caps.length;
  const puntos   = caps.reduce((s, cap) => s + valorPieza(cap.cell ?? cap.piece ?? null), 0);
  return { cantidad, puntos };
}

export function filtrarMejoresRutas(routes) {
  const norm = normalizeRoutes(routes);
  if (!norm.length) return [];
  let bestCant = -Infinity, bestPts = -Infinity;

  for (const r of norm) {
    const s = puntuar(r);
    if (s.cantidad > bestCant || (s.cantidad === bestCant && s.puntos > bestPts)) {
      bestCant = s.cantidad; bestPts = s.puntos;
    }
  }
  return norm.filter(r => {
    const s = puntuar(r);
    return s.cantidad === bestCant && s.puntos === bestPts;
  });
}

// ================== API principal por pieza (para UI) ==================
export function movimientos(board, from) {
  const cell = board[from[0]]?.[from[1]];
  if (!cell) return { moves: [], captures: [] };

  // 1) Intentar módulos aislados primero (normalizados)
  if (esDama(cell)) {
    const capsNew  = normalizeRoutes(safeCall(genQueenCaptures, board, from[0], from[1], {}));
    if (capsNew.length) return { moves: [], captures: filtrarMejoresRutas(capsNew) };
    const movesNew = normalizeMoves(safeCall(genQueenMoves, board, from[0], from[1], {}));
    if (movesNew.length) return { moves: movesNew, captures: [] };
  } else {
    const capsNew  = normalizeRoutes(safeCall(genPawnCaptures, board, from[0], from[1], {}));
    if (capsNew.length) return { moves: [], captures: filtrarMejoresRutas(capsNew) };
    const movesNew = normalizeMoves(safeCall(genPawnMoves, board, from[0], from[1], {}));
    if (movesNew.length) return { moves: movesNew, captures: [] };
  }

  // 2) Fallback legacy (mantiene comportamiento existente)
  const isQ = esDama(cell);
  const moves = isQ ? movimientosDama(board, from)
                    : movimientosPeon(board, from);
  const caps  = isQ ? capturasDama(board, from)
                    : capturasPeon(board, from);

  const captures = caps.length ? filtrarMejoresRutas(caps) : [];
  return { moves: caps.length ? [] : moves, captures };
}

// =========== Capturas globales (para obligación en todo el tablero) ===========
export function mejoresCapturasGlobal(board, color) {
  const pool = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = board[r][c];
      if (!cell || colorOf(cell) !== color) continue;

      // Primero módulos aislados
      const capsNew = esDama(cell)
        ? normalizeRoutes(safeCall(genQueenCaptures, board, r, c, {}))
        : normalizeRoutes(safeCall(genPawnCaptures,  board, r, c, {}));

      const caps = (capsNew.length
        ? capsNew
        : (esDama(cell) ? capturasDama(board, [r, c]) : capturasPeon(board, [r, c]))
      );

      for (const cap of caps) pool.push({ from: [r, c], route: cap });
    }
  }

  const res = new Map();
  if (!pool.length) return res;

  let bestCant = -Infinity, bestPts = -Infinity;
  for (const it of pool) {
    const s = puntuar(it.route);
    if (s.cantidad > bestCant || (s.cantidad === bestCant && s.puntos > bestPts)) {
      bestCant = s.cantidad; bestPts = s.puntos;
    }
  }
  for (const it of pool) {
    const s = puntuar(it.route);
    if (s.cantidad === bestCant && s.puntos === bestPts) {
      const k = it.from.join(",");
      if (!res.has(k)) res.set(k, []);
      res.get(k).push(it.route);
    }
  }
  return res; // si hay varias piezas empatadas, la UI permite elegir entre esas piezas
}
