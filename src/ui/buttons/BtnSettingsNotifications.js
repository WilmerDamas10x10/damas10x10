export default function BtnSettingsNotifications({ onClick, disabled=false, label="Notificaciones" } = {
  onClick: null, disabled: false, label: "Notificaciones"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
