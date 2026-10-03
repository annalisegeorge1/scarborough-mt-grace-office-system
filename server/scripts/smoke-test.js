'use strict';
const base=(process.env.SMOKE_BASE_URL||'http://127.0.0.1:8080').replace(/\/$/,'');
const email=process.env.SMOKE_EMAIL||'';
const password=process.env.SMOKE_PASSWORD||'';
let cookie=''; let csrf=''; let failures=0;
async function req(path,opt={}){const headers={...(opt.headers||{})};if(cookie)headers.Cookie=cookie;if(csrf&&!['GET','HEAD'].includes((opt.method||'GET').toUpperCase()))headers['X-SMG-CSRF']=csrf;const r=await fetch(base+path,{redirect:'manual',...opt,headers});const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return r;}
async function check(name,path,expect=[200]){
  const transient=new Set([429,502,503,504]);
  let last=null,lastError=null;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const r=await req(path);last=r;
      if(expect.includes(r.status)){console.log(`PASS — ${name}: ${r.status}${attempt>1?` (attempt ${attempt})`:''}`);return r;}
      if(!transient.has(r.status)||attempt===3)break;
      console.log(`RETRY — ${name}: transient ${r.status} (attempt ${attempt}/3)`);
    }catch(e){
      lastError=e;
      if(attempt===3)break;
      console.log(`RETRY — ${name}: ${e.message} (attempt ${attempt}/3)`);
    }
    await new Promise(resolve=>setTimeout(resolve,2500*attempt));
  }
  if(last){console.log(`FAIL — ${name}: ${last.status}`);failures++;return last;}
  console.log(`FAIL — ${name}: ${lastError?.message||'request failed'}`);failures++;
}
(async()=>{
await check('Liveness','/api/health/live');
await check('Health','/api/health',[200,503]);
await check('Readiness','/api/health/readiness',[200,503]);
await check('Public homepage','/');
await check('Public Civic Flow script','/assets/district-civic-flow-v237.js');
await check('Public Civic Flow styles','/assets/district-civic-flow-v237.css');
await check('Public content API','/api/public/content');
await check('Resident tracker','/track/');
await check('Resident portal hub','/portals/');
await check('Resident guide','/resident-guide/');
await check('Staff login','/staff/login.html');
await check('Protected Staff Home redirects','/staff/home.html',[302]);
await check('Protected Resident Directory redirects','/staff/residents.html',[302]);
await check('Protected Resident Profile redirects','/staff/resident.html?id=test',[302]);
await check('Protected New Case redirects','/staff/new-case.html',[302]);
await check('Protected staff page redirects','/staff/index.html',[302]);
await check('Protected staff directory redirects','/staff/sections.html',[302]);
await check('Protected Daily Workboard redirects','/staff/workflow.html',[302]);
await check('Protected Management Reports redirects','/staff/reports.html',[302]);
await check('Protected Management Briefing redirects','/staff/briefing.html',[302]);
await check('Protected Community Operations redirects','/staff/community.html',[302]);
await check('Protected Events and Volunteers redirects','/staff/events.html',[302]);
await check('Protected Meetings redirects','/staff/meetings.html',[302]);
await check('Protected Website CMS redirects','/staff/cms.html',[302]);
await check('Protected Roster and Coverage redirects','/staff/roster.html',[302]);
await check('Protected Access Control redirects','/staff/access.html',[302]);
await check('Protected Audit Review redirects','/staff/audit.html',[302]);
await check('Protected System Administration redirects','/staff/system.html',[302]);
await check('Protected Production Control redirects','/staff/production.html',[302]);
await check('Protected Publishing Desk redirects','/staff/publishing.html',[302]);
await check('Protected Publishing QA redirects','/staff/publishing-qa.html',[302]);
await check('Protected Release Control redirects','/staff/readiness.html',[302]);
await check('Protected UAT Centre redirects','/staff/uat.html',[302]);
await check('Protected Go-Live Control redirects','/staff/go-live.html',[302]);
if(email&&password){
  const r=await req('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  let d={};try{d=await r.json()}catch{}
  const ok=r.status===200&&d.csrf&&Array.isArray(d.permissions);console.log(`${ok?'PASS':'FAIL'} — Staff authentication + permission payload: ${r.status}`);if(!ok)failures++;else{
    csrf=d.csrf;
    await check('Authenticated staff shell styles','/staff/staff-shell.css');
    await check('Authenticated staff shell script','/staff/staff-shell.js');
    await check('Authenticated Administration cohesion styles','/staff/admin-cohesion-v261.css');
    await check('Authenticated case workspace styles','/staff/case-workspace-v251.css');
    await check('Authenticated case workspace script','/staff/case-workspace-v251.js');
    await check('Authenticated case-context styles','/staff/case-context-v251.css');
    await check('Authenticated case-context helper','/staff/case-context-v251.js');
    await check('Authenticated focused case styles','/staff/case-focus-v252.css');
    await check('Authenticated focused case script','/staff/case-focus-v252.js');
    await check('Authenticated Staff Home','/staff/home.html');
    try{
      const todayR=await req('/api/today'),todayD=todayR.ok?await todayR.json():{};
      const todayOk=todayR.ok&&Array.isArray(todayD.attention)&&todayD.summary&&Number.isInteger(todayD.summary.attentionOverdue)&&Number.isInteger(todayD.summary.attentionDueToday);
      console.log(`${todayOk?'PASS':'FAIL'} — Unified Today attention API: ${todayR.status}`);
      if(!todayOk)failures++;
    }catch(e){console.log('FAIL — Unified Today attention API: '+e.message);failures++;}
    await check('Authenticated Resident Directory','/staff/residents.html');
    await check('Authenticated Resident Profile shell','/staff/resident.html');
    await check('Authenticated New Case workflow','/staff/new-case.html');
    const canCaseWrite=d.permissions.includes('*')||d.permissions.includes('cases.write')||d.permissions.includes('cases.write.assigned');
    if(canCaseWrite)await check('Case creation options API','/api/cases/options');
    else console.log('SKIP — Case creation options API (smoke role cannot create cases).');
    await check('Authenticated Case Management','/staff/index.html');
    await check('Authenticated Applications','/staff/applications.html');
    await check('Authenticated Correspondence','/staff/correspondence.html');
    await check('Authenticated Field Operations','/staff/field.html');
    await check('Authenticated Records Centre','/staff/records.html');
    if(d.permissions.includes('*')||d.permissions.includes('records.read')){
      try{
        const recordsR=await req('/api/records'),recordsD=recordsR.ok?await recordsR.json():{};
        const recordsOk=recordsR.ok&&Array.isArray(recordsD.records)&&recordsD.records.every(x=>Array.isArray(x.links));
        console.log(`${recordsOk?'PASS':'FAIL'} — Records API evidence links: ${recordsR.status}`);
        if(!recordsOk)failures++;
      }catch(e){console.log('FAIL — Records API evidence links: '+e.message);failures++;}
    }
    await check('Authenticated Resident Feedback','/staff/feedback.html');
    await check('Authenticated staff directory','/staff/sections.html');
    await check('Authenticated Daily Workboard','/staff/workflow.html');
    if(d.permissions.includes('*')||d.permissions.includes('community.write')){await check('Authenticated Community Operations','/staff/community.html');await check('Authenticated Events and Volunteers','/staff/events.html');await check('Authenticated Meetings','/staff/meetings.html');await check('Authenticated Meetings API','/api/ops/meetings');}
    if(d.permissions.includes('*')||d.permissions.includes('content.write')){await check('Authenticated Website CMS','/staff/cms.html');await check('Authenticated content cohesion styles','/staff/content-cohesion-v262.css');}
    if(d.permissions.includes('*')||d.permissions.includes('reports.read'))await check('Authenticated Roster and Coverage','/staff/roster.html');
    if(d.permissions.includes('*')||d.permissions.includes('accessAdmin'))await check('Authenticated Access Control','/staff/access.html');
    if(d.permissions.includes('*')||d.permissions.includes('audit.read')){await check('Authenticated Audit Review','/staff/audit.html');await check('Authenticated Audit API','/api/audit?limit=5');}
    await check('Authenticated System Administration','/staff/system.html');
    await check('Authenticated Production Control','/staff/production.html');
    await check('Authenticated Publishing Desk','/staff/publishing.html');
    await check('Authenticated Publishing QA','/staff/publishing-qa.html');
    await check('Authenticated Release Control','/staff/readiness.html');
    await check('Authenticated UAT Centre','/staff/uat.html');
    await check('Authenticated Go-Live Control','/staff/go-live.html');
    await check('Management summary API','/api/reports/summary');
    if(d.permissions.includes('*')||d.permissions.includes('reports.read')){
      await check('Authenticated Management Reports','/staff/reports.html');
      await check('Authenticated Management Briefing','/staff/briefing.html');
      try{
        const mr=await req('/api/reports/management'),md=mr.ok?await mr.json():{};
        const managementOk=mr.ok&&md.headline&&Array.isArray(md.caseStatuses)&&Array.isArray(md.closureReasons)&&Array.isArray(md.categories)&&Array.isArray(md.sixMonthTrend)&&Array.isArray(md.ownerWorkload);
        console.log(`${managementOk?'PASS':'FAIL'} — Central management outcomes API: ${mr.status}`);
        if(!managementOk)failures++;
      }catch(e){console.log('FAIL — Central management outcomes API: '+e.message);failures++;}
    }
    await check('Publishing readiness API','/api/content/publishing-readiness');
    try{
      const residentsR=await req('/api/residents'),residentsD=residentsR.ok?await residentsR.json():{};
      console.log(`${residentsR.ok?'PASS':'FAIL'} — Resident Profile API list: ${residentsR.status}`);if(!residentsR.ok)failures++;
      const resident=residentsD.residents?.[0];
      if(resident?.id)await check('Resident Profile API detail','/api/residents/'+encodeURIComponent(resident.id));
      else console.log('SKIP — Resident Profile API detail (no accessible resident profiles).');
    }catch(e){console.log('FAIL — Resident Profile API discovery: '+e.message);failures++;}

    try{
      const casesR=await req('/api/cases'),casesD=casesR.ok?await casesR.json():{};
      const first=casesD.cases?.[0];
      const hasCase=!!first?.id;
      console.log(`${casesR.ok?'PASS':'FAIL'} — Cases API for integrated workspace: ${casesR.status}`);if(!casesR.ok)failures++;
      if(hasCase){
        const wsR=await req('/api/cases/'+encodeURIComponent(first.id)+'/workspace'),wsD=wsR.ok?await wsR.json():{};
        const cr=wsD.closureReadiness||{};
        const wsOk=wsR.ok&&Array.isArray(wsD.events)&&Array.isArray(wsD.meetings)&&Array.isArray(wsD.applications)&&Array.isArray(wsD.documents)&&wsD.documents.every(x=>Array.isArray(x.evidence_links))&&Array.isArray(cr.blockers)&&Array.isArray(cr.warnings)&&typeof cr.ready==='boolean'&&typeof cr.canFormalClose==='boolean';
        console.log(`${wsOk?'PASS':'FAIL'} — Integrated case workspace + related work + evidence + closure readiness: ${wsR.status}`);
        if(!wsOk)failures++;
      }else console.log('SKIP — Integrated case workspace API (no accessible cases in smoke account).');
    }catch(e){console.log('FAIL — Integrated case workspace API discovery: '+e.message);failures++;}

    const me=await req('/api/auth/me');let med={};try{med=await me.json()}catch{}const meOk=me.ok&&Array.isArray(med.permissions);console.log(`${meOk?'PASS':'FAIL'} — Authenticated /me + permissions: ${me.status}`);if(!meOk)failures++;
  }
}else console.log('SKIP — Authenticated staff smoke test (set SMOKE_EMAIL and SMOKE_PASSWORD).');
console.log(`\nSmoke test complete: ${failures} failure(s).`);process.exitCode=failures?1:0;
})();
