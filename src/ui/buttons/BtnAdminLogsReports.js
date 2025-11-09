export default function BtnAdminLogsReports({ onClick, disabled=false, label="Admin · Logs & Reportes" } = {
  onClick: null, disabled: false, label: "Admin · Logs & Reportes"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
