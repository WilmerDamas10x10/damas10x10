// src/dev/goldens.run.js
import { GOLDENS, GOLDENS_MIXED_EXTRA } from "./goldens.data.js";
import { computeGlobalAllowed } from "../engine/chainPolicies.js";
import { movimientos, colorOf } from "@rules";

function k(r,c){ return `${r},${c}`; }

export async function runGoldens() {
  // Construye la lista final de casos: GOLDENS base + mixtos extra (si existen)
  const CASES = Array.isArray(GOLDENS) ? [...GOLDENS] : [];
  try {
    if (Array.isArray(GOLDENS_MIXED_EXTRA) && GOLDENS_MIXED_EXTRA.length) {
      CASES.push(...GOLDENS_MIXED_EXTRA);
    }
  } catch (e) {
    console.warn("[goldens] No se pudo anexar GOLDENS_MIXED_EXTRA:", e);
  }

  const results = [];
  for (const g of CASES) {
    try {
      const { winners } = computeGlobalAllowed(g.board, g.turn, movimientos, colorOf);
      const keys = [...winners.keys()];
      let ok = true, why = "";

      if (g.expect?.noWinners) {
        if (keys.length !== 0) { ok = false; why = `esperaba 0 y hubo ${keys.length}`; }
      } else if (Array.isArray(g.expect?.mustIncludeWinnerKeys)) {
        for (const need of g.expect.mustIncludeWinnerKeys) {
          if (!keys.includes(need)) { ok = false; why = `faltó ganador ${need}`; break; }
        }
      } else {
        // Sin expectativas explícitas: al menos debe devolver objeto válido
        ok = winners instanceof Map;
      }

      results.push({ name: g.name, ok, detail: ok ? "OK" : `FALLÓ: ${why}`, winners: keys });
    } catch (e) {
      results.push({ name: g.name, ok: false, detail: `ERROR: ${e?.message||e}`, winners: [] });
    }
  }

  openResultsDialog(results);
}

function openResultsDialog(results) {
  const dlg = document.createElement("div");
  Object.assign(dlg.style, {
    position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
    display:"flex", alignItems:"center", justifyContent:"center", zIndex:99999
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background:"#fff", borderRadius:"12px", width:"min(720px,95vw)",
    maxHeight:"85vh", overflow:"auto", padding:"16px",
    boxShadow:"0 10px 30px rgba(0,0,0,0.3)", fontFamily:"system-ui, sans-serif"
  });

  const h = document.createElement("div");
  h.textContent = "Resultados - Posiciones doradas";
  Object.assign(h.style, { fontWeight:700, fontSize:"18px", marginBottom:"8px" });

  const list = document.createElement("div");
  for (const r of results) {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display:"grid", gridTemplateColumns:"1fr 120px", gap:"12px",
      padding:"8px 0", borderBottom:"1px solid #eee"
    });
    const left = document.createElement("div");
    left.textContent = r.name;

    const right = document.createElement("div");
    right.textContent = r.ok ? "✔︎ OK" : r.detail;
    Object.assign(right.style, { color: r.ok ? "#17803d" : "#b00020", fontWeight:600 });

    const wins = document.createElement("div");
    wins.textContent = r.winners?.length ? `Ganadores: ${r.winners.join("  ·  ")}` : "Sin ganadores";
    Object.assign(wins.style, { gridColumn:"1 / span 2", fontSize:"12px", color:"#555" });

    row.appendChild(left); row.appendChild(right); row.appendChild(wins);
    list.appendChild(row);
  }

  const footer = document.createElement("div");
  Object.assign(footer.style, { display:"flex", justifyContent:"flex-end", gap:"8px", marginTop:"8px" });

  const close = document.createElement("button");
  close.textContent = "Cerrar";
  close.addEventListener("click", () => dlg.remove());
  footer.appendChild(close);

  panel.appendChild(h);
  panel.appendChild(list);
  panel.appendChild(footer);
  dlg.appendChild(panel);
  document.body.appendChild(dlg);
}
