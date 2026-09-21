'use strict';
const fs=require('fs');
const path=require('path');
const cfg=require('../src/config');

const results=[];
function add(name,ok,detail,required=true){results.push({name,ok:!!ok,detail,required});}
function nonPlaceholder(v){return !!v && !/CHANGE_ME|example|password|secret/i.test(String(v));}

add('NODE_ENV is production',cfg.production,process.env.NODE_ENV||'development');
add('PUBLIC_ORIGIN uses HTTPS',/^https:\/\//i.test(cfg.publicOrigin),cfg.publicOrigin);
add('DATABASE_URL configured',nonPlaceholder(cfg.databaseUrl),cfg.databaseUrl?'configured':'missing');
add('TRUST_PROXY configured',Number(cfg.trustProxy)>=1,String(cfg.trustProxy));
add('Session idle limit reasonable',cfg.sessionIdleMinutes>=5&&cfg.sessionIdleMinutes<=120,`${cfg.sessionIdleMinutes} minutes`);
add('Session absolute limit reasonable',cfg.sessionAbsoluteHours>=1&&cfg.sessionAbsoluteHours<=24,`${cfg.sessionAbsoluteHours} hours`);
const storageReady=cfg.storageDriver!=='local'||cfg.allowLocalPrivateStorage;
add('Private storage production-safe',storageReady,cfg.storageDriver==='local'?'local storage selected':'managed/object storage selected',cfg.uploadsEnabled);
add('Malware scanning configured when required',!cfg.uploadsEnabled||!cfg.clamav.required||!!cfg.clamav.host,cfg.uploadsEnabled?(cfg.clamav.host||'scanner missing'):'uploads disabled',cfg.uploadsEnabled);
add('Static public index exists',fs.existsSync(path.join(cfg.staticRoot,'index-self-contained.html')),'index-self-contained.html');
add('Staff login exists',fs.existsSync(path.join(cfg.staticRoot,'staff','login.html')),'staff/login.html');
add('Tracker exists',fs.existsSync(path.join(cfg.staticRoot,'track','index.html')),'track/index.html');

const failed=results.filter(r=>r.required&&!r.ok);
for(const r of results){console.log(`${r.ok?'PASS':'FAIL'} ${r.required?'':'(optional) '}— ${r.name}: ${r.detail}`)}
console.log(`\nPreflight: ${results.length-failed.length}/${results.length} checks acceptable; ${failed.length} required failure(s).`);
if(failed.length) process.exitCode=2;
