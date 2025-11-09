// src/boot/posParamRedirect.js
// Si la URL trae ?pos=... redirige al Editor antes de montar el router.
// Soporta SPA con hash (#/...) y router por path (/...).

(function () {
  try {
    const getPosParam = () => {
      // 1) ?pos en la parte "search" (https://app.com/?pos=XXXX#/algo)
      const s = new URLSearchParams(window.location.search).get("pos");
      if (s) return s;

      // 2) ?pos dentro del hash (https://app.com/#/training?pos=XXXX)
      const hash = window.location.hash || "";
      const qIndex = hash.indexOf("?");
      if (qIndex >= 0) {
        const qstr = hash.slice(qIndex + 1);
        const qs = new URLSearchParams(qstr);
        const h = qs.get("pos");
        if (h) return h;
      }
      return null;
    };

    const pos = getPosParam();
    if (!pos) return; // no hay posición → no tocamos nada

    // 👇 Ajusta si tu ruta real del Editor es otra:
    const EDITOR_HASH = "#/training"; // hash-router
    const EDITOR_PATH = "/training";  // path-router

    const { origin, pathname, hash } = window.location;
    const hasHashRouter = !!hash; // si hay algo en hash, asumimos hash-router

    if (hasHashRouter) {
      // Forzamos ir al editor con ?pos DENTRO del hash
      const currentHashPath = hash.split("?")[0];
      if (currentHashPath !== EDITOR_HASH) {
        const newHash = `${EDITOR_HASH}?pos=${pos}`;
        window.location.replace(`${origin}${pathname}${newHash}`);
      }
    } else {
      // Path-router: aseguramos /training?pos=...
      const currentPath = pathname.replace(/\/+$/,'');
      if (currentPath !== EDITOR_PATH) {
        const url = new URL(origin + EDITOR_PATH);
        url.searchParams.set("pos", pos);
        window.location.replace(url.toString());
      }
    }
  } catch (e) {
    console.warn("[posBoot] no se pudo redirigir al Editor:", e);
  }
})();
