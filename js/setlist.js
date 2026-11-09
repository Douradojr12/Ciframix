(function(){
const CM=window.CM,S=CM.store,{esc,$,plural}=CM.ui;
const wrap=n=>n>6?n-12:n<-6?n+12:n;
const fmt=n=>(n>0?'+':n<0?'−':'')+Math.abs(n);
CM.nav.route('list',(m,id)=>{
 const l=S.setlist(id);
 if(!l){m.innerHTML=`<div class="empty"><b>Pot-pourri não encontrado</b><a class="btn sm" href="#/library">Voltar à biblioteca</a></div>`;return}
 m.innerHTML=`<div class="row"><input class="title-in" id="ln" value="${esc(l.name)}" maxlength="80" aria-label="Nome do pot-pourri"><span class="m" id="sv">Salvo automaticamente</span></div>
 <div class="row" style="margin-top:14px"><a class="btn pri" href="#/play/${l.id}">Tocar pot-pourri</a><a class="btn" href="#/stage/${l.id}">Modo palco</a><a class="btn" href="#/library">Biblioteca</a></div>
 <h2 id="cnt"></h2><div id="items"></div>
 <h2>Adicionar músicas</h2><input class="search" id="aq" type="search" placeholder="Nome da música ou artista" aria-label="Buscar para adicionar">
 <div class="row"><button class="btn" id="ns">Cadastrar música</button></div><div id="eres" style="margin-top:12px"></div>`;
 const box=$('#items',m),sv=$('#sv',m);let from=null,st,aq='',tm;
 const pref=()=>S.pref('notation')||'auto';
 const saved=()=>{sv.textContent='Salvo';clearTimeout(st);st=setTimeout(()=>{sv.textContent='Salvo automaticamente'},1500)};
 function draw(flash){
  $('#cnt',m).textContent=plural(l.items.length,'música','músicas')+' na sequência';
  box.innerHTML=l.items.length?l.items.map((it,i)=>{
   const s=S.song(it.songId),k=s&&CM.songKey(s);
   const tone=!s?'música removida da biblioteca':k?`Tom ${esc(k.name)} → <b>${esc(CM.transposeKey(k.name,it.transpose,pref()))}</b>`:'Tom não identificado';
   return`<div class="sitem${i===flash?' new':''}" data-i="${i}"><span class="grip" draggable="true" title="Arraste para reordenar" aria-hidden="true">⠿</span>
   <div class="sinfo"><div class="t">${i+1}. ${esc(s?s.title:'Música removida')}</div><div class="m">${esc(s?s.artist:'')}${s&&s.artist?' · ':''}${tone}</div>
   <textarea class="note" rows="1" placeholder="Observações (ex.: começar no refrão)" aria-label="Observações">${esc(it.note||'')}</textarea></div>
   <div class="sact row"><button class="btn sm" data-a="t-" aria-label="Descer um semitom">−</button><span class="tv" title="Semitons">${fmt(it.transpose)}</span><button class="btn sm" data-a="t+" aria-label="Subir um semitom">+</button><button class="btn sm" data-a="t0">Original</button>
   <button class="btn sm" data-a="up" aria-label="Mover para cima">▲</button><button class="btn sm" data-a="dn" aria-label="Mover para baixo">▼</button><button class="btn sm" data-a="dup">Duplicar</button><button class="btn sm dng" data-a="rm">Remover</button></div></div>`;
  }).join(''):`<div class="empty"><b>Sequência vazia</b>Busque abaixo e adicione as músicas do pot-pourri.</div>`;
 }
 box.onclick=e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const i=+b.closest('.sitem').dataset.i,a=b.dataset.a,it=l.items[i];
  if(a==='t-'||a==='t+'){S.updateItem(id,i,{transpose:wrap(it.transpose+(a==='t+'?1:-1))});draw();saved()}
  else if(a==='t0'){S.updateItem(id,i,{transpose:0});draw();saved()}
  else if(a==='up'&&i>0){S.moveItem(id,i,i-1);draw();saved()}
  else if(a==='dn'&&i<l.items.length-1){S.moveItem(id,i,i+1);draw();saved()}
  else if(a==='dup'){S.duplicateItem(id,i);draw(i+1);saved()}
  else if(a==='rm'){const el=b.closest('.sitem');el.classList.add('out');setTimeout(()=>{S.removeFromSetlist(id,i);draw();saved()},200)}
 };
 box.oninput=e=>{const t=e.target;if(!t.classList.contains('note'))return;S.updateItem(id,+t.closest('.sitem').dataset.i,{note:t.value});saved()};
 box.ondragstart=e=>{const r=e.target.closest('.sitem');if(!r)return;from=+r.dataset.i;r.classList.add('drag');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(from));if(e.dataTransfer.setDragImage)e.dataTransfer.setDragImage(r,12,12)};
 box.ondragover=e=>{if(from===null)return;e.preventDefault();box.querySelectorAll('.over').forEach(x=>x.classList.remove('over'));const r=e.target.closest('.sitem');if(r)r.classList.add('over')};
 box.ondrop=e=>{e.preventDefault();const r=e.target.closest('.sitem');if(from===null||!r)return;const to=+r.dataset.i;if(to!==from){S.moveItem(id,from,to);saved()}from=null;draw()};
 box.ondragend=()=>{from=null;draw()};
 $('#ln',m).oninput=e=>{S.renameSetlist(id,e.target.value);saved()};
 async function runAdd(){
  const r=await CM.search(aq),out=$('#eres',m);if(!out)return;
  out.innerHTML=r.length?r.slice(0,40).map(x=>`<div class="item"><div><div class="t">${esc(x.title)}</div><div class="m">${esc(x.artist||'Artista não informado')}${x.key?' · tom '+esc(x.key):''}</div></div><button class="btn sm pri" data-add="${x.ref}">Adicionar</button></div>`).join(''):`<div class="empty"><b>${aq?'Nada encontrado':'Biblioteca vazia'}</b>${aq?'Tente outro termo ou cadastre a música.':'Cadastre uma música para começar.'}</div>`;
 }
 $('#aq',m).oninput=e=>{aq=e.target.value;clearTimeout(tm);tm=setTimeout(runAdd,200)};
 $('#eres',m).onclick=e=>{const b=e.target.closest('[data-add]');if(!b)return;S.addToSetlist(id,b.dataset.add);draw(l.items.length-1);saved();CM.toast('Música adicionada')};
 $('#ns',m).onclick=()=>CM.ui.songForm(runAdd);
 draw();runAdd();
});
})();
