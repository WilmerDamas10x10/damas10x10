// ================================
// partida.collapsible.js
// ================================
export function setupPartidaCollapsible(refs) {
  const partidaButtons = [
    refs.btnPauseStart,         // Solicitar pausa
    refs.btnPauseConfirmRed,    // Confirmar Rojo
    refs.btnPauseConfirmBlack,  // Confirmar Negro
    refs.btnPauseResume,        // Reanudar
    refs.btnPauseCancel,        // Cancelar
    refs.btnDrawStart,          // Proponer empate
    refs.btnDrawConfirmRed,     // Aceptar Rojo
    refs.btnDrawConfirmBlack,   // Aceptar Negro
  ].filter(Boolean);
  if (partidaButtons.length === 0) return;

  // Ocultamos los botones originales (los reubicaremos dentro del panel)
  for (const b of partidaButtons) b.style.display = "none";
  const grp = partidaButtons[0].parentNode || refs.root;

  // ❌ Antes: ensureHeader(groupEl=grp, text="Partida", fallbackBtn=(refs.btnPartida || refs.btnGame))
  // ✅ Ahora:
  const btnToggle = ensureHeader(grp, "Partida", (refs.btnPartida || refs.btnGame));
  const panel = createPanel(grp, btnToggle, "gamePanel");

  // Movemos los botones al panel
  for (const b of partidaButtons) {
    b.style.display = "";
    b.classList.add("gamePanel__btn");
    panel.appendChild(b);
  }

  wireToggle(btnToggle, panel, grp);
}

function ensureHeader(groupEl, text, fallbackBtn) {
  const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  // Si existe un header de texto "Partida", lo reemplazamos por un botón
  let headerEl = Array.from(groupEl.childNodes).find(n =>
    n.nodeType === 1 && norm(n.textContent) === "partida"
  );
  if (headerEl) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = (headerEl.className ? headerEl.className + " " : "") + "btn";
    btn.textContent = headerEl.textContent?.trim() || text;
    groupEl.replaceChild(btn, headerEl);
    return btn;
  }
  // Si nos pasaron un botón de fallback, úsalo
  if (fallbackBtn) return fallbackBtn;

  // Si no hay header ni fallback, creamos un botón nuevo al inicio del grupo
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.textContent = text;
  groupEl.insertBefore(btn, groupEl.firstChild || null);
  return btn;
}

function createPanel(groupEl, btnToggle, className) {
  const panel = document.createElement("div");
  panel.className = className;
  panel.style.display = "none";
  if (btnToggle.nextSibling) groupEl.insertBefore(panel, btnToggle.nextSibling);
  else groupEl.appendChild(panel);
  return panel;
}

function wireToggle(btnToggle, panel, scopeEl) {
  btnToggle.setAttribute("aria-expanded", "false");
  btnToggle.addEventListener("click", () => {
    const open = panel.style.display !== "none";
    panel.style.display = open ? "none" : "";
    btnToggle.setAttribute("aria-expanded", String(!open));
    btnToggle.classList.toggle("is-open", !open);
  });
  // Cerrar si se hace click fuera
  document.addEventListener("click", (ev) => {
    if (panel.style.display !== "none" && !scopeEl.contains(ev.target)) {
      panel.style.display = "none";
      btnToggle.setAttribute("aria-expanded", "false");
      btnToggle.classList.remove("is-open");
    }
  });
}
