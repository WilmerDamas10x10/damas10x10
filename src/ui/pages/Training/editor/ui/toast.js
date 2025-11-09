// src/ui/pages/Training/editor/ui/toast.js
export function toast(msg = "", ms = 2000) {
  try {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.style.position = "fixed";
      host.style.left = "50%";
      host.style.bottom = "18px";
      host.style.transform = "translateX(-50%)";
      host.style.zIndex = "9999";
      host.style.display = "flex";
      host.style.flexDirection = "column";
      host.style.gap = "8px";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.padding = "10px 14px";
    el.style.borderRadius = "10px";
    el.style.background = "rgba(0,0,0,.8)";
    el.style.color = "#fff";
    el.style.fontSize = "14px";
    el.style.boxShadow = "0 6px 18px rgba(0,0,0,.25)";
    el.style.maxWidth = "80vw";
    el.style.textAlign = "center";
    el.style.backdropFilter = "blur(2px)";
    el.style.transition = "opacity .18s ease";
    el.style.opacity = "0";
    host.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; });
    setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 180); }, ms);
  } catch {}
}
try { window.toast = toast; } catch {}
