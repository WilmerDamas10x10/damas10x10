// =========================
// src/ui/design-utils.js
// Utilidades visuales reusables
// - show/hide/toggle
// - pulse / flash
// - place
// - acordeón genérico (cerrado por defecto)
// - helpers de texto: norm / readLabel  ← NUEVO
// =========================

export const show   = (el) => el && el.classList.remove('hidden');
export const hide   = (el) => el && el.classList.add('hidden');
export const toggle = (el, force) => {
  if (!el) return;
  if (typeof force === 'boolean') el.classList.toggle('hidden', !force);
  else el.classList.toggle('hidden');
};

// Reinicia y aplica una animación CSS (para clicks, mover, etc.)
export function pulse(el, cls = 'pulse'){
  if (!el) return;
  el.classList.remove(cls);
  // Reflow para reiniciar la animación
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth;
  el.classList.add(cls);
}

// Flash para feedback breve: "ok" | "error" | "capture"
export function flash(el, type = 'ok'){
  if (!el) return;
  const map = { ok:'flash--ok', error:'flash--error', capture:'flash--capture' };
  const cls = map[type] || map.ok;
  el.classList.remove('flash--ok', 'flash--error', 'flash--capture');
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth;
  el.classList.add(cls);
}

// Posiciona un elemento en una zona declarativa (izq/centro/der/abajo)
export function place(el, where = 'left'){
  if (!el) return;
  el.setAttribute('data-area', where);
}

// Acordeón genérico (cerrado por defecto)
// Patrón HTML esperado (no obliga a cambiar tu HTML, solo añade attrs):
// <div class="acc">
//   <button class="acc__hdr" data-acc>
//     Título <span class="chev">▶</span>
//   </button>
//   <div class="acc__panel" data-acc-panel>
//     <div class="acc__inner"> ...contenido... </div>
//   </div>
// </div>
export function toggleCollapse(container, open){
  if (!container) return;
  container.classList.toggle('is-open', !!open);
}

// Auto-cableado global: cualquier [data-acc] controla su panel adyacente
export function setupAccordions(root = document){
  root.querySelectorAll('[data-acc]').forEach((btn) => {
    const acc = btn.closest('.acc') || btn.parentElement;
    if (!acc) return;
    // Inicia cerrado:
    acc.classList.remove('is-open');

    // Vincula al panel hermano (soporta varios layouts)
    const panel = acc.querySelector('[data-acc-panel]') ||
                  btn.nextElementSibling;

    btn.addEventListener('click', () => {
      const willOpen = !acc.classList.contains('is-open');
      acc.classList.toggle('is-open', willOpen);
      pulse(btn); // feedback visual
      // accesibilidad básica
      btn.setAttribute('aria-expanded', String(willOpen));
      if (panel) panel.setAttribute('aria-hidden', String(!willOpen));
    });
  });
}

/* ===== NUEVO: helpers de texto usados por layout.moves.js ===== */
export function norm(s){
  return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function readLabel(el){
  return [
    el?.textContent,
    el?.value,
    el?.placeholder,
    el?.getAttribute?.('aria-label'),
    el?.getAttribute?.('title'),
  ].filter(Boolean).join(' ');
}
