(function(){
const CM=window.CM;
/* Catálogo online de músicas (título, artista, álbum, ano, capa) — SEM cifras.
   Fontes abertas e oficiais: iTunes Search API (Apple, sem chave) e MusicBrainz (sem chave, 1 chamada/s).
   Não existe API pública autorizada de cifras: a cifra é colada pelo usuário. */
CM.catalog={gap:3200,cache:new Map(),last:0,reset(){this.cache.clear();this.last=0}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function throttle(){const w=CM.catalog.last+CM.catalog.gap-Date.now();if(w>0)await sleep(w);CM.catalog.last=Date.now()}
async function getJSON(url){
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);
 try{const r=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}
 finally{clearTimeout(t)}
}
/* plano B só para a API da Apple (que aceita callback), caso o navegador bloqueie o fetch */
function jsonp(url){
 return new Promise((res,rej)=>{
  const cb='cm_cb_'+Math.random().toString(36).slice(2),s=document.createElement('script');
  const done=()=>{delete window[cb];s.remove();clearTimeout(t)};
  const t=setTimeout(()=>{done();rej(new Error('timeout'))},8000);
  window[cb]=d=>{done();res(d)};s.onerror=()=>{done();rej(new Error('jsonp'))};
  s.src=url+'&callback='+cb;document.head.appendChild(s);
 });
}
const key=x=>CM.norm(x.title)+'|'+CM.norm(x.artist);
const dedupe=a=>{const seen=new Set();return a.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true})};
async function itunes(term){
 const url='https://itunes.apple.com/search?'+new URLSearchParams({term,media:'music',entity:'song',country:'BR',limit:'15'});
 let d;try{d=await getJSON(url)}catch(e){d=await jsonp(url)}
 return dedupe((d.results||[]).filter(r=>r.trackName&&r.artistName).map(r=>({ref:'it:'+r.trackId,title:r.trackName,artist:r.artistName,album:r.collectionName||'',year:(r.releaseDate||'').slice(0,4),cover:(r.artworkUrl100||'').replace(/^http:/,'https:'),source:'Catálogo online (Apple)'})));
}
async function musicbrainz(term){
 const words=term.replace(/[+\-&|!(){}\[\]^"~*?:\\\/]/g,' ').split(/\s+/).filter(Boolean).slice(0,5);
 if(!words.length)return[];
 const query=words.map(w=>'(recording:'+w+' OR artist:'+w+')').join(' AND ');
 const d=await getJSON('https://musicbrainz.org/ws/2/recording?'+new URLSearchParams({query,limit:'15',fmt:'json'}));
 return dedupe((d.recordings||[]).filter(r=>r.title).map(r=>({ref:'mb:'+r.id,title:r.title,
  artist:(r['artist-credit']||[]).map(a=>(a.name||'')+(a.joinphrase||'')).join('').trim(),
  album:(r.releases&&r.releases[0]&&r.releases[0].title)||'',year:String(r['first-release-date']||'').slice(0,4),cover:'',source:'Catálogo online (MusicBrainz)'})).filter(x=>x.artist));
}
class CatalogSource extends CM.SourceAdapter{
 get id(){return'catalog'}
 get name(){return'Catálogo online'}
 get remote(){return true}
 async search(q){
  const term=String(q||'').trim();if(term.length<3)return[];
  const k=CM.norm(term),c=CM.catalog.cache;if(c.has(k))return c.get(k);
  await throttle();
  let items=null,fails=0;
  try{items=await itunes(term)}catch(e){fails++}
  if(!items||!items.length){try{const m=await musicbrainz(term);items=(items||[]).concat(m)}catch(e){fails++}}
  if(!items&&fails>=2)throw new Error('offline');
  items=items||[];c.set(k,items);return items;
 }
 async getChart(){return null}   /* sem fonte autorizada de cifras */
}
CM.registerSource(new CatalogSource());
/* Links para o usuário procurar a cifra por conta própria (abrem em nova aba). */
CM.chartLinks=it=>({
 google:'https://www.google.com/search?q='+encodeURIComponent('cifra '+it.title+' '+it.artist),
 youtube:'https://www.youtube.com/results?search_query='+encodeURIComponent(it.title+' '+it.artist)
});
/* Limpa o texto colado de sites: caracteres invisíveis, espaços no fim, excesso de linhas em branco; acha "Tom: X". */
CM.cleanChart=function(text){
 const lines=String(text||'').replace(/\r\n?/g,'\n').replace(/[\u200b-\u200d\u2060\ufeff]/g,'').replace(/\u00a0/g,' ').split('\n').map(l=>l.replace(/\s+$/,''));
 let key='';
 for(const l of lines.slice(0,20)){const m=/^\s*tom\s*:\s*([A-G][#b♯♭]?m?)\s*$/i.exec(l);if(m){key=m[1].replace(/♯/g,'#').replace(/♭/g,'b');key=key[0].toUpperCase()+key.slice(1);break}}
 const out=[];let blank=0;
 for(const l of lines){if(l===''){blank++;if(blank>2)continue}else blank=0;out.push(l)}
 return{body:out.join('\n').replace(/^\n+/,'').replace(/\n+$/,''),key};
};
})();
