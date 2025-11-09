// ================================
// src/ui/pages/Online/lib/toast.js
// Toasters minimalistas con estilos inline (sin CSS extra)
// Uso: showToast("Conectado", { level:"ok", tag:"WS" });
// levels: "ok" | "info" | "warn" | "error"
// ================================

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement("div");
  container.id = "d10-toasts";
  Object.assign(container.style, {
    position: "fixed",
    right: "12px",
    bottom: "12px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    pointerEvents: "none",
  });
  document.body.appendChild(container);
  return container;
}

function bgFor(level) {
  switch (level) {
    case "ok":    return "#c7f5d9";
    case "warn":  return "#ffe8b3";
    case "error": return "#ffd6d6";
    default:      return "#e8f0fe"; // info
  }
}

export function showToast(text, { level = "info", tag = "" } = {}) {
  try {
    ensureContainer();
    const el = document.createElement("div");
    el.role = "status";
    el.setAttribute("aria-live", "polite");
    el.style.pointerEvents = "auto";
    el.style.padding = "8px 10px";
    el.style.borderRadius = "10px";
    el.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)";
    el.style.fontSize = "14px";
    el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    el.style.color = "#111";
    el.style.background = bgFor(level);
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.gap = "8px";
    el.style.maxWidth = "320px";
    el.style.transition = "transform .18s ease, opacity .18s ease";
    el.style.transform = "translateY(6px)";
    el.style.opacity = "0";

    if (tag) {
      const strong = document.createElement("strong");
      strong.textContent = `[${tag}]`;
      strong.style.marginRight = "4px";
      el.appendChild(strong);
    }
    const span = document.createElement("span");
    span.textContent = String(text ?? "");
    el.appendChild(span);

    container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = "translateY(0)";
      el.style.opacity = "1";
    });

    const hide = () => {
      el.style.transform = "translateY(6px)";
      el.style.opacity = "0";
      setTimeout(() => { try { container.removeChild(el); } catch {} }, 200);
    };

    const ttl = Math.max(1500, Math.min(5000, ("" + text).length * 60));
    const timer = setTimeout(hide, ttl);

    el.addEventListener("click", () => { clearTimeout(timer); hide(); });

    return hide;
  } catch {}
}
