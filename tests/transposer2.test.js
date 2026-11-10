/* Robustez do reconhecimento: node tests/transposer2.test.js */
const assert=require('assert');global.window=global;require('../js/chord-engine.js');require('../js/transposer.js');
let n=0;const eq=(a,b,m)=>{assert.strictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
const C=CM.chords,T=(l,s=2)=>CM.transposeBody(l,s,'sharp');
/* 70 formatos de acorde usados em cifras brasileiras */
['C#m7(b5)','Em7(b5)/Bb','A7(13)','Bm7(11)','F#7(#9)','G#°','D#dim7','Cm(maj7)','C7+','C9+','Cmaj7(9)','G7(4)','A/B','E7/4(9)','Dsus2','D(9)','C♯m','B♭','CΔ','A7M/C#','Em9','Asus4/7','G13','G#m7M','F#m7(11/9)','B7(4/9)','E7M(9)','Gm7(b5)/Db','Am7/9','C4','C6/9','Bb7M','Dm/F','E°','Cø','C-','C5','Eb9','A#7M','Em7(9)','G/B','Fm6','D9(11)','Am(add9)','C/G','Bm7/A','E7(b13)','F7(#11)','C#m7(9)','Abmaj7','D7(b9)','A6','A9sus4','F#m7(b5)','Eadd9','Cm7M','Ddim','Gaug','Bsus','E7sus4','G7/13','Am7(11)','G#7(b13)','D4(7/9)','Fdim7','C11','C7(#9)','C7(b5)','Cm9','Cm11']
 .forEach(c=>ok(C.parseChord(c),'acorde não reconhecido: '+c));
['Amor','Bem','Dom','Cada','Hello','Sol','Fé','Dedo','Ela','Eu','Gato'].forEach(w=>ok(!C.parseChord(w),'palavra virou acorde: '+w));
/* linhas com anotações, símbolos e caracteres invisíveis: TODOS os acordes mudam */
eq(T('A   E   F#m   D   (Riff)'),'B   F#  G#m   E   (Riff)');
eq(T('Parte 2:  A  E  B'),'Parte 2:  B  F# C#');
eq(T('Am  G  C  F   Solo'),'Bm  A  D  G   Solo');
eq(T('(Intro) A E'),'(Intro) B F#');
eq(T('A\u200b  E  F#m'),'B  F# G#m');
eq(T('A\u00a0\u00a0E\u00a0\u00a0F#m'),'B  F# G#m');
eq(T('C♯m   G♯   A'),'D#m   A#   B');
eq(T('A     E     F#m   D\tB'),'B     F#    G#m   E C#');
eq(T('[Intro]  E7M  A7M(9)  G#m7  C#m7(9)'),'[Intro]  F#7M B7M(9)  A#m7  D#m7(9)');
eq(T('[Am]Hoje eu [G]canto'),'[Bm]Hoje eu [A]canto');
eq(T('[Refrão]\nHoje eu canto'),'[Refrão]\nHoje eu canto');
/* letras com A/E maiúsculos não viram acordes */
['E A casa é bonita','A gente vai','E eu vou','A (casa)','Amor, Bem e Dom'].forEach(l=>eq(T(l),l,'letra alterada: '+l));
/* cifra completa: nenhum acorde fica para trás */
const song=`Tom: E
[Intro] E7M  A7M(9)  G#m7  C#m7(9)  (2x)
      E7M       A7M(9)
Texto de exemplo número um
G#m7       C#m7(9)   F#m7(11)  B7(4/9)
Segunda linha de exemplo
Parte 2:  A  E/G#  F#m  D  (Riff)
E7M  |  A7M  |  G#m7  -  C#m7  x2
Final: E  B/D#  C#m7  A7M  Solo`;
const out=CM.transposeBody(song,-2,'auto').split('\n'),src=song.split('\n');
const chordsOf=l=>CM.chords.analyze(l).toks.filter(t=>t.chord).map(t=>t.chord.root);
[0,1,2,4,6,7,8].forEach(i=>{const a=chordsOf(src[i]),b=chordsOf(out[i]);eq(a.length,b.length,'qtde de acordes linha '+i);a.forEach((r,j)=>ok(C.pc(r)!==C.pc(b[j])&&(C.pc(r)-C.pc(b[j])+12)%12===2,'acorde '+r+' não desceu 2 (linha '+i+')'))});
[3,5].forEach(i=>eq(out[i],src[i],'letra alterada'));
eq(out[1],'[Intro] D7M  G7M(9)  F#m7  Bm7(9)   (2x)','coluna de (2x) preservada');
/* destaque: cada acorde marcado, letra nunca */
const html=CM.renderChart('A  E\nletra [Am] aqui',2,'sharp','A');
ok(html.includes('<span class="ch">B</span>')&&html.includes('<span class="ch">F#</span>')&&html.includes('<span class="ch">Bm</span>'),'destaque dos acordes');
ok(!/<span class="ch">[^<]*letra/.test(html),'a letra não é destacada');
/* diagnóstico */
eq(CM.diagnose('Am G C Xyz\nletra').join(),'Xyz');eq(CM.diagnose('Am G C Solo\nE A casa é bonita').length,0);
/* original intacto com semitom 0, e colunas preservadas */
eq(CM.transposeBody(song,0,'flat'),song);
const starts=l=>[...l.matchAll(/\S+/g)].map(m=>m.index).join();
eq(starts(CM.transposeBody('A    E    F#m    D',3,'flat')),starts('A    E    F#m    D'));
console.log('OK —',n,'verificações');
