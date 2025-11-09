// src/ui/pages/Home/home.grid.js
// Marca contenedores de botones con .two-col (grilla 2 columnas)
// Funciona aunque el Home se monte tarde (SPA) o cambie de ruta.

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function findSectionByTitle(title) {
  const want = norm(title);
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6,summary,legend"));
  const hit = headings.find(h => norm(h.textContent).includes(want));
  if (!hit) return null;
  return hit.closest("section, fieldset, div") || hit.parentElement || null;
}

function firstButtonsContainer(section) {
  if (!section) return null;

  // 1) Un contenedor típico debajo del título
  const direct = section.querySelector(":scope > .actions, :scope > .panel, :scope > .content, :scope > .acc__panel .acc__inner, :scope > div");
  if (direct && direct.querySelector("button, a[role='button'], .btn")) return direct;

  // 2) Busca el primer bloque dentro que tenga botones
  const withBtns = Array.from(section.querySelectorAll("div, section, ul, ol"))
    .find(el => el.querySelector && el.querySelector("button, a[role='button'], .btn"));
  return withBtns || section;
}

function markTwoColFor(title) {
  const section = findSectionByTitle(title);
  if (!section) return;
  const host = firstButtonsContainer(section);
  if (!host) return;
  host.classList.add("two-col");
}

function apply() {
  // Ya estaban:
  markTwoColFor("modo rapido");
  markTwoColFor("modo clasico");
  markTwoColFor("modo clásico");

  // ➕ Nuevos:
  markTwoColFor("social");
  markTwoColFor("ajustes y perfil");
}

// Aplica ahora y re-aplica si es SPA
if (document.readyState !== "loading") apply();
else document.addEventListener("DOMContentLoaded", apply);

// Observa cambios (navegación interna, renders diferidos)
const mo = new MutationObserver(() => apply());
mo.observe(document.documentElement, { childList: true, subtree: true });

// Reintentos suaves por si el Home se monta con retraso
let tries = 0;
const id = setInterval(() => {
  apply();
  if (++tries >= 10) clearInterval(id);
}, 250);

// Por si cambian de ruta (hash SPA)
window.addEventListener("hashchange", apply);
window.addEventListener("popstate", apply);
