// ================================
// src/ui/patches/kill.dev.proxies.js
// Desactiva y oculta los botones dev obsoletos de la esquina derecha
// ("GOLDEN", "Export Replay (dev)", "Mark Undo (dev)") aunque la UI se
// re-renderice, para que sólo queden los espejos en la izquierda.
// ================================

const N = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
const $all = (r, sel) => Array.from((r || document).querySelectorAll(sel));

function hasText(el, words) {
  const t = N(el.textContent || el.value || "");
  return words.some((w) => t.includes(N(w)));
}

function hideStrong(el) {
  if (!el) return;
  el.style.setProperty("display", "none", "important");
  el.setAttribute("data-killed", "1");
}

function killRightSide(root) {
  const candidates = $all(root, 'button, .btn, a, [role="button"], input[type="button"], input[type="submit"], .chip');

  // Frases objetivo (flexibles a mayúsculas/espacios)
  const GOLDENS = ["goldens", "golden"];
  const EXPORT  = ["export replay"];
  const MARK    = ["mark undo"];

  for (const el of candidates) {
    const t = N(el.textContent || el.value || "");
    if (!t) continue;

    if (hasText(el, GOLDENS) || hasText(el, EXPORT) || hasText(el, MARK)) {
      // Si está en la barra superior/derecha, o sin contenedor claro: ocultar
      const inTopRight =
        el.closest(".toolbar, .toolbar-top, .topbar, .area-right, [data-area='right']") ||
        (window.getComputedStyle(el).position === "fixed");

      if (inTopRight || !el.closest("[data-area='left'], .area-left")) {
        hideStrong(el);
      }
    }
  }
}

export function installKillDevProxies(root = document) {
  // 1) Golpe inmediato
  killRightSide(root);

  // 2) Observer: cada mutación vuelve a ocultarlos
  const mo = new MutationObserver(() => killRightSide(root));
  mo.observe(root.body || root, { childList: true, subtree: true });

  // 3) “Keep-alive” corto tras renderes pesados
  let loops = 0;
  const T = setInterval(() => {
    killRightSide(root);
    if (++loops > 40) clearInterval(T); // ~24s de autocuración (600ms * 40)
  }, 600);
}
