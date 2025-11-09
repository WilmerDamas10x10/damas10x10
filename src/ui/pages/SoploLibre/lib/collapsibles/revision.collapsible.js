// ================================
// revision.collapsible.js
// ================================
export function setupRevisionCollapsible(refs) {
  const revisionButtons = [
    refs.btnRevisionStart,    // Acordar Revisión
    refs.btnRevConfirmRed,    // Confirmar Rojo
    refs.btnRevConfirmBlack,  // Confirmar Negro
    refs.btnRevStepBack,      // Retroceder Jugada (si existe)
    refs.btnRevApply,         // Cerrar Revisión (aplicar)
    refs.btnRevCancel,        // Cerrar Revisión (cancelar)
  ].filter(Boolean);
  if (revisionButtons.length === 0) return;

  for (const b of revisionButtons) b.style.display = "none";
  const grp = revisionButtons[0].parentNode || refs.root;

  const btnToggle = ensureHeader(grp, "Revisión", refs.btnRevision || refs.btnRevisar);
  const panel = createPanel(grp, btnToggle, "reviewPanel");

  for (const b of revisionButtons) {
    b.style.display = "";
    b.classList.add("reviewPanel__btn");
    panel.appendChild(b);
  }

  wireToggle(btnToggle, panel, grp);
}

function ensureHeader(groupEl, text, fallbackBtn) {
  const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  let headerEl = Array.from(groupEl.childNodes).find(n =>
    n.nodeType === 1 && (norm(n.textContent) === "revision" || norm(n.textContent) === "revisión")
  );
  if (headerEl) {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = (headerEl.className ? headerEl.className + " " : "") + "btn";
    btn.textContent = headerEl.textContent?.trim() || text;
    groupEl.replaceChild(btn, headerEl);
    return btn;
  }
  if (fallbackBtn) return fallbackBtn;
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "btn"; btn.textContent = text;
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
  document.addEventListener("click", (ev) => {
    if (panel.style.display !== "none" && !scopeEl.contains(ev.target)) {
      panel.style.display = "none";
      btnToggle.setAttribute("aria-expanded", "false");
      btnToggle.classList.remove("is-open");
    }
  });
}
