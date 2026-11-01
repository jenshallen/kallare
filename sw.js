/* Vinkällaren service worker: appen fungerar offline. Datan är krypterad. */
const CACHE="kallare-v1";
const SHELL=["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  const isData=/\/(data\.enc|wrap\.json)$/.test(u.pathname);
  if(isData||u.pathname.endsWith("/")||u.pathname.endsWith("index.html")){
    // nätverk först, annars cache
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(new Request(u.origin+u.pathname),c));}return r;})
      .catch(()=>caches.match(new Request(u.origin+u.pathname)).then(r=>r||caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return res;})));
});
