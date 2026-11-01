/* Vinkällaren service worker: appen fungerar offline. Datan är krypterad.
   Appens filer och datan hämtas alltid färskt från nätet när det finns, annars från cachen. */
const CACHE="kallare-v4";
const SHELL=["./","index.html","pairing.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  const key=new Request(u.origin+u.pathname);
  const fresh=e.request.mode==="navigate"||/\/(data\.enc|wrap\.json|index\.html|pairing\.js|manifest\.webmanifest)$/.test(u.pathname)||u.pathname.endsWith("/");
  if(fresh){
    e.respondWith(fetch(u.origin+u.pathname,{cache:"no-store"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(key,c));}return r.ok?r:caches.match(key).then(m=>m||r);})
      .catch(()=>caches.match(key).then(m=>m||caches.match(new Request(u.origin+u.pathname.replace(/[^/]*$/,"index.html"))))));
    return;
  }
  e.respondWith(caches.match(key).then(r=>r||fetch(e.request).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(ca=>ca.put(key,c));}return res;})));
});
