// src/ui/menu/menu.render.js
// Renderiza el Menú Principal desde el esquema, con:
// - Selector de variantes
// - Panel de "Preferencias de sesión" (por variante)
// - Secciones y subgrupos colapsables con MEMORIA (LS)
// - Emite acciones con { variant, sessionPrefs }

import { MENU, VARIANTS, DEFAULT_VARIANT_ID } from "./menu.schema.js";

const LS_VARIANT        = "menu.variant";
const LS_SESSION_PREFIX = "session.prefs.";        // + <variantId>
const LS_SECTIONS_OPEN  = "menu.openSections.v2";  // ← bumped a v2 para reiniciar
const LS_GROUPS_OPEN    = "menu.openGroups.v2";    // ← bumped a v2 para reiniciar
const STYLE_ID          = "schema-menu-style";

// Opciones de tema (puedes cambiarlas o cargarlas dinámicamente)
const THEME_OPTIONS = [
  { id: "classic",       label: "Clásico" },
  { id: "wood",          label: "Madera" },
  { id: "high-contrast", label: "Alto contraste" },
];

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
  .sm-root{max-width:1100px;margin:28px auto;padding:0 12px;font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Arial,"Apple Color Emoji","Segoe UI Emoji"}
  .sm-h1{font-size:28px;font-weight:800;margin:0 0 10px}
  .sm-sub{opacity:.7;margin:0 0 18px}
  .sm-sec{background:#fff;border:1px solid #e8e8ee;border-radius:16px;margin:14px 0;overflow:hidden;box-shadow:0 1px 0 rgba(0,0,0,.02)}
  .sm-sec-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;cursor:pointer;user-select:none}
  .sm-sec-hd h2{font-size:16px;margin:0;font-weight:700}
  .sm-sec-ct{padding:12px 14px;display:none}
  .sm-sec[aria-expanded="true"] .sm-sec-ct{display:block}
  .sm-row{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}
  .sm-pill{appearance:none;border:1px solid #e0e2ea;background:#fff;border-radius:999px;padding:10px 14px;cursor:pointer}
  .sm-pill[disabled]{opacity:.55;cursor:not-allowed}
  .sm-badge{margin-left:8px;font-size:11px;padding:2px 6px;border-radius:999px;background:#f2f4fb;border:1px solid #e6e9f5}
  .sm-muted{opacity:.7}
  .sm-variant{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .sm-chip{border:1px solid #d7dcef;background:#f6f8ff;border-radius:999px;padding:6px 10px;cursor:pointer}
  .sm-chip[aria-current="true"]{background:#e8edff;border-color:#c9d6ff;font-weight:600}
  .sm-grid{display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:10px}
  @media (max-width:860px){.sm-grid{grid-template-columns:1fr}}
  .sm-btn{appearance:none;border:1px solid #e0e2ea;background:#fff;border-radius:12px;padding:14px;text-align:left;cursor:pointer}
  .sm-btn:hover{box-shadow:0 2px 10px rgba(0,0,0,.05);transform:translateY(-1px)}
  .sm-btn[disabled]{opacity:.5;cursor:not-allowed}
  .sm-note{font-size:12px;opacity:.75;margin:6px 0 0}

  /* Preferencias de sesión */
  .sm-prefbox{border:1px dashed #e1e4ef;border-radius:12px;padding:10px 12px;margin:6px 0 14px;background:#fbfcff}
  .sm-preftitle{font-weight:700;margin:0 0 8px}
  .sm-prefrow{display:flex;flex-wrap:wrap;gap:10px 12px;align-items:center}
  .sm-seg{display:inline-flex;border:1px solid #dfe3f2;border-radius:999px;overflow:hidden;background:#fff}
  .sm-seg button{border:0;background:transparent;padding:8px 10px;cursor:pointer}
  .sm-seg button[aria-pressed="true"]{background:#e9efff;font-weight:600}
  .sm-kv{display:flex;align-items:center;gap:8px}
  .sm-select{appearance:none;border:1px solid #dfe3f2;border-radius:10px;padding:8px 10px;background:#fff;cursor:pointer}
  `;
  const st = document.createElement("style");
  st.id = STYLE_ID;
  st.textContent = css;
  document.head.appendChild(st);
}

const qs  = (sel,el=document)=>el.querySelector(sel);
const qsa = (sel,el=document)=>Array.from(el.querySelectorAll(sel));

/* -------------------- Persistencia (LS) -------------------- */
function getRememberedVariant() {
  try { return localStorage.getItem(LS_VARIANT) || DEFAULT_VARIANT_ID; }
  catch { return DEFAULT_VARIANT_ID; }
}
function rememberVariant(id) { try { localStorage.setItem(LS_VARIANT, id); } catch {} }

function loadSessionPrefs(variantId) {
  const key = LS_SESSION_PREFIX + variantId;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) throw 0;
    return JSON.parse(raw);
  } catch {
    return {
      audioFx: true,        // sonidos de juego
      micMode: "off",       // off | ptt | on  (push-to-talk)
      cameraOn: false,      // video
      appearance: "room",   // room | my  (tema de la sala o del jugador)
      themeId: "classic",   // "mi tema" para ESTA variante
    };
  }
}
function saveSessionPrefs(variantId, prefs) {
  const key = LS_SESSION_PREFIX + variantId;
  try { localStorage.setItem(key, JSON.stringify(prefs)); } catch {}
}

function getOpenSet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null; // sin preferencia todavía
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return null; }
}
function saveOpenSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch {}
}

/* -------------------- Montaje -------------------- */
export function mountSchemaMenu(mountEl=document.body, opts={}) {
  ensureStyles();
  const {
    title="Pantalla principal",
    subtitle="Todos los botones vienen de un esquema JS.",
    isLoggedIn=false,
    isAdmin=false,
    onAction
  } = opts;

  const root = document.createElement("div");
  root.className = "sm-root";
  root.innerHTML = `<h1 class="sm-h1">${title}</h1><p class="sm-sub">${subtitle}</p>`;
  mountEl.appendChild(root);

  // Estado recordado para secciones y subgrupos (v2 = resetea cualquier estado previo)
  let openSections = getOpenSet(LS_SECTIONS_OPEN);
  const firstRunSections = openSections === null;
  if (openSections === null) openSections = new Set(); // empezamos vacío → todo cerrado
  let openGroups = getOpenSet(LS_GROUPS_OPEN);
  if (openGroups === null) openGroups = new Set();

  const ctx = {
    variant: getRememberedVariant(),
    isLoggedIn,
    isAdmin,
    onAction: (payload) => {
      document.dispatchEvent(new CustomEvent("menu:action", { detail: payload }));
      if (typeof onAction === "function") onAction(payload);
    },
    // prefs por variante, con cache simple
    getSessionPrefs() {
      if (!this._cache) this._cache = {};
      if (!this._cache[this.variant]) this._cache[this.variant] = loadSessionPrefs(this.variant);
      return this._cache[this.variant];
    },
    setSessionPrefs(next) {
      if (!this._cache) this._cache = {};
      this._cache[this.variant] = { ...this.getSessionPrefs(), ...next };
      saveSessionPrefs(this.variant, this._cache[this.variant]);
      document.dispatchEvent(new CustomEvent("session:prefs-changed", {
        detail: { variant: this.variant, prefs: this._cache[this.variant] }
      }));
    },
    // recordar expand/collapse
    _openSections: openSections,
    _openGroups: openGroups,
    _firstRunSections: firstRunSections,
  };

  // Pinta secciones
  for (const node of MENU) {
    if (node.role === "admin" && !ctx.isAdmin) continue;
    root.appendChild(renderSection(node, ctx));
  }

  return { el: root, context: ctx };
}

/* -------------------- Secciones / Grupos -------------------- */
function renderSection(node, ctx) {
  const sec = document.createElement("section");
  sec.className = "sm-sec";

  // Estado inicial: todo cerrado; si es la primera vez, abrimos SOLO "jugar".
  let startOpen = ctx._openSections.has(node.id);
  if ((ctx._firstRunSections && node.id === "jugar") || (ctx._openSections.size === 0 && node.id === "jugar")) {
    startOpen = true;
  }
  sec.setAttribute("aria-expanded", String(!!startOpen));

  const hd = document.createElement("div");
  hd.className = "sm-sec-hd";
  hd.innerHTML = `<h2>${node.label}</h2><span class="sm-muted">▼</span>`;
  hd.addEventListener("click", () => {
    const open = sec.getAttribute("aria-expanded") !== "true";
    sec.setAttribute("aria-expanded", String(open));
    if (open) ctx._openSections.add(node.id); else ctx._openSections.delete(node.id);
    saveOpenSet(LS_SECTIONS_OPEN, ctx._openSections);
  });

  const ct = document.createElement("div");
  ct.className = "sm-sec-ct";
  sec.append(hd, ct);

  // Jugar: coloca Variant + SessionPrefs arriba
  if (node.id === "jugar") {
    const hasVariant = node.children?.some(n => n.type === "variantPicker");
    const hasSess    = node.children?.some(n => n.type === "sessionPrefs");
    if (hasVariant) ct.appendChild(renderVariantPicker(ctx, () => sessView?.refresh()));
    let sessView = null;
    if (hasSess) { sessView = renderSessionPrefs(ctx); ct.appendChild(sessView.el); }
  }

  // Render hijos (grupos o botones)
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.type === "variantPicker" || child.type === "sessionPrefs") continue;
      if (child.children?.length) {
        ct.appendChild(renderGroup(node.id, child, ctx)); // pasa id de sección
      } else {
        const row = document.createElement("div");
        row.className = "sm-row";
        row.appendChild(renderButton(child, ctx, node));
        ct.appendChild(row);
      }
    }
  }

  return sec;
}

function renderGroup(sectionId, groupNode, ctx) {
  const box = document.createElement("div");
  box.className = "sm-sec sm-sec--sub";

  // Estado inicial de subgrupo: cerrado (salvo preferencia previa)
  const key = `${sectionId}/${groupNode.id}`;
  const startOpen = ctx._openGroups.has(key);
  box.setAttribute("aria-expanded", String(!!startOpen));

  const hd = document.createElement("div");
  hd.className = "sm-sec-hd";
  hd.innerHTML = `<h2>${groupNode.label}</h2><span class="sm-muted">▼</span>`;
  hd.addEventListener("click", () => {
    const open = box.getAttribute("aria-expanded") !== "true";
    box.setAttribute("aria-expanded", String(open));
    if (open) ctx._openGroups.add(key); else ctx._openGroups.delete(key);
    saveOpenSet(LS_GROUPS_OPEN, ctx._openGroups);
  });

  const ct = document.createElement("div");
  ct.className = "sm-sec-ct";

  const grid = document.createElement("div");
  grid.className = "sm-grid";

  for (const item of (groupNode.children || [])) {
    grid.appendChild(renderButton(item, ctx, groupNode));
  }

  ct.appendChild(grid);
  box.append(hd, ct);
  return box;
}

/* -------------------- Variant & Session Prefs -------------------- */
function renderVariantPicker(ctx, onAfterChange) {
  const wrap = document.createElement("div");
  wrap.className = "sm-row sm-variant";
  const label = document.createElement("span");
  label.textContent = "Variante:";
  wrap.appendChild(label);

  for (const v of VARIANTS) {
    const chip = document.createElement("button");
    chip.className = "sm-chip";
    chip.textContent = v.label + (v.official ? " ⭐" : "");
    chip.setAttribute("aria-current", String(ctx.variant === v.id));
    chip.addEventListener("click", () => {
      ctx.variant = v.id;
      rememberVariant(v.id);
      qsa(".sm-chip", wrap).forEach(el => el.setAttribute("aria-current","false"));
      chip.setAttribute("aria-current", "true");
      document.dispatchEvent(new CustomEvent("damas:variant-changed", { detail: { variant: v.id }}));
      if (typeof onAfterChange === "function") onAfterChange();
    });
    wrap.appendChild(chip);
  }
  return wrap;
}

function renderSessionPrefs(ctx) {
  const el = document.createElement("div");
  el.className = "sm-prefbox";

  function seg(name, value, options, onSelect) {
    const row = document.createElement("div");
    row.className = "sm-kv";
    const lab = document.createElement("span");
    lab.textContent = name + ":";
    const bar = document.createElement("div");
    bar.className = "sm-seg";
    for (const [val, label] of options) {
      const b = document.createElement("button");
      b.textContent = label;
      b.setAttribute("aria-pressed", String(value === val));
      b.addEventListener("click", () => {
        qsa("button", bar).forEach(x => x.setAttribute("aria-pressed","false"));
        b.setAttribute("aria-pressed","true");
        onSelect(val);
      });
      bar.appendChild(b);
    }
    row.append(lab, bar);
    return row;
  }

  function select(name, value, options, onChange) {
    const row = document.createElement("div");
    row.className = "sm-kv";
    const lab = document.createElement("span");
    lab.textContent = name + ":";
    const sel = document.createElement("select");
    sel.className = "sm-select";
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.id;
      o.textContent = opt.label;
      sel.appendChild(o);
    }
    sel.value = value;
    sel.addEventListener("change", () => onChange(sel.value));
    row.append(lab, sel);
    return row;
  }

  function refresh() {
    el.innerHTML = "";
    const title = document.createElement("div");
    title.className = "sm-preftitle";
    title.textContent = "Preferencias de sesión (se aplican al iniciar partida)";
    el.appendChild(title);

    const prefs = ctx.getSessionPrefs();
    const rows = document.createElement("div");
    rows.className = "sm-prefrow";

    // Audio FX
    rows.appendChild(seg("Audio", prefs.audioFx ? "on" : "off",
      [["on","ON"],["off","OFF"]],
      (val) => ctx.setSessionPrefs({ audioFx: val === "on" })
    ));

    // Mic
    rows.appendChild(seg("Micrófono", prefs.micMode,
      [["off","OFF"],["ptt","Push-to-talk"],["on","ON"]],
      (val) => ctx.setSessionPrefs({ micMode: val })
    ));

    // Cámara
    rows.appendChild(seg("Cámara", prefs.cameraOn ? "on" : "off",
      [["off","OFF"],["on","ON"]],
      (val) => ctx.setSessionPrefs({ cameraOn: val === "on" })
    ));

    // Apariencia: tema de la sala o mi tema
    rows.appendChild(seg("Apariencia", prefs.appearance,
      [["room","Tema de la sala"],["my","Mi tema"]],
      (val) => ctx.setSessionPrefs({ appearance: val })
    ));

    // Mi tema para ESTA variante (se guarda en sessionPrefs.themeId por variante)
    rows.appendChild(select(
      "Mi tema (variante)",
      prefs.themeId,
      THEME_OPTIONS,
      (val) => ctx.setSessionPrefs({ themeId: val })
    ));

    el.appendChild(rows);
  }

  refresh();
  return { el, refresh };
}

/* -------------------- Botones hoja -------------------- */
function renderButton(item, ctx, parentNode) {
  const btn = document.createElement("button");
  btn.className = "sm-btn";
  btn.textContent = item.label;

  const notes = [];
  if (item.soon) notes.push("próximamente");
  if (item.requiresLogin && !ctx.isLoggedIn) { btn.disabled = true; notes.push("requiere sesión"); }
  if (notes.length) {
    const span = document.createElement("div");
    span.className = "sm-note";
    span.textContent = notes.join(" · ");
    btn.appendChild(span);
  }

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    const variant =
      item.usesSavedVariant ? "saved" :
      (item.variantScoped ? ctx.variant : null);

    const payload = {
      id: item.id,
      action: item.action || item.id,
      node: item,
      parent: parentNode?.id,
      variant,
      sessionPrefs: ctx.getSessionPrefs(), // prefs incluyen themeId por variante
    };
    ctx.onAction(payload);
  });

  return btn;
}

