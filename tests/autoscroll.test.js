/* node tests/autoscroll.test.js — simula janela e quadros de animação */
const assert=require('assert');global.window=global;let n=0;const eq=(a,b,m)=>{assert.strictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
let H=3000;global.innerHeight=800;global.scrollY=0;
global.document={scrollingElement:{get scrollHeight(){return H}},addEventListener(){},removeEventListener(){}};
global.scrollTo=(x,y)=>{if(typeof x==='object')y=x.top;global.scrollY=Math.max(0,Math.min(H-innerHeight,Math.round(y)))};
let now=0,q=[];global.performance={now:()=>now};global.requestAnimationFrame=f=>{q.push(f);return q.length};global.cancelAnimationFrame=()=>{q=[]};
const frame=ms=>{now+=ms;const f=q;q=[];f.forEach(x=>x(now))};
const run=(sec,ms=16.67)=>{for(let t=0;t<sec*1000;t+=ms)frame(ms)};
global.CM={};require('../js/autoscroll.js');
let st;const A=CM.autoscroll({level:3,onState:s=>{st=s}});
A.play();eq(st.running,true);run(10);ok(Math.abs(scrollY-150)<=3,'nível 3 = 15px/s -> ~150px em 10s, obteve '+scrollY);
let p=scrollY;A.setLevel(6);run(5);ok(Math.abs(scrollY-p-180)<=3,'mudou para 36px/s sem parar: '+(scrollY-p));
A.pause();eq(st.running,false);p=scrollY;run(3);eq(scrollY,p,'pausado não rola');
A.play();eq(st.started,true);run(2);ok(scrollY>p,'continua de onde parou');
/* sem pular trechos e sem recuar, em velocidade mínima */
A.setLevel(1);let prev=scrollY,maxStep=0;for(let i=0;i<600;i++){frame(16.67);maxStep=Math.max(maxStep,scrollY-prev);ok(scrollY>=prev,'não recua');prev=scrollY}
ok(maxStep<=1,'passo máximo por quadro <=1px no nível 1: '+maxStep);
/* rolagem manual durante a execução: acompanha */
global.scrollY=1500;frame(16.67);run(1);ok(scrollY>=1500&&scrollY<1530,'retoma da posição manual: '+scrollY);
/* chegada ao fim: para, não ultrapassa e não trava */
A.setLevel(10);run(40);eq(scrollY,H-innerHeight);eq(st.running,false);eq(st.atEnd,true);
A.play();ok(scrollY<100,'play no fim recomeça do topo');run(1);ok(st.running);
/* reiniciar durante a execução continua rolando do topo */
A.restart();ok(scrollY===0&&st.running);run(1);ok(scrollY>0);
/* jump */
A.jump(1000,true);eq(scrollY,1000);run(1);ok(scrollY>=1000&&scrollY<1100);
A.stop();eq(A.running,false);
/* conteúdo menor que a tela não trava */
H=500;global.scrollY=0;const B=CM.autoscroll({level:5,onState:s=>{st=s}});B.play();run(1);eq(st.running,false);
console.log('OK —',n,'verificações');
