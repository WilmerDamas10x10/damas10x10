export default function BtnRegister({ onClick, disabled=false, label="Registrarse" } = {
  onClick: null, disabled: false, label: "Registrarse"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
