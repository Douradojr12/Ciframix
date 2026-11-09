(function(){
const CM=window.CM,S=CM.store,{esc,$}=CM.ui;
const title=r=>r.s?r.s.title:'Música removida';
function render(m,id,stageStart){
 const l=S.setlist(id);
 if(!l||!l.items.length){m.innerHTML=`<div class="empty"><b>${l?'Este pot-pourri está vazio':'Pot-pourri não encontrado'}</b>${l?`<a class="btn sm pri" href="#/list/${l.id}">Adicionar músicas</a>`:`<a class="btn sm" href="#/library">Voltar à biblioteca</a>`}</div>`;return}
 const pref=S.pref('notation')||'auto',B=document.body;
 let fs=S.pref('fontsize')||18,stage=!!stageStart;
 B.classList.add('play');B.classList.toggle('stage',stage);
 const rows=l.items.map(it=>{const s=S.song(it.songId),k=s&&CM.songKey(s);return{it,s,k,cur:k?CM.transposeKey(k.name,it.transpose,pref):''}});
 m.innerHTML=`<div class="pnow" id="pnow"></div>
 <article class="pot" id="pot" style="--fs:${fs}px"><h1 class="ptitle">${esc(l.name)}</h1>
 ${rows.map((r,i)=>`<section class="song" data-i="${i}"><header><span class="num">${i+1}</span><div><h2>${esc(title(r))}</h2><div class="m">${esc(r.s?r.s.artist:'')}</div></div>${r.cur?`<span class="tompill">Tom ${esc(r.cur)}${r.it.transpose&&r.k?' · orig. '+esc(r.k.name):''}</span>`:''}</header>${r.it.note?`<div class="onote">${esc(r.it.note)}</div>`:''}<pre class="chart">${r.s&&r.s.body.trim()?CM.renderChart(r.s.body,r.it.transpose,pref,r.k&&r.k.name):'Sem cifra cadastrada.'}</pre></section>`).join('')}
 <div class="endmark">Fim do pot-pourri</div></article>
 <div class="pbar" id="pbar"><div class="prow main"><button class="btn big" data-c="prev" aria-label="Música anterior">‹</button><button class="btn big pri" data-c="toggle" id="tg">▶ Iniciar</button><button class="btn big" data-c="next" aria-label="Próxima música">›</button></div>
 <div class="prow"><button class="btn" data-c="restart">↺ Reiniciar</button>
 <span class="grp"><button class="btn" data-c="slow" aria-label="Diminuir velocidade">−</button><span class="sv" id="spd"></span><button class="btn" data-c="fast" aria-label="Aumentar velocidade">+</button></span>
 <span class="grp"><button class="btn" data-c="fsm" aria-label="Diminuir fonte">A−</button><button class="btn" data-c="fbig" aria-label="Aumentar fonte">A+</button></span>
 <button class="btn" data-c="stage" id="stg"></button><button class="btn" data-c="full" id="fl">Tela cheia</button><a class="btn" id="ex" href="#/list/${l.id}">Editar</a></div></div>`;
 const secs=[...m.querySelectorAll('.song')],pot=$('#pot',m);
 const tops=()=>secs.map(s=>s.getBoundingClientRect().top+window.scrollY);
 const maxY=()=>document.documentElement.scrollHeight-window.innerHeight;
 function curIdx(){if(window.scrollY>=maxY()-2)return rows.length-1;const y=window.scrollY+window.innerHeight*.3;let c=0;tops().forEach((v,i)=>{if(v<=y)c=i});return c}
 function paint(){const i=curIdx(),r=rows[i],n=rows[i+1];$('#pnow',m).innerHTML=`<span><b>${i+1}. ${esc(title(r))}</b>${r.cur?' · Tom '+esc(r.cur):''}</span><span class="nxt">${n?'Próxima: '+esc(title(n)):'Última música'}</span>`}
 const AS=CM.autoscroll({level:S.pref('speed')||3,onState:st=>{
  $('#tg',m).textContent=st.running?'❚❚ Pausar':st.atEnd?'▶ Recomeçar':st.started?'▶ Continuar':'▶ Iniciar';
  $('#spd',m).textContent='Vel. '+st.level+'/10';S.pref('speed',st.level);
 }});
 let ticking=false;
 const onScroll=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;paint()})};
 addEventListener('scroll',onScroll,{passive:true});
 function goto(i){i=Math.max(0,Math.min(rows.length-1,i));AS.jump(tops()[i]-(stage?64:56))}
 const next=()=>goto(curIdx()+1);
 const prev=()=>{const c=curIdx();goto(window.scrollY-tops()[c]>140?c:c-1)};
 function keepPos(fn){const c=curIdx(),t=tops()[c],h=secs[c].offsetHeight,f=h?(window.scrollY-t)/h:0;fn();AS.jump(tops()[c]+f*secs[c].offsetHeight,true);paint()}
 function labels(){$('#stg',m).textContent=stage?'Sair do palco':'Modo palco'}
 function toggleStage(){keepPos(()=>{stage=!stage;B.classList.toggle('stage',stage)});labels();if(!stage&&document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
 function setFs(v){fs=Math.max(12,Math.min(40,v));S.pref('fontsize',fs);keepPos(()=>pot.style.setProperty('--fs',fs+'px'))}
 $('#fl',m).hidden=!document.fullscreenEnabled;
 $('#pbar',m).onclick=e=>{
  const b=e.target.closest('[data-c]');if(!b)return;b.blur();
  const c=b.dataset.c;
  if(c==='toggle')AS.toggle();else if(c==='next')next();else if(c==='prev')prev();else if(c==='restart')AS.restart();
  else if(c==='slow')AS.setLevel(AS.level-1);else if(c==='fast')AS.setLevel(AS.level+1);
  else if(c==='fsm')setFs(fs-2);else if(c==='fbig')setFs(fs+2);else if(c==='stage')toggleStage();
  else if(c==='full'){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>CM.toast('Tela cheia indisponível neste navegador'))}
 };
 const key=e=>{
  if(e.target.closest&&e.target.closest('input,textarea,select'))return;
  if($('#dlg').open)return;
  const k=e.key;
  if(k===' '||k==='Spacebar'){e.preventDefault();AS.toggle()}
  else if(k==='ArrowUp'){e.preventDefault();AS.setLevel(AS.level+1)}
  else if(k==='ArrowDown'){e.preventDefault();AS.setLevel(AS.level-1)}
  else if(k==='ArrowRight'){e.preventDefault();next()}
  else if(k==='ArrowLeft'){e.preventDefault();prev()}
  else if(k==='Escape'&&stage)toggleStage();
 };
 document.addEventListener('keydown',key);
 CM.nav.onLeave(()=>{AS.stop();document.removeEventListener('keydown',key);removeEventListener('scroll',onScroll);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})});
 labels();paint();AS.emit();
}
CM.nav.route('play',(m,id)=>render(m,id,false));
CM.nav.route('stage',(m,id)=>render(m,id,true));
})();
