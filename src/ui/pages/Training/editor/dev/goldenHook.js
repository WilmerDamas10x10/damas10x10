// src/ui/pages/Training/editor/dev/goldenHook.js
// Botón "GOLDEN" + atajo Ctrl/Cmd+G para ejecutar dev/golden.js
// Nota: este módulo **no** se auto-instala. Solo exporta la función.

export function installGoldenHook(root = document.body) {
  try {
    const host = root || document.body;
    if (!host) return null;

    // Evitar duplicados (HMR / múltiples montajes)
    if (document.getElementById("golden-hook-btn")) {
      return document.getElementById("golden-hook-btn");
    }

    const btn = document.createElement("button");
    btn.id = "golden-hook-btn";
    btn.textContent = "GOLDEN";
    btn.title = "Ejecutar Golden runner (ver consola)";
    Object.assign(btn.style, {
      position: "absolute",
      top: "8px",
      right: "8px",
      zIndex: "9999",
      padding: "6px 10px",
      fontSize: "12px",
      borderRadius: "8px",
      opacity: "0.75",
      cursor: "pointer",
    });

    btn.addEventListener("mouseenter", () => (btn.style.opacity = "1"));
    btn.addEventListener("mouseleave", () => (btn.style.opacity = "0.75"));

    btn.addEventListener("click", async () => {
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Running…";
      try {
        // Ejecuta el runner que loguea en consola
        await import("./golden.js");

        // Si golden.js dejó un resultado global, úsalo
        const passed = globalThis?.GOLDEN_RESULT?.passed ?? null;
        if (passed != null) {
          btn.textContent = `Golden ${passed}/5`;
          btn.title = `Golden pasó ${passed}/5 (ver consola)`;
        } else {
          btn.textContent = "Golden ✓";
          btn.title = "Golden ejecutado (ver consola)";
        }
      } catch (err) {
        console.error("[goldenHook] Error al ejecutar golden.js:", err);
        btn.textContent = "Golden ✗";
        btn.title = "Error (ver consola)";
      } finally {
        setTimeout(() => {
          btn.textContent = prev || "GOLDEN";
          btn.disabled = false;
        }, 4000); // 4 segundos
      }
    });

    host.appendChild(btn);

    // Atajo de teclado (una sola vez)
    if (!window.__goldenHookHotkeyInstalled) {
      window.__goldenHookHotkeyInstalled = true;
      window.addEventListener(
        "keydown",
        (ev) => {
          if ((ev.ctrlKey || ev.metaKey) && (ev.key === "g" || ev.key === "G")) {
            ev.preventDefault();
            const b = document.getElementById("golden-hook-btn");
            if (b) b.click();
          }
        },
        { passive: false }
      );
    }

    return btn;
  } catch (e) {
    console.warn("[goldenHook] No se pudo instalar:", e);
    return null;
  }
}

// ⚠️ Importante: No llames aquí a installGoldenHook(...).
// La instalación se controla desde index.js (condicionado por ?golden=1 en DEV).
