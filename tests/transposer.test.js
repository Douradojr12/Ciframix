/* Execute com: node tests/transposer.test.js */
const assert=require('assert');global.window=global;
require('../js/chord-engine.js');require('../js/transposer.js');
const C=CM.chords;let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};const eq=(a,b,m)=>{assert.strictEqual(a,b,m);n++};
for(const t of['C','Am7','F#m7(b5)','Bb/D','G7M','Dsus4','Cadd9','E°','Caug','C+','Cm/Eb','D7(b9)','Cmaj7','G5','E7/9','Dm7/A','Abdim','C#m'])ok(C.parseChord(t),'deveria ser acorde: '+t);
for(const t of['Amor','Bem','Dom','a','Cada','Hello','Sol','Dim','Add','Aug','Fé'])ok(!C.parseChord(t),'não é acorde: '+t);
eq(CM.transposeKey('A',-2),'G');eq(CM.transposeKey('F#m',2),'G#m');eq(CM.transposeKey('G',1,'flat'),'Ab');eq(CM.transposeKey('Bb',2),'C');eq(CM.transposeKey('E',1),'F');eq(CM.transposeKey('C',1),'Db');eq(CM.transposeKey('C',1,'sharp'),'C#');eq(CM.transposeKey('C',1,'flat'),'Db');
const song=`Intro: G D Em C
G       D/F#     Em7
Hoje eu canto pra você
C   G/B  Am7  D7(b9)  (2x)
Letra de teste, E eu vou
E eu
[Refrão]
Am   Dm   E7
Amor, Bem e Dom`;
const L=song.split('\n'),lyr=[2,4,5,6,8];
for(let s=-11;s<=11;s++){
 const o=CM.transposeBody(song,s,'auto').split('\n');
 eq(o.length,L.length);
 lyr.forEach(i=>eq(o[i],L[i],'letra alterada na linha '+i+' semitom '+s));
 eq(CM.transposeBody(song,s,'auto'),CM.transposeBody(song,s,'auto'),'pureza');
}
eq(CM.transposeBody(song,0,'flat'),song,'semitom 0 deve devolver o original');
eq(CM.transposeBody(song,12,'flat'),song,'oitava = original');
const t2=CM.transposeBody(song,2,'sharp').split('\n');
eq(t2[1],'A       E/G#     F#m7');eq(t2[3],'D   A/C# Bm7  E7(b9)  (2x)');eq(t2[0],'Intro: A E F#m D');eq(t2[7],'Bm   Em   F#7');
const starts=l=>[...l.matchAll(/\S+/g)].map(m=>m.index);
eq(starts(t2[1]).join(),starts(L[1]).join(),'alinhamento preservado');
const fl=CM.transposeBody(song,-2,'auto').split('\n');eq(fl[1],'F       C/E      Dm7');
const f3=CM.transposeBody('G   C\nlinha',3,'flat').split('\n');eq(f3[0],'Bb  Eb');
const norm=s=>s.replace(/Db/g,'C#').replace(/Eb/g,'D#').replace(/Gb/g,'F#').replace(/Ab/g,'G#').replace(/Bb/g,'A#');
/* ida e volta: acordes idênticos; só os espaços de linhas de acorde com gap de 1 coluna podem diferir (acorde que cresceu empurra o vizinho) */
const sq=t=>t.split('\n').map((l,i)=>lyr.includes(i)?l:l.replace(/ +/g,' ')).join('\n');
for(let s=1;s<12;s++){const back=CM.transposeBody(CM.transposeBody(song,s,'sharp'),12-s,'sharp');eq(sq(norm(back)),sq(norm(song)),'ida e volta s='+s)}
eq(CM.songKey({key:'',body:'G D Em C\nx\nG D C G'}).name,'G');
eq(CM.songKey({key:'',body:'Am Dm E7 Am'}).name,'Am');
eq(CM.songKey({key:'D',body:''}).source,'informado');
ok(!CM.songKey({key:'',body:'só letra'}));
console.log('OK —',n,'verificações');
