// src/main.js
// 👇 Este import debe ir PRIMERO, antes de montar el router
import "./boot/posParamRedirect.js";

// ⬇️ Carga global del tema/estilos (oscuro, botones .btn, acordeones, etc.)
import "./ui/design.css";

// (opcional pero útil): asegura el alcance visual en toda la app
try { document.body.classList.add("design-scope"); } catch {}

import {
  initRouter,
  registerRoute,
  appElement,
  registerTrainingRoute,
  registerAIRoute,       // /ai (Jugar contra la IA)
  registerSoploRoute,    // /soplo (Soplo 1v1 local)
  registerOnlineRoute,   // 🆕 /online (Jugar Online)
} from "@router";
import Home from "./ui/pages/Home/index.js";

// Montadores
const mountHome = () => {
  const el = appElement();
  if (el) Home(el);
};

// Rutas básicas
registerRoute("/",     mountHome);
registerRoute("/home", mountHome);

// Rutas perezosas (lazy)
registerTrainingRoute(); // /training (Editor)
registerAIRoute();       // /ai
registerSoploRoute();    // /soplo
registerOnlineRoute();   // 🆕 /online

// Iniciar router
initRouter(document.getElementById("app"));
