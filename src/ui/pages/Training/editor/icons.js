// src/ui/pages/Training/editor/icons.js
export function applyButtonIcons(root){
  const mapIdToUrl = {
    '#btn-borrar' : '/imagenes/ui/icono_borrador.webp',
    '#btn-undo'   : '/imagenes/ui/deshacer.webp',
    '#btn-redo'   : '/imagenes/ui/edicion_rehacer.webp',
    '#btn-vaciar' : '/imagenes/ui/icono_vaciar_tablero.webp',
    '#btn-menu'   : '/imagenes/ui/icono_volver_menu.svg',
    '#share'      : '/imagenes/ui/icono_compartir.svg',

    '#btn-inicial': '/imagenes/ui/icono_posicioninicial_tablero.webp',
    '#btn-add-w'  : '/imagenes/piezas/peon-blanco.webp',
    '#btn-add-b'  : '/imagenes/piezas/peon-negro.webp',
    '#btn-add-W'  : '/imagenes/piezas/dama-blanca.webp',
    '#btn-add-B'  : '/imagenes/piezas/dama-negra.webp',
  };

  for (const [sel, url] of Object.entries(mapIdToUrl)) {
    const btn = root.querySelector(sel);
    if (!btn) continue;

    btn.classList.add('btn-icon');

    let ico = btn.querySelector('.ico');
    if (!ico) {
      ico = document.createElement('span');
      ico.className = 'ico';
      ico.setAttribute('aria-hidden','true');
      btn.prepend(ico);
    }

    Object.assign(ico.style, {
      backgroundImage: `url("${url}")`,
      display:'inline-block',
      width:'20px',
      height:'20px',
      flex:'0 0 20px',
      backgroundRepeat:'no-repeat',
      backgroundPosition:'center',
      backgroundSize:'contain',
    });
  }
}

