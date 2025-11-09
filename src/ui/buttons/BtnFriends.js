export default function BtnFriends({ onClick, disabled=false, label="Amigos" } = {
  onClick: null, disabled: false, label: "Amigos"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
