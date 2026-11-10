/* Campo harmônico e grafia: node tests/harmony.test.js */
const assert=require('assert');global.window=global;require('../js/chord-engine.js');require('../js/transposer.js');
let n=0;const eq=(a,b,m)=>{assert.strictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
const T=(body,s,key,pref='auto')=>CM.transposeBody(body,s,pref,key);
/* 1) Campos harmônicos de referência (teoria) — música em C maior e em Lá menor levada para os 12 tons */
const MAJ={C:'C Dm Em F G Am Bdim',Db:'Db Ebm Fm Gb Ab Bbm Cdim',D:'D Em F#m G A Bm C#dim',Eb:'Eb Fm Gm Ab Bb Cm Ddim',E:'E F#m G#m A B C#m D#dim',F:'F Gm Am Bb C Dm Edim',
 'F#':'F# G#m A#m B C# D#m Fdim',G:'G Am Bm C D Em F#dim',Ab:'Ab Bbm Cm Db Eb Fm Gdim',A:'A Bm C#m D E F#m G#dim',Bb:'Bb Cm Dm Eb F Gm Adim',B:'B C#m D#m E F# G#m A#dim'};
const MIN={A:'Am Bdim C Dm Em F G',Bb:'Bbm Cdim Db Ebm Fm Gb Ab',B:'Bm C#dim D Em F#m G A',C:'Cm Ddim Eb Fm Gm Ab Bb','C#':'C#m D#dim E F#m G#m A B',D:'Dm Edim F Gm Am Bb C',
 Eb:'Ebm Fdim Gb Abm Bbm B Db',E:'Em F#dim G Am Bm C D','F':'Fm Gdim Ab Bbm Cm Db Eb','F#':'F#m G#dim A Bm C#m D E',G:'Gm Adim Bb Cm Dm Eb F','G#':'G#m A#dim B C#m D#m E F#'};
const PCS={C:0,'C#':1,'G#':8,Db:1,D:2,Eb:3,E:4,F:5,'F#':6,G:7,Ab:8,A:9,Bb:10,B:11};
for(const [t,f] of Object.entries(MAJ)){const o=T(MAJ.C,PCS[t],'C');eq(o,f,'campo maior '+t)}
for(const [t,f] of Object.entries(MIN)){const base=(PCS[t]-9+12)%12;eq(T(MIN.A,base,'Am'),f,'campo menor '+t)}
/* 2) Notas fora do campo (empréstimos e dominantes secundários) seguem o grau, em qualquer tom */
const BVII={C:'Bb',Db:'B',D:'C',Eb:'Db',E:'D',F:'Eb','F#':'E',G:'F',Ab:'Gb',A:'G',Bb:'Ab',B:'A'};
for(const [t,c] of Object.entries(BVII))eq(T('C  Bb  F  C',PCS[t],'C').split(/\s+/)[1],c,'bVII em '+t);
const V7ii={Db:'Bb7',D:'B7',Eb:'C7',E:'C#7',F:'D7','F#':'D#7',G:'E7',Ab:'F7',A:'F#7',Bb:'G7',B:'G#7'};   /* A7 = V7 de Dm */
for(const [t,c] of Object.entries(V7ii))eq(T('C  A7  Dm  G7  C',PCS[t],'C').split(/\s+/)[1],c,'V7/ii em '+t);
/* 3) Músicas só com acordes do campo nunca misturam sustenido e bemol; nenhuma grafia estranha (E#, B#, Fb, Cb, ##, bb) em nenhum caso */
const dia=['C  Am  F  G  C  Dm  Em  G','G  D  Em  C  G  Bm  Am  D','Em  C  G  D  Em  Bm  Am  D','D  A/C#  Bm  G  F#m  Em  A7  D','Am  Dm  E7  Am  F  G  C  E7'];
const wild=['C  Am  F  G7  C  Bb  Dm  E7  Am  A7  D7  G','Am  G  F  E7  Am  Dm  F#dim  G#dim  Am','G  D  Em  C  G  Bm  A7  D7  B7  Em  Eb  F','Em  C  G  D  B7  Em  Am  D7  F#m7(b5)  B7'];
const roots=o=>o.split(/[\s/]+/).filter(Boolean).map(x=>x.match(/^[A-G][#b]?/)[0]);
for(const pref of['auto','sharp','flat'])for(let s=1;s<12;s++){
 for(const song of dia){const r=roots(T(song,s,'',pref));ok(!(r.some(x=>x[1]==='#')&&r.some(x=>x[1]==='b')),'mistura em '+T(song,s,'',pref)+' ('+s+','+pref+')')}
 for(const song of dia.concat(wild)){const r=roots(T(song,s,'',pref));ok(!r.some(x=>/^(E#|B#|Fb|Cb)$/.test(x)),'grafia estranha: '+T(song,s,'',pref))}
}
/* 4) Tom exibido e campo harmônico mostrado ao usuário */
eq(CM.transposeKey('G',3),'Bb');eq(CM.transposeKey('G',3,'sharp'),'A#'.replace('A#','Bb'),'A# maior não existe na prática -> Bb');
eq(CM.transposeKey('E',1),'F');eq(CM.transposeKey('Em',1),'Fm');eq(CM.transposeKey('Am',-2),'Gm');eq(CM.transposeKey('C',6),'F#');eq(CM.transposeKey('C',6,'flat'),'Gb');
const hf=CM.harmonicField('G',3);eq(hf.name,'Bb maior');eq(hf.items.map(x=>x.triad).join(' '),'Bb Cm Dm Eb F Gm Adim');eq(hf.items.map(x=>x.seventh).join(' '),'Bb7M Cm7 Dm7 Eb7M F7 Gm7 Am7(b5)'.replace('Am7','Am7'));
const hm=CM.harmonicField('Em',0);eq(hm.name,'E menor');eq(hm.items[4].alt,'B');eq(hm.items.map(x=>x.triad).join(' '),'Em F#dim G Am Bm C D');
/* 5) Detecção de tom por progressões típicas */
const dk=b=>CM.songKey({key:'',body:b}).name;
eq(dk('G  D  Em  C\nG  D  C  G'),'G');eq(dk('D  A  Bm  G\nD  A  G  D'),'D');eq(dk('Am  F  C  G\nAm  F  G  Am'),'Am');eq(dk('Bb  F  Gm  Eb\nBb  F  Eb  Bb'),'Bb');
eq(dk('E  B  C#m  A\nE  B  A  E'),'E');eq(dk('Dm  Gm  A7  Dm'),'Dm');eq(dk('F  C  Dm  Bb\nF  C  Bb  F'),'F');
console.log('OK —',n,'verificações');
