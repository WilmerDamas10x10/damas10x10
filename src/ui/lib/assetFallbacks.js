// src/ui/lib/assetFallbacks.js
// Detecta soporte WebP y, si NO hay, cambia .webp -> .png en <img> y limpia <source type="image/webp">.
// También marca <html> con clases: .webp ó .no-webp para que puedas hacer estilos si quieres.

async function canUseWebP() {
  // Canvas test: funciona incluso con CSP estricta (no requiere fetch)
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext) return false;
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch { return false; }
}

function swapWebPToPNG(root = document) {
  // <img src="...webp"> → "...png"
  root.querySelectorAll('img[src$=".webp"], img[src*=".webp?"]').forEach(img => {
    try {
      const url = new URL(img.src, window.location.href);
      const isWebp = url.pathname.endsWith(".webp");
      if (!isWebp) return;
      url.pathname = url.pathname.replace(/\.webp$/i, ".png");
      img.src = url.toString();
    } catch {
      // Fallback textual si no pudo parsear URL absoluta
      img.src = img.src.replace(/\.webp(\?.*)?$/i, ".png$1");
    }
  });

  // <picture><source type="image/webp"> … → quítalos para que caiga al <img> PNG
  root.querySelectorAll('picture source[type="image/webp"]').forEach(s => {
    try { s.remove(); } catch {}
  });

  // Elementos con data-src-webp/data-src-png (opcional)
  root.querySelectorAll("[data-src-webp][data-src-png]").forEach(el => {
    const png = el.getAttribute("data-src-png");
    if (!png) return;
    const img = new Image();
    img.alt = el.getAttribute("data-alt") || "";
    img.decoding = "async";
    img.loading  = "lazy";
    img.src = png;
    // Conserva clases/estilos útiles si el contenedor era un placeholder
    img.className = el.className || "";
    Object.assign(img.style, el.style || {});
    el.replaceWith(img);
  });
}

export async function installAssetFallbacks(root = document) {
  const supported = await canUseWebP();
  const html = document.documentElement;
  html.classList.toggle("webp", !!supported);
  html.classList.toggle("no-webp", !supported);
  if (!supported) swapWebPToPNG(root);
}
