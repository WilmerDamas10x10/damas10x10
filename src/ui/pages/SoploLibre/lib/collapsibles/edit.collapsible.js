// ================================
// src/ui/pages/SoploLibre/lib/collapsibles/edit.collapsible.js
// Colapsable de Edición — sin botón “Mover pieza (libre)” y sin duplicados
// ================================
export function setupEditCollapsible(refs, ...rest) {
  // --- Guard anti-duplicados (layout "bueno" ya presente) ---
  // Si el layout correcto ya expone estos refs, NO montar este colapsable.
  if (refs?.btnClearBoard && refs?.btnPopulateInitial) return;

  // Nodo raíz del modo
  const modeRoot =
    (refs?.root && refs.root.closest?.(".soploLibre")) ||
    document.querySelector(".soploLibre") ||
    refs?.root ||
    document.body;

  // Host donde se debe insertar el colapsable (preferencia: editHost > leftPane > modeRoot)
  const host = refs?.editHost || refs?.leftPane || modeRoot;

  // Si ya existe un colapsable de edición en este host, no duplicar
  if (host.querySelector('[data-collapsible="edit"]')) return;

  // Limpieza: si hay botones "Edición" fuera del host (ej. panel duplicado abajo), eliminarlos
  const allEditBtns = Array.from(
    modeRoot.querySelectorAll('[data-collapsible="edit"], .btn')
  )
    .filter(
      (el) =>
        el.getAttribute?.("data-collapsible") === "edit" ||
        /(^|\s)btn(\s|$)/.test(el.className || "")
    )
    .filter((el) => /edici[oó]n/i.test(el.textContent || ""));

  allEditBtns.forEach((el) => {
    if (!host.contains(el)) {
      // Si es un botón suelto “Edición” en otra zona, removerlo
      if (/edici[oó]n/i.test(el.textContent || "")) {
        try {
          el.remove();
        } catch {}
      }
    }
  });

  // --- Botón toggle (único) ---
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.setAttribute("data-collapsible", "edit");
  btn.textContent = "Edición";
  host.appendChild(btn);

  // --- Panel ---
  const panel = document.createElement("div");
  panel.className = "editPanel";
  panel.style.display = "none";
  host.appendChild(panel);

  // === CONTROLES DE COLOCACIÓN (sin botón de mover libre) ===
  const rowPlace = document.createElement("div");
  rowPlace.className = "editRow";
  rowPlace.innerHTML = `
    <div class="toolGroup">
      <button type="button" class="btn" data-role="place-pawn-red">Peón rojo</button>
      <button type="button" class="btn" data-role="place-pawn-black">Peón negro</button>
      <button type="button" class="btn" data-role="place-king-red">Dama roja</button>
      <button type="button" class="btn" data-role="place-king-black">Dama negra</button>
    </div>
  `;
  panel.appendChild(rowPlace);

  // Enlazar con refs esperados por index.js
  if (refs) {
    refs.btnPlacePawnRed   = rowPlace.querySelector('[data-role="place-pawn-red"]');
    refs.btnPlacePawnBlack = rowPlace.querySelector('[data-role="place-pawn-black"]');
    refs.btnPlaceKingRed   = rowPlace.querySelector('[data-role="place-king-red"]');
    refs.btnPlaceKingBlack = rowPlace.querySelector('[data-role="place-king-black"]');
  }

  // --- Toggle ---
  btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", () => {
    const open = panel.style.display !== "none";
    panel.style.display = open ? "none" : "";
    btn.setAttribute("aria-expanded", String(!open));
    btn.classList.toggle("is-open", !open);
  });

  // --- Cerrar al hacer click fuera ---
  const onDocClick = (ev) => {
    if (panel.style.display !== "none" && !host.contains(ev.target)) {
      panel.style.display = "none";
      btn.setAttribute("aria-expanded", "false");
      btn.classList.remove("is-open");
    }
  };
  document.addEventListener("click", onDocClick);

  // (Opcional) Limpieza si el host se desmonta
  const obs = new MutationObserver(() => {
    if (!document.body.contains(host)) {
      try { document.removeEventListener("click", onDocClick); } catch {}
      try { obs.disconnect(); } catch {}
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
