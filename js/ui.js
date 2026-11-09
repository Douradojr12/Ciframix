(function(){
const CM=window.CM;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(s,r=document)=>r.querySelector(s);
const date=t=>new Date(t).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
const plural=(n,a,b)=>n+' '+(n===1?a:b);
let tt;
CM.toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2600)};

/* ---------- diálogo ---------- */
function dialog(title,body,onOk,okLabel){
 const d=$('#dlg');
 d.innerHTML=`<form method="dialog"><h3>${esc(title)}</h3>${body}<div class="acts"><button type="button" class="btn" data-x>Cancelar</button>${okLabel?`<button class="btn pri">${esc(okLabel)}</button>`:''}</div></form>`;
 $('[data-x]',d).onclick=()=>d.close();
 $('form',d).onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);if(onOk(Object.fromEntries(f))!==false)d.close()};
 d.showModal();const first=$('input,select,textarea',d);if(first)first.focus();
}
const askName=(title,val,ok)=>dialog(title,`<label for="n">Nome</label><input id="n" name="name" value="${esc(val)}" required maxlength="80">`,ok,'Salvar');
const confirmBox=(title,msg,ok)=>dialog(title,`<p>${esc(msg)}</p>`,()=>ok(),'Excluir');

CM.ui={esc,$,date,plural,dialog,askName,confirmBox};
})();
