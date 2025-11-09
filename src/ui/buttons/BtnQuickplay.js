export default function BtnQuickplay({ onClick, disabled=false, label="Jugar Rápido" } = {
  onClick: null, disabled: false, label: "Jugar Rápido"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
