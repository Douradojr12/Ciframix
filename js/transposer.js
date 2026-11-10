(function(){
const CM=window.CM,C=CM.chords;
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const mod12=n=>((Math.round(n)%12)+12)%12;
/* Acordes entre colchetes no meio da letra: "[Am]Hoje eu [G]canto". */
function inline(line,s,sp){
 let out='',last=0,m;const marks=[],re=/\[([^\]\s]+)\]/g;
 while((m=re.exec(line))){
  const c=C.parseChord(m[1]);if(!c)continue;
  out+=line.slice(last,m.index+1);
  const t=s===0?m[1]:C.formatChord(c,s,sp);
  marks.push([out.length,out.length+t.length]);out+=t;last=m.index+1+m[1].length;
 }
 return{text:out+line.slice(last),chord:false,marks};
}
/* Tom (informado ou detectado) -> objeto de tom depois de subir/descer `semi` semitons. */
CM.keyInfo=(keyStr,semi,pref)=>{const k=C.parseKey(keyStr);return k?C.keyObj(mod12(k.root+semi),k.minor,pref):null};
/* Sempre parte do texto ORIGINAL: o deslocamento é só um número, nunca se acumula erro.
   Os nomes das notas seguem o campo harmônico do tom de destino.
   Retorna, por linha: {text, chord, marks:[[ini,fim]...]} (marks = posições dos acordes, para destacar). */
CM.transposeLines=function(body,semi,pref,keyStr){
 const raw=String(body).replace(/\r\n?/g,'\n').split('\n');
 const parsed=raw.map(C.analyze);
 const s=mod12(semi);
 let sp=null;
 if(s!==0){
  let k=C.parseKey(keyStr);
  if(!k){const all=[];parsed.forEach(p=>p.isChord&&p.toks.forEach(t=>t.chord&&all.push(t.chord)));k=C.detectKey(all)}
  sp=k?C.speller(C.keyObj((k.root+s)%12,k.minor,pref)):(x=>(pref==='flat'?C.FLAT:C.SHARP)[((x%12)+12)%12]);
 }
 return raw.map((orig,i)=>{
  const p=parsed[i];
  if(!p.isChord)return inline(orig,s,sp);
  let out='';const marks=[];
  for(const t of p.toks){
   const txt=!t.chord||s===0?t.text:t.pre+C.formatChord(t.chord,s,sp)+t.post;
   while(out.length<t.start)out+=' ';                                   /* mantém a coluna original */
   if(s!==0&&out&&out.length>=t.start&&!/\s$/.test(out))out+=' ';        /* separa se o acorde anterior cresceu */
   const st=out.length;out+=txt;
   if(t.chord)marks.push([st+t.pre.length,st+txt.length-t.post.length]);
  }
  return{text:s===0?p.line:out,chord:true,marks};
 });
};
CM.transposeBody=(b,s,p,k)=>CM.transposeLines(b,s,p,k).map(l=>l.text).join('\n');
CM.transposeKey=(keyStr,semi,pref)=>{const k=CM.keyInfo(keyStr,semi,pref);return k?k.name:keyStr};
CM.songKey=function(song){
 const k=C.parseKey(song.key);
 if(k)return{name:song.key.trim().replace(/♯/g,'#').replace(/♭/g,'b'),source:'informado'};
 const all=[];String(song.body||'').split(/\r?\n/).forEach(l=>{const p=C.analyze(l);if(p.isChord)p.toks.forEach(t=>t.chord&&all.push(t.chord))});
 const d=C.detectKey(all);
 return d?{name:C.keyObj(d.root,d.minor,'auto').name,source:'detectado'}:null;
};
/* Campo harmônico do tom (já transposto) para exibir ao usuário. */
CM.harmonicField=(keyStr,semi,pref)=>{const k=CM.keyInfo(keyStr,semi,pref);return k?{name:k.tonic+(k.minor?' menor':' maior'),items:C.harmonicField(k)}:null};
/* HTML da cifra com cada acorde destacado (o destaque não muda a largura, então o alinhamento se mantém). */
CM.renderChart=(body,semi,pref,key)=>CM.transposeLines(body,semi,pref,key).map(l=>{
 let h='',p=0;
 (l.marks||[]).forEach(([a,b])=>{h+=esc(l.text.slice(p,a))+'<span class="ch">'+esc(l.text.slice(a,b))+'</span>';p=b});
 return h+esc(l.text.slice(p));
}).join('\n');
})();
