(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const primary=[
  ['All','All Cases','count-all'],
  ['My Cases','My Cases','count-my-cases'],
  ['Overdue','Overdue','count-overdue'],
  ['High Priority','Urgent / High','count-high-priority']
];
const statuses=['New','Unassigned','Assigned','In Progress','Awaiting Documents','Referred','Completed','Closed'];
function legacyButton(view){return $('.sidebar .nav-btn[data-view="'+CSS.escape(view)+'"]')}
function count(id){return document.getElementById(id)?.textContent?.trim()||'0'}
function sync(){
  const active=$('.sidebar .nav-btn.active')?.dataset.view||'All';
  $$('.v252-queue').forEach(b=>b.classList.toggle('active',b.dataset.view===active));
  primary.forEach(([view,,id])=>{const e=$('.v252-queue[data-view="'+CSS.escape(view)+'"] .v252-n');if(e)e.textContent=count(id)});
  const s=$('#v252-status');if(s)s.value=statuses.includes(active)?active:'';
  const live=$('#v43-live-state'),chip=$('#v252-live');
  if(chip&&live){
    const on=!live.classList.contains('offline');
    chip.classList.toggle('offline',!on);
    chip.textContent=on?(live.textContent.trim()||'CENTRAL API'):'OFFLINE / TEST FALLBACK';
  }
}
function build(){
  const main=$('#main-content');if(!main||$('#v252-casebar'))return;
  const head=$('.page-head',main),metrics=$('.metrics',main);
  if(head){
    const eyebrow=$('span',head),title=$('h2',head),p=$('p',head);
    if(eyebrow)eyebrow.textContent='RESIDENTS · CASES';
    if(title)title.textContent='Case Management';
    if(p)p.textContent='Review, assign and follow resident cases from intake through action, referral, resident update and completion.';
  }
  const notice=$('.notice',main);
  if(notice)notice.textContent='Pre-launch safeguard: central API records are authoritative when signed in. Browser fallback is for testing only; do not place confidential resident documents in unapproved storage.';
  const bar=document.createElement('section');bar.id='v252-casebar';bar.className='v252-casebar';
  bar.innerHTML='<div class="v252-casebar-top"><div class="v252-casebar-copy"><small>CASE QUEUES</small><strong>Choose the work that needs attention</strong><span>Queue filters affect the register below; module navigation stays in the main Residents tabs.</span></div><span class="v252-live offline" id="v252-live">CHECKING</span></div><div class="v252-casebar-controls" id="v252-controls"></div>';
  (metrics||notice||head)?.before(bar);
  const controls=$('#v252-controls',bar);
  primary.forEach(([view,label,id])=>{
    const b=document.createElement('button');b.type='button';b.className='v252-queue';b.dataset.view=view;b.innerHTML=label+' <span class="v252-n">'+count(id)+'</span>';
    b.onclick=()=>legacyButton(view)?.click();controls.appendChild(b);
  });
  const wrap=document.createElement('div');wrap.className='v252-status-wrap';
  wrap.innerHTML='<label for="v252-status">STATUS</label><select id="v252-status"><option value="">Any status</option>'+statuses.map(x=>'<option>'+x+'</option>').join('')+'</select>';
  controls.appendChild(wrap);
  $('#v252-status').onchange=e=>{const v=e.target.value;(v?legacyButton(v):legacyButton('All'))?.click()};
  const refresh=document.createElement('button');refresh.type='button';refresh.className='v252-mini-action';refresh.textContent='Refresh';refresh.onclick=()=>document.getElementById('v43-refresh')?.click();controls.appendChild(refresh);
  const today=document.createElement('a');today.className='v252-mini-action';today.href='workflow.html';today.textContent='Today';controls.appendChild(today);
  const search=document.createElement('a');search.className='v252-mini-action';search.href='search.html';search.textContent='Global Search';controls.appendChild(search);

  const targets=['count-all','count-my-cases','count-overdue','count-high-priority','v43-live-state'];
  const mo=new MutationObserver(sync);
  targets.forEach(id=>{const e=document.getElementById(id);if(e)mo.observe(e,{childList:true,subtree:true,attributes:true})});
  $$('.sidebar .nav-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
  sync();
}
function init(){
  if(!document.body.classList.contains('smg-shell-active'))return setTimeout(init,30);
  build();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();