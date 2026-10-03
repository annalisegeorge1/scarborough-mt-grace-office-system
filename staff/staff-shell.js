(()=>{'use strict';
const STORAGE_COLLAPSE='smg_staff_shell_collapsed';
const STORAGE_AREA='smg_staff_shell_area';
const areas=[
  {id:'home',label:'Home',icon:'⌂',items:[
    ['Today','workflow.html'],['Operations Centre','command.html'],['Management Briefing','briefing.html'],['Handover','handover.html'],['Attention & Reminders','automation.html']
  ]},
  {id:'residents',label:'Residents',icon:'◉',items:[
    ['Case Management','index.html'],['Applications & Referrals','applications.html'],['Correspondence','correspondence.html'],['Field Visits','field.html'],['Resident Feedback','feedback.html']
  ]},
  {id:'community',label:'Community',icon:'◇',items:[
    ['Community Matters','community.html'],['Events & Volunteers','events.html'],['Meetings','meetings.html']
  ]},
  {id:'records',label:'Records & Knowledge',icon:'▤',items:[
    ['Records Centre','records.html'],['Global Search','search.html'],['Reports','reports.html'],['Performance','performance.html'],['Service Quality','quality.html'],['Procedures','procedures.html']
  ]},
  {id:'communications',label:'Communications',icon:'◈',items:[
    ['Website CMS','cms.html'],['Publishing Desk','publishing.html'],['Publishing QA','publishing-qa.html']
  ]},
  {id:'admin',label:'Administration',icon:'⚙',items:[
    ['Roster & Coverage','roster.html'],['Access Control','access.html'],['Audit Review','audit.html'],['System Administration','system.html'],['Production Control','production.html'],['Release Control','readiness.html'],['Training','training.html'],['UAT','uat.html'],['Pilot','pilot.html'],['Go-Live & Migration','go-live.html'],['IT Review','it-review.html']
  ]}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function currentFile(){const p=location.pathname.split('/').filter(Boolean);return p[p.length-1]||'index.html'}
function findArea(file){
  for(const a of areas)if(a.items.some(([,href])=>href===file))return a;
  return file==='sections.html'?areas[0]:areas[0];
}
function itemLabel(area,file){return area.items.find(([,href])=>href===file)?.[0]||'Staff System'}
function shellMarkup(file,active){
  return '<aside class="smg-shell" aria-label="Staff system navigation">'+
    '<div class="smg-shell-brand"><div class="smg-shell-mark">SMG</div><div class="smg-shell-brandtext"><strong>Staff System</strong><span>Scarborough / Mt. Grace</span></div></div>'+
    '<nav class="smg-shell-nav">'+areas.map(a=>{
      const isActive=a.id===active.id;
      return '<section class="smg-nav-group '+(isActive?'active open':'')+'" data-area="'+a.id+'">'+
        '<button class="smg-nav-parent" type="button" aria-expanded="'+(isActive?'true':'false')+'" title="'+esc(a.label)+'"><span class="smg-nav-icon">'+a.icon+'</span><span class="smg-nav-label">'+esc(a.label)+'</span><span class="smg-nav-caret">›</span></button>'+
        '<div class="smg-nav-children">'+a.items.map(([label,href])=>'<a href="'+href+'" '+(href===file?'class="active" aria-current="page"':'')+'>'+esc(label)+'</a>').join('')+'</div>'+
      '</section>';
    }).join('')+'</nav>'+
    '<div class="smg-shell-footer"><div class="smg-shell-shortcuts"><a href="sections.html">Directory</a><a href="search.html">Search</a></div><div class="smg-shell-user"><strong id="smgShellUser">Staff session</strong><span id="smgShellRole">Authenticated workspace</span><button id="smgShellLogout" type="button">Sign out</button></div></div>'+
  '</aside>';
}
function contextMarkup(file,area){
  const label=itemLabel(area,file);
  return '<div class="smg-shell-context" role="navigation" aria-label="'+esc(area.label)+' subpages"><div class="smg-context-title"><span>'+esc(area.label)+'</span><b>›</b>'+esc(label)+'</div><div class="smg-context-tabs">'+
    area.items.map(([name,href])=>'<a href="'+href+'" '+(href===file?'class="active" aria-current="page"':'')+'>'+esc(name)+'</a>').join('')+
    '</div><div class="smg-context-actions"><a href="search.html">Search</a><a href="sections.html">All sections</a></div></div>';
}
async function hydrateUser(){
  let session=null;
  try{
    if(window.SMG?.session)session=await window.SMG.session();
    else{
      const r=await fetch('/api/auth/me',{credentials:'same-origin'});
      if(r.ok){const d=await r.json();session={user:d.user,csrf:d.csrf||''}}
    }
  }catch{}
  if(session?.user){
    const u=document.getElementById('smgShellUser'),r=document.getElementById('smgShellRole');
    if(u)u.textContent=session.user.name||session.user.email||'Staff member';
    if(r)r.textContent=session.user.role||'Staff';
  }
  const logout=document.getElementById('smgShellLogout');
  if(logout)logout.onclick=async()=>{
    try{
      if(window.SMG?.api)await window.SMG.api('/api/auth/logout',{method:'POST'});
      else if(session?.csrf)await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',headers:{'X-SMG-CSRF':session.csrf}});
    }catch{}finally{location.href='/staff/login.html'}
  };
}
function setCollapsed(on){
  document.body.classList.toggle('smg-shell-collapsed',!!on);
  try{localStorage.setItem(STORAGE_COLLAPSE,on?'1':'0')}catch{}
  const edge=document.querySelector('.smg-shell-edge');
  if(edge)edge.textContent=innerWidth<=900?(document.body.classList.contains('smg-shell-open')?'×':'☰'):(on?'›':'‹');
}
function init(){
  if(document.body.dataset.smgNoShell==='true'||/\/staff\/login\.html$/i.test(location.pathname))return;
  const file=currentFile(),active=findArea(file);
  document.body.classList.add('smg-shell-active');
  let collapsed=false;try{collapsed=localStorage.getItem(STORAGE_COLLAPSE)==='1'}catch{}
  document.body.classList.toggle('smg-shell-collapsed',collapsed);
  document.body.insertAdjacentHTML('afterbegin',shellMarkup(file,active)+contextMarkup(file,active)+'<button class="smg-shell-edge" type="button" aria-label="Toggle staff navigation"></button><div class="smg-shell-overlay"></div>');
  document.querySelectorAll('.smg-nav-parent').forEach(btn=>btn.addEventListener('click',()=>{
    const group=btn.closest('.smg-nav-group'),isOpen=group.classList.contains('open');
    if(document.body.classList.contains('smg-shell-collapsed')&&innerWidth>900){setCollapsed(false);group.classList.add('open');btn.setAttribute('aria-expanded','true');return}
    document.querySelectorAll('.smg-nav-group').forEach(g=>{if(g!==group){g.classList.remove('open');g.querySelector('.smg-nav-parent')?.setAttribute('aria-expanded','false')}});
    group.classList.toggle('open',!isOpen);btn.setAttribute('aria-expanded',String(!isOpen));
    if(!isOpen)try{localStorage.setItem(STORAGE_AREA,group.dataset.area||'')}catch{}
  }));
  const edge=document.querySelector('.smg-shell-edge'),overlay=document.querySelector('.smg-shell-overlay');
  function edgeText(){edge.textContent=innerWidth<=900?(document.body.classList.contains('smg-shell-open')?'×':'☰'):(document.body.classList.contains('smg-shell-collapsed')?'›':'‹')}
  edge.onclick=()=>{
    if(innerWidth<=900)document.body.classList.toggle('smg-shell-open');
    else setCollapsed(!document.body.classList.contains('smg-shell-collapsed'));
    edgeText();
  };
  overlay.onclick=()=>{document.body.classList.remove('smg-shell-open');edgeText()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('smg-shell-open')){document.body.classList.remove('smg-shell-open');edgeText()}});
  window.addEventListener('resize',edgeText);edgeText();hydrateUser();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();