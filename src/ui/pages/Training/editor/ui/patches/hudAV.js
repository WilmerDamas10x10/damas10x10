// src/ui/pages/Training/editor/ui/patches/hudAV.js
// HUD A/V minimal: Audio FX, Mic (off/ptt/on), Cámara (off/on),
// Apariencia (room/my) y Tema (por variante). Persiste por variante.
//
// Ubicación:
// 1) Preferida: DENTRO del panel "Turno", inmediatamente después de “Cambiar turno”.
// 2) Fallback: flotante centrado bajo el tablero.
//
// Atajos: M (mic), V (cam)

(function(){
  const LS_VARIANT = "menu.variant";
  const LS_SESSION_PREFIX = "session.prefs."; // + <variantId>
  const DEFAULT_VARIANT = "ecuatorianas";

  const THEME_OPTIONS = [
    { id: "classic",       label: "Clásico" },
    { id: "wood",          label: "Madera" },
    { id: "high-contrast", label: "Alto contraste" },
  ];

  const STYLE_ID = "hudAV-style";
  const CSS = `
  /* --------- Modo FLOTANTE (fallback) --------- */
  .hudAV{
    position:absolute;
    left:50%;
    bottom:-12px;               /* pegado por fuera del marco inferior del board */
    transform:translateX(-50%);
    display:flex; gap:8px; z-index:30; flex-wrap:wrap;
    pointer-events:auto;
  }
  .hudAV .hud-card{
    background:#ffffff; border:1px solid rgba(0,0,0,.1);
    border-radius:12px; padding:8px 10px;
    box-shadow:0 8px 24px rgba(0,0,0,.08);
  }
  .hudAV .row{display:flex; gap:6px; align-items:center; flex-wrap:wrap}
  .hudAV .row + .row{ margin-top:8px; }
  .hudAV button, .hudAV select{
    appearance:none; border:1px solid #dfe3f2; background:#fff;
    border-radius:10px; padding:6px 10px; cursor:pointer;
    font:13px system-ui,-apple-system,Segoe UI,Roboto
  }
  .hudAV button[aria-pressed="true"]{background:#e9efff; border-color:#c9d6ff; font-weight:600}
  .hudAV .tag{font-size:11px; opacity:.75; margin-right:4px}
  .hudAV .led{width:8px; height:8px; border-radius:50%; display:inline-block; margin-left:6px; vertical-align:middle}
  .hudAV .led.mic-off{background:#c7ccd8}
  .hudAV .led.mic-ptt{background:#2d7ff9}
  .hudAV .led.mic-on{background:#22c55e}
  .hudAV .led.cam-on{background:#22c55e}
  .hudAV .led.cam-off{background:#c7ccd8}

  /* --------- Modo DENTRO DEL PANEL "Turno" --------- */
  .hudAV.hud--side{
    position:static;            /* entra al flujo del panel */
    transform:none;
    margin:8px 0 6px 0;         /* pegado al botón “Cambiar turno” */
  }
  .hudAV.hud--side .hud-card{
    width:100%;
    box-shadow:0 2px 10px rgba(0,0,0,.05);
  }
  .hudAV.hud--side .row.row-av{ justify-content:flex-start; }
  .hudAV.hud--side .row.row-theme{ justify-content:flex-start; }
  .hudAV.hud--side select{ min-width:140px; }

  /* Móvil: si queda flotante, lo pego dentro de la vista */
  @media (max-width: 680px){
    .hudAV:not(.hud--side){left:12px; right:12px; bottom:10px; transform:none}
  }
  `;

  function ensureStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function getVariant(){
    try { return localStorage.getItem(LS_VARIANT) || DEFAULT_VARIANT; }
    catch { return DEFAULT_VARIANT; }
  }
  function loadPrefs(variant){
    const k = LS_SESSION_PREFIX + variant;
    try {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      audioFx: true,
      micMode: "off",   // off | ptt | on
      cameraOn: false,  // false | true
      appearance: "room", // "room" | "my"
      themeId: "classic",
    };
  }
  function savePrefs(variant, prefs){
    try { localStorage.setItem(LS_SESSION_PREFIX + variant, JSON.stringify(prefs)); } catch {}
    document.dispatchEvent(new CustomEvent("session:prefs-changed", { detail:{ variant, prefs }}));
  }

  function el(tag, attrs={}, ...kids){
    const n = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)){
      if (k === "class") n.className = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (v !== undefined) n.setAttribute(k, String(v));
    }
    for (const k of kids) n.append(k);
    return n;
  }

  /** Panel "Turno" */
  function findTurnPanel(){
    // 1) IDs/clases típicas si existen
    const direct = document.querySelector("#turn, .turn-panel, .editor-sidebar, aside.sidebar");
    if (direct) return direct;
    // 2) Busca “Turno” con botón dentro
    const blk = Array.from(document.querySelectorAll("section,div"))
      .find(el => /turno/i.test(el.textContent || "") && el.querySelector("button"));
    return blk || null;
  }

  /** Botón “Cambiar turno” dentro del panel */
  function findChangeTurnButton(panel){
    if (!panel) return null;
    return Array.from(panel.querySelectorAll("button, .btn"))
      .find(b => /cambiar\s*turno/i.test(b.textContent || ""));
  }

  function renderHUDInSidebar(side, hud){
    hud.classList.add("hud--side");
    const anchor = findChangeTurnButton(side);
    if (anchor) {
      anchor.insertAdjacentElement("afterend", hud);  // ← justo debajo del botón
    } else {
      side.insertBefore(hud, side.firstChild);        // fallback: arriba del panel
    }
  }

  function renderHUDFloating(boardEl, hud){
    // asegurar posicionamiento del tablero
    const cs = getComputedStyle(boardEl);
    if (cs.position === "static") boardEl.style.position = "relative";
    // reserva espacio para no tapar el marco
    boardEl.style.paddingBottom = "56px";
    boardEl.append(hud);
  }

  function buildHUD(variant, prefs){
    const hud = el("div", { class:"hudAV" });
    const card = el("div", { class:"hud-card" });

    // ---- Fila 1: A/V ----
    const rowAV  = el("div", { class:"row row-av" });
    const tagAV  = el("span", { class:"tag" }, "A/V");

    const audioBtn = el("button", { "aria-pressed": String(!!prefs.audioFx) }, "Audio");
    const audioLed = el("span", { class:"led " + (prefs.audioFx ? "mic-on" : "mic-off") });
    audioBtn.append(audioLed);
    audioBtn.onclick = () => {
      prefs.audioFx = !prefs.audioFx;
      audioBtn.setAttribute("aria-pressed", String(prefs.audioFx));
      audioLed.className = "led " + (prefs.audioFx ? "mic-on" : "mic-off");
      savePrefs(variant, prefs);
    };

    const micBtn = el("button", {}, "Mic");
    const micLed = el("span", { class:"led " + (prefs.micMode === "on" ? "mic-on" : (prefs.micMode === "ptt" ? "mic-ptt" : "mic-off")) });
    micBtn.append(micLed);
    micBtn.onclick = () => {
      prefs.micMode = prefs.micMode === "off" ? "ptt" : prefs.micMode === "ptt" ? "on" : "off";
      micLed.className = "led " + (prefs.micMode === "on" ? "mic-on" : (prefs.micMode === "ptt" ? "mic-ptt" : "mic-off"));
      savePrefs(variant, prefs);
    };

    const camBtn = el("button", { "aria-pressed": String(!!prefs.cameraOn) }, "Cam");
    const camLed = el("span", { class:"led " + (prefs.cameraOn ? "cam-on" : "cam-off") });
    camBtn.append(camLed);
    camBtn.onclick = () => {
      prefs.cameraOn = !prefs.cameraOn;
      camBtn.setAttribute("aria-pressed", String(prefs.cameraOn));
      camLed.className = "led " + (prefs.cameraOn ? "cam-on" : "cam-off");
      savePrefs(variant, prefs);
    };

    rowAV.append(tagAV, audioBtn, micBtn, camBtn);

    // ---- Fila 2: Tema ----
    const rowTheme = el("div", { class:"row row-theme" });

    const appBtn = el("button", { "aria-pressed": String(prefs.appearance === "my") },
      prefs.appearance === "my" ? "Mi tema" : "Tema sala"
    );
    appBtn.onclick = () => {
      prefs.appearance = prefs.appearance === "my" ? "room" : "my";
      appBtn.textContent = prefs.appearance === "my" ? "Mi tema" : "Tema sala";
      appBtn.setAttribute("aria-pressed", String(prefs.appearance === "my"));
      themeSel.disabled = prefs.appearance !== "my";
      savePrefs(variant, prefs);
    };

    const themeSel = el("select", {});
    for (const opt of THEME_OPTIONS){
      themeSel.append(el("option", { value: opt.id }, opt.label));
    }
    themeSel.value = prefs.themeId;
    themeSel.onchange = () => {
      prefs.themeId = themeSel.value;
      savePrefs(variant, prefs);
    };
    themeSel.disabled = prefs.appearance !== "my";

    document.addEventListener("session:prefs-changed", (ev)=>{
      if (ev.detail?.variant !== getVariant()) return;
      if (typeof ev.detail.prefs?.appearance === "string"){
        themeSel.disabled = ev.detail.prefs.appearance !== "my";
      }
    });

    rowTheme.append(appBtn, themeSel);

    // ---- Componer ----
    card.append(rowAV, rowTheme);
    hud.append(card);
    return hud;
  }

  function renderHUD(){
    ensureStyles();

    const side = findTurnPanel();
    const boardEl = document.querySelector("#board");
    if (!side && !boardEl) return;

    // Limpia HUDs previos
    document.querySelectorAll(".hudAV").forEach(n => n.remove());

    const variant = getVariant();
    const prefs = loadPrefs(variant);
    const hud = buildHUD(variant, prefs);

    if (side) {
      hud.classList.add("hud--side");
      renderHUDInSidebar(side, hud); // ← justo debajo del botón “Cambiar turno”
    } else {
      renderHUDFloating(boardEl, hud);
    }

    // Atajos de teclado globales
    window.addEventListener("keydown", (e)=>{
      if (e.repeat) return;
      if (e.key.toLowerCase() === "m") { const b = hud.querySelector("button:nth-of-type(2)"); b?.click(); }
      if (e.key.toLowerCase() === "v") { const b = hud.querySelector("button:nth-of-type(3)"); b?.click(); }
    });

    // expone utilidades
    window.boardHUD = { variant, get prefs(){ return loadPrefs(getVariant()); }, refresh: renderHUD };
  }

  function tryMount(){
    const ok = !!findTurnPanel() || !!document.querySelector("#board");
    if (ok) renderHUD();
  }

  document.addEventListener("damas:variant-changed", tryMount);

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", tryMount);
  } else {
    setTimeout(tryMount, 0);
  }

  window.installBoardHUD = function(){ tryMount(); };
})();
