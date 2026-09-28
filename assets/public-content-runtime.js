(()=>{'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const txt=(s='')=>String(s).trim();
const meta=x=>(x&&typeof x==='object'&&!Array.isArray(x))?x:{};
const norm=s=>txt(s).toLowerCase().replace(/\s+/g,' ');

function statusClass(status){
  const s=norm(status);
  if(/complete|confirm|resolved/.test(s))return 'confirmed';
  if(/develop|draft|prepar/.test(s))return 'development';
  if(/follow|hold|await/.test(s))return 'followup';
  return 'planning';
}
function formKey(card){
  const a=$('[data-v53-pdf]',card);
  const title=txt(a?.dataset?.v53Title||$('h3,strong',card)?.textContent||'').replace(/^Open\s+/i,'');
  return txt(a?.dataset?.v53Pdf)||title;
}
function activityKey(card){
  const title=txt($('h4',card)?.textContent||'');
  return card.classList.contains('v26-project')?`project:${title}`:`notice:${title}`;
}
function setHidden(el,yes){
  if(!el)return;
  el.hidden=!!yes;
  el.style.display=yes?'none':'';
}
function fmtDate(v){
  if(!v)return '';
  try{return new Date(v).toLocaleDateString('en-TT',{day:'numeric',month:'short',year:'numeric'})}catch{return ''}
}

async function getContent(section){
  const r=await fetch('/api/public/content?section='+encodeURIComponent(section),{credentials:'same-origin',cache:'no-store'});
  if(!r.ok)throw new Error('Public content unavailable');
  return (await r.json()).content||[];
}

/* ---------------- Forms & Public Documents ---------------- */
function renderManagedForm(x){
  const host=$('#service-forms .v16-form-grid');
  if(!host||!x.publicUrl)return;
  const card=document.createElement('article');
  card.className='v16-form-card v202-managed-form';
  card.dataset.v21Category=x.category||'other';
  card.dataset.v27SearchAlias=[x.title,x.summary,x.category,x.responsibleAuthority].filter(Boolean).join(' ');
  card.innerHTML=`
    <div class="v16-pdf-icon" aria-hidden="true">PDF</div>
    <div class="v202-form-copy">
      <small>PUBLIC DOCUMENT</small>
      <h3>${escapeHtml(x.title)}</h3>
      ${x.summary?`<p>${escapeHtml(x.summary)}</p>`:''}
      ${x.responsibleAuthority?`<small class="v202-authority">Responsible authority: ${escapeHtml(x.responsibleAuthority)}</small>`:''}
      <a class="v202-open-document" href="${escapeAttr(x.publicUrl)}" target="_blank" rel="noopener">OPEN DOCUMENT →</a>
    </div>`;
  host.appendChild(card);
}
function applyFormContent(records){
  const overrides=new Map(records.filter(x=>x.type==='form_override').map(x=>[txt(meta(x.metadata).staticKey),x]));
  $$('#service-forms .v16-form-card').forEach(card=>{
    const o=overrides.get(formKey(card));
    if(o&&meta(o.metadata).action==='hide')setHidden(card,true);
  });
  records.filter(x=>x.type==='form').forEach(renderManagedForm);

  const cards=$$('#service-forms .v16-form-card').filter(x=>!x.hidden&&x.style.display!=='none');
  const n=cards.length;
  const count=$('#service-forms .v50-form-library-status > div:first-child strong');
  if(count)count.textContent=`${n} PDF document${n===1?'':'s'}`;
  const intro=$('#service-forms .v12-section-head p');
  if(intro)intro.textContent=intro.textContent.replace(/Browse the \d+ forms?/i,`Browse the ${n} forms`);

  const search=$('#v21-form-search');
  const filters=$$('#service-forms .v21-filter');
  const apply=()=>{
    const q=norm(search?.value||'');
    const active=filters.find(b=>b.classList.contains('is-active'))?.dataset.filter||'all';
    $$('#service-forms .v16-form-card').forEach(card=>{
      if(card.hidden)return;
      const category=card.dataset.v21Category||'';
      const hay=norm((card.dataset.v27SearchAlias||'')+' '+card.textContent);
      const show=(active==='all'||category===active)&&(!q||hay.includes(q));
      card.style.display=show?'':'none';
    });
  };
  search?.addEventListener('input',apply);
  filters.forEach(b=>b.addEventListener('click',()=>setTimeout(apply,0)));
}

/* ---------------- District Activity Hub ---------------- */
function applyActivityOverride(card,x){
  const m=meta(x.metadata);
  if(m.action==='hide'){setHidden(card,true);return}
  const title=$('h4',card); if(title&&x.title)title.textContent=x.title;
  const summary=$('h4 + p',card)||$('p',card); if(summary&&x.summary)summary.textContent=x.summary;
  const status=x.publicStatus||'';
  if(card.classList.contains('v26-project')){
    if(m.code){
      const code=$('.v26-project-code',card); if(code)code.textContent=m.code;
    }
    if(m.role){
      const role=[...card.querySelectorAll('.v26-project-meta span')].find(s=>/DISTRICT OFFICE ROLE/i.test(s.textContent));
      const b=role?.querySelector('b');if(b)b.textContent=m.role;
    }
    if(status){
      card.dataset.v90Status=statusClass(status).replace('planning','planned');
      const ps=$('.v90-public-status',card);
      if(ps){ps.className='v90-public-status '+statusClass(status);ps.textContent=status.toUpperCase()}
      const pub=[...card.querySelectorAll('.v26-project-meta span')].find(s=>/PUBLIC STATUS/i.test(s.textContent));
      const b=pub?.querySelector('b');if(b)b.textContent=status;
      const badge=$('.v26-stage-wrap .v26-badge',card);if(badge)badge.textContent=status.toUpperCase();
    }
    if(x.statusNote){
      const em=$('.v90-status-inline em',card);if(em)em.textContent=x.statusNote;
    }
  }else{
    if(status){
      const badge=$('.v26-badge',card);
      if(badge){badge.className='v26-badge '+statusClass(status);badge.textContent=status.toUpperCase()}
    }
  }
  if(x.eventDate){
    let d=$('.v202-public-date',card);
    if(!d){d=document.createElement('div');d.className='v202-public-date';card.appendChild(d)}
    d.textContent='DATE • '+fmtDate(x.eventDate);
  }
}
function renderProject(x){
  const panel=$('#activity-hub #projects');if(!panel)return;
  const host=$('.v26-project-grid,.v26-project-list',panel)||panel;
  const m=meta(x.metadata),sc=statusClass(x.publicStatus||'Planned');
  const el=document.createElement('article');
  el.className='v26-project v202-managed-activity';
  el.dataset.v26Category=x.category||'community';
  el.dataset.v90Status=sc==='planning'?'planned':sc;
  el.innerHTML=`
    <div class="v26-project-main">
      <div class="v26-project-code">${escapeHtml(m.code||x.category||'DISTRICT UPDATE')}</div>
      <div class="v90-status-inline">
        <small>PUBLIC STATUS</small>
        <span class="v90-public-status ${sc}">${escapeHtml((x.publicStatus||'Planned').toUpperCase())}</span>
        ${x.statusNote?`<em>${escapeHtml(x.statusNote)}</em>`:''}
      </div>
      <h4>${escapeHtml(x.title)}</h4>
      ${x.summary?`<p>${escapeHtml(x.summary)}</p>`:''}
      <div class="v26-project-meta">
        <span><small>DISTRICT OFFICE ROLE</small><b>${escapeHtml(m.role||'Public Update')}</b></span>
        <span><small>PUBLIC STATUS</small><b>${escapeHtml(x.publicStatus||'Planned')}</b></span>
      </div>
      ${x.eventDate?`<div class="v202-public-date">DATE • ${escapeHtml(fmtDate(x.eventDate))}</div>`:''}
    </div>
    <div class="v26-stage-wrap">
      <span class="v26-badge ${sc}">${escapeHtml((x.publicStatus||'Planned').toUpperCase())}</span>
      <div class="v26-stage"><i class="done"></i><i></i><i></i><i></i></div>
      <small>${escapeHtml(x.body||'District Office update → follow-up → next action → completion')}</small>
    </div>`;
  const note=$('.v26-tracker-note',panel);
  note?panel.insertBefore(el,note):host.appendChild(el);
}
function renderNotice(x){
  const subtype=meta(x.metadata).subtype||'notice';
  const panel=subtype==='townhall'?$('#activity-hub #events'):$('#activity-hub #notices');
  if(!panel)return;
  const host=$('.v26-notice-grid',panel)||panel;
  const sc=statusClass(x.publicStatus||'Planned');
  const el=document.createElement('article');
  el.className='v26-notice v202-managed-activity';
  el.innerHTML=`
    <div class="v26-notice-top">
      <span class="v26-badge ${sc}">${escapeHtml((x.publicStatus||'Planned').toUpperCase())}</span>
      <small>${escapeHtml(x.category|| (subtype==='townhall'?'Town Hall Programme':'District Notice'))}</small>
    </div>
    <h4>${escapeHtml(x.title)}</h4>
    ${x.summary?`<p>${escapeHtml(x.summary)}</p>`:''}
    ${x.eventDate?`<div class="v202-public-date">DATE • ${escapeHtml(fmtDate(x.eventDate))}</div>`:''}`;
  host.appendChild(el);
}
function refreshActivityCounts(records){
  const hub=$('#activity-hub');if(!hub)return;
  const summaries=$$('.v26-summary article',hub);
  const notices=$$('.v26-notice',hub).filter(x=>!x.hidden&&x.style.display!=='none').length;
  const projects=$$('.v26-project',hub).filter(x=>!x.hidden&&x.style.display!=='none').length;
  if(summaries[0]){const n=$('.v26-summary-num',summaries[0]);if(n)n.textContent=String(notices).padStart(2,'0')}
  if(summaries[3]){const n=$('.v26-summary-num',summaries[3]);if(n)n.textContent=String(projects).padStart(2,'0')}

  const townhall=records.find(x=>{
    const m=meta(x.metadata);return (x.type==='activity'||x.type==='activity_override')&&m.subtype==='townhall'&&x.eventDate&&m.action!=='hide';
  });
  if(townhall&&summaries[1]){
    const s=$('small',summaries[1]);
    if(s)s.textContent='Next published date • '+fmtDate(townhall.eventDate);
  }

  const counts={confirmed:0,planned:0,development:0,followup:0};
  $$('.v26-project',hub).filter(x=>!x.hidden&&x.style.display!=='none').forEach(card=>{
    const v=card.dataset.v90Status||'';
    if(v in counts)counts[v]++;
    else if(v==='planning')counts.planned++;
  });
  $$('.v90-status-overview article',hub).forEach(a=>{
    const key=['confirmed','planned','development','followup'].find(k=>a.classList.contains(k));
    if(key&&counts[key]>0){
      const n=$('.v90-status-count',a);if(n)n.textContent=counts[key];
    }
  });
}
function applyActivityContent(records){
  const overrides=new Map(records.filter(x=>x.type==='activity_override').map(x=>[txt(meta(x.metadata).staticKey),x]));
  $$('#activity-hub .v26-project,#activity-hub .v26-notice').forEach(card=>{
    const o=overrides.get(activityKey(card));
    if(o)applyActivityOverride(card,o);
  });
  records.filter(x=>x.type==='activity').forEach(x=>{
    const subtype=meta(x.metadata).subtype||'project';
    subtype==='project'?renderProject(x):renderNotice(x);
  });
  refreshActivityCounts(records);
}

/* Small style additions for database-managed cards. */
function addStyles(){
  if($('#v202-public-content-css'))return;
  const s=document.createElement('style');s.id='v202-public-content-css';
  s.textContent=`
    .v202-managed-form .v16-pdf-icon{display:grid;place-items:center;font-weight:950;color:#0b3553}
    .v202-form-copy h3{margin:4px 0 5px}
    .v202-authority{display:block;margin-top:5px;color:#405b69}
    .v202-open-document{display:inline-flex;margin-top:8px;font-size:8px;font-weight:950;color:#0b3553;text-decoration:none}
    .v202-public-date{margin-top:8px;font-size:8px;font-weight:950;letter-spacing:.05em;color:#0b3553}
    body.v112-dark .v202-public-date,body.v112-dark .v202-open-document{color:#f0d895}
  `;
  document.head.appendChild(s);
}
function clarifySupportingDocuments(){
  const input=$('#supporting-files');
  if(!input||!input.disabled)return;
  const group=input.closest('.form-group');
  if(!group)return;
  input.hidden=true;
  input.style.display='none';
  input.setAttribute('aria-hidden','true');
  const label=$('label[for="supporting-files"]',group);
  if(label){label.removeAttribute('for');label.textContent='Supporting documents';}
  const help=$('#v48-files-help',group);
  if(help)help.textContent='Document upload is not available on this staging site. Submit your enquiry without attachments and keep your reference number. The District Office will advise how to provide any documents it needs through an approved secure method.';
  $('.v33-file-note',group)?.remove();
  group.classList.add('v203-document-note');
  const style=document.createElement('style');
  style.id='v203-document-note-css';
  style.textContent='#enquiry .v203-document-note{padding:14px 16px;border:1px solid rgba(11,53,83,.18);border-left:4px solid #c9a34a;border-radius:10px;background:#f8fbfc}#enquiry .v203-document-note .v48-form-help{margin:6px 0 0;color:#385669;font-size:13px;line-height:1.55}';
  document.head.appendChild(style);
}
function improveActivityHubContrast(){
  if(!$('#activity-hub')||$('#v203-activity-contrast-css'))return;
  const style=document.createElement('style');
  style.id='v203-activity-contrast-css';
  style.textContent=`
    body:not(.v112-dark) #activity-hub .v26-hub-head h2{color:#0b2e48!important;text-shadow:none!important}
    body:not(.v112-dark) #activity-hub .v26-hub-head .v26-eyebrow{color:#31546b!important}
    body:not(.v112-dark) #activity-hub .v26-hub-head .v26-status-key span{color:#244960!important}
  `;
  document.head.appendChild(style);
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function escapeAttr(v){return escapeHtml(v).replace(/`/g,'&#96;')}

async function init(){
  addStyles();
  clarifySupportingDocuments();
  improveActivityHubContrast();
  const jobs=[];
  if($('#service-forms'))jobs.push(getContent('forms').then(applyFormContent).catch(()=>{}));
  if($('#activity-hub'))jobs.push(getContent('activity').then(applyActivityContent).catch(()=>{}));
  await Promise.all(jobs);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
