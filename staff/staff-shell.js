(()=>{'use strict';
const STORAGE_COLLAPSE='smg_staff_shell_collapsed';
const STORAGE_AREA='smg_staff_shell_area';
const areas=[
  {id:'home',label:'Home',icon:'⌂',items:[
    ['Home','home.html','cases.read'],['Daily Workboard','workflow.html','cases.read'],
    ['Operations Centre','command.html','reports.read'],['Management Briefing','briefing.html','reports.read'],
    ['Handover','handover.html','reports.read'],['Attention & Reminders','automation.html','reports.read']
  ]},
  {id:'residents',label:'Residents',icon:'◉',items:[
    ['Resident Profiles','residents.html','cases.read'],['Case Management','index.html','cases.read'],['Applications & Referrals','applications.html','applications.read'],
    ['Correspondence','correspondence.html','correspondence.write'],['Field Visits','field.html','field.write'],
    ['Resident Feedback','feedback.html','feedback.write']
  ]},
  {id:'community',label:'Community',icon:'◇',items:[
    ['Community Matters','community.html','community.write'],['Events & Volunteers','events.html','community.write'],
    ['Meetings','meetings.html','community.write']
  ]},
  {id:'records',label:'Records & Knowledge',icon:'▤',items:[
    ['Records Centre','records.html','records.read'],['Global Search','search.html','search.use'],
    ['Reports','reports.html','reports.read'],['Performance','performance.html','reports.read'],
    ['Service Quality','quality.html','reports.read'],['Procedures','procedures.html','reports.read']
  ]},
  {id:'communications',label:'Communications',icon:'◈',items:[
    ['Website CMS','cms.html','content.write'],['Publishing Desk','publishing.html','content.write'],
    ['Publishing QA','publishing-qa.html','content.write']
  ]},
  {id:'admin',label:'Administration',icon:'⚙',roles:['Manager','Administrative'],items:[
    ['Roster & Coverage','roster.html','reports.read'],['Access Control','access.html',null,['Manager']],
    ['Audit Review','audit.html','audit.read'],['System Administration','system.html',null,['Manager','Administrative']],
    ['Production Control','production.html',null,['Manager','Administrative']],['Release Control','readiness.html',null,['Manager','Administrative']],
    ['Training','training.html','reports.read'],['UAT','uat.html','reports.read'],['Pilot','pilot.html','reports.read'],
    ['Go-Live & Migration','go-live.html',null,['Manager','Administrative']],['IT Review','it-review.html',null,['Manager','Administrative']]
  ]}
];
const quickItems=[
  ['New case','new-case.html','cases.write',null,'Resident case'],
  ['New resident','residents.html?new=1','cases.write',['Manager','Administrative','Senior Officer'],'Resident profile'],
  ['New application','applications.html?new=1','applications.write',null,'Application / referral'],
  ['New correspondence','correspondence.html?new=1','correspondence.write',null,'Letter / correspondence'],
  ['New field visit','field.html?new=1','field.write',null,'Field activity'],
  ['New community matter','community.html?new=matter','community.write',null,'Community matter'],
  ['New event','events.html?new=1','community.write',null,'Event / outreach'],
  ['New meeting','meetings.html?new=1','community.write',null,'Meeting / follow-up'],
  ['New record','records.html?new=1','records.write',null,'Document record']
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function currentFile(){const p=location.pathname.split('/').filter(Boolean);return p[p.length-1]||'home.html'}
function hasPermission(session,permission){
  if(!permission)return true;
  const set=session?.permissions||[];
  return set.includes('*')||set.includes(permission)||set.includes(permission+'.assigned')||set.includes(permission.replace(/\.assigned$/,''));
}
function itemAllowed(item,session){
  const permission=item[2],roles=item[3];
  if(Array.isArray(roles)&&roles.length&&!roles.includes(session?.user?.role))return false;
  return hasPermission(session,permission);
}
function visibleAreas(session){
  return areas.filter(a=>!a.roles||a.roles.includes(session?.user?.role)).map(a=>({...a,items:a.items.filter(i=>itemAllowed(i,session))})).filter(a=>a.items.length);
}
function quickVisible(session){return quickItems.filter(i=>itemAllowed([i[0],i[1],i[2],i[3]],session))}
function quickMenuMarkup(session){
  const items=quickVisible(session);if(!items.length)return '';
  return '<div class="smg-quick-menu" id="smgQuickMenu" aria-hidden="true"><div class="smg-quick-head"><small>QUICK CREATE</small><strong>Start new work</strong></div><div class="smg-quick-items">'+items.map(i=>'<a href="'+i[1]+'"><strong>'+esc(i[0])+'</strong><span>'+esc(i[4]||'')+'</span></a>').join('')+'</div></div>';
}
function isCurrent(href,file){return href===file||(file==='resident.html'&&href==='residents.html')}
function findArea(file,view){if(file==='resident.html'||file==='new-case.html')return view.find(a=>a.id==='residents')||view[0];for(const a of view)if(a.items.some(([,href])=>href===file))return a;return view[0]}
function itemLabel(area,file){if(file==='resident.html')return 'Resident Profile';if(file==='new-case.html')return 'New Case';return area?.items.find(([,href])=>href===file)?.[0]||'Staff System'}
function shellMarkup(file,active,view){
  return '<aside class="smg-shell" aria-label="Staff system navigation"><div class="smg-shell-brand"><div class="smg-shell-mark">SMG</div><div class="smg-shell-brandtext"><strong>Staff System</strong><span>Scarborough / Mt. Grace</span></div></div><nav class="smg-shell-nav">'+
    view.map(a=>{const isActive=a.id===active?.id;return '<section class="smg-nav-group '+(isActive?'active open':'')+'" data-area="'+a.id+'"><button class="smg-nav-parent" type="button" aria-expanded="'+(isActive?'true':'false')+'" title="'+esc(a.label)+'"><span class="smg-nav-icon">'+a.icon+'</span><span class="smg-nav-label">'+esc(a.label)+'</span><span class="smg-nav-caret">›</span></button><div class="smg-nav-children">'+a.items.map(([label,href])=>'<a href="'+href+'" '+(isCurrent(href,file)?'class="active" aria-current="page"':'')+'>'+esc(label)+'</a>').join('')+'</div></section>'}).join('')+
    '</nav><div class="smg-shell-footer"><div class="smg-shell-shortcuts"><a href="sections.html">Directory</a><a href="search.html">Search</a></div><div class="smg-shell-user"><strong id="smgShellUser">Staff session</strong><span id="smgShellRole">Authenticated workspace</span><button id="smgShellLogout" type="button">Sign out</button></div></div></aside>';
}
function contextMarkup(file,area,session){
  if(!area)return '';
  const label=itemLabel(area,file);
  const q=quickVisible(session);return '<div class="smg-shell-context" role="navigation" aria-label="'+esc(area.label)+' subpages"><div class="smg-context-title"><span>'+esc(area.label)+'</span><b>›</b>'+esc(label)+'</div><div class="smg-context-tabs">'+area.items.map(([name,href])=>'<a href="'+href+'" '+(isCurrent(href,file)?'class="active" aria-current="page"':'')+'>'+esc(name)+'</a>').join('')+'</div><div class="smg-context-actions">'+(q.length?'<button class="smg-quick-trigger" id="smgQuickCreate" type="button">+ New</button>':'')+'<a href="search.html">Search</a><a href="sections.html">All sections</a></div></div>';
}
async function getSession(){
  if(window.SMG?.session)return window.SMG.session();
  const r=await fetch('/api/auth/me',{credentials:'same-origin'});
  if(r.status===401){location.href='/staff/login.html?next='+encodeURIComponent(location.pathname+location.search);throw new Error('Authentication required')}
  if(!r.ok)throw new Error('Unable to verify staff session');
  const d=await r.json();return {user:d.user,permissions:d.permissions||[],csrf:d.csrf||''};
}
function hydrateUser(session){
  const u=document.getElementById('smgShellUser'),r=document.getElementById('smgShellRole');
  if(u)u.textContent=session?.user?.name||session?.user?.email||'Staff member';
  if(r)r.textContent=session?.user?.role||'Staff';
  const logout=document.getElementById('smgShellLogout');
  if(logout)logout.onclick=async()=>{try{if(window.SMG?.api)await window.SMG.api('/api/auth/logout',{method:'POST'});else await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',headers:{'X-SMG-CSRF':session.csrf||''}})}catch{}finally{location.href='/staff/login.html'}};
}
function triggerRequestedCreate(file){
  const mode=new URLSearchParams(location.search).get('new');if(!mode)return;
  const ids={'residents.html':'newResident','applications.html':'new','correspondence.html':'new','field.html':'new','records.html':'new','events.html':'new','meetings.html':'newBtn','community.html':'openMatterForm'};
  const id=ids[file];if(!id)return;
  setTimeout(()=>document.getElementById(id)?.click(),250);
}
function setCollapsed(on){
  document.body.classList.toggle('smg-shell-collapsed',!!on);
  try{localStorage.setItem(STORAGE_COLLAPSE,on?'1':'0')}catch{}
  const edge=document.querySelector('.smg-shell-edge');
  if(edge)edge.textContent=innerWidth<=900?(document.body.classList.contains('smg-shell-open')?'×':'☰'):(on?'›':'‹');
}
async function init(){
  if(document.body.dataset.smgNoShell==='true'||/\/staff\/login\.html$/i.test(location.pathname))return;
  let session;try{session=await getSession()}catch{return}
  const file=currentFile(),view=visibleAreas(session),allKnown=areas.flatMap(a=>a.items),known=allKnown.find(i=>i[1]===file);if(file==='resident.html'&&!hasPermission(session,'cases.read')){location.replace('/staff/home.html?access=limited');return}if(file==='new-case.html'&&!hasPermission(session,'cases.write')){location.replace('/staff/home.html?access=limited');return}
  if(known&&!itemAllowed(known,session)){location.replace('/staff/home.html?access=limited');return}
  const active=findArea(file,view);
  document.body.classList.add('smg-shell-active');
  let collapsed=false;try{collapsed=localStorage.getItem(STORAGE_COLLAPSE)==='1'}catch{}
  document.body.classList.toggle('smg-shell-collapsed',collapsed);
  document.body.insertAdjacentHTML('afterbegin',shellMarkup(file,active,view)+contextMarkup(file,active,session)+'<button class="smg-shell-edge" type="button" aria-label="Toggle staff navigation"></button><div class="smg-shell-overlay"></div>'+quickMenuMarkup(session));
  document.querySelectorAll('.smg-nav-parent').forEach(btn=>btn.addEventListener('click',()=>{
    const group=btn.closest('.smg-nav-group'),isOpen=group.classList.contains('open');
    if(document.body.classList.contains('smg-shell-collapsed')&&innerWidth>900){setCollapsed(false);group.classList.add('open');btn.setAttribute('aria-expanded','true');return}
    document.querySelectorAll('.smg-nav-group').forEach(g=>{if(g!==group){g.classList.remove('open');g.querySelector('.smg-nav-parent')?.setAttribute('aria-expanded','false')}});
    group.classList.toggle('open',!isOpen);btn.setAttribute('aria-expanded',String(!isOpen));
    if(!isOpen)try{localStorage.setItem(STORAGE_AREA,group.dataset.area||'')}catch{}
  }));
  const edge=document.querySelector('.smg-shell-edge'),overlay=document.querySelector('.smg-shell-overlay');
  function edgeText(){edge.textContent=innerWidth<=900?(document.body.classList.contains('smg-shell-open')?'×':'☰'):(document.body.classList.contains('smg-shell-collapsed')?'›':'‹')}
  edge.onclick=()=>{if(innerWidth<=900)document.body.classList.toggle('smg-shell-open');else setCollapsed(!document.body.classList.contains('smg-shell-collapsed'));edgeText()};
  overlay.onclick=()=>{document.body.classList.remove('smg-shell-open');edgeText()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('smg-shell-open')){document.body.classList.remove('smg-shell-open');edgeText()}});
  const quick=document.getElementById('smgQuickCreate'),menu=document.getElementById('smgQuickMenu');
  if(quick&&menu){
    quick.onclick=e=>{e.stopPropagation();const open=menu.classList.toggle('open');menu.setAttribute('aria-hidden',String(!open))};
    menu.onclick=e=>e.stopPropagation();
    document.addEventListener('click',()=>{menu.classList.remove('open');menu.setAttribute('aria-hidden','true')});
  }
  window.addEventListener('resize',edgeText);edgeText();hydrateUser(session);triggerRequestedCreate(file);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();