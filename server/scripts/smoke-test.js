'use strict';
const base=(process.env.SMOKE_BASE_URL||'http://127.0.0.1:8080').replace(/\/$/,'');
const email=process.env.SMOKE_EMAIL||'';
const password=process.env.SMOKE_PASSWORD||'';
let cookie=''; let csrf=''; let failures=0;
async function req(path,opt={}){const headers={...(opt.headers||{})};if(cookie)headers.Cookie=cookie;if(csrf&&!['GET','HEAD'].includes((opt.method||'GET').toUpperCase()))headers['X-SMG-CSRF']=csrf;const r=await fetch(base+path,{redirect:'manual',...opt,headers});const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return r;}
async function check(name,path,expect=[200]){try{const r=await req(path);const ok=expect.includes(r.status);console.log(`${ok?'PASS':'FAIL'} — ${name}: ${r.status}`);if(!ok)failures++;return r;}catch(e){console.log(`FAIL — ${name}: ${e.message}`);failures++;}}
(async()=>{
await check('Liveness','/api/health/live');
await check('Health','/api/health',[200,503]);
await check('Readiness','/api/health/readiness',[200,503]);
await check('Public homepage','/');
await check('Resident tracker','/track/');
await check('Resident portal hub','/portals/');
await check('Resident guide','/resident-guide/');
await check('Staff login','/staff/login.html');
const protectedPage=await check('Protected staff page redirects','/staff/index.html',[302]);
if(email&&password){
  const r=await req('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  let d={};try{d=await r.json()}catch{}
  const ok=r.status===200&&d.csrf;console.log(`${ok?'PASS':'FAIL'} — Staff authentication: ${r.status}`);if(!ok)failures++;else{csrf=d.csrf;await check('Authenticated staff home','/staff/index.html');const me=await req('/api/auth/me');console.log(`${me.ok?'PASS':'FAIL'} — Authenticated /me: ${me.status}`);if(!me.ok)failures++;}
}else console.log('SKIP — Authenticated staff smoke test (set SMOKE_EMAIL and SMOKE_PASSWORD).');
console.log(`\nSmoke test complete: ${failures} failure(s).`);process.exitCode=failures?1:0;
})();
