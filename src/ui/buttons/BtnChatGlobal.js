export default function BtnChatGlobal({ onClick, disabled=false, label="Chat Global" } = {
  onClick: null, disabled: false, label: "Chat Global"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
