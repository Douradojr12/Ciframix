(function(){
const CM=window.CM=window.CM||{};
const SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const BASE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const pc=n=>{let v=BASE[n[0]];if(n[1]==='#')v++;else if(n[1]==='b')v--;return(v+12)%12};
/* sufixo: m, 7, 7M, maj7, dim, °, aug, +, sus4, add9, (b5), 7/9 ... (preservado sem alteração) */
const SUF='(?:maj|min|dim|aug|sus|add|alt|omit|no|m|M|°|º|ø|∅|Δ|\\+|-|#|b|\\*|\\^|\\d+|\\/\\d+|\\(|\\)|,|\\.)*';
const RE=new RegExp('^([A-G][#b]?)('+SUF+')(?:\\/([A-G][#b]?))?$');
const NEUTRAL=/^(\|+|[-–—.\/]+|\(?\d+x\)?|\(?x\d+\)?|\(?bis\)?|[A-ZÀ-Ú][\wÀ-ú]*:|\[[^\]]*\])$/;
const parseChord=t=>{const m=RE.exec(String(t).replace(/♯/g,'#').replace(/♭/g,'b'));return m?{root:m[1],suf:m[2],bass:m[3]||null}:null};
const quality=c=>{const s=c.suf;if(/^(dim|°|º|ø)/.test(s))return'dim';if(/^(m(?!aj)|min|-)/.test(s))return'min';return'maj'};
const formatChord=(c,s,sp)=>sp((pc(c.root)+s)%12)+c.suf+(c.bass?'/'+sp((pc(c.bass)+s)%12):'');
/* Normaliza para análise: remove caracteres invisíveis, troca espaço rígido por comum, ♯/♭ por #/b e expande tabs (4 colunas, como no CSS). */
function clean(line){
 let t=String(line).replace(/[\u200b-\u200d\u2060\ufeff]/g,'').replace(/\u00a0/g,' ').replace(/♯/g,'#').replace(/♭/g,'b');
 if(t.indexOf('\t')<0)return t;
 let o='';for(const ch of t){if(ch==='\t')o+=' '.repeat(4-(o.length%4));else o+=ch}return o;
}
/* anotações comuns ao lado dos acordes: (Riff), Solo, Intro, Parte 2: ... (só valem com 2+ acordes na linha) */
const WORD=/^\(?(intro|solo|riff|interl[uú]dio|repete|repetir|outro|final|fim|bis|parte|coro|base|ponte|refr[aã]o|verso|\d+[ªa]?)\)?:?$/i;
const ANNOT=/^\(.*$|^.*\)$/;
/* Linha de acordes = ao menos 1 acorde e o resto só separadores/rótulos/repetições; com 2+ acordes aceita também anotações. */
function analyze(raw){
 const line=clean(raw),toks=[],re=/\S+/g;let m;
 while((m=re.exec(line))){
  const text=m[0];let chord=parseChord(text),pre='',post='';
  if(!chord){const p=/^([(\[|]*)(.*?)([)\]|,.;]*)$/.exec(text);const c=p[2]&&parseChord(p[2]);if(c){chord=c;pre=p[1];post=p[3]}}
  const neutral=!chord&&NEUTRAL.test(text);
  toks.push({start:m.index,text,chord,pre,post,neutral,soft:!chord&&!neutral&&(WORD.test(text)||ANNOT.test(text))});
 }
 const n=toks.filter(t=>t.chord).length;
 const strict=toks.every(t=>t.chord||t.neutral),soft=n>=2&&toks.every(t=>t.chord||t.neutral||t.soft);
 return{line,toks,isChord:n>0&&(strict||soft)};
}
/* Trechos que parecem estar numa linha de acordes mas não foram reconhecidos (para avisar o usuário). */
function diagnose(body){
 const bad=new Set();
 String(body).split(/\r?\n/).forEach(l=>{
  const a=analyze(l);if(a.isChord)return;
  const n=a.toks.filter(t=>t.chord).length,o=a.toks.filter(t=>!t.chord&&!t.neutral);
  if(n>=2&&o.length<=n)o.forEach(t=>bad.add(t.text));
 });
 return[...bad].slice(0,10);
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
   if(d===0&&q===tq)sc+=.25;else if(d===7&&q==='maj')sc+=.15;   /* tônica e dominante recorrentes */
  });
  const l=chords[chords.length-1];
  if(pc(l.root)===r&&quality(l)===tq)sc+=2;
  if(!best||sc>best.sc)best={root:r,minor,sc};
 }
 return best;
}
/* ---------- Campo harmônico e grafia correta das notas ----------
   Cada nota é escrita pela escala do tom: em Db maior é Db Eb F Gb Ab Bb C (nunca C# e Db misturados).
   Notas fora do campo recebem o nome pelo grau: 7ª menor de Db = Cb, escrita B; 7ª menor de F# = E. */
