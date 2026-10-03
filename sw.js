'use strict';

const VERSION='v270-5';
const SHELL_CACHE='smg-public-shell-'+VERSION;
const ASSET_CACHE='smg-public-assets-'+VERSION;
const RUNTIME_CACHE='smg-public-runtime-'+VERSION;

const PUBLIC_SHELL_PATHS=new Set([
  '/',
  '/index.html',
  '/index-self-contained.html',
  '/office',
  '/office/',
  '/services',
  '/services/',
  '/community',
  '/community/',
  '/forms',
  '/forms/',
  '/updates',
  '/updates/',
  '/contact',
  '/contact/'
]);

const PRECACHE=[
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/district-app-icon-v229.svg'
];

function sameOrigin(url){
  return url.origin===self.location.origin;
}

function isSensitivePath(pathname){
  return pathname.startsWith('/staff')||
    pathname.startsWith('/api')||
    pathname.startsWith('/server');
}

async function trimCache(name,maxEntries){
  const cache=await caches.open(name);
  const keys=await cache.keys();
  if(keys.length<=maxEntries)return;
  await Promise.all(keys.slice(0,keys.length-maxEntries).map(key=>cache.delete(key)));
}

async function cachePublicShell(){
  try{
    const response=await fetch('/',{cache:'reload',credentials:'same-origin'});
    if(response.ok){
      const cache=await caches.open(SHELL_CACHE);
      await cache.put('/',response.clone());
    }
  }catch(_e){}
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    await Promise.allSettled(PRECACHE.map(async url=>{
      try{
        const response=await fetch(url,{cache:'reload',credentials:'same-origin'});
        if(response.ok)await cache.put(url,response);
      }catch(_e){}
    }));
    await cachePublicShell();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keep=new Set([SHELL_CACHE,ASSET_CACHE,RUNTIME_CACHE]);
    const names=await caches.keys();
    await Promise.all(names
      .filter(name=>name.startsWith('smg-public-')&&!keep.has(name))
      .map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirstShell(request){
  try{
    const response=await fetch(request);
    if(response.ok){
      const cache=await caches.open(SHELL_CACHE);
      await cache.put('/',response.clone());
    }
    return response;
  }catch(_e){
    const cache=await caches.open(SHELL_CACHE);
    return (await cache.match('/'))||
      (await cache.match('/offline.html'))||
      Response.error();
  }
}

async function networkFirstNavigation(request){
  try{
    return await fetch(request);
  }catch(_e){
    const cache=await caches.open(SHELL_CACHE);
    return (await cache.match('/offline.html'))||Response.error();
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(ASSET_CACHE);
  const cached=await cache.match(request);

  const update=fetch(request).then(async response=>{
    if(response.ok){
      await cache.put(request,response.clone());
      trimCache(ASSET_CACHE,90).catch(()=>{});
    }
    return response;
  }).catch(()=>null);

  if(cached){
    update.catch(()=>{});
    return cached;
  }

  return (await update)||Response.error();
}

async function cacheFirstStatic(request){
  const cache=await caches.open(SHELL_CACHE);
  const cached=await cache.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch(_e){
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  if(!sameOrigin(url))return;
  if(isSensitivePath(url.pathname))return;

  if(request.mode==='navigate'){
    if(PUBLIC_SHELL_PATHS.has(url.pathname)){
      event.respondWith(networkFirstShell(request));
    }else{
      event.respondWith(networkFirstNavigation(request));
    }
    return;
  }

  if(url.pathname.startsWith('/assets/')){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if(PRECACHE.includes(url.pathname)){
    event.respondWith(cacheFirstStatic(request));
  }
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
