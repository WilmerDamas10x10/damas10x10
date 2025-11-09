// ================================
// src/ui/pages/Home/index.js
// Menú principal + Editor en overlay full-screen (sin barra superior)
// Variante por defecto: Clásica Ecuatoriana
// ================================

import { navigate } from "@router";
import "../../design.css";
import { setupAccordions, pulse } from "../../design-utils.js";
import { setRulesVariant } from "../../../engine/policies/config.js";

import "./home.grid.css";
import "./home.grid.js";

function toast(msg = "", ms = 1600) {
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
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 180);
    }, ms);
  } catch {}
}

// ==== Helper de prefetch en hover (Soplo / Online / IA) ====
function prefetchOnHover(el, loader) {
  if (!el || typeof loader !== "function") return;
  let done = false;
  const run = async () => {
    if (done) return;
    done = true;
    try { await loader(); } catch (err) {
      console.error("[Prefetch] Error al precargar:", err);
    }
  };
  el.addEventListener("mouseenter", run, { once: true });
  el.addEventListener("touchstart", run, { once: true, passive: true });
}

export default function Home(container) {
  container.style.minHeight = "100vh";
  document.documentElement.style.height = "100%";
  document.body.style.height = "100%";
  document.body.style.margin = "0";

  let bg = document.getElementById("home-bg-fixed");
  if (!bg) {
    bg = document.createElement("div");
    bg.id = "home-bg-fixed";
    document.body.appendChild(bg);
  }
  Object.assign(bg.style, {
    position: "fixed",
    inset: "0",
    zIndex: "-1",
    background: "#EAF6FF",
    pointerEvents: "none",
  });

  const css = `
    html, body, #app, #root { background: #EAF6FF !important; }
    [data-page="home"] { background: transparent !important; }
  `;
  let tag = document.getElementById("home-bg-fix");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "home-bg-fix";
    tag.textContent = css;
    document.head.appendChild(tag);
  } else {
    tag.textContent = css;
  }
  container.style.background = "transparent";

  container.innerHTML = `
    <div class="design-scope pad-4" style="max-width:920px;margin:0 auto;" data-page="home">
      <div class="col gap-3">
        <h1 style="margin:0 0 8px 0; font-weight:700;">El Mundo de las Damas</h1>
        <p class="menu-subtitle" style="margin:0; color:var(--muted)">Tradición y táctica.</p>

        <div class="card" style="padding:10px 12px;">
          <div class="row" style="gap:12px; align-items:center;">
            <label for="homeVariant" style="min-width:84px;">Variante</label>
            <select id="homeVariant" class="btn" style="padding:8px 10px;">
              <option value="clasica">Clásica Ecuatoriana</option>
              <option value="internacional">Internacional</option>
            </select>
            <span id="variantBadge" class="btn btn--subtle" style="pointer-events:none;">Actual: Clásica Ecuatoriana</span>
          </div>
        </div>

        <div class="acc card">
          <button class="acc__hdr" data-acc>
            <span class="row space" style="width:100%;">
              <span>Jugar</span>
              <span class="chev">▶</span>
            </span>
          </button>
          <div class="acc__panel" data-acc-panel>
            <div class="acc__inner col gap-2">

              <div class="acc">
                <button class="acc__hdr" data-acc>
                  <span class="row space" style="width:100%;">
                    <span>Modo Rápido</span>
                    <span class="chev">▶</span>
                  </span>
                </button>
                <div class="acc__panel" data-acc-panel>
                  <div class="acc__inner col gap-2 two-col">
                    <button class="btn" id="btn-quick-play">Jugar Rápido</button>
                    <button class="btn" id="btn-quick-room">Crear Sala</button>
                    <button class="btn" id="btn-quick-ai">Jugar contra la IA</button>
                    <button class="btn" id="btn-quick-league" title="mini torneo todos contra todos">Liga Exprés</button>
                    <button class="btn" id="btn-quick-editor">Editor / Modo Entrenamiento</button>
                  </div>
                </div>
              </div>

              <div class="acc">
                <button class="acc__hdr" data-acc>
                  <span class="row space" style="width:100%;">
                    <span>Soplo / Online</span>
                    <span class="chev">▶</span>
                  </span>
                </button>
                <div class="acc__panel" data-acc-panel>
                  <div class="acc__inner col gap-2 two-col">
                    <button class="btn" id="btn-classic-local">Jugar con Soplo</button>
                    <button class="btn" id="btn-classic-online">Jugar Online</button>
                    <!-- Nuevo botón explícito para el modo reconstruido -->
                    
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div class="acc card">
          <button class="acc__hdr" data-acc>
            <span class="row space" style="width:100%;">
              <span>Clasificadas (ELO)</span>
              <span class="chev">▶</span>
            </span>
          </button>
          <div class="acc__panel" data-acc-panel>
            <div class="acc__inner col gap-2 two-col">
              <button class="btn" id="btn-elo-queue">Buscar Partida ELO</button>
              <button class="btn" id="btn-elo-rated">Partida Calificada ELO</button>
              <button class="btn" id="btn-elo-top">Mi Ranking TOP</button>
            </div>
          </div>
        </div>

        <div class="acc card">
          <button class="acc__hdr" data-acc>
            <span class="row space" style="width:100%;">
              <span>Social</span>
              <span class="chev">▶</span>
            </span>
          </button>
          <div class="acc__panel" data-acc-panel>
            <div class="acc__inner col gap-2 two-col">
              <button class="btn" id="btn-social-feed">Noticias / Feed</button>
              <button class="btn" id="btn-social-friends">Amigos</button>
              <button class="btn" id="btn-social-clubs">Clubs</button>
            </div>
          </div>
        </div>

        <div class="acc card">
          <button class="acc__hdr" data-acc>
            <span class="row space" style="width:100%;">
              <span>Ajustes y Perfil</span>
              <span class="chev">▶</span>
            </span>
          </button>
          <div class="acc__panel" data-acc-panel>
            <div class="acc__inner col gap-2 two-col">
              <button class="btn" id="btn-account">Cuenta</button>
              <button class="btn" id="btn-login">Iniciar sesión</button>
              <button class="btn" id="btn-register">Registrarse</button>
              <button class="btn" id="btn-recover">Recuperar contraseña</button>
              <button class="btn" id="btn-profile">Perfil</button>
              <button class="btn" id="btn-settings">Ajustes</button>
              <button class="btn" id="btn-themes">Temas</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  setupAccordions(container);

  (() => {
    const sel = container.querySelector("#homeVariant");
    const badge = container.querySelector("#variantBadge");
    if (!sel) return;
    const apply = (v) => {
      try { setRulesVariant?.(v); } catch {}
      try {
        window.dispatchEvent(new CustomEvent("rules:variant-changed", { detail: { variant: v } }));
      } catch {}
      if (badge) badge.textContent = "Actual: " + (v === "internacional" ? "Internacional" : "Clásica Ecuatoriana");
    };
    sel.value = "clasica";
    apply("clasica");
    sel.addEventListener("change", () => {
      const v = sel.value === "internacional" ? "internacional" : "clasica";
      apply(v);
    });
  })();

  const go = (path, fallbackMsg) => {
    try {
      if (typeof navigate === "function") navigate(path);
      else location.hash = `#${path}`;
    } catch {
      toast(fallbackMsg || "Acción no disponible");
    }
  };

  // JUGAR → Modo Rápido
  container.querySelector("#btn-quick-play")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/play?mode=quick", "Jugar Rápido");
  });
  container.querySelector("#btn-quick-room")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/rooms/create", "Crear Sala");
  });

  // JUGAR → Modo Rápido → IA
  container.querySelector("#btn-quick-ai")?.addEventListener("click", (e) => {
    try { pulse(e.currentTarget); } catch {}
    navigate("/ai");
  });

  container.querySelector("#btn-quick-league")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/tournaments/league-express", "Liga Exprés");
  });

  // === SOPLO / ONLINE ===
  // Jugar con Soplo → (legacy) navegar a /soplo si aún existe
  container.querySelector("#btn-classic-local")?.addEventListener("click", (e) => {
    try { pulse?.(e.currentTarget); } catch {}
    navigate("/soplo");
  });

  // Jugar Online → navegar a /online (router)
  container.querySelector("#btn-classic-online")?.addEventListener("click", (e) => {
    try { pulse?.(e.currentTarget); } catch {}
    navigate("/online");
  });

  // Nuevo: Soplo Modo Libre → lazy-load y montar directamente (ROBUSTO)
  const btnSoploLibre = container.querySelector("#btn-soplo-libre");
  if (btnSoploLibre) {
    btnSoploLibre.addEventListener("click", async (e) => {
      try {
        pulse?.(e.currentTarget);

        const mod = await import("../SoploLibre/index.js");
        // Selecciona función de montaje entre varias convenciones posibles
        const mount =
          (typeof mod === "function" && mod) ||
          (typeof mod?.default === "function" && mod.default) ||
          (typeof mod?.mountSoploLibre === "function" && mod.mountSoploLibre) ||
          (typeof mod?.default?.default === "function" && mod.default.default) ||
          (typeof mod?.mount === "function" && mod.mount) ||
          (typeof mod?.start === "function" && mod.start) ||
          null;

        if (!mount) {
          throw new TypeError("El módulo SoploLibre no exporta una función de montaje");
        }

        const appRoot = document.getElementById("app") || document.body;
        await mount(appRoot);
      } catch (err) {
        console.error("[Home] No se pudo abrir Soplo Modo Libre:", err);
        toast("No se pudo abrir Soplo Modo Libre. Revisa la consola.");
      }
    });
  }

  // ===== Editor / Modo Entrenamiento — overlay FULL SCREEN
  container.querySelector("#btn-quick-editor")?.addEventListener("click", async (e) => {
    pulse(e.currentTarget);
    try {
      let overlay = document.getElementById("editor-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "editor-overlay";
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.zIndex = "9998";
        overlay.style.background = "rgba(0,0,0,.85)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "stretch";
        overlay.style.justifyContent = "stretch";
        overlay.style.backdropFilter = "blur(2px)";
        document.body.appendChild(overlay);
      } else {
        overlay.innerHTML = "";
        overlay.style.display = "flex";
      }

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const shell = document.createElement("div");
      shell.id = "editor-shell";
      shell.style.width = "100vw";
      shell.style.height = "100vh";
      shell.style.display = "flex";
      shell.style.flexDirection = "column";
      shell.style.borderRadius = "0";
      shell.style.boxShadow = "none";
      shell.style.background = "var(--bg)";

      const host = document.createElement("div");
      host.id = "editor-host";
      host.style.flex = "1";
      host.style.minHeight = "0";
      host.style.overflow = "hidden";

      const fitCss = document.createElement("style");
      fitCss.textContent = `
        #editor-host .layout-editor{ min-height:100%; height:100%; padding:12px; box-sizing:border-box; }
        #editor-host .area-center{ min-height:0; }
        #editor-host #board{ max-height:calc(100vh - 120px); }
        #editor-host .variant-badge, #editor-host [data-variant-badge], #editor-host .variant-crumb{ display:none !important; }
      `;
      shell.appendChild(fitCss);

      shell.appendChild(host);
      overlay.appendChild(shell);

      overlay.addEventListener("click", (ev) => {
        if (ev.target === overlay) {
          overlay.style.display = "none";
          overlay.innerHTML = "";
          document.body.style.overflow = prevOverflow;
        }
      });

      const onKey = (ev) => {
        if (ev.key === "Escape") {
          overlay.style.display = "none";
          overlay.innerHTML = "";
          document.body.style.overflow = prevOverflow;
          window.removeEventListener("keydown", onKey);
        }
      };
      window.addEventListener("keydown", onKey);

      const mod = await import("../Training/editor/Editor.js");
      if (typeof mod.default === "function") {
        mod.default(host);
      } else {
        throw new Error("Editor.js no exporta default()");
      }
    } catch (err) {
      console.error("[Home] No se pudo abrir el Editor]:", err);
      toast("No se pudo abrir el Editor. Revisa la consola.");
    }
  });

  // ===== Clasificadas (ELO)
  container.querySelector("#btn-elo-queue")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/ranked/queue", "Buscar Partida ELO");
  });
  container.querySelector("#btn-elo-rated")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/ranked/rated", "Partida Calificada ELO");
  });
  container.querySelector("#btn-elo-top")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/ranked/top", "Mi Ranking TOP");
  });

  // ===== Ajustes y Perfil (rutas)
  container.querySelector("#btn-account")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/account", "Cuenta");
  });
  container.querySelector("#btn-login")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/auth/login", "Iniciar sesión");
  });
  container.querySelector("#btn-register")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/auth/register", "Registrarse");
  });
  container.querySelector("#btn-recover")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/auth/recover", "Recuperar contraseña");
  });
  container.querySelector("#btn-profile")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/profile", "Perfil");
  });
  container.querySelector("#btn-settings")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/settings", "Ajustes");
  });
  container.querySelector("#btn-themes")?.addEventListener("click", (e) => {
    pulse(e.currentTarget);
    go("/themes", "Temas");
  });

  // ===== Prefetch en hover (Soplo / Online / IA) =====
  try {
    const btnSoplo = container.querySelector("#btn-classic-local");
    const btnOnline = container.querySelector("#btn-classic-online");
    const btnSoploLibreHover = container.querySelector("#btn-soplo-libre");

    // Prefetch (Soplo Modo Libre) — reemplaza import del Soplo antiguo
    prefetchOnHover(btnSoplo, async () => {
      await import("../SoploLibre/index.js");
    });
    prefetchOnHover(btnSoploLibreHover, async () => {
      await import("../SoploLibre/index.js");
    });

    // Prefetch (Online) — calienta bundle; navegación usa /online
    prefetchOnHover(btnOnline, async () => {
      await import("../Online/index.js");
    });

    // Prefetch para IA
    const btnAI = container.querySelector("#btn-quick-ai");
    prefetchOnHover(btnAI, async () => {
      await import("../AI/index.js");
    });

  } catch (e) {
    // Silencioso: si falla el prefetch, no bloquea el Home.
  }
}
