// src/ui/pages/Training/editor/ui/variantSelector.js
// Coloca un selector visible (INT/CL) en la toolbar del Editor y lo conecta
// a las policies (getPolicy / setRulesVariant) + persistencia en localStorage.

import { getPolicy, setRulesVariant } from "../../../../../engine/policies/config.js";

// Claves de storage
const LS_KEY = "editor.variant";

// Normaliza valor a solo dos variantes soportadas
function normalizeVariant(v) {
  const x = String(v || "").toLowerCase().trim();
  if (x === "clasica" || x === "clásica") return "clasica";
  // por defecto internacional
  return x === "internacional" ? "internacional" : "internacional";
}

// Obtiene valor inicial: URL ?variant=..., luego LS, luego policy, luego "internacional"
function resolveInitialVariant() {
  try {
    const qs = new URLSearchParams(location.search);
    const q = qs.get("variant");
    if (q) return normalizeVariant(q);
  } catch {}
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls) return normalizeVariant(ls);
  } catch {}
  try {
    const pol = getPolicy?.() || {};
    const fromPolicy =
      pol?.variant ||
      (pol?.INTERNATIONAL ? "internacional" : null) ||
      (pol?.CLASSIC ? "clasica" : null);
    if (fromPolicy) return normalizeVariant(fromPolicy);
  } catch {}
  return "internacional";
}

// Crea el nodo <select> + label
function createSelectorDom() {
  const wrap = document.createElement("div");
  wrap.id = "variant-select-wrap";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Seleccionar variante de reglas");

  // estilos mínimos inline para integrarlo sin depender de CSS extra
  wrap.style.display = "inline-flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "6px";
  wrap.style.marginLeft = "8px";

  const label = document.createElement("label");
  label.textContent = "Variante:";
  label.style.fontSize = "12px";
  label.style.opacity = "0.9";

  const sel = document.createElement("select");
  sel.id = "variantSelect";
  sel.setAttribute("aria-label", "Variante de reglas");
  sel.style.fontSize = "12px";
  sel.style.padding = "4px 6px";
  sel.style.borderRadius = "6px";

  const optIntl = document.createElement("option");
  optIntl.value = "internacional";
  optIntl.textContent = "Internacional";

  const optClas = document.createElement("option");
  optClas.value = "clasica";
  optClas.textContent = "Clásica";

  sel.appendChild(optIntl);
  sel.appendChild(optClas);
  wrap.appendChild(label);
  wrap.appendChild(sel);
  return { wrap, sel };
}

// Inserta el wrapper en la toolbar del Editor (o en su defecto, en el contenedor)
function mountIntoToolbar(doc) {
  const root =
    doc.querySelector("#editor-toolbar") ||
    doc.querySelector(".editor-toolbar") ||
    doc.querySelector("#tools") ||
    doc.querySelector(".toolbar") ||
    doc.querySelector("[data-editor-root]") ||
    doc.body;

  return root;
}

// Emite evento global y sincroniza títulos/hints que ya escuchan 'rules:variant-changed'
function emitVariantChanged(variant) {
  try {
    window.dispatchEvent(
      new CustomEvent("rules:variant-changed", { detail: { variant } })
    );
  } catch {}
}

// Evita doble montaje
function alreadyMounted(doc) {
  return !!doc.querySelector("#variant-select-wrap");
}

// Atajo de teclado: Alt+V alterna entre INT/CL si el foco no está escribiendo
function installHotkey(sel, getCurrent) {
  const isTypingTarget = (t) => {
    const tag = (t?.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || !!t?.isContentEditable;
  };

  const handler = (e) => {
    const key = String(e.key || "").toLowerCase();
    if (key !== "v" || !e.altKey) return;
    if (isTypingTarget(e.target)) return;

    const cur = getCurrent();
    const next = cur === "internacional" ? "clasica" : "internacional";
    sel.value = next;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    e.preventDefault();
    e.stopPropagation();
  };

  window.addEventListener("keydown", handler);
  // Limpieza si el selector desaparece del DOM
  const mo = new MutationObserver(() => {
    if (!document.body.contains(sel)) {
      window.removeEventListener("keydown", handler);
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

// API principal
export function installVariantSelector(doc = document) {
  try {
    if (alreadyMounted(doc)) return;

    const mountPoint = mountIntoToolbar(doc);
    if (!mountPoint) return;

    const { wrap, sel } = createSelectorDom();
    const initial = resolveInitialVariant();
    sel.value = initial;

    // Aplica al motor de reglas + persiste + notifica UI que escucha el evento
    const applyVariant = (v) => {
      const vv = normalizeVariant(v);
      try {
        setRulesVariant?.(vv);
      } catch (e) {
        console.warn("[variantSelector] setRulesVariant falló:", e);
      }
      try {
        localStorage.setItem(LS_KEY, vv);
      } catch {}
      emitVariantChanged(vv);
    };

    // Aplica inmediatamente el valor inicial (por si la policy no estaba aún)
    applyVariant(initial);

    // Cambios del usuario
    sel.addEventListener("change", (e) => {
      const v = normalizeVariant(e?.target?.value);
      applyVariant(v);
      try {
        // feedback accesible
        sel.setAttribute("title", v === "internacional" ? "Variante: Internacional" : "Variante: Clásica");
        sel.setAttribute("aria-label", sel.getAttribute("title"));
      } catch {}
    });

    // Montaje en toolbar (al final)
    mountPoint.appendChild(wrap);

    // Atajo Alt+V
    installHotkey(sel, () => sel.value);

  } catch (err) {
    console.warn("[variantSelector] no se pudo montar:", err);
  }
}

export default installVariantSelector;
