(function(){
const CM=window.CM;
/* px/s por nível (1 = lento ... 10 = rápido). A posição é acumulada em ponto flutuante, então nada é pulado em velocidades baixas. */
const SPEEDS=[6,10,15,21,28,36,46,58,72,90];
CM.autoscroll=function(opts){
 opts=opts||{};
 let level=Math.max(1,Math.min(10,opts.level||3)),running=false,started=false,raf=0,last=0,pos=0,setY=0,wl=null;
 const maxY=()=>Math.max(0,(document.scrollingElement||document.documentElement).scrollHeight-window.innerHeight);
 const atEnd=()=>window.scrollY>=maxY()-1;
 const emit=()=>{if(opts.onState)opts.onState({running,started,level,atEnd:atEnd()})};
 async function lock(){try{if(typeof navigator!=='undefined'&&navigator.wakeLock)wl=await navigator.wakeLock.request('screen')}catch(e){}}
 function unlock(){try{if(wl)wl.release()}catch(e){}wl=null}
 const vis=()=>{if(running&&document.visibilityState==='visible')lock()};
 function tick(t){
  if(!running)return;
  const dt=Math.min((t-last)/1000,.1);last=t;      /* aba em segundo plano não gera salto */
  if(Math.abs(window.scrollY-setY)>3)pos=window.scrollY; /* o usuário rolou à mão: acompanha */
  pos+=SPEEDS[level-1]*dt;
  const m=maxY();
  if(pos>=m){pos=m;window.scrollTo(0,pos);setY=pos;pause();return}
  window.scrollTo(0,pos);setY=pos;
  raf=requestAnimationFrame(tick);
 }
 function play(){
  if(running)return;
  if(atEnd()&&maxY()>0)window.scrollTo(0,0);
  pos=window.scrollY;setY=pos;running=true;started=true;last=performance.now();
  raf=requestAnimationFrame(tick);lock();emit();
 }
 function pause(){running=false;cancelAnimationFrame(raf);unlock();emit()}
 document.addEventListener('visibilitychange',vis);
 return{
  play,pause,toggle:()=>running?pause():play(),
  restart(){window.scrollTo(0,0);pos=0;setY=0;if(!running)started=false;emit()},
  setLevel(n){level=Math.max(1,Math.min(10,n));emit()},   /* vale já no próximo quadro */
  jump(y,instant){y=Math.max(0,Math.min(maxY(),y));if(running||instant){window.scrollTo(0,y);pos=y;setY=y}else window.scrollTo({top:y,behavior:'smooth'})},
  stop(){opts.onState=null;pause();document.removeEventListener('visibilitychange',vis)},
  get level(){return level},get running(){return running},emit
 };
};
})();
