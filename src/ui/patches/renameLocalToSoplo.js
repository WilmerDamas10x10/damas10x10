// src/ui/patches/renameLocalToSoplo.js
import { setRulesVariant } from "../../engine/policies/config.js";
import { navigate } from "@router";

// Normaliza texto: quita espacios, saltos y acentos.
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function looksLikeJugarLocal(el) {
  const t = norm(el.textContent || "");
  // Acepta variantes con iconos/espacios: "jugar local", "jugar   local", etc.
  return /\bjugar\s+local\b/i.test(t);
}

function retitle(btn) {
  if (!btn || btn.__soploRenamed) return;
  btn.textContent = "Jugar con soplo";
  btn.setAttribute("data-variant", "soplo");
  btn.setAttribute("aria-label", "Jugar con soplo");
  btn.__soploRenamed = true;

  // Handler único para fijar variante y fallback de navegación
  if (!btn.__soploClick) {
    btn.addEventListener("click", () => {
      try {
        setRulesVariant && setRulesVariant("soplo");
        window.dispatchEvent(new CustomEvent("rules:variant-changed", { detail: { variant: "soplo" } }));
      } catch (e) {
        console.warn("[soplo] no se pudo fijar la variante:", e);
      }
      // Fallback si ningún handler navegó
      queueMicrotask(() => {
        const url = String(location.href);
        const alreadyInPlay = /(#\/play|\/play\/|#play)/i.test(url);
        if (!alreadyInPlay) {
          try {
            if (typeof navigate === "function") navigate("/play/local");
            else location.hash = "#/play/local";
          } catch {
            try { location.hash = "#/play/local"; } catch {}
          }
        }
      });
    }, { passive: true });
    btn.__soploClick = true;
  }
}

function scanAndRename(root = document) {
  const candidates = root.querySelectorAll("button, a[role='button'], .btn");
  for (const el of candidates) {
    if (looksLikeJugarLocal(el)) retitle(el);
  }
}

// 1) Escaneo inicial (por si ya está en DOM)
if (document.readyState !== "loading") scanAndRename();
else document.addEventListener("DOMContentLoaded", () => scanAndRename());

// 2) Observa cambios en el árbol (SPA / navegación interna)
const mo = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type !== "childList") continue;
    m.addedNodes?.forEach((n) => {
      if (!(n instanceof Element)) return;
      // Si añaden un bloque grande, escanéalo completo
      scanAndRename(n);
      // Si directamente es un botón, evalúalo
      if (n.matches?.("button, a[role='button'], .btn") && looksLikeJugarLocal(n)) {
        retitle(n);
      }
    });
  }
});
mo.observe(document.documentElement, { childList: true, subtree: true });

// 3) Reintentos suaves (por si Home monta con retraso)
let tries = 0;
const maxTries = 10;
const id = setInterval(() => {
  tries++;
  scanAndRename();
  if (tries >= maxTries) clearInterval(id);
}, 250);

// 4) Reaccionar a cambios de ruta típicos en SPA
window.addEventListener("hashchange", () => scanAndRename());
window.addEventListener("popstate", () => scanAndRename());
