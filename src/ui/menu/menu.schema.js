// src/ui/menu/menu.schema.js
// Esquema del Menú Principal: todo se dibuja desde aquí.

export const VARIANTS = [
  { id: "ecuatorianas", label: "Damas ecuatorianas", official: true },
  { id: "clasica",       label: "Damas clásicas" },
  { id: "internacional", label: "Damas internacionales" },
];

export const DEFAULT_VARIANT_ID = "ecuatorianas";

/**
 * Props comunes posibles:
 * - action: string
 * - children: Nodo[]
 * - variantScoped: boolean
 * - usesSavedVariant: boolean
 * - requiresLogin: boolean
 * - role: "admin" | ...
 * - soon: boolean
 * - enabledWhen: string
 */
export const MENU = [
  {
    id: "jugar",
    label: "Jugar",
    children: [
      // Selector de variantes + preferencias de sesión (se renderizan por type)
      { id: "variant",       type: "variantPicker", remember: true },
      { id: "sessionPrefs",  type: "sessionPrefs" }, // ← aquí va "Mi tema para esta variante"

      // Hubs dentro de Jugar
      {
        id: "modos",
        label: "Modos rápidos",
        children: [
          { id: "quick",      label: "Jugar rápido",        action: "start.quick",      variantScoped: true },
          { id: "vsIA",       label: "Jugar vs IA",         action: "start.ai",         variantScoped: true },
          { id: "continue",   label: "Continuar partida",   action: "resume",           usesSavedVariant: true },
          { id: "roomCreate", label: "Crear sala privada",  action: "rooms.create",     variantScoped: true },
          { id: "roomJoin",   label: "Unirse por código",   action: "rooms.join" },
          { id: "roomChat",   label: "Chat de salas",       action: "rooms.chat" },
        ],
      },
      {
        id: "elo",
        label: "Clasificadas (ELO)",
        children: [
          { id: "rated",   label: "Partida calificada (ELO)", action: "elo.rated",  requiresLogin: true, variantScoped: true },
          { id: "search",  label: "Buscar partida (ELO)",     action: "elo.search", requiresLogin: true, variantScoped: true },
          { id: "top",     label: "Mi rating / Top",          action: "elo.top",    requiresLogin: true, soon: true },
        ],
      },
      {
        id: "training",
        label: "Entrenamiento",
        children: [
          { id: "editor",   label: "Entrenamiento / Editor", action: "editor.open" },
          { id: "lessons",  label: "Lecciones",               action: "lessons.list",  soon: true },
          { id: "replays",  label: "Repeticiones",            action: "replays.list" },
          { id: "puzzles",  label: "Puzzles diarios",         action: "puzzles.daily", soon: true },
        ],
      },
      {
        id: "tournaments",
        label: "Torneos",
        children: [
          { id: "arena",  label: "Torneo Arena",     action: "tournaments.arena", variantScoped: true },
          { id: "swiss",  label: "Suizo / Privado",  action: "tournaments.swiss", variantScoped: true, soon: true },
        ],
      },
    ],
  },

  {
    id: "social",
    label: "Social",
    children: [
      { id: "friends",    label: "Amigos",       action: "social.friends" },
      { id: "blocks",     label: "Bloqueos",     action: "social.blocks" },
      { id: "globalChat", label: "Chat Global",  action: "social.chat" },
    ],
  },

  {
    id: "settings",
    label: "Ajustes & Perfil",
    children: [
      {
        id: "account",
        label: "Cuenta",
        children: [
          { id: "login",   label: "Iniciar sesión",        action: "auth.login" },
          { id: "signup",  label: "Registrarse",           action: "auth.signup" },
          { id: "profile", label: "Perfil",                action: "profile.open", requiresLogin: true },
          { id: "recover", label: "Recuperar contraseña",  action: "auth.recover" },
        ],
      },
      {
        id: "prefs",
        label: "Preferencias",
        children: [
          { id: "lang",   label: "Idioma",          action: "prefs.lang" },
          { id: "notif",  label: "Notificaciones",  action: "prefs.notifications" },
          { id: "a11y",   label: "Accesibilidad",   action: "prefs.a11y" },
        ],
      },
      // En principal quedan solo "defaults" y pruebas (sin switches permanentes)
      {
        id: "av",
        label: "Dispositivos (prueba)",
        children: [
          { id: "testAV", label: "Probar mic/cámara", action: "prefs.testAV" },
        ],
      },
      {
        id: "appearance",
        label: "Tema base (fallback)",
        children: [
          { id: "baseTheme", label: "Tema base (si la variante no tiene uno propio)", action: "prefs.baseTheme" },
        ],
      },
    ],
  },

  {
    id: "admin",
    label: "Admin",
    role: "admin",
    children: [
      { id: "users",      label: "Usuarios & Bloqueos",                 action: "admin.users" },
      { id: "closeRooms", label: "Cerrar salas",                        action: "admin.closeRooms" },
      { id: "logs",       label: "Logs & Reportes",                     action: "admin.logs" },
      { id: "resetPw",    label: "Restablecer contraseñas (soporte)",   action: "admin.resetPw" },
    ],
  },
];

export default MENU;
