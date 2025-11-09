export default function BtnBlocks({ onClick, disabled=false, label="Bloqueos" } = {
  onClick: null, disabled: false, label: "Bloqueos"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
