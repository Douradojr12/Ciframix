/* Service worker do CifraMix: guarda o app no aparelho para abrir sem internet.
   Ao alterar qualquer arquivo do app, aumente a versão abaixo. */
const VERSION='ciframix-v1';
const FILES=[
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/style.css",
 "css/responsive.css",
 "js/app.js",
 "js/autoscroll.js",
 "js/chord-engine.js",
 "js/navigation.js",
 "js/presentation.js",
 "js/search.js",
 "js/setlist.js",
 "js/source-adapter.js",
 "js/storage.js",
 "js/transposer.js",
 "js/ui.js",
 "assets/icons/apple-touch-icon.png",
 "assets/icons/icon-192.png",
 "assets/icons/icon-512.png",
 "assets/icons/icon-maskable-512.png",
 "assets/icons/icon.svg",
 "js/help.js"
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* abre do cache na hora e atualiza em segundo plano para a próxima abertura */
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(caches.open(VERSION).then(async c=>{
  const hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>null);
  return hit||(await net)||(r.mode==='navigate'?c.match('index.html'):Response.error());
 }));
});
