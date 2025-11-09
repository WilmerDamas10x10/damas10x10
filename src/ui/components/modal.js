// =========================
// src/ui/ui.modal.js
// Modal mínimo reutilizable
// export { openModal, closeModal }
// =========================

let overlay = null;
let modal = null;

function ensureHost() {
  if (overlay && modal) return;

  overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', (e) => {
    // Cierra si se hace click fuera del modal
    if (e.target === overlay) closeModal();
  });

  modal = document.createElement('div');
  modal.className = 'modal';
  overlay.appendChild(modal);

  document.body.appendChild(overlay);
}

export function openModal({ title = '', content = '', footer = null, onClose = null } = {}) {
  ensureHost();
  modal.innerHTML = `
    <div class="modal__header">
      <span class="modal__title">${title || ''}</span>
      <button class="modal__close" aria-label="Cerrar">✕</button>
    </div>
    <div class="modal__body"></div>
    <div class="modal__footer"></div>
  `;

  const btnClose = modal.querySelector('.modal__close');
  const body = modal.querySelector('.modal__body');
  const foot = modal.querySelector('.modal__footer');

  btnClose.addEventListener('click', () => closeModal(onClose));

  // Contenido
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof Node) {
    body.innerHTML = '';
    body.appendChild(content);
  }

  // Footer (botones)
  if (footer == null) {
    foot.innerHTML = `<button class="btn" data-close="1">Cerrar</button>`;
    foot.querySelector('[data-close]')?.addEventListener('click', () => closeModal(onClose));
  } else if (typeof footer === 'string') {
    foot.innerHTML = footer;
    foot.querySelectorAll('[data-close]').forEach(btn =>
      btn.addEventListener('click', () => closeModal(onClose))
    );
  } else if (footer instanceof Node) {
    foot.innerHTML = '';
    foot.appendChild(footer);
    foot.querySelectorAll('[data-close]').forEach(btn =>
      btn.addEventListener('click', () => closeModal(onClose))
    );
  }

  // Abrir
  overlay.classList.add('is-open');
  // pequeña animación
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

export function closeModal(onClose) {
  if (!overlay || !modal) return;
  modal.classList.remove('is-open');
  overlay.classList.remove('is-open');
  if (typeof onClose === 'function') {
    try { onClose(); } catch {}
  }
}
