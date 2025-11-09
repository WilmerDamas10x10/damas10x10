// src/ui/patches/goldensUI.js
// Botón “Goldens” SIEMPRE visible + panel de resultados (si el runner devuelve resumen)

export function installGoldensUI(root) {
  if (!root) return;

  // 1) Contenedor de herramientas
  const tools =
    root.querySelector("#tools") ||
    root.querySelector(".toolbar-vertical") ||
    root;

  // 2) Crear (o reutilizar) botón visible
  let btn = tools.querySelector("#btn-goldens-ui");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "btn-goldens-ui";
    btn.type = "button";
    btn.className = "btn btn-icon";
    btn.title = "Ejecutar Golden tests";
    btn.innerHTML = `
      <span class="ico ico--icono_test" aria-hidden="true"></span>
      <span>Goldens</span>
    `;
    tools.appendChild(btn);
  }

  // 3) Crear host del panel (debajo del tablero si existe)
  let board = root.querySelector("#board");
  let panelHost = root.querySelector(".goldens-panel-host");
  if (!panelHost) {
    panelHost = document.createElement("div");
    panelHost.className = "goldens-panel-host";
    if (board && board.parentNode) {
      board.parentNode.appendChild(panelHost);
    } else {
      root.appendChild(panelHost);
    }
  }

  // Render helpers
  const renderLoading = () => {
    panelHost.innerHTML = `
      <div class="goldens-panel">
        <div class="goldens-row">
          <strong>Golden tests</strong>
          <span class="goldens-chip goldens-chip--loading">Ejecutando…</span>
        </div>
        <div class="goldens-body">Por favor espera…</div>
      </div>
    `;
  };

  const renderError = (err) => {
    panelHost.innerHTML = `
      <div class="goldens-panel">
        <div class="goldens-row">
          <strong>Golden tests</strong>
          <span class="goldens-chip goldens-chip--fail">Error</span>
        </div>
        <div class="goldens-body">
          <p>No se pudieron ejecutar los goldens. Revisa la consola.</p>
          <pre class="goldens-pre">${(err && (err.stack || err.message || String(err))) || "Error desconocido"}</pre>
        </div>
      </div>
    `;
  };

  const renderSummary = (summary) => {
    // summary esperado (si el runner lo devuelve):
    // { ok: boolean, total: number, passed: number, failed: number, items?: [{name, ok, timeMs, msg?}] }
    const ok = !!summary?.ok;
    const total = Number(summary?.total ?? 0);
    const passed = Number(summary?.passed ?? 0);
    const failed = Number(summary?.failed ?? Math.max(0, total - passed));

    const chipClass = ok && failed === 0 ? "goldens-chip--ok" : (failed > 0 ? "goldens-chip--fail" : "goldens-chip--warn");

    const items = Array.isArray(summary?.items) ? summary.items : null;

    panelHost.innerHTML = `
      <div class="goldens-panel">
        <div class="goldens-row">
          <strong>Golden tests</strong>
          <span class="goldens-chip ${chipClass}">
            ${failed > 0 ? `${passed}/${total} OK · ${failed} fallidos` : `${passed}/${total} OK`}
          </span>
        </div>
        <div class="goldens-body">
          ${items ? `
          <table class="goldens-table" aria-label="Resultados de Golden tests">
            <thead><tr><th>Nombre</th><th>Estado</th><th>Tiempo</th><th>Detalle</th></tr></thead>
            <tbody>
              ${items.map(it => `
                <tr class="${it.ok ? "row-ok" : "row-fail"}">
                  <td>${escapeHtml(it.name || "(sin nombre)")}</td>
                  <td>${it.ok ? "OK" : "FAIL"}</td>
                  <td>${it.timeMs != null ? `${it.timeMs} ms` : "—"}</td>
                  <td>${escapeHtml(it.msg || "")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          ` : `
          <p>Goldens ejecutados. <em>No se recibió un resumen estructurado.</em> Revisa la consola para detalles.</p>
          `}
        </div>
      </div>
    `;
  };

  // Simple escape HTML
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => (
      c === "&" ? "&amp;" :
      c === "<" ? "&lt;" :
      c === ">" ? "&gt;" : "&quot;"
    ));
  }

  // 4) Click handler
  let busy = false;
  btn.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    try {
      renderLoading();
      const mod = await import("../../dev/goldens.run.js");
      const fn = mod?.runGoldens;
      if (typeof fn !== "function") {
        throw new Error("No se encontró runGoldens() en dev/goldens.run.js");
      }
      // Puede o no devolver resumen
      const result = await fn();
      if (result && (typeof result === "object")) {
        renderSummary(result);
      } else {
        renderSummary({ ok: true, total: 0, passed: 0, failed: 0, items: null });
      }
    } catch (err) {
      console.error("[goldensUI] error:", err);
      renderError(err);
    } finally {
      btn.disabled = false;
      busy = false;
    }
  });
}
