// ================================
// src/ui/router/pages.js
// Mapa de rutas -> componentes
// ================================
import Home from "../pages/Home/index.js";
import TrainingEditor from "../pages/Training/editor/Editor.js";

// Agrega aquí otras páginas que ya tengas…

export const PAGES = {
  "/": Home,
  "/home": Home,
  "/training/editor": TrainingEditor,
  // …tus demás rutas
};
