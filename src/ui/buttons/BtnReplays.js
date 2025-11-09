export default function BtnReplays({ onClick, disabled=false, label="Repeticiones" } = {
  onClick: null, disabled: false, label: "Repeticiones"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
