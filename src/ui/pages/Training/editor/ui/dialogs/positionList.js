// src/ui/pages/Training/editor/ui/dialogs/positionList.js
import { readByName, writeByName, KEY_AUTO } from "../../services/snapshot.js";

// Mini-render del tablero a canvas para la tarjeta de preview
function renderPreviewCanvas(snap, cell = 24) {
  const b = snap.board;
  const R = b.length, C = b[0].length;
  const w = C * cell, h = R * cell;

  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");

  // Cuadrícula
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const dark = ((r + c) % 2 === 0);
      g.fillStyle = dark ? "#3b3b3b" : "#e7e3d7";
      g.fillRect(c * cell, r * cell, cell, cell);
    }
  }

  // Piezas
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const p = b[r][c];
      if (!p) continue;
      const cx = c * cell + cell / 2;
      const cy = r * cell + cell / 2;
      const isQueen = (p === p.toUpperCase());
      const isRed = (p.toLowerCase() === "r");

      g.beginPath();
      g.arc(cx, cy, cell * 0.38, 0, Math.PI * 2);
      g.fillStyle = isRed ? "#d33838" : "#1e1e1e";
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "rgba(255,255,255,0.7)";
      g.stroke();

      if (isQueen) {
        g.beginPath();
        g.arc(cx, cy, cell * 0.22, 0, Math.PI * 2);
        g.lineWidth = 3;
        g.strokeStyle = "rgba(255,215,0,0.9)";
        g.stroke();
      }
    }
  }
  return cv;
}

/**
 * Normaliza distintos formatos de snapshot importado.
 */
function normalizeSnapshot(raw) {
  if (!raw) return null;

  // 1) Canónico
  if (Array.isArray(raw.board) && typeof raw.turn !== "undefined") {
    return {
      name: raw.name || "importado",
      board: raw.board,
      turn:  raw.turn,
      size:  typeof raw.size === "number" ? raw.size : raw.board.length,
      ts:    raw.ts ?? Date.now(),
    };
  }

  // 2) Array 2D directamente
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    return {
      name: "importado",
      board: raw,
      turn:  0, // por defecto (ajústalo si usas enum/constantes fuera)
      size:  raw.length,
      ts:    Date.now(),
    };
  }

  // 3) Envuelto en { data: { board, turn } }
  if (raw.data && Array.isArray(raw.data.board) && typeof raw.data.turn !== "undefined") {
    return {
      name: raw.name || "importado",
      board: raw.data.board,
      turn:  raw.data.turn,
      size:  typeof raw.data.size === "number" ? raw.data.size : raw.data.board.length,
      ts:    raw.ts ?? Date.now(),
    };
  }

  return null;
}

/**
 * Abre la lista de posiciones guardadas con tarjetas de preview.
 * onLoad(snap) se llama al pulsar "Cargar" y el diálogo se cierra.
 */
