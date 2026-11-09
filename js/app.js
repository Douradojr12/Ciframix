(function(){
const CM=window.CM,S=CM.store;
const {esc,$,date,plural,dialog,askName,confirmBox}=CM.ui;

/* ---------- Início ---------- */
CM.nav.route('home',m=>{
 const ls=[...S.setlists()].sort((a,b)=>b.updated-a.updated).slice(0,4);
 m.innerHTML=`<h1>CifraMix</h1><p class="sub">Monte o pot-pourri, ajuste o tom e toque tudo em uma página.</p>
 <div class="row"><button class="btn pri" data-act="new-list">Novo pot-pourri</button><a class="btn" href="#/search">Pesquisar músicas</a></div>
 <h2>Recentes</h2>${ls.length?ls.map(listItem).join(''):`<div class="empty"><b>Nenhum pot-pourri ainda</b>Crie o primeiro e adicione músicas da sua biblioteca.</div>`}
 <h2>Biblioteca</h2><div class="grid">
 <div class="card stat"><b>${S.songs().length}</b><span>${S.songs().length===1?'música cadastrada':'músicas cadastradas'}</span></div>
 <div class="card stat"><b>${S.setlists().length}</b><span>${S.setlists().length===1?'pot-pourri salvo':'pot-pourris salvos'}</span></div></div>`;
});
function listItem(l){return`<div class="item"><div><div class="t">${esc(l.name)}</div><div class="m">${plural(l.items.length,'música','músicas')} · editado em ${date(l.updated)}</div></div><div class="row"><a class="btn sm pri" href="#/play/${l.id}">Tocar</a><a class="btn sm" href="#/list/${l.id}">Abrir</a></div></div>`}

/* ---------- Pesquisar ---------- */
let q='',timer;
CM.nav.route('search',m=>{
 m.innerHTML=`<h1>Pesquisar músicas</h1><p class="sub">Busque por nome ou artista nas fontes conectadas.</p>
 <input class="search" type="search" placeholder="Nome da música ou artista" aria-label="Pesquisar" value="${esc(q)}">
 <div class="row"><button class="btn pri" data-act="new-song">Cadastrar música</button></div>
 <div class="note">Nenhuma fonte online de cifras está conectada: não há API pública autorizada do Cifra Club. A pesquisa cobre as músicas que você cadastrar ou importar.</div>
 <div id="res"></div>`;
 const inp=$('.search',m);
 inp.oninput=()=>{q=inp.value;clearTimeout(timer);timer=setTimeout(run,200)};
 run();
});
async function run(){
 const box=$('#res');if(!box)return;
 box.innerHTML='<div class="spin" role="progressbar" aria-label="Pesquisando"></div>';
 const mine=q;const r=await CM.search(q);
 if(mine!==q||!$('#res'))return;
 $('#res').innerHTML=r.length?r.map(x=>`<div class="item"><div><div class="t">${esc(x.title)}</div><div class="m">${esc(x.artist||'Artista não informado')}${x.key?' · tom '+esc(x.key):''} · ${esc(x.source)}</div></div><div class="row"><a class="btn sm" href="#/song/${x.ref}">Ver cifra</a><button class="btn sm dng" data-act="delsong" data-id="${x.ref}" data-t="${esc(x.title)}">Excluir</button><button class="btn sm pri" data-act="add" data-id="${x.ref}">Adicionar ao repertório</button></div></div>`).join('')
  :`<div class="empty"><b>${q?'Nada encontrado':'Sua biblioteca está vazia'}</b>${q?'Tente outro termo ou cadastre esta música.':'Cadastre uma música com a letra e os acordes.'}</div>`;
}
function songForm(after,song){const v=song||{};
 dialog(song?'Editar música':'Cadastrar música',`<label for="t">Música</label><input id="t" name="title" required maxlength="100" value="${esc(v.title)}">
 <label for="a">Artista</label><input id="a" name="artist" maxlength="100" value="${esc(v.artist)}">
 <label for="k">Tom original (opcional)</label><input id="k" name="key" maxlength="6" placeholder="Ex.: G, Am, F#m" value="${esc(v.key)}">
 <label for="f">Importar arquivo .txt (opcional)</label><input id="f" type="file" accept=".txt,text/plain">
 <label for="b">Letra e cifra (acordes sobre as palavras)</label><textarea id="b" name="body" spellcheck="false">${esc(v.body)}</textarea>`,
 d=>{if(song)S.updateSong(song.id,d);else S.addSong(d);CM.toast('Música salva');run();if(after)after();return true},'Salvar');
 $('#f').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('#b').value=String(r.result);if(!$('#t').value)$('#t').value=f.name.replace(/\.txt$/i,'')};r.readAsText(f)};
}
function addDialog(songId){
 const ls=S.setlists();
 dialog('Adicionar ao repertório',`${ls.length?`<label for="l">Repertório</label><select id="l" name="list">${ls.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>`:''}
 <label for="nn">${ls.length?'Ou crie um novo':'Nome do novo repertório'}</label><input id="nn" name="name" maxlength="80" ${ls.length?'':'required'}>`,
 d=>{const l=d.name&&d.name.trim()?S.addSetlist(d.name):S.setlist(d.list);S.addToSetlist(l.id,songId);CM.toast('Adicionada a "'+l.name+'"');return true},'Adicionar');
}

/* ---------- Biblioteca ---------- */
CM.nav.route('library',m=>{
 const ls=[...S.setlists()].sort((a,b)=>b.updated-a.updated),lb=S.pref('lastBackup');
 m.innerHTML=`<h1>Biblioteca</h1><p class="sub">Seus pot-pourris e backup. Último backup: ${lb?date(lb):'nunca'}.</p>
 <div class="row"><button class="btn pri" data-act="new-list">Novo pot-pourri</button><button class="btn" data-act="export">Exportar JSON</button><button class="btn" data-act="import">Importar JSON</button><input id="imp" type="file" accept=".json,application/json" hidden></div><h2>Pot-pourris</h2>
 ${ls.length?ls.map(l=>`<div class="item"><div><div class="t">${esc(l.name)}</div><div class="m">${plural(l.items.length,'música','músicas')} · editado em ${date(l.updated)}</div></div><div class="row"><a class="btn sm pri" href="#/play/${l.id}">Tocar</a><a class="btn sm" href="#/list/${l.id}">Editar</a><button class="btn sm" data-act="rename" data-id="${l.id}">Renomear</button><button class="btn sm" data-act="dup" data-id="${l.id}">Duplicar</button><button class="btn sm dng" data-act="del" data-id="${l.id}">Excluir</button></div></div>`).join(''):`<div class="empty"><b>Nenhum pot-pourri salvo</b>Crie um novo ou importe um backup.</div>`}`;
 $('#imp',m).onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const n=S.importJSON(String(r.result));CM.toast(`Importado: ${plural(n.setlists,'repertório','repertórios')}, ${plural(n.songs,'música','músicas')}`);CM.nav.render()}catch(err){CM.toast(err.message)}};r.readAsText(f)};
});
/* ---------- Cifra com transposição ---------- */
CM.nav.route('song',(m,id)=>{
 const s=S.song(id);
 if(!s){m.innerHTML=`<div class="empty"><b>Música não encontrada</b><a class="btn sm" href="#/search">Voltar à pesquisa</a></div>`;return}
 const k=CM.songKey(s);let semi=0,pref=S.pref('notation')||'auto';
 m.innerHTML=`<h1>${esc(s.title)}</h1><p class="sub">${esc(s.artist||'Artista não informado')}</p>
 <div class="card row ctl"><button class="btn sm" data-d="-1" aria-label="Descer um semitom">−1</button><button class="btn sm" data-d="1" aria-label="Subir um semitom">+1</button><button class="btn sm" data-d="0">Original</button><button class="btn sm" id="ed">Editar cifra</button>
 <select id="np" aria-label="Notação"><option value="auto">Notação automática</option><option value="sharp">Sustenidos (#)</option><option value="flat">Bemóis (♭)</option></select></div>
 <p class="m" id="st"></p><pre class="chart" id="ch"></pre>`;
 $('#np',m).value=pref;
 $('#ed',m).onclick=()=>CM.ui.songForm(()=>CM.nav.render(),s);
 const draw=()=>{
  $('#ch',m).innerHTML=s.body.trim()?CM.renderChart(s.body,semi,pref,k&&k.name):'Esta música não tem cifra cadastrada.';
  const n=Math.abs(semi),sg=semi>0?'+':semi<0?'−':'';
  $('#st',m).textContent=(k?`Tom original: ${k.name} (${k.source}) · tom atual: ${CM.transposeKey(k.name,semi,pref)}`:'Tom não identificado')+` · ${sg}${n} ${n===1?'semitom':'semitons'}`;
 };
 m.onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;const d=+b.dataset.d;semi=d===0?0:semi+d;if(semi>6)semi-=12;if(semi<-6)semi+=12;draw()};
 $('#np',m).onchange=e=>{pref=e.target.value;S.pref('notation',pref);draw()};
 draw();
});

