export default function BtnPlayGuest({ onClick, disabled=false, label="Jugar como Invitado" } = {
  onClick: null, disabled: false, label: "Jugar como Invitado"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
