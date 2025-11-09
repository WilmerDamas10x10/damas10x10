export default function BtnJoinByCode({ onClick, disabled=false, label="Unirse por Código" } = {
  onClick: null, disabled: false, label: "Unirse por Código"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
