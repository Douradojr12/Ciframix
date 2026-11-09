(function(){
const CM=window.CM,C=CM.chords;
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
/* Sempre parte do texto ORIGINAL: o deslocamento é um número, nunca se acumula erro. */
CM.transposeLines=function(body,semi,pref,keyStr){
 const lines=String(body).replace(/\r\n?/g,'\n').split('\n');
 const parsed=lines.map(C.analyze);
 const s=((Math.round(semi)%12)+12)%12;
 if(s===0)return lines.map((t,i)=>({text:t,chord:parsed[i].isChord}));
 let k=C.parseKey(keyStr);
 if(!k){const all=[];parsed.forEach(p=>p.isChord&&p.toks.forEach(t=>t.chord&&all.push(t.chord)));k=C.detectKey(all)}
 const flat=pref==='flat'?true:pref==='sharp'?false:k?C.useFlatForKey((k.root+s)%12,k.minor):false;
 return lines.map((line,i)=>{
  const p=parsed[i];if(!p.isChord)return{text:line,chord:false};
  let out='';
  for(const t of p.toks){
   const txt=t.chord?t.pre+C.formatChord(t.chord,s,flat)+t.post:t.text;
   while(out.length<t.start)out+=' ';                  /* mantém a coluna original */
   if(out&&out.length>=t.start&&!/\s$/.test(out))out+=" ";   /* garante separação se o acorde anterior cresceu */
   out+=txt;
  }
  return{text:out,chord:true};
 });
};
CM.transposeBody=(b,s,p,k)=>CM.transposeLines(b,s,p,k).map(l=>l.text).join('\n');
CM.transposeKey=function(keyStr,semi,pref){
 const k=C.parseKey(keyStr);if(!k)return keyStr;
 const r=(((k.root+Math.round(semi))%12)+12)%12;
 const flat=pref==='flat'||(pref!=='sharp'&&C.useFlatForKey(r,k.minor));
 return(flat?C.FLAT:C.SHARP)[r]+(k.minor?'m':'');
};
CM.songKey=function(song){
 const k=C.parseKey(song.key);
 if(k)return{name:song.key.trim(),source:'informado'};
 const all=[];String(song.body||'').split(/\r?\n/).forEach(l=>{const p=C.analyze(l);if(p.isChord)p.toks.forEach(t=>t.chord&&all.push(t.chord))});
 const d=C.detectKey(all);
 return d?{name:C.keyName(d.root,d.minor),source:'detectado'}:null;
};
CM.renderChart=(body,semi,pref,key)=>CM.transposeLines(body,semi,pref,key).map(l=>l.chord?'<span class="c">'+esc(l.text)+'</span>':esc(l.text)).join('\n');
})();
