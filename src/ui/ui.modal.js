let current = null;
let lastFocused = null;

function trapFocus(root){
  const focusables = root.querySelectorAll(
    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return () => {};
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  function onKey(e){
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first){
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last){
      e.preventDefault(); first.focus();
    }
  }
  root.addEventListener('keydown', onKey);
  return () => root.removeEventListener('keydown', onKey);
}

export function openModal({ title = "Detalle", content = "", onConfirm = null, confirmText = "Ejecutar acción", cancelText = "Cerrar" } = {}){
  if (current) closeModal();
  lastFocused = document.activeElement;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__hdr">
        <div class="modal__title" id="modal-title"></div>
        <button class="modal__close" aria-label="Cerrar">✕</button>
      </div>
      <div class="modal__body"></div>
      <div class="modal__ftr">
        <button class="modal__btn">${cancelText}</button>
        <button class="modal__btn modal__btn--primary">${confirmText}</button>
      </div>
    </div>
  `;

  const modal    = backdrop.querySelector('.modal');
  const body     = backdrop.querySelector('.modal__body');
  const titleEl  = backdrop.querySelector('#modal-title');
  const btnClose = backdrop.querySelector('.modal__close');
  const btns     = backdrop.querySelectorAll('.modal__btn');
  const btnCancel= btns[0];
  const btnOk    = btns[1];

  titleEl.textContent = title;
  if (typeof content === 'string') body.innerHTML = content;
  else if (content instanceof Node) body.appendChild(content);

  function doClose(){
    backdrop.classList.remove('is-open');
    setTimeout(() => {
      backdrop.remove();
      if (lastFocused?.focus) try{ lastFocused.focus(); }catch{}
      if (cleanupTrap) cleanupTrap();
      current = null;
    }, 160);
  }

  btnClose.addEventListener('click', doClose);
  btnCancel.addEventListener('click', doClose);
  btnOk.addEventListener('click', () => { try{ onConfirm && onConfirm(); } finally{ doClose(); } });
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) doClose(); });
  document.addEventListener('keydown', function esc(e){
    if (e.key === 'Escape') { doClose(); document.removeEventListener('keydown', esc); }
  });

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('is-open'));

  const cleanupTrap = trapFocus(modal);
  modal.focus?.();
  current = backdrop;
  return doClose;
}

export function closeModal(){
  if (!current) return;
  const node = current;
  current = null;
  node.classList.remove('is-open');
  setTimeout(() => node.remove(), 160);
}
