// src/ui/patches/variantBadge.js
// Muestra una insignia (badge) con la variante activa: "Clásica" o "Internacional".
// Escucha cambios por CustomEvent: 'rules:variant-changed' { detail: { variant } }

import { getPolicy } from "../../engine/policies/config.js";

/**
 * Monta el contenedor y renderiza el badge según la variante actual.
 * @param {HTMLElement} root - Nodo raíz del Editor (contenedor principal)
 */
export function installVariantBadge(root) {
  if (!root) return;

  // 1) Crea (o reutiliza) contenedor fijo del badge:
  let bar = root.querySelector(".variant-badge-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "variant-badge-bar";
    // Lo colocamos al inicio del Editor (fuera de la toolbar) pero dentro del root:
    root.prepend(bar);
  }

  // 2) Función de render:
  const render = (variant) => {
    const label = variant === "international" ? "Internacional" : "Clásica";
    bar.innerHTML = `
      <div class="variant-badge" role="status" aria-live="polite" title="Variante de reglas activa">
        <span class="dot" aria-hidden="true"></span>
        <strong>${label}</strong>
      </div>
    `;
  };

  // 3) Estado inicial desde la policy global:
  const { variant: initialVariant } = getPolicy();
  render(initialVariant);

  // 4) Reaccionar a cambios (emitidos por el Editor):
  const onVariantChanged = (ev) => {
    const v = ev?.detail?.variant;
    if (!v) return;
    render(v);
  };

  window.addEventListener("rules:variant-changed", onVariantChanged);

  // 5) Limpieza opcional si el Editor desmonta root:
  const observer = new MutationObserver((mut) => {
    if (!document.body.contains(root)) {
      window.removeEventListener("rules:variant-changed", onVariantChanged);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
