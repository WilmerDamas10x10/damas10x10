export default function BtnAdminCloseRooms({ onClick, disabled=false, label="Admin · Cerrar salas" } = {
  onClick: null, disabled: false, label: "Admin · Cerrar salas"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
