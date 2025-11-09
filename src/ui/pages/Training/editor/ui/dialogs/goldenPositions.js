// src/ui/pages/Training/editor/ui/dialogs/goldenPositions.js
import { fromFEN } from "../../services/fen.js";
import { GOLDEN_POSITIONS } from "../../test/goldenPositions.js";

export function openGoldenPositionsDialog({ onLoad }) {
  document.getElementById("ctx-popover")?.remove();

  const dlg = document.createElement("div");
  Object.assign(dlg.style, {
    position: "fixed", inset: "0", background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: "9999"
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "#fff", padding: "16px", borderRadius: "12px",
    width: "min(560px, 95vw)", maxHeight: "85vh", overflow: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: "12px"
  });

  const header = document.createElement("div");
  header.textContent = "Posiciones doradas (demo)";
  Object.assign(header.style, { fontWeight: 700, fontSize: "16px" });

  const list = document.createElement("div");
  Object.assign(list.style, { display: "flex", flexDirection: "column", gap: "8px" });

  if (!Array.isArray(GOLDEN_POSITIONS) || GOLDEN_POSITIONS.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No hay posiciones doradas definidas.";
    list.appendChild(empty);
  } else {
    for (const it of GOLDEN_POSITIONS) {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "8px", border: "1px solid #eee", borderRadius: "10px", padding: "8px 10px"
      });

      const label = document.createElement("div");
      label.textContent = it.name;
      Object.assign(label.style, { fontWeight: 600 });

      const btn = document.createElement("button");
      btn.textContent = "Cargar";
      btn.addEventListener("click", () => {
        try {
          const snap = fromFEN(it.fen);
          if (!snap || !Array.isArray(snap.board)) throw new Error("FEN inválido");
          onLoad?.(snap);
          dlg.remove();
        } catch (e) {
          console.error("[golden] error:", e);
          alert("No se pudo cargar la posición.");
        }
      });

      row.append(label, btn);
      list.appendChild(row);
    }
  }

  const footer = document.createElement("div");
  Object.assign(footer.style, { display: "flex", justifyContent: "flex-end" });
  const close = document.createElement("button");
  close.textContent = "Cerrar";
  close.addEventListener("click", () => dlg.remove());
  footer.appendChild(close);

  panel.append(header, list, footer);
  dlg.appendChild(panel);
  document.body.appendChild(dlg);
}
