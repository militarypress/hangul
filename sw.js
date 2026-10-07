/* 오프라인용 서비스워커.
   전략: 캐시에 있으면 즉시 보여주고, 뒤에서 네트워크로 새 버전을 받아 캐시를 갱신한다.
   → 파일을 고쳐 올리면 다음 실행 때 새 버전이 적용됨 (수동 캐시 이름 변경 불필요) */
var CACHE='hangul-trace-v1';
var CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=e.request.url;
  var cacheable=u.indexOf(self.location.origin)===0||/fonts\.(googleapis|gstatic)\.com/.test(u);
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(e.request).then(function(hit){
      var net=fetch(e.request).then(function(res){
        if(res&&res.ok&&cacheable)c.put(e.request,res.clone());
        return res;
      }).catch(function(){return hit||caches.match('./index.html')});
      if(hit){e.waitUntil(net.catch(function(){}));return hit}
      return net;
    });
  }));
});
