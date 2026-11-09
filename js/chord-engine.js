(function(){
const CM=window.CM=window.CM||{};
const SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const BASE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const pc=n=>{let v=BASE[n[0]];if(n[1]==='#')v++;else if(n[1]==='b')v--;return(v+12)%12};
/* sufixo: m, 7, 7M, maj7, dim, °, aug, +, sus4, add9, (b5), 7/9 ... (preservado sem alteração) */
const SUF='(?:maj|min|dim|aug|sus|add|alt|omit|no|m|M|°|º|ø|\\+|-|#|b|\\d+|\\/\\d+|\\(|\\)|,|\\.)*';
const RE=new RegExp('^([A-G][#b]?)('+SUF+')(?:\\/([A-G][#b]?))?$');
const NEUTRAL=/^(\|+|[-–—.\/]+|\(?\d+x\)?|\(?x\d+\)?|\(?bis\)?|[A-ZÀ-Ú][\wÀ-ú]*:|\[[^\]]*\])$/;
const parseChord=t=>{const m=RE.exec(t);return m?{root:m[1],suf:m[2],bass:m[3]||null}:null};
const quality=c=>{const s=c.suf;if(/^(dim|°|º|ø)/.test(s))return'dim';if(/^(m(?!aj)|min|-)/.test(s))return'min';return'maj'};
const formatChord=(c,s,flat)=>{const n=flat?FLAT:SHARP;return n[(pc(c.root)+s)%12]+c.suf+(c.bass?'/'+n[(pc(c.bass)+s)%12]:'')};
/* Linha de acordes = ao menos 1 acorde e nenhum outro texto além de separadores, rótulos ("Intro:") e repetições (x2). */
function analyze(line){
 const toks=[],re=/\S+/g;let m;
 while((m=re.exec(line))){
  const text=m[0];let chord=parseChord(text),pre='',post='';
  if(!chord){const p=/^([(\[|]*)(.*?)([)\]|,.;]*)$/.exec(text);const c=p[2]&&parseChord(p[2]);if(c){chord=c;pre=p[1];post=p[3]}}
  toks.push({start:m.index,text,chord,pre,post,neutral:!chord&&NEUTRAL.test(text)});
 }
 return{toks,isChord:toks.some(t=>t.chord)&&toks.every(t=>t.chord||t.neutral)};
}
const useFlatForKey=(r,minor)=>minor?[0,2,3,5,7,10].includes(r):[1,3,5,8,10].includes(r);
const keyName=(r,minor)=>(useFlatForKey(r,minor)?FLAT:SHARP)[r]+(minor?'m':'');
function parseKey(str){
 const c=parseChord(String(str||'').trim());
 if(!c||c.bass||!['','m','min'].includes(c.suf))return null;
 return{root:pc(c.root),minor:c.suf!==''};
}
/* Estima a tonalidade pelos acordes diatônicos + peso do primeiro e do último acorde. */
function detectKey(chords){
 if(!chords.length)return null;
 let best=null;
 for(let r=0;r<12;r++)for(const minor of[false,true]){
  const deg=minor?{0:'min',5:'min',7:'min',2:'dim',3:'maj',8:'maj',10:'maj'}:{0:'maj',5:'maj',7:'maj',2:'min',4:'min',9:'min',11:'dim'};
  const tq=minor?'min':'maj';let sc=0;
  chords.forEach((c,i)=>{
   const d=(pc(c.root)-r+12)%12,q=quality(c);
   if(deg[d]===q||(minor&&d===7&&q==='maj'))sc+=1;else sc-=.5;
   if(i===0&&d===0&&q===tq)sc+=1;
  });
  const l=chords[chords.length-1];
  if(pc(l.root)===r&&quality(l)===tq)sc+=2;
  if(!best||sc>best.sc)best={root:r,minor,sc};
 }
 return best;
}
CM.chords={SHARP,FLAT,pc,parseChord,quality,formatChord,analyze,useFlatForKey,keyName,parseKey,detectKey};
})();
