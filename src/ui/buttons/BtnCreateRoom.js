export default function BtnCreateRoom({ onClick, disabled=false, label="Crear Sala Privada" } = {
  onClick: null, disabled: false, label: "Crear Sala Privada"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
