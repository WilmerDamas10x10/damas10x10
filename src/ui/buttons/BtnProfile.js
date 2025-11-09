export default function BtnProfile({ onClick, disabled=false, label="Perfil" } = {
  onClick: null, disabled: false, label: "Perfil"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
