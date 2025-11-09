// src/ui/pages/Training/editor/ui/rotate.board.js
/* eslint-disable no-console */

/**
 * Monta un botón "Girar tablero" debajo de los botones de edición.
 * - Solo afecta la vista local (agrega/quita .view-negro en #board).
 * - Persiste por dispositivo y por sala: editor:orientation:<room> = "white" | "black".
 * - No emite nada por WS, no sincroniza con el otro dispositivo.
 */
export function mountRotateBoardButton(toolbarEl) {
  try {
    if (!toolbarEl) {
      toolbarEl = document.getElementById("tools");
    }
    if (!toolbarEl) {
      console.warn("[rotate.board] Toolbar no encontrada (#tools).");
      return;
    }

    // Evita duplicados si se monta dos veces
    if (toolbarEl.querySelector("#btn-rotate-board")) return;

    // Crea el botón y lo añade al final de la barra de edición
    const btn = document.createElement("button");
    btn.id = "btn-rotate-board";
    btn.type = "button";
    btn.className = "btn btn-icon";
    btn.style.marginTop = "6px";
    btn.innerHTML = `
      <span class="ico ico--icono_rotar" aria-hidden="true"></span>
      <span>Girar tablero</span>
    `;
    toolbarEl.appendChild(btn);

    // Helpers de orientación
    const $boardHost = () => document.getElementById("board");
    const getRoom = () => {
      // Si está expuesto por el bridge del Editor:
      const room = (window.__editorWS && window.__editorWS.room) ? window.__editorWS.room : "default";
      return String(room || "default");
    };
    const setWhite = (room) => {
      const host = $boardHost();
      if (!host) return;
      host.classList.remove("view-negro");
      try { localStorage.setItem(`editor:orientation:${room}`, "white"); } catch {}
    };
    const setBlack = (room) => {
      const host = $boardHost();
      if (!host) return;
      host.classList.add("view-negro");
      try { localStorage.setItem(`editor:orientation:${room}`, "black"); } catch {}
    };
    const getStored = (room) => {
      try { return localStorage.getItem(`editor:orientation:${room}`) || ""; } catch { return ""; }
    };
    const applyStored = () => {
      const room = getRoom();
      const val = getStored(room);
      if (val === "black") setBlack(room);
      else if (val === "white") setWhite(room);
      // Si no hay valor almacenado, no tocamos nada (respeta estado actual)
    };

    // Click: alterna localmente sin emitir por WS
    btn.addEventListener("click", () => {
      const room = getRoom();
      const host = $boardHost();
      if (!host) return;

      const isBlack = host.classList.toggle("view-negro");
      try { localStorage.setItem(`editor:orientation:${room}`, isBlack ? "black" : "white"); } catch {}

      // No emitimos nada a red. Es puramente local.
      console.log(`[rotate.board] Vista local ⇒ ${isBlack ? "NEGRO abajo" : "BLANCO abajo"} (room=${room})`);
    });

    // Aplica la última preferencia guardada (si existe) al cargar
    // Nota: también se puede invocar desde fuera si cambias de sala en caliente.
    applyStored();

    // Exponer utilidad opcional para depuración/otros módulos
    window.__rotateBoard = {
      setWhiteBottom: () => setWhite(getRoom()),
      setBlackBottom: () => setBlack(getRoom()),
      applyStored,
    };
  } catch (err) {
    console.warn("[rotate.board] Error al montar botón:", err);
  }
}
