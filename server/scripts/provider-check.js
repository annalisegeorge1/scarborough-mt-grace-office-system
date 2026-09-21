'use strict';
const cfg=require('../src/config');
const errors=[]; const warnings=[];
function ok(label,detail){console.log(`PASS — ${label}: ${detail}`)}
function fail(label,detail){console.log(`FAIL — ${label}: ${detail}`);errors.push(label)}
function warn(label,detail){console.log(`WARN — ${label}: ${detail}`);warnings.push(label)}
const render=!!process.env.RENDER;
render?ok('Render runtime detected','RENDER environment variable present'):warn('Render runtime detected','not running inside Render; this is expected during local checks');
/^https:\/\//.test(cfg.publicOrigin)?ok('Public origin',cfg.publicOrigin):fail('Public origin',cfg.publicOrigin);
if(!cfg.databaseUrl) fail('Database URL','missing');
else {
  let u; try{u=new URL(cfg.databaseUrl)}catch{fail('Database URL','invalid URI')}
  if(u){
    ok('Database URL','configured');
    const host=u.hostname||'';
    if(/pooler\.supabase\.com$/i.test(host) && String(u.port||'5432')==='5432') ok('Supabase connection mode','session pooler on port 5432');
    else if(/supabase\.co$/i.test(host)) warn('Supabase connection mode','for Render, use the IPv4 Session pooler on port 5432 rather than the direct IPv6 endpoint');
    else warn('Database provider',`host is ${host}; V163 staging docs are optimized for Supabase`);
  }
}
cfg.databaseSsl==='require'?ok('Database TLS','DATABASE_SSL=require'):fail('Database TLS',cfg.databaseSsl||'not configured');
cfg.dbPoolMax<=6?ok('Database pool size',String(cfg.dbPoolMax)):warn('Database pool size',`${cfg.dbPoolMax}; use 5 or fewer for free/small staging databases`);
!cfg.uploadsEnabled?ok('Sensitive uploads','disabled for zero-cost staging'):warn('Sensitive uploads','enabled; do not use zero-cost staging for confidential uploads unless managed private storage and malware scanning are configured');
console.log(`\nProvider check: ${errors.length} failure(s), ${warnings.length} warning(s).`);
if(errors.length) process.exitCode=2;
