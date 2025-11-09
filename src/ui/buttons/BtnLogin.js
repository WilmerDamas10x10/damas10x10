export default function BtnLogin({ onClick, disabled=false, label="Iniciar sesión" } = {
  onClick: null, disabled: false, label: "Iniciar sesión"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
