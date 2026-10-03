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
add('Malware scanning configured for uploads',!cfg.uploadsEnabled||!!cfg.clamav.host,cfg.uploadsEnabled?(cfg.clamav.host||'scanner missing'):'uploads disabled',cfg.uploadsEnabled);
add('Static public index exists',fs.existsSync(path.join(cfg.staticRoot,'index-self-contained.html')),'index-self-contained.html');
add('Staff login exists',fs.existsSync(path.join(cfg.staticRoot,'staff','login.html')),'staff/login.html');
add('Staff Home exists',fs.existsSync(path.join(cfg.staticRoot,'staff','home.html')),'staff/home.html');
add('Resident directory exists',fs.existsSync(path.join(cfg.staticRoot,'staff','residents.html')),'staff/residents.html');
add('Resident profile workspace exists',fs.existsSync(path.join(cfg.staticRoot,'staff','resident.html')),'staff/resident.html');
add('New Case workflow exists',fs.existsSync(path.join(cfg.staticRoot,'staff','new-case.html')),'staff/new-case.html');
add('Resident profile API route exists',fs.existsSync(path.join(__dirname,'..','src','routes','residents.js')),'src/routes/residents.js');
add('Role-aware Today route exists',fs.existsSync(path.join(__dirname,'..','src','routes','today.js')),'src/routes/today.js');
add('Shared staff shell styles exist',fs.existsSync(path.join(cfg.staticRoot,'staff','staff-shell.css')),'staff/staff-shell.css');
add('Shared staff shell script exists',fs.existsSync(path.join(cfg.staticRoot,'staff','staff-shell.js')),'staff/staff-shell.js');
add('Administration cohesion styles exist',fs.existsSync(path.join(cfg.staticRoot,'staff','admin-cohesion-v261.css')),'staff/admin-cohesion-v261.css');
add('Content cohesion styles exist',fs.existsSync(path.join(cfg.staticRoot,'staff','content-cohesion-v262.css')),'staff/content-cohesion-v262.css');
add('Integrated case workspace styles exist',fs.existsSync(path.join(cfg.staticRoot,'staff','case-workspace-v251.css')),'staff/case-workspace-v251.css');
add('Integrated case workspace script exists',fs.existsSync(path.join(cfg.staticRoot,'staff','case-workspace-v251.js')),'staff/case-workspace-v251.js');
add('Case-context styles exist',fs.existsSync(path.join(cfg.staticRoot,'staff','case-context-v251.css')),'staff/case-context-v251.css');
add('Case-context helper exists',fs.existsSync(path.join(cfg.staticRoot,'staff','case-context-v251.js')),'staff/case-context-v251.js');
add('Focused case page styles exist',fs.existsSync(path.join(cfg.staticRoot,'staff','case-focus-v252.css')),'staff/case-focus-v252.css');
add('Focused case page script exists',fs.existsSync(path.join(cfg.staticRoot,'staff','case-focus-v252.js')),'staff/case-focus-v252.js');
add('Staff directory exists',fs.existsSync(path.join(cfg.staticRoot,'staff','sections.html')),'staff/sections.html');
add('Daily Workboard exists',fs.existsSync(path.join(cfg.staticRoot,'staff','workflow.html')),'staff/workflow.html');
add('Management Reports exists',fs.existsSync(path.join(cfg.staticRoot,'staff','reports.html')),'staff/reports.html');
add('Management Briefing exists',fs.existsSync(path.join(cfg.staticRoot,'staff','briefing.html')),'staff/briefing.html');
add('Community Operations exists',fs.existsSync(path.join(cfg.staticRoot,'staff','community.html')),'staff/community.html');
add('Events and Volunteers exists',fs.existsSync(path.join(cfg.staticRoot,'staff','events.html')),'staff/events.html');
add('Meetings workspace exists',fs.existsSync(path.join(cfg.staticRoot,'staff','meetings.html')),'staff/meetings.html');
add('Website CMS exists',fs.existsSync(path.join(cfg.staticRoot,'staff','cms.html')),'staff/cms.html');
add('Roster and Coverage exists',fs.existsSync(path.join(cfg.staticRoot,'staff','roster.html')),'staff/roster.html');
add('Access Control exists',fs.existsSync(path.join(cfg.staticRoot,'staff','access.html')),'staff/access.html');
add('Audit Review exists',fs.existsSync(path.join(cfg.staticRoot,'staff','audit.html')),'staff/audit.html');
add('System Administration exists',fs.existsSync(path.join(cfg.staticRoot,'staff','system.html')),'staff/system.html');
add('Production Control exists',fs.existsSync(path.join(cfg.staticRoot,'staff','production.html')),'staff/production.html');
add('Publishing Desk exists',fs.existsSync(path.join(cfg.staticRoot,'staff','publishing.html')),'staff/publishing.html');
add('Publishing QA exists',fs.existsSync(path.join(cfg.staticRoot,'staff','publishing-qa.html')),'staff/publishing-qa.html');
add('Release Control exists',fs.existsSync(path.join(cfg.staticRoot,'staff','readiness.html')),'staff/readiness.html');
add('UAT Centre exists',fs.existsSync(path.join(cfg.staticRoot,'staff','uat.html')),'staff/uat.html');
add('Feature freeze document exists',fs.existsSync(path.join(__dirname,'..','..','FEATURE_FREEZE_V269.md')),'FEATURE_FREEZE_V269.md');
add('Current UAT plan exists',fs.existsSync(path.join(__dirname,'..','..','UAT_TEST_PLAN.md')),'UAT_TEST_PLAN.md');
add('Go-Live Control exists',fs.existsSync(path.join(cfg.staticRoot,'staff','go-live.html')),'staff/go-live.html');
add('Publishing workflow migration exists',fs.existsSync(path.join(__dirname,'..','migrations','006_content_publishing_workflow.sql')),'migrations/006_content_publishing_workflow.sql');
add('Resident profile migration exists',fs.existsSync(path.join(__dirname,'..','migrations','007_resident_profiles.sql')),'migrations/007_resident_profiles.sql');
add('Operational hardening migration exists',fs.existsSync(path.join(__dirname,'..','migrations','008_operational_indexes_and_function_hardening.sql')),'migrations/008_operational_indexes_and_function_hardening.sql');
add('Meeting operations migration exists',fs.existsSync(path.join(__dirname,'..','migrations','009_meeting_operations.sql')),'migrations/009_meeting_operations.sql');
add('Evidence links migration exists',fs.existsSync(path.join(__dirname,'..','migrations','010_document_evidence_links.sql')),'migrations/010_document_evidence_links.sql');
add('Tracker exists',fs.existsSync(path.join(cfg.staticRoot,'track','index.html')),'track/index.html');

const failed=results.filter(r=>r.required&&!r.ok);
for(const r of results){console.log(`${r.ok?'PASS':'FAIL'} ${r.required?'':'(optional) '}— ${r.name}: ${r.detail}`)}
console.log(`\nPreflight: ${results.length-failed.length}/${results.length} checks acceptable; ${failed.length} required failure(s).`);
if(failed.length) process.exitCode=2;