export function openLoadListDialog({ onLoad } = {}) {
  let dlg = document.getElementById("pos-list-dialog");
  if (dlg) dlg.remove();

  const map = readByName();
  const entries = Object.entries(map)
    .map(([name, snap]) => ({ name, snap }))
    .sort((a, b) => (b.snap?.ts || 0) - (a.snap?.ts || 0));

  dlg = document.createElement("div");
  dlg.id = "pos-list-dialog";
  Object.assign(dlg.style, {
    position: "fixed", inset: "0", background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: "9999"
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "#fff", padding: "16px", borderRadius: "12px",
    width: "min(960px, 95vw)", maxHeight: "85vh", overflow: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    display: "flex", flexDirection: "column", gap: "12px"
  });

  const header = document.createElement("div");
  header.textContent = "Posiciones guardadas";
  Object.assign(header.style, { fontWeight: 700, fontSize: "16px" });

  const list = document.createElement("div");
  Object.assign(list.style, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "12px"
  });

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.textContent = "No hay posiciones con nombre. Guarda alguna con “Guardar posición”.";
    list.appendChild(empty);
  } else {
    for (const { name, snap } of entries) {
      const card = document.createElement("div");
      Object.assign(card.style, {
        border: "1px solid #e0e0e0",
        borderRadius: "10px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      });

      const title = document.createElement("div");
      title.textContent = name;
      Object.assign(title.style, { fontWeight: 600 });

      const cv = renderPreviewCanvas(snap, 24);
      cv.style.width = "100%";
      cv.style.height = "auto";
      cv.style.borderRadius = "6px";

      const row = document.createElement("div");
      Object.assign(row.style, { display: "flex", gap: "8px", justifyContent: "space-between" });

      const btnLoad = document.createElement("button");
      btnLoad.textContent = "Cargar";

      const btnImg = document.createElement("button");
      // ⬇️ CAMBIO: ahora este botón guarda JSON (no PNG)
      btnImg.textContent = "Guardar JSON";

      const btnDel = document.createElement("button");
      btnDel.textContent = "Eliminar";

      row.appendChild(btnLoad);
      row.appendChild(btnImg);
      row.appendChild(btnDel);

      card.appendChild(title);
      card.appendChild(cv);
      card.appendChild(row);
      list.appendChild(card);

      // Acciones
      btnLoad.addEventListener("click", () => {
        // Actualiza AUTO y notifica a la app
        try { localStorage.setItem(KEY_AUTO, JSON.stringify(snap)); } catch {}
        try { onLoad?.(snap); } catch (e) { console.error(e); }
        try { dlg.remove(); } catch {}
      });

      // ⬇️ CAMBIO: exporta .json con { name, board, turn, size, ts }
      btnImg.addEventListener("click", () => {
        try {
          const size =
            (typeof snap.size === "number" && snap.size > 0) ? snap.size :
            (Array.isArray(snap.board) ? snap.board.length : 10);

          const data = {
            name,
            board: snap.board,
            turn: snap.turn,
            size,
            ts: snap.ts ?? Date.now()
          };

          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.download = `${(name || "posicion").replace(/\s+/g, "_")}.json`;
          a.href = URL.createObjectURL(blob);
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 0);
        } catch (e) {
          console.error("[pos] no se pudo exportar JSON:", e);
        }
      });

      btnDel.addEventListener("click", () => {
        const map2 = readByName();
        delete map2[name];
        writeByName(map2);
        try { card.remove(); } catch {}
      });
    }
  }

  const footer = document.createElement("div");
  Object.assign(footer.style, { display: "flex", justifyContent: "space-between", gap: "8px" });

  // ⬇️ NUEVO: botón para importar un .json y cargarlo directo
  const btnImportJSON = document.createElement("button");
  btnImportJSON.textContent = "Cargar JSON";
  btnImportJSON.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", async (ev) => {
      const file = ev?.target?.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const raw = JSON.parse(text);
        const snap = normalizeSnapshot(raw);
        if (!snap || !Array.isArray(snap.board) || typeof snap.turn === "undefined") {
          throw new Error("Formato de snapshot inválido.");
        }
        // Guarda como AUTO, notifica y cierra
        try { localStorage.setItem(KEY_AUTO, JSON.stringify(snap)); } catch {}
        try { onLoad?.(snap); } catch (e) { console.error(e); }
        try { dlg.remove(); } catch {}
      } catch (err) {
        console.error("[import-json] error:", err);
        try { alert("No se pudo importar el JSON. Verifica el formato."); } catch {}
      } finally {
        input.remove();
      }
    }, { once: true });
    input.click();
  });

  const btnClose = document.createElement("button");
  btnClose.textContent = "Cerrar";
  btnClose.addEventListener("click", () => { try { dlg.remove(); } catch {} });

  footer.appendChild(btnImportJSON);
  footer.appendChild(btnClose);

  panel.appendChild(header);
  panel.appendChild(list);
  panel.appendChild(footer);
  dlg.appendChild(panel);
  document.body.appendChild(dlg);
}
