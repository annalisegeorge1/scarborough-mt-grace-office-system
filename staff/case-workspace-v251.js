(()=>{'use strict';
const state={caseId:null,workspace:null,csrf:'',loading:false,activeTab:'overview'};
const tabs=[
  ['overview','Overview'],['activity','Activity'],['applications','Applications'],['correspondence','Correspondence'],
  ['field','Field Visits'],['documents','Documents'],['feedback','Feedback'],['timeline','Timeline']
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>{if(!v)return '—';try{return new Date(v).toLocaleString('en-TT',{dateStyle:'medium',timeStyle:String(v).includes('T')?'short':undefined})}catch{return String(v)}};
const val=(o,...keys)=>{for(const k of keys)if(o&&o[k]!=null&&o[k]!=='')return o[k];return null};
function currentFromQuery(){try{return new URLSearchParams(location.search).get('case')||null}catch{return null}}
function closestSection(id){return document.getElementById(id)?.closest('section')||null}
function make(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e}
function pane(id){return document.querySelector('.v251-pane[data-pane="'+id+'"]')}
function setTab(id){
  state.activeTab=id;
  document.querySelectorAll('.v251-tabs button').forEach(b=>{const on=b.dataset.tab===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});
  document.querySelectorAll('.v251-pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===id));
  try{sessionStorage.setItem('smg_v251_case_tab',id)}catch{}
}
function moduleUrl(page){const w=state.workspace,c=w?.case||{};const q=new URLSearchParams();if(state.caseId)q.set('caseId',state.caseId);if(c.reference)q.set('case',c.reference);if(c.fullName)q.set('resident',c.fullName);return page+(q.toString()?'?'+q.toString():'')}
function panel(title,desc,page,label){
  const e=make('section','v251-live-panel');
  e.innerHTML='<div class="v251-panel-top"><div><h4>'+esc(title)+'</h4><p>'+esc(desc)+'</p></div>'+(page?'<div class="v251-panel-actions"><a class="v251-link" href="'+esc(moduleUrl(page))+'">'+esc(label||'Open module')+'</a></div>':'')+'</div><div class="v251-list"></div>';
  return e;
}
function ensureLayout(){
  const drawer=document.querySelector('#drawer-backdrop .drawer'),body=drawer?.querySelector('.drawer-body');
  if(!drawer||!body||drawer.dataset.v251Ready==='1')return;
  drawer.dataset.v251Ready='1';
  const notice=body.querySelector('.v75-dialog-note');
  const head=make('div','v251-workspace-head','<div id="v251-case-strip" class="v251-case-strip"><div class="v251-case-stat primary"><small>Resident workspace</small><strong>Open a case</strong></div></div><div class="v251-tabs" role="tablist"></div>');
  (notice||body.firstChild)?.after?.(head);if(!head.parentNode)body.prepend(head);
  const tabbar=head.querySelector('.v251-tabs');
  tabs.forEach(([id,label])=>{const b=make('button','',esc(label)+' <span class="v251-count" data-count="'+id+'">0</span>');b.type='button';b.dataset.tab=id;b.setAttribute('role','tab');b.onclick=()=>setTab(id);tabbar.appendChild(b)});
  const host=make('div','v251-panes');
  head.after(host);
  tabs.forEach(([id])=>{const p=make('div','v251-pane');p.dataset.pane=id;p.setAttribute('role','tabpanel');host.appendChild(p)});

  const move=(node,to)=>{if(node&&pane(to))pane(to).appendChild(node)};
  move(document.getElementById('case-grid'),'overview');
  move(closestSection('case-message'),'overview');
  move(closestSection('save-case'),'overview');
  move(document.getElementById('v39-community-integration'),'overview');
  move(document.getElementById('v38-resident-summary'),'overview');

  move(document.getElementById('v138-case-communications'),'activity');
  move(document.getElementById('resident-facing-update'),'activity');
  move(document.getElementById('resident-notification-tools'),'activity');
  move(closestSection('new-note'),'activity');

  move(closestSection('save-referral'),'applications');
  move(document.getElementById('v38-documents'),'documents');
  move(closestSection('activity-list'),'timeline');

  const apps=panel('Linked applications','Application and referral records attached to this case.','applications.html','Open Applications');apps.id='v251-applications';pane('applications').prepend(apps);
  const corr=panel('Linked correspondence','Letters and issued correspondence linked to this case.','correspondence.html','Open Correspondence');corr.id='v251-correspondence';pane('correspondence').append(corr);
  const field=panel('Linked field visits','Site visits and field activity linked to this case.','field.html','Open Field Operations');field.id='v251-field';pane('field').append(field);
  const fb=panel('Resident feedback & recovery','Feedback and service-recovery actions linked to this case.','feedback.html','Open Feedback');fb.id='v251-feedback';pane('feedback').append(fb);
  const timeline=panel('Central case timeline','Server-backed activity recorded against this case.');timeline.id='v251-timeline';pane('timeline').prepend(timeline);

  const noteSec=closestSection('new-note');
  if(noteSec){
    const oldInput=document.getElementById('new-note'),oldBtn=document.getElementById('add-note');
    if(oldInput)oldInput.style.display='none';if(oldBtn)oldBtn.style.display='none';
    const composer=make('div','v251-note-compose','<textarea id="v251-note-text" placeholder="Add a permanent internal case note…"></textarea><button id="v251-note-save" type="button">SAVE NOTE</button>');
    const status=make('div','v251-statusline');status.id='v251-note-status';
    const list=document.getElementById('notes-list');
    noteSec.insertBefore(composer,list||null);noteSec.insertBefore(status,list||null);
    composer.querySelector('button').onclick=saveNote;
  }

  const docs=document.getElementById('v38-documents');
  if(docs){
    const note=make('div','v251-records-note','Documents shown here come from the central Records Centre. Use Records Centre to register metadata or upload files to configured private storage. <a href="records.html">Open Records Centre →</a>');
    const list=document.getElementById('docs-list');docs.insertBefore(note,list||null);
  }
  let remembered='overview';try{remembered=sessionStorage.getItem('smg_v251_case_tab')||'overview'}catch{}
  setTab(tabs.some(x=>x[0]===remembered)?remembered:'overview');
}
async function getCsrf(){
  if(state.csrf)return state.csrf;
  const r=await fetch('/api/auth/me',{credentials:'same-origin'});if(!r.ok)throw new Error('Unable to verify staff session');
  const d=await r.json();state.csrf=d.csrf||'';return state.csrf;
}
async function api(path,opt={}){
  const o={credentials:'same-origin',...opt};o.headers={...(opt.headers||{})};
  if(o.body&&!(o.body instanceof FormData)){o.headers['Content-Type']='application/json';if(typeof o.body!=='string')o.body=JSON.stringify(o.body)}
  if(!['GET','HEAD'].includes((o.method||'GET').toUpperCase()))o.headers['X-SMG-CSRF']=await getCsrf();
  const r=await fetch(path,o);let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.detail||'Request failed ('+r.status+')');return d;
}
function setCount(id,n){const e=document.querySelector('[data-count="'+id+'"]');if(e)e.textContent=String(n||0)}
function restricted(list,message){list.innerHTML='<div class="v251-restricted">'+esc(message)+'</div>'}
function renderItems(host,rows,render,emptyText){
  const list=host?.querySelector('.v251-list');if(!list)return;
  list.innerHTML=rows?.length?rows.map(render).join(''):'<div class="v251-empty">'+esc(emptyText)+'</div>';
}
function renderWorkspace(w){
  state.workspace=w;const c=w.case||{},p=w.permissions||{};
  const strip=document.getElementById('v251-case-strip');
  if(strip)strip.innerHTML=[
    ['Resident workspace',c.fullName||c.resident_name||'Unnamed resident','primary'],
    ['Case',c.reference||'—',''],['Status',c.status||'—',''],['Owner',c.caseOwner||c.owner_name||'Unassigned',''],['Next follow-up',c.followUpDate||c.next_follow_up||'Not set','']
  ].map(([a,b,k])=>'<div class="v251-case-stat '+k+'"><small>'+esc(a)+'</small><strong>'+esc(b)+'</strong></div>').join('');

  setCount('applications',w.applications?.length);setCount('correspondence',w.correspondence?.length);setCount('field',w.fieldVisits?.length);setCount('documents',w.documents?.length);setCount('feedback',w.feedback?.length);setCount('timeline',w.activity?.length);setCount('activity',(w.notes?.length||0)+(w.appointments?.length||0));

  const appHost=document.getElementById('v251-applications');
  if(!p.applications)restricted(appHost.querySelector('.v251-list'),'Your role does not have Applications access.');
  else renderItems(appHost,w.applications,a=>'<article class="v251-item"><div><strong>'+esc(a.reference)+' · '+esc(a.assistance_type)+'</strong><small>'+esc(a.agency||'No agency recorded')+' · Follow-up '+esc(a.next_follow_up||'not set')+'</small><p>'+esc(a.applicant_name||'')+'</p></div><span class="v251-badge">'+esc(a.stage||'')+'</span></article>','No applications are linked to this case.');

  const corrHost=document.getElementById('v251-correspondence');
  if(!p.correspondence)restricted(corrHost.querySelector('.v251-list'),'Your role does not have Correspondence access.');
  else renderItems(corrHost,w.correspondence,a=>'<article class="v251-item"><div><strong>'+esc(a.correspondence_reference||'Correspondence')+' · '+esc(a.subject)+'</strong><small>'+esc(a.recipient_name||'No recipient recorded')+' · '+esc(fmt(a.updated_at||a.created_at))+'</small></div><span class="v251-badge">'+esc(a.workflow||'Draft')+'</span></article>','No correspondence is linked to this case.');

  const fieldHost=document.getElementById('v251-field');
  if(!p.field)restricted(fieldHost.querySelector('.v251-list'),'Your role does not have Field Operations access.');
  else renderItems(fieldHost,w.fieldVisits,a=>'<article class="v251-item"><div><strong>'+esc(a.visit_type||'Field visit')+' · '+esc(a.location_text||'Location not recorded')+'</strong><small>'+esc(fmt(a.scheduled_at||a.completed_at||a.updated_at))+'</small><p>'+esc(a.next_action||a.public_outcome||a.purpose||'')+'</p></div><span class="v251-badge">'+esc(a.status||'Planned')+'</span></article>','No field visits are linked to this case.');

  const fbHost=document.getElementById('v251-feedback');
  if(!p.feedback)restricted(fbHost.querySelector('.v251-list'),'Your role does not have Resident Feedback access.');
  else renderItems(fbHost,w.feedback,a=>'<article class="v251-item"><div><strong>'+esc(a.feedback_type||'Feedback')+(a.theme?' · '+esc(a.theme):'')+'</strong><small>'+esc(fmt(a.updated_at||a.created_at))+(a.rating?' · Rating '+esc(a.rating)+'/5':'')+'</small><p>'+esc(a.details||'')+'</p></div><span class="v251-badge">'+esc(a.status||'Open')+'</span></article>','No resident feedback is linked to this case.');

  const noteList=document.getElementById('notes-list');
  if(noteList){
    noteList.innerHTML=w.notes?.length?w.notes.map(n=>'<article class="v251-server-note"><strong>'+esc(n.author_name||'Staff')+'</strong><time>'+esc(fmt(n.created_at))+'</time><p>'+esc(n.note_text)+'</p></article>').join(''):'<div class="v251-empty">No permanent internal notes have been recorded.</div>';
  }

  const docsList=document.getElementById('docs-list');
  const drawer=document.querySelector('#drawer-backdrop .drawer');
  if(drawer)drawer.classList.add('v251-central');
  if(docsList){
    if(!p.records)docsList.innerHTML='<div class="v251-restricted">Your role does not have Records Centre access.</div>';
    else docsList.innerHTML=w.documents?.length?w.documents.map(d=>'<article class="v251-item"><div><strong>'+esc(d.record_reference)+' · '+esc(d.title)+'</strong><small>'+esc(d.document_type||'Document')+' · '+esc(d.sensitivity||'Internal')+' · '+esc(d.review_status||'Needs Review')+'</small></div><span class="v251-badge">'+esc(d.original_filename?'FILE':'METADATA')+'</span></article>').join(''):'<div class="v251-empty">No central records are linked to this case.</div>';
  }

  const timeline=document.getElementById('v251-timeline')?.querySelector('.v251-list');
  if(timeline)timeline.innerHTML=w.activity?.length?'<div class="v251-server-timeline">'+w.activity.map(a=>'<article class="v251-event"><i></i><time>'+esc(fmt(a.occurred_at))+'</time><div><strong>'+esc(a.activity_type||'Case activity')+(a.actor_name?' · '+esc(a.actor_name):'')+'</strong>'+esc(a.description||'Activity recorded.')+'</div></article>').join('')+'</div>':'<div class="v251-empty">No central case activity has been recorded.</div>';
}
async function loadWorkspace(){
  ensureLayout();if(!state.caseId||state.loading)return;
  state.loading=true;
  const status=document.getElementById('v251-note-status');if(status)status.textContent='Loading central case workspace…';
  try{const w=await api('/api/cases/'+encodeURIComponent(state.caseId)+'/workspace');renderWorkspace(w);if(status)status.textContent='Central case workspace synchronized.'}
  catch(e){if(status)status.textContent='Workspace unavailable: '+e.message}
  finally{state.loading=false}
}
async function saveNote(){
  const box=document.getElementById('v251-note-text'),btn=document.getElementById('v251-note-save'),status=document.getElementById('v251-note-status');
  const text=box?.value.trim();if(!text||!state.caseId)return;
  if(btn)btn.disabled=true;if(status)status.textContent='Saving permanent note…';
  try{await api('/api/cases/'+encodeURIComponent(state.caseId)+'/notes',{method:'POST',body:{text}});box.value='';await loadWorkspace();if(status)status.textContent='Permanent note saved.'}
  catch(e){if(status)status.textContent=e.message}
  finally{if(btn)btn.disabled=false}
}
function trackCaseFromEvent(e){
  const row=e.target.closest?.('tr[data-id]'),alert=e.target.closest?.('[data-v36-case]');
  if(row?.dataset.id)state.caseId=row.dataset.id;
  else if(alert?.dataset.v36Case)state.caseId=alert.dataset.v36Case;
  const save=e.target.closest?.('#save-case,#save-referral,#save-public-update,#v39-save-community');
  if(save&&state.caseId)setTimeout(loadWorkspace,900);
}
function init(){
  state.caseId=currentFromQuery();
  ensureLayout();
  document.addEventListener('click',trackCaseFromEvent,true);
  const backdrop=document.getElementById('drawer-backdrop');
  if(backdrop){
    const ob=new MutationObserver(()=>{if(backdrop.classList.contains('open'))setTimeout(loadWorkspace,40)});
    ob.observe(backdrop,{attributes:true,attributeFilter:['class']});
  }
  if(state.caseId&&backdrop?.classList.contains('open'))loadWorkspace();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();