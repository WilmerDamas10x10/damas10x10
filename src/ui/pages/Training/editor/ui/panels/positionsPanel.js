// src/ui/pages/Training/editor/ui/panels/positionsPanel.js
import { makeBtn } from "../btn.js";
import { openPopoverMenu } from "../popover.js";
import { runGoldenTests } from "../../dev/golden.js";
import { openGoldenPositionsDialog } from "../dialogs/goldenPositions.js";

import { openNameDialog } from "../dialogs/namePrompt.js";
import { openLoadListDialog } from "../dialogs/positionList.js";
import { openImportCodeDialog } from "../dialogs/importCode.js";

import { saveLocalNamed } from "../../services/snapshot.js";
import { afterLocalSaveOptions } from "../../exporters.js";
import { copyToClipboard } from "../../services/clipboard.js";
import {
  makeShareLinkToTraining,
  parseSharedFromURL,
  cleanShareParamsInURL,
} from "../../services/shareLink.js";
import { normalizeSnapshot } from "../../services/importers.js";

/**
 * Instala el panel de posiciones (Guardar, Cargar, Importar, Compartir) y
 * hace la carga inicial desde URL (?pos= / ?fen=) si existe.
 */
export function installPositionsPanel(container, {
  applySnapshot,        // (snap) => void
  boardForSave,         // () => cleanBoard
  getTurn,              // () => turn
  getSize,              // () => SIZE
}) {
  const findChangeTurnButton = () =>
    container.querySelector("#btn-cambiar-turno") ||
    Array.from(container.querySelectorAll("button")).find(b =>
      (b.textContent || "").trim().toLowerCase().includes("cambiar turno")
    );

  const changeBtn = findChangeTurnButton();

  // Evitar duplicados
  if (!changeBtn || container.querySelector("#group-save-load-local")) {
    // Aun así intentamos cargar desde URL si aplica
    tryInitFromURL();
    return;
  }

  const group = document.createElement("div");
  group.id = "group-save-load-local";
  Object.assign(group.style, { display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" });

  // Botones principales
  const btnSaveLocal = makeBtn("btn-save-pos-local", "Guardar posición");
  const btnLoadLocal = makeBtn("btn-load-pos-local", "Cargar posición");
  const btnImport    = makeBtn("btn-import-any",     "Importar ▾");
  const btnShareMenu = makeBtn("btn-share-menu",     "Compartir ▾");

  // Insertamos JUSTO DESPUÉS del botón “Cambiar turno”
  changeBtn.insertAdjacentElement("afterend", group);
  group.append(btnSaveLocal, btnLoadLocal, btnImport, btnShareMenu);

  // Guardar con nombre + menú post-guardado (JSON/PNG) — usa tablero LIMPIO
  btnSaveLocal.addEventListener("click", (e) => {
    openNameDialog((name) => {
      const clean = boardForSave();
      const turn  = getTurn();
      saveLocalNamed(clean, turn, name);
      try { btnSaveLocal.animate?.([{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }], { duration: 250 }); } catch {}
      try { afterLocalSaveOptions({ board: clean, turn, anchor: e?.currentTarget || btnSaveLocal }); } catch {}
    });
  });

  // Cargar: abre la lista con previews
  btnLoadLocal.addEventListener("click", () => {
    openLoadListDialog({ onLoad: (snap) => applySnapshot(snap) });
  });

  // IMPORTAR ▾ (Posiciones doradas / FEN / Código / JSON)
  btnImport.addEventListener("click", (ev) => {
    openPopoverMenu([
      { label: "Posiciones doradas…", action: () => {
          openGoldenPositionsDialog({ onLoad: (snap) => applySnapshot(snap) });
        } },
      { label: "Pegar FEN…", action: async () => {
          const fen = prompt("Pega el FEN (r/R/n/N, números de vacías, filas con '/', y al final ' r' o ' n'):");
          if (!fen) return;
          try {
            const { fromFEN } = await import("../../services/fen.js");
            const snap = fromFEN(fen);
            if (!Array.isArray(snap.board) || typeof snap.turn === "undefined") throw new Error();
            applySnapshot(snap);
          } catch {
            alert("FEN inválido. Revisa el formato.");
          }
        } },
      { label: "Pegar código (Base64)…", action: () => {
          openImportCodeDialog({ onImport: (snap) => applySnapshot(snap) });
        } },
      { label: "Cargar archivo JSON…", action: () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json,.json";
          input.addEventListener("change", async (e2) => {
            const file = e2?.target?.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const raw = JSON.parse(text);
              const snap = normalizeSnapshot(raw, getTurn(), getSize());
              if (!snap || !Array.isArray(snap.board) || typeof snap.turn === "undefined") throw new Error("Formato inválido.");
              applySnapshot(snap);
            } catch (err) {
              console.error("[import-json] error:", err);
              alert("No se pudo importar el JSON.");
            } finally { input.remove(); }
          }, { once: true });
          input.click();
        } },
    ], ev.currentTarget);
  });

  // COMPARTIR ▾ — solo “Copiar enlace”
  btnShareMenu.addEventListener("click", (ev) => {
    openPopoverMenu([
      { label: "Copiar enlace", action: async () => {
          try {
            const snap = { board: boardForSave(), turn: getTurn(), size: getSize(), ts: Date.now() };
            const link = makeShareLinkToTraining(snap);
            await copyToClipboard(link);
            alert("Enlace copiado.");
          } catch (e) {
            console.error("[share-link] error:", e);
            alert("No se pudo generar el enlace.");
          }
        } },
    ], ev.currentTarget);
  });

  // Carga inicial desde enlace (?pos= / ?fen=)
  tryInitFromURL();

  function tryInitFromURL() {
    const parsed = parseSharedFromURL();
    if (!parsed) return;
    try {
      applySnapshot(parsed);
      cleanShareParamsInURL();
    } catch (e) {
      console.warn("[initFromURL] no se pudo aplicar snapshot del enlace:", e);
    }
  }
}
