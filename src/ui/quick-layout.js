// =========================
// src/ui/quick-layout.js
// Helpers mínimos para mover/estilar botones por ID o texto
// =========================

// --- Búsqueda ---
const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();

export function byId(id, root = document) {
  return id ? root.getElementById(id) : null;
}

export function byText(txt, root = document) {
  if (!txt) return null;
  const want = norm(txt);
  const nodes = root.querySelectorAll('button, a, [role="button"], .btn, .chip, [data-action]');
  for (const el of nodes) {
    const t = norm(el.textContent);
    if (t === want) return el;
  }
  return null;
}

// --- Mover / ordenar ---
export function place(el, area = "left") {
  if (!el) return;
  el.setAttribute("data-area", area);
  // Normalización básica para que se comporte “tipo botón” de columna
  el.classList.add("btn");
  el.classList.remove("chip", "floating", "badge", "pill", "top-right");
  el.style.position = "static";
  el.style.width = "100%";
  el.style.marginTop = "8px";
  el.hidden = false;
}

export function insertAfter(referenceEl, elToMove) {
  if (referenceEl && elToMove && referenceEl.parentNode) {
    referenceEl.insertAdjacentElement("afterend", elToMove);
  }
}

export function hide(el) {
  if (!el) return;
  el.style.display = "none";
}

// --- Estilo rápido ---
export function styleBtn(el, variant = "accent") {
  if (!el) return;
  el.classList.remove("btn--accent","btn--danger","btn--subtle","btn--ghost");
  const map = new Set(["accent","danger","subtle","ghost"]);
  if (map.has(variant)) el.classList.add(`btn--${variant}`);
}

// --- Atajos por ID o texto ---
export function placeById(id, area) {
  place(byId(id), area);
}
export function placeByText(txt, area) {
  place(byText(txt), area);
}
export function insertAfterByText(anchorText, moveText) {
  insertAfter(byText(anchorText), byText(moveText));
}
export function insertAfterById(anchorId, moveId) {
  insertAfter(byId(anchorId), byId(moveId));
}
export function hideByText(txt) {
  hide(byText(txt));
}
export function hideById(id) {
  hide(byId(id));
}
export function styleByText(txt, variant) {
  styleBtn(byText(txt), variant);
}
export function styleById(id, variant) {
  styleBtn(byId(id), variant);
}
