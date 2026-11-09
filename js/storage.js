(function(){
const CM=window.CM=window.CM||{};
const K='ciframix:v1';
let db=load();
function load(){try{const d=JSON.parse(localStorage.getItem(K));if(d&&Array.isArray(d.songs)&&Array.isArray(d.setlists))return d}catch(e){}return{songs:[],setlists:[],prefs:{}}}
function save(){try{localStorage.setItem(K,JSON.stringify(db));return true}catch(e){CM.toast&&CM.toast('Não foi possível salvar: armazenamento do navegador indisponível ou cheio.');return false}}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const list=id=>db.setlists.find(l=>l.id===id);
CM.store={
 uid,
 songs:()=>db.songs,
 setlists:()=>db.setlists,
 song:id=>db.songs.find(s=>s.id===id),
 setlist:list,
 pref(k,v){db.prefs=db.prefs||{};if(v===undefined)return db.prefs[k];db.prefs[k]=v;save()},
 addSong(s){const song={id:uid(),title:s.title.trim(),artist:(s.artist||'').trim(),key:(s.key||'').trim(),body:s.body||'',created:Date.now()};db.songs.push(song);save();return song},
 updateSong(id,p){const s=db.songs.find(x=>x.id===id);if(!s||!String(p.title||"").trim())return;s.title=p.title.trim();s.artist=(p.artist||"").trim();s.key=(p.key||"").trim();s.body=p.body||"";save();return s},
 deleteSong(id){db.songs=db.songs.filter(s=>s.id!==id);db.setlists.forEach(l=>{l.items=l.items.filter(i=>i.songId!==id)});save()},
 addSetlist(name){const l={id:uid(),name:name.trim()||'Novo pot-pourri',items:[],created:Date.now(),updated:Date.now()};db.setlists.push(l);save();return l},
 renameSetlist(id,name){const l=list(id);if(l&&name.trim()){l.name=name.trim();l.updated=Date.now();save()}},
 duplicateSetlist(id){const l=list(id);if(!l)return;const c=JSON.parse(JSON.stringify(l));c.id=uid();c.name=l.name+' (cópia)';c.created=c.updated=Date.now();db.setlists.push(c);save();return c},
 deleteSetlist(id){db.setlists=db.setlists.filter(l=>l.id!==id);save()},
 addToSetlist(id,songId){const l=list(id);if(!l)return;l.items.push({songId,transpose:0,note:''});l.updated=Date.now();save()},
 moveItem(id,from,to){const l=list(id);if(!l||from===to||from<0||to<0||from>=l.items.length||to>=l.items.length)return;const [it]=l.items.splice(from,1);l.items.splice(to,0,it);l.updated=Date.now();save()},
 duplicateItem(id,idx){const l=list(id);if(!l||!l.items[idx])return;l.items.splice(idx+1,0,JSON.parse(JSON.stringify(l.items[idx])));l.updated=Date.now();save()},
 updateItem(id,idx,p){const l=list(id);if(!l||!l.items[idx])return;Object.assign(l.items[idx],p);l.updated=Date.now();save()},
 removeFromSetlist(id,idx){const l=list(id);if(!l)return;l.items.splice(idx,1);l.updated=Date.now();save()},
 exportJSON(){return JSON.stringify({app:'ciframix',version:1,exported:new Date().toISOString(),songs:db.songs,setlists:db.setlists},null,2)},
 importJSON(text){
  let d;try{d=JSON.parse(text)}catch(e){throw new Error('O arquivo não é um JSON válido.')}
  if(!d||d.app!=='ciframix'||!Array.isArray(d.songs)||!Array.isArray(d.setlists))throw new Error('Este arquivo não é um backup do CifraMix.');
  let ns=0,nl=0;
  d.songs.forEach(s=>{if(s&&s.id&&s.title&&!CM.store.song(s.id)){db.songs.push(s);ns++}});
  d.setlists.forEach(l=>{if(l&&l.name&&Array.isArray(l.items)){if(list(l.id))l.id=uid();db.setlists.push(l);nl++}});
  save();return{songs:ns,setlists:nl};
 }
};
})();
