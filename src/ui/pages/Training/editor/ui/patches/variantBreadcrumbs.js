// src/ui/pages/Training/editor/ui/patches/variantBreadcrumbs.js
import { getPolicy } from "../../../../../../engine/policies/config.js";

// Pinta "INT" o "CL" en el botón Verificar, y sincroniza aria-label
export function installVariantBreadcrumbs(root) {
  const verifyBtn = root.querySelector("#btn-verificar");
  if (!verifyBtn) return;
  let crumb = verifyBtn.querySelector(".variant-crumb");
  if (!crumb) {
    crumb = document.createElement("span");
    crumb.className = "variant-crumb";
    verifyBtn.appendChild(crumb);
  }
  const render = (variant) => {
    const isIntl = variant === "internacional";
    crumb.textContent = isIntl ? "INT" : "CL";
    crumb.setAttribute("data-variant", variant);
    const base = "Ver capturas";
    const suffix = isIntl ? " (Internacional)" : " (Clásica)";
    verifyBtn.setAttribute("aria-label", base + suffix);
  };
  try { const { variant } = getPolicy(); render(variant || "internacional"); } catch { render("internacional"); }
  const onVariantChanged = (ev) => { const v = ev?.detail?.variant; if (v) render(v); };
  window.addEventListener("rules:variant-changed", onVariantChanged);
  const obs = new MutationObserver(()=>{ if(!document.body.contains(root)){ window.removeEventListener("rules:variant-changed",onVariantChanged); obs.disconnect(); } });
  obs.observe(document.body,{childList:true,subtree:true});
}

// Actualiza titles/aria-label de botones con data-mode según la variante
export function syncVariantToolTitles(root) {
  try {
    const { variant } = getPolicy();
    const isIntl = (variant || "internacional") === "internacional";
    root.querySelectorAll("[data-mode]").forEach((btn) => {
      const base = btn.getAttribute("data-title") || btn.getAttribute("title") || btn.textContent || "Herramienta";
      const title = isIntl ? `${base} — Intl` : `${base} — Clásica`;
      btn.setAttribute("title", title);
      btn.setAttribute("aria-label", title);
    });
  } catch {}
}
