export default function BtnAdminPasswords({ onClick, disabled=false, label="Admin · Recuperar contraseñas" } = {
  onClick: null, disabled: false, label: "Admin · Recuperar contraseñas"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
