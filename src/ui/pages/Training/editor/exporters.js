// src/ui/pages/Training/editor/exporters.js
import { COLOR } from "@rules";

/**
 * Popover que aparece después de "Guardar posición".
 * Ofrece: Descargar JSON, Descargar PNG, Copiar FEN y Descargar .fen.
 *
 * @param {{ board: any[][], turn: any, anchor?: HTMLElement }} params
 */
export function afterLocalSaveOptions({ board, turn, anchor }) {
  // Limpia popovers previos
  try { document.getElementById("ctx-popover")?.remove(); } catch {}

  const pop = document.createElement("div");
  pop.id = "ctx-popover";
  Object.assign(pop.style, {
    position: "fixed",
    zIndex: 10000,
    minWidth: "220px",
    maxWidth: "90vw",
    background: "white",
    color: "#222",
    border: "1px solid #e6e6e6",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,.12)",
    padding: "10px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    overflow: "hidden",
  });

  const list = document.createElement("div");
  Object.assign(list.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  const title = document.createElement("div");
  title.textContent = "Exportar posición";
  Object.assign(title.style, {
    fontSize: "13px",
    fontWeight: 600,
    opacity: .8,
    marginBottom: "6px",
  });

  pop.appendChild(title);
  pop.appendChild(list);

  function addBtn(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    Object.assign(btn.style, {
      width: "100%",
      textAlign: "left",
      padding: "9px 10px",
      borderRadius: "8px",
      border: "1px solid #eee",
      background: "#fafafa",
      cursor: "pointer",
      fontSize: "14px",
    });
    btn.addEventListener("mouseenter", () => btn.style.background = "#f2f2f2");
    btn.addEventListener("mouseleave", () => btn.style.background = "#fafafa");
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      try { await onClick(); } catch (e) { console.error("[export]", e); alert("No se pudo completar la acción."); }
    });
    list.appendChild(btn);
    return btn;
  }

  function place(anchorEl) {
    const A = anchorEl || document.body;
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : { left: 12, bottom: 12 };
    pop.style.left = Math.round((rect.left || 12)) + "px";
    pop.style.top  = Math.round((rect.bottom || 12) + 8) + "px";
  }

  function triggerDownload(filename, text) {
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
    a.download = filename;
    a.click();
  }

  // ─────────────────────────────────────────────────────────────
  // Botón: Descargar JSON
  addBtn("Descargar JSON", async () => {
    const stamp = new Date().toISOString().replaceAll(":", "-").slice(0,19);
    const payload = { board, turn, ts: Date.now() };
    triggerDownload(`position-${stamp}.json`, JSON.stringify(payload, null, 2));
  });

  // Botón: Descargar PNG (canvas del tablero)
  addBtn("Descargar PNG", async () => {
    const cv = document.querySelector("#board canvas");
    if (!cv) { alert("No se encontró el canvas del tablero."); return; }
    const url = cv.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "position.png";
    a.click();
  });

  // Botón: Copiar FEN al portapapeles
  addBtn("Copiar FEN", async () => {
    const fen = toFEN(board, turn);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fen);
      alert("FEN copiado al portapapeles.");
    } else {
      const ta = document.createElement("textarea");
      ta.value = fen;
      ta.style.position="fixed";
      ta.style.left="-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("FEN copiado al portapapeles.");
    }
  });

  // ✅ Botón nuevo: Descargar .fen
  addBtn("Descargar .fen", async () => {
    const fen = toFEN(board, turn);
    const stamp = new Date().toISOString().replaceAll(":", "-").slice(0,19);
    triggerDownload(`position-${stamp}.fen`, fen);
  });

  document.body.appendChild(pop);
  place(anchor || document.body);

  // Cerrar al hacer click fuera
  setTimeout(() => {
    document.addEventListener("mousedown", (ev) => {
      if (!pop.contains(ev.target)) pop.remove();
    }, { once: true });
  }, 0);
}

/**
 * Convierte el tablero + turno a FEN para damas (10x10 o 8x8).
 * Reglas:
 *  - r/R = rojas: peón/dama
 *  - n/N = negras: peón/dama
 *  - números = vacías consecutivas
 *  - filas separadas por "/"
 *  - al final, espacio + " r" o " n" según turno
 *
 * Nota: ignora celdas con valores no válidos (p.ej. 'x') tratándolas como vacías.
 */
export function toFEN(board, turn) {
  const H = Array.isArray(board) ? board.length : 0;
  const W = H > 0 && Array.isArray(board[0]) ? board[0].length : 0;
  if (!H || !W) return "";

  const rows = [];
  for (let r = 0; r < H; r++) {
    let out = "";
    let run = 0;
    for (let c = 0; c < W; c++) {
      const cell = board?.[r]?.[c] ?? null;
      if (!cell || cell === "." || cell === "x" || cell === "X") {
        // vacía / no jugable → cuenta
        run++;
      } else {
        // flush de vacías previo
        if (run > 0) { out += String(run); run = 0; }
        // Solo permitimos r/R/n/N; si llega otra cosa, se intenta normalizar
        const ch = String(cell);
        if (/^[rRnN]$/.test(ch)) {
          out += ch;
        } else {
          // fallback: intenta mapear por color/role si tu engine usa objetos
          const mapped = mapCellToFENChar(cell);
          out += mapped || "1"; // evita romper fila
        }
      }
    }
    if (run > 0) out += String(run);
    rows.push(out || String(W)); // evita cadena vacía
  }

  const t = (turn === "r" || turn === COLOR?.ROJO || String(turn).toLowerCase() === "r")
    ? "r"
    : "n";

  return rows.join("/") + " " + t;
}

function mapCellToFENChar(cell) {
  // Si tu engine usa objetos tipo { color:'r|n', king:true|false }
  try {
    const color = (cell.color || cell.side || cell.player || "").toLowerCase();
    const king  = !!(cell.king || cell.isQueen || cell.dama);
    if (color === "r" || color === "rojo" || color === "red") return king ? "R" : "r";
    if (color === "n" || color === "negro" || color === "black") return king ? "N" : "n";
  } catch {}
  return null;
}