CM.ui.songForm=songForm;

/* ---------- ações (delegação) ---------- */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const id=b.dataset.id,act=b.dataset.act;
 if(act==='new-list')askName('Novo pot-pourri','',d=>{const l=S.addSetlist(d.name);location.hash='#/list/'+l.id});
 else if(act==='new-song')songForm();
 else if(act==='add')addDialog(id);
 else if(act==='rename')askName('Renomear pot-pourri',S.setlist(id).name,d=>{S.renameSetlist(id,d.name);CM.nav.render()});
 else if(act==='dup'){S.duplicateSetlist(id);CM.toast('Pot-pourri duplicado');CM.nav.render()}
 else if(act==='del')confirmBox('Excluir pot-pourri','Excluir "'+S.setlist(id).name+'"? As músicas continuam na biblioteca.',()=>{S.deleteSetlist(id);CM.nav.render()});
 else if(act==='delsong')confirmBox('Excluir música','Excluir "'+b.dataset.t+'"? Ela também sai dos pot-pourris que a usam.',()=>{S.deleteSong(id);CM.toast('Música excluída');run()});
 else if(act==='rm'){S.removeFromSetlist(id,+b.dataset.i);CM.nav.render()}
 else if(act==='import')$('#imp').click();
 else if(act==='export'){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([S.exportJSON()],{type:'application/json'}));
  a.download='ciframix-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);S.pref('lastBackup',Date.now());CM.toast('Backup exportado');CM.nav.render();
 }
});
CM.nav.start();
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
