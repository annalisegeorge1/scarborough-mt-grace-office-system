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
await check('Public content API','/api/public/content');
await check('Resident tracker','/track/');
await check('Resident portal hub','/portals/');
await check('Resident guide','/resident-guide/');
await check('Staff login','/staff/login.html');
await check('Protected staff page redirects','/staff/index.html',[302]);
await check('Protected staff directory redirects','/staff/sections.html',[302]);
await check('Protected Daily Workboard redirects','/staff/workflow.html',[302]);
await check('Protected System Administration redirects','/staff/system.html',[302]);
await check('Protected Production Control redirects','/staff/production.html',[302]);
await check('Protected Publishing Desk redirects','/staff/publishing.html',[302]);
await check('Protected Publishing QA redirects','/staff/publishing-qa.html',[302]);
await check('Protected Release Control redirects','/staff/readiness.html',[302]);
await check('Protected Go-Live Control redirects','/staff/go-live.html',[302]);
if(email&&password){
  const r=await req('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  let d={};try{d=await r.json()}catch{}
  const ok=r.status===200&&d.csrf;console.log(`${ok?'PASS':'FAIL'} — Staff authentication: ${r.status}`);if(!ok)failures++;else{
    csrf=d.csrf;
    await check('Authenticated staff home','/staff/index.html');
    await check('Authenticated staff directory','/staff/sections.html');
    await check('Authenticated Daily Workboard','/staff/workflow.html');
    await check('Authenticated System Administration','/staff/system.html');
    await check('Authenticated Production Control','/staff/production.html');
    await check('Authenticated Publishing Desk','/staff/publishing.html');
    await check('Authenticated Publishing QA','/staff/publishing-qa.html');
    await check('Authenticated Release Control','/staff/readiness.html');
    await check('Authenticated Go-Live Control','/staff/go-live.html');
    await check('Management summary API','/api/reports/summary');
    await check('Publishing readiness API','/api/content/publishing-readiness');
    const me=await req('/api/auth/me');console.log(`${me.ok?'PASS':'FAIL'} — Authenticated /me: ${me.status}`);if(!me.ok)failures++;
  }
}else console.log('SKIP — Authenticated staff smoke test (set SMOKE_EMAIL and SMOKE_PASSWORD).');
console.log(`\nSmoke test complete: ${failures} failure(s).`);process.exitCode=failures?1:0;
})();
