// src/ui/patches/variantHints.js
// Eliminado: bloque de "ayuda contextual" de reglas (Internacional / Clásica)

import { getPolicy } from "../../engine/policies/config.js";

/**
 * Eliminada la función de mostrar texto de reglas.
 * Se mantiene la firma por compatibilidad con Editor.js.
 */
export function installVariantHints(root) {
  if (!root) return;

  // Mantener estructura vacía para evitar errores si Editor.js la llama
  let host = root.querySelector(".variant-hints-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "variant-hints-host";
    // Se inserta sin contenido
    const badgeBar = root.querySelector(".variant-badge-bar");
    if (badgeBar?.nextSibling) {
      badgeBar.parentNode.insertBefore(host, badgeBar.nextSibling);
    } else {
      root.prepend(host);
    }
  }

  // No renderiza texto ni se suscribe a eventos
  // Solo deja el host vacío para mantener compatibilidad
}
