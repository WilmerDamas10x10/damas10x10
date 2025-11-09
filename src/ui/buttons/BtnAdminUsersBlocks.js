export default function BtnAdminUsersBlocks({ onClick, disabled=false, label="Admin · Usuarios & Bloqueos" } = {
  onClick: null, disabled: false, label: "Admin · Usuarios & Bloqueos"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
