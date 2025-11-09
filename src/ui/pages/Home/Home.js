// src/ui/pages/Home/Home.js
import { navigate } from "../../../router.js"; // ruta correcta desde /ui/pages/Home/

export default function Home(container) {
  const host = container || document.getElementById("app");

  host.innerHTML = `
    <main class="main">
      <!-- Estilos: 2 columnas en desktop/tablet; 1 columna sólo en móviles -->
      <style id="home-cards-patch">
        /* ====== GRID: 2 columnas por defecto ====== */
        .home-grid{
          display: grid !important;
          grid-template-columns: repeat(2, minmax(300px, 1fr)) !important; /* 2 columnas */
          gap: 16px 20px !important;
          width: 100% !important;
          max-width: 1200px !important;
          margin: 18px auto 36px !important;
          padding: 0 8px !important;
          box-sizing: border-box !important;
        }

        /* Cada card NO ocupa toda la fila */
        .home-card{ grid-column: auto !important; }

        /* Cabecera clicable del grupo */
        .home-card__head{
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 46px;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,.12);
          background: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(0,0,0,.03);
          user-select: none;
        }

        /* Chevron animado */
        .home-card__chev{ transition: transform .15s ease; opacity:.8; font-weight:700; }
        .home-card.is-collapsed .home-card__chev { transform: rotate(0deg); }
        .home-card:not(.is-collapsed) .home-card__chev { transform: rotate(90deg); }

        /* Cuerpo colapsable */
        .home-card__body{ margin: 12px 4px 6px; }
        .home-card.is-collapsed .home-card__body{ display: none; }
        .home-card:not(.is-collapsed) .home-card__body{ display: block; }

        /* Subgrid de botones dentro del grupo */
        .home-subgrid{
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px 14px;
        }

        /* ====== RESPONSIVE ====== */
        /* 1 columna sólo en móviles (<700px) */
        @media (max-width: 700px){
          .home-grid{
            grid-template-columns: 1fr !important;
            max-width: 680px !important;
          }
        }

        @media (max-width: 560px){
          .home-subgrid{
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px 12px;
          }
        }

        /* (Opcional) ocultar la nota de WAN */
        .foot-note{ display:none; }
      </style>

      <h1>Pantalla principal</h1>
      <p>Todos los botones tienen su propio archivo .js (vanilla ESM).</p>

      <section class="home-grid">

        <!-- Jugar -->
        <section class="home-card is-collapsed">
          <button class="home-card__head" type="button">
            <span class="home-card__title">Jugar</span>
            <span class="home-card__chev">▸</span>
          </button>
          <div class="home-card__body">
            <div class="home-subgrid">
              <button class="btn" data-route="#/quick">Jugar Rápido</button>
              <button class="btn" data-route="#/ai">Jugar vs IA</button>
              <button class="btn" data-route="#/resume">Continuar Partida</button>
              <button class="btn" data-route="#/private/create">Crear Sala Privada</button>
              <button class="btn" data-route="#/join">Unirse por Código</button>
              <button class="btn" data-route="#/room/chat">Chat de Sala</button>
            </div>
          </div>
        </section>

        <!-- Clasificadas (ELO) -->
        <section class="home-card is-collapsed">
          <button class="home-card__head" type="button">
            <span class="home-card__title">Clasificadas (ELO)</span>
            <span class="home-card__chev">▸</span>
          </button>
          <div class="home-card__body">
            <div class="home-subgrid">
              <button class="btn" data-route="#/elo/play">Partida Calificada (ELO)</button>
              <button class="btn" data-route="#/elo/find">Buscar Partida (ELO)</button>
            </div>
          </div>
        </section>

        <!-- Entrenamiento -->
        <section class="home-card is-collapsed">
          <button class="home-card__head" type="button">
            <span class="home-card__title">Entrenamiento</span>
            <span class="home-card__chev">▸</span>
          </button>
          <div class="home-card__body">
            <div class="home-subgrid">
              <!-- Sin data-route: lo abrimos directo por JS -->
              <button class="btn" id="btn-open-editor" type="button">Entrenamiento / Editor</button>
              <button class="btn" data-route="#/lessons">Lecciones</button>
              <button class="btn" data-route="#/replays">Repeticiones</button>
              <button class="btn" data-route="#/puzzles">Puzzles Diarios</button>
            </div>
          </div>
        </section>

        <!-- Torneos -->
        <section class="home-card is-collapsed">
          <button class="home-card__head" type="button">
            <span class="home-card__title">Torneos</span>
            <span class="home-card__chev">▸</span>
          </button>
          <div class="home-card__body">
            <div class="home-subgrid">
              <button class="btn" data-route="#/arena">Torneo Arena</button>
            </div>
          </div>
        </section>

        <!-- Social -->
        <section class="home-card is-collapsed">
          <button class="home-card__head" type="button">
            <span class="home-card__title">Social</span>
            <span class="home-card__chev">▸</span>
          </button>
          <div class="home-card__body">
            <div class="home-subgrid">
              <button class="btn" data-route="#/friends">Amigos</button>
              <button class="btn" data-route="#/blocks">Bloqueos</button>
              <button class="btn" data-route="#/global-chat">Chat Global</button>
            </div>
          </div>
        </section>

        <!-- Ajustes & Perfil -->
        <section class="home-card is-collapsed">
          <button class="home-card__head" type="button">
            <span class="home-card__title">Ajustes & Perfil</span>
            <span class="home-card__chev">▸</span>
          </button>
          <div class="home-card__body">
            <div class="home-subgrid">
              <button class="btn" data-route="#/login">Iniciar sesión</button>
              <button class="btn" data-route="#/signup">Registrarse</button>
              <button class="btn" data-route="#/profile">Perfil</button>
              <button class="btn" data-route="#/lang">Idioma</button>
              <button class="btn" data-route="#/notifs">Notificaciones</button>
              <button class="btn" data-route="#/audio">Audio & Sonidos</button>
              <button class="btn" data-route="#/camera">Cámara & Micro</button>
              <button class="btn" data-route="#/board">Tablero & Piezas</button>
              <button class="btn" data-route="#/a11y">Accesibilidad</button>
            </div>
          </div>
        </section>

        <!-- Admin -->
        <section class="home-card is-collapsed">
          <button class="home-card__head" type="button">
            <span class="home-card__title">Admin</span>
            <span class="home-card__chev">▸</span>
          </button>
          <div class="home-card__body">
            <div class="home-subgrid">
              <button class="btn" data-route="#/admin/recover">Recuperar contraseñas</button>
              <button class="btn" data-route="#/admin/users">Usuarios & Bloqueos</button>
              <button class="btn" data-route="#/admin/close">Cerrar salas</button>
              <button class="btn" data-route="#/admin/logs">Logs & Reportes</button>
            </div>
          </div>
        </section>

      </section>

      <p class="foot-note">
        WAN activo en todos los modos salvo Entrenamiento (solo al compartir).
      </p>
    </main>
  `;

  // Toggle abrir/cerrar
  host.querySelectorAll(".home-card__head").forEach((head) => {
    head.addEventListener("click", () => {
      head.closest(".home-card")?.classList.toggle("is-collapsed");
    });
  });

  // Abrir el editor directo, sin router
  const btnEditor = host.querySelector("#btn-open-editor");
  if (btnEditor) {
    const openEditor = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      try {
        const { default: TrainingEditor } = await import("../Training/editor/Editor.js");
        host.innerHTML = "";
        TrainingEditor(host);
      } catch (err) {
        console.error("[Home] Error cargando TrainingEditor:", err);
      }
    };
    btnEditor.addEventListener("click", openEditor, { capture: true });
  }

  // Navegación hash/router para el resto
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-route]");
    if (!b) return;
    e.preventDefault();
    const route = b.getAttribute("data-route") || "";
    if (route.startsWith("#")) {
      location.hash = route;
    } else if (typeof navigate === "function") {
      navigate(route);
    } else {
      location.hash = "#" + route.replace(/^\//, "");
    }
  });
}