const LET=['C','D','E','F','G','A','B'],LPC=[0,2,4,5,7,9,11];
const STEPS={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10]};
const TONICS={
 auto:{maj:['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'],min:['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B']},
 sharp:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
 flat:['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']};
const AWKWARD={'E#':'F','B#':'C','Fb':'E','Cb':'B'};   /* grafias teóricas pouco usadas em cifras */
const accs=d=>d>0?'#'.repeat(d):'b'.repeat(-d);
function spellOn(li,p){let d=(((p-LPC[li])%12)+12)%12;if(d>6)d-=12;return Math.abs(d)>1?null:LET[li]+accs(d)}
function scaleOf(tonic,minor){
 const li=LET.indexOf(tonic[0]),tp=pc(tonic),out=[];
 for(let i=0;i<7;i++){const n=spellOn((li+i)%7,(tp+STEPS[minor?'min':'maj'][i])%12);if(!n)return null;out.push(n)}
 return out;
}
/* tom de destino: nome convencional (ou sustenidos/bemóis, se pedido, quando a escala não exigir notas dobradas) */
function keyObj(root,minor,pref){
 const auto=TONICS.auto[minor?'min':'maj'][root];
 let t=pref==='sharp'?TONICS.sharp[root]:pref==='flat'?TONICS.flat[root]:auto;
 if(!scaleOf(t,minor))t=auto;
 return{root,minor:!!minor,tonic:t,name:t+(minor?'m':''),scale:scaleOf(t,minor)};
}
function speller(k){
 const st=STEPS[k.minor?'min':'maj'],map={};
 k.scale.forEach((n,i)=>{map[(k.root+st[i])%12]=n});
 const li=LET.indexOf(k.tonic[0]);
 const DEG=k.minor?{1:1,4:2,6:3,9:5,11:6}:{1:1,3:2,6:3,8:5,10:6};   /* grau (letra) das notas fora do campo */
 const flatKey=k.scale.some(n=>n.includes('b'));
 return p=>{
  p=((p%12)+12)%12;
  let n=map[p];
  if(!n)n=spellOn((li+DEG[(p-k.root+12)%12])%7,p)||(flatKey?FLAT:SHARP)[p];
  return AWKWARD[n]||n;
 };
}
function harmonicField(k){
 const sp=speller(k),st=STEPS[k.minor?'min':'maj'];
 const deg=k.minor?['i','ii°','III','iv','v','VI','VII']:['I','ii','iii','IV','V','vi','vii°'];
 const tri=k.minor?['m','dim','','m','m','','']:['','m','m','','','m','dim'];
 const sev=k.minor?['m7','m7(b5)','7M','m7','m7','7M','7']:['7M','m7','m7','7M','7','m7','m7(b5)'];
 return st.map((x,i)=>{const n=sp(k.root+x);return{deg:deg[i],triad:n+tri[i],seventh:n+sev[i],alt:k.minor&&i===4?n:null}});
}
CM.chords={SHARP,FLAT,pc,keyObj,speller,scaleOf,harmonicField,parseChord,quality,formatChord,analyze,clean,diagnose,useFlatForKey,keyName,parseKey,detectKey};
CM.diagnose=diagnose;
})();