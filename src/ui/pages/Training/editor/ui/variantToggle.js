// src/ui/pages/Training/editor/ui/variantToggle.js
import { getVariant, setVariant, isClassic, isInternational } from "../../../../../engine/policies/variant.js"; // ← corregido (5 niveles)

function label(v) {
  return v === "international" ? "Internacional" : "Clásica";
}

function makePill() {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "variant-pill";
  el.setAttribute("aria-label", "Cambiar variante de reglas");
  el.style.display = "inline-flex";
  el.style.alignItems = "center";
  el.style.gap = "0.5rem";
  el.style.padding = "0.35rem 0.7rem";
  el.style.borderRadius = "999px";
  el.style.border = "1px solid var(--ui-border, #d0d5dd)";
  el.style.background = "var(--ui-bg, #fff)";
  el.style.cursor = "pointer";
  el.style.fontSize = "0.9rem";
  el.style.userSelect = "none";
  return el;
}

function icon(v) {
  return v === "international" ? "🌍" : "🎲";
}

export function setupVariantToggle(toolbarEl, ctx) {
  if (!toolbarEl) return;

  const group = document.createElement("div");
  group.className = "toolbar-group toolbar-variant";
  group.style.display = "inline-flex";
  group.style.alignItems = "center";

  const btn = makePill();

  function render() {
    const v = getVariant();
    btn.textContent = "";
    const i = document.createElement("span");
    i.textContent = icon(v);
    const t = document.createElement("span");
    t.textContent = `Variante: ${label(v)}`;
    btn.appendChild(i);
    btn.appendChild(t);

    btn.style.background = isInternational()
      ? "var(--variant-intl-bg, #e6f4ff)"
      : "var(--ui-bg, #fff)";
    btn.style.borderColor = isInternational()
      ? "var(--variant-intl-border, #b3ddff)"
      : "var(--ui-border, #d0d5dd)";
  }

  btn.addEventListener("click", () => {
    const next = isClassic() ? "international" : "classic";
    setVariant(next, ctx);
    render();
    toolbarEl.dispatchEvent(new CustomEvent("variant:apply", { bubbles: true, detail: { variant: next } }));
  });

  render();
  group.appendChild(btn);
  toolbarEl.prepend(group);

  const onExternal = () => {
    render();
    try { ctx?.repaint?.(); } catch {}
    try { ctx?.rebuildHints?.(); } catch {}
  };
  window.addEventListener("variant:changed", onExternal);

  return () => window.removeEventListener("variant:changed", onExternal);
}
