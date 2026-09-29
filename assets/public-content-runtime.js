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
const collectionOffices={
  community:{name:'Community Development and Social Protection',address:'#10 Montessori Drive\nGlen Road\nScarborough',phone:'(868) 639-4818'},
  education:{name:'Education, Skills and Innovation',address:'Dutch Fort Plaza\nDutch Fort\nScarborough',phone:'(868) 299-0781'},
  finance:{name:'Finance, Trade and the Economy',address:'The Victor E. Bruce Financial Complex\n6–10 Post Office Street\nScarborough',phone:'(868) 639-4412'},
  food:{name:'Food Security',address:'Milshirv Administrative Complex\nCor. Milford & Shirvan Road\nTobago',phone:'(868) 639-1966'},
  health:{name:'Health and Wellness',address:'#7 Montessori Drive\nGlen Road\nScarborough\nTobago',phone:'(868) 639-3395'},
  infrastructure:{name:'Public Infrastructure and Transportation',address:'Old Government Farm Road\nShaw Park\nScarborough',phone:'(868) 639-1287'},
  chief:{name:'Office of The Chief Secretary',address:'Naresh Persad Building\nBacolet Street\nScarborough',phone:'(868) 639-3421'},
  housing:{name:'Housing, Settlements and Public Utilities',address:'D Colosseum Building #2\nCor. Airport Bypass & Milford Road\nCrown Point',phone:'(868) 639-6800'},
  tourism:{name:'Tourism, Antiquities and Creative Industries',address:'#12 Sankar Building\nSangster’s Hill\nScarborough',phone:'(868) 639-2125'}
};
function collectionLink(key){
  if(key==='district')return '<a class="v202-open-document" href="#contact">CONTACT DISTRICT OFFICE →</a>';
  const office=collectionOffices[key];
  return office?`<a class="v202-open-document" href="#v205-collection-offices">SEE OFFICE DETAILS →</a>`:'';
}
function showCollectionDirectory(){
  const section=$('#service-forms');if(!section||$('#v205-collection-offices'))return;
  const directory=document.createElement('section');directory.id='v205-collection-offices';directory.className='v205-collection';
  directory.innerHTML=`<div class="v205-collection-head"><div><small>FIND YOUR COLLECTION OFFICE</small><h3>Where to collect a form in person</h3><p>Some forms are supplied by the responsible THA division or the District Office. Browse the offices below and call before visiting to confirm the form is available and what you need to bring.</p></div></div><div class="v205-collection-rail" aria-label="THA collection offices">${Object.values(collectionOffices).map((o,i)=>`<article class="v205-office-card"><small>COLLECTION OFFICE ${String(i+1).padStart(2,'0')}</small><h4>${escapeHtml(o.name)}</h4><address>${escapeHtml(o.address)}</address><div class="v205-office-status"><span>FORM AVAILABILITY</span><strong>Call to confirm before visiting</strong></div><a href="tel:${o.phone.replace(/\D/g,'')}" aria-label="Call ${escapeAttr(o.name)} at ${escapeAttr(o.phone)}">CALL ${escapeHtml(o.phone)} →</a></article>`).join('')}</div><div class="v205-collection-nav"><button type="button" class="v205-prev" aria-label="Previous collection office">‹</button><div class="v205-dots" aria-label="Collection office navigation"></div><button type="button" class="v205-next" aria-label="Next collection office">›</button></div><p class="v205-collection-source">Division contact details: <a href="https://www.tha.gov.tt/contact/" target="_blank" rel="noopener noreferrer">Tobago House of Assembly directory</a>. Form availability varies by programme.</p>`;
  const anchor=$('.v16-help-box',section);
  anchor?anchor.before(directory):section.querySelector('.wrap')?.appendChild(directory);
  const rail=$('.v205-collection-rail',directory),cards=$$('.v205-office-card',rail),dots=$('.v205-dots',directory);
  const goTo=i=>rail.scrollTo({left:cards[i].offsetLeft-cards[0].offsetLeft,behavior:'smooth'});
  cards.forEach((_,i)=>{const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',`Show collection office ${i+1}: ${collectionOffices[Object.keys(collectionOffices)[i]].name}`);dot.addEventListener('click',()=>goTo(i));dots.appendChild(dot)});
  const current=()=>cards.reduce((best,card,i)=>Math.abs((card.offsetLeft-cards[0].offsetLeft)-rail.scrollLeft)<Math.abs((cards[best].offsetLeft-cards[0].offsetLeft)-rail.scrollLeft)?i:best,0);
  const update=()=>{$$('button',dots).forEach((dot,i)=>{dot.classList.toggle('is-active',i===current());dot.setAttribute('aria-current',i===current()?'true':'false')})};
  $('.v205-prev',directory).addEventListener('click',()=>goTo(Math.max(0,current()-1)));
  $('.v205-next',directory).addEventListener('click',()=>goTo(Math.min(cards.length-1,current()+1)));
  rail.addEventListener('scroll',update,{passive:true});update();
}
function renderManagedForm(x){
  const host=$('#service-forms .v16-form-grid');
  const pickup=meta(x.metadata).delivery==='in_person';
  if(!host||(!pickup&&!x.publicUrl))return;
  const officeKey=meta(x.metadata).collectionOffice;
  const office=collectionOffices[officeKey];
  const card=document.createElement('article');
  card.className='v16-form-card v202-managed-form';
  card.dataset.v21Category=x.category||'other';
  card.dataset.v27SearchAlias=[x.title,x.summary,x.category,x.responsibleAuthority].filter(Boolean).join(' ');
  card.innerHTML=`
    <div class="v16-pdf-icon" aria-hidden="true">${pickup?'OFFICE':'PDF'}</div>
    <div class="v202-form-copy">
      <small>${pickup?'COLLECT IN PERSON':'PUBLIC DOCUMENT'}</small>
      <h3>${escapeHtml(x.title)}</h3>
      ${x.summary?`<p>${escapeHtml(x.summary)}</p>`:''}
      ${x.responsibleAuthority?`<small class="v202-authority">Responsible authority: ${escapeHtml(x.responsibleAuthority)}</small>`:''}
      ${pickup?`<small class="v202-authority">Collection office: ${escapeHtml(office?.name||'Scarborough / Mt. Grace District Office')}</small>${collectionLink(officeKey)}`:`<a class="v202-open-document" href="${escapeAttr(x.publicUrl)}" target="_blank" rel="noopener">OPEN DOCUMENT →</a>`}
    </div>`;
  host.appendChild(card);
}
function applyFormContent(records){
  showCollectionDirectory();
  const overrides=new Map(records.filter(x=>x.type==='form_override').map(x=>[txt(meta(x.metadata).staticKey),x]));
  $$('#service-forms .v16-form-card').forEach(card=>{
    const o=overrides.get(formKey(card));
    if(o&&meta(o.metadata).action==='hide')setHidden(card,true);
  });
  records.filter(x=>x.type==='form').forEach(renderManagedForm);

  const cards=$$('#service-forms .v16-form-card').filter(x=>!x.hidden&&x.style.display!=='none');
  const n=cards.length;
  const count=$('#service-forms .v50-form-library-status > div:first-child strong');
  if(count)count.textContent=`${n} available form${n===1?'':'s'}`;
  const intro=$('#service-forms .v12-section-head p');
  if(intro)intro.textContent=`Browse ${n} available forms and documents. Some can be opened online; others must be collected from the responsible office. Confirm the latest version and submission requirements with that office.`;
  const label=$('#service-forms .v12-label');if(label)label.textContent='FORMS & COLLECTION';

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
function setupEmploymentTab(){
  const hub=$('#activity-hub'),tabs=$('.v26-tabs',hub),panels=$('.v26-panels',hub);
  if(!tabs||!panels||$('#v204-employment-tab'))return;
  const tab=document.createElement('button');
  tab.id='v204-employment-tab';tab.className='v26-tab';tab.type='button';tab.role='tab';tab.tabIndex=-1;
  tab.dataset.v26Tab='employment';tab.setAttribute('aria-controls','employment');tab.setAttribute('aria-selected','false');
  tab.innerHTML='<span>04</span><b>Employment Opportunities</b><small>THA &amp; community vacancies</small>';
  tabs.appendChild(tab);
  const panel=document.createElement('div');
  panel.id='employment';panel.className='v26-panel';panel.role='tabpanel';panel.hidden=true;
  panel.setAttribute('aria-labelledby',tab.id);
  panel.innerHTML='<div class="v26-panel-head"><div><span>VERIFIED OPEN VACANCIES</span><h3>Employment Opportunities</h3></div><p>Apply directly through the employer’s official notice. The District Office does not receive applications here.</p></div><div class="v26-notice-grid v204-employment-grid"></div><p class="v204-employment-empty">There are no verified open vacancies listed at present. Check the <a href="https://www.tha.gov.tt/downloads/" target="_blank" rel="noopener noreferrer">THA employment notices</a> for additional opportunities.</p>';
  panels.appendChild(panel);
  const oldTabs=$$('.v26-tab',tabs).filter(b=>b!==tab);
  oldTabs.forEach(b=>b.addEventListener('click',()=>{tab.classList.remove('is-active');tab.setAttribute('aria-selected','false');tab.tabIndex=-1;panel.hidden=true;panel.classList.remove('is-active')}));
  tab.addEventListener('click',()=>{
    oldTabs.forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-selected','false');b.tabIndex=-1});
    $$('.v26-panel',panels).forEach(p=>{p.classList.toggle('is-active',p===panel);p.hidden=p!==panel});
    tab.classList.add('is-active');tab.setAttribute('aria-selected','true');tab.tabIndex=0;
  });
  tab.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const target=e.key==='ArrowLeft'?oldTabs.at(-1):oldTabs[0];target.click();target.focus()}});
  const style=document.createElement('style');style.id='v204-employment-css';
  style.textContent='#activity-hub .v26-tabs{grid-template-columns:repeat(4,1fr)}#activity-hub .v204-employment-grid .v26-notice{min-width:0}#activity-hub .v204-employment-meta{display:grid;gap:5px;margin:11px 0;color:#244960;font-size:12px}#activity-hub .v204-employment-link{display:inline-flex;margin-top:10px;padding:9px 12px;border-radius:8px;background:#0b3553;color:#fff;font-size:12px;font-weight:800;text-decoration:none}#activity-hub .v204-employment-empty{font-size:13px;line-height:1.6;color:#244960}#activity-hub .v204-employment-empty a{color:#0b3553;font-weight:800}@media(max-width:950px){#activity-hub .v26-tabs{grid-template-columns:repeat(2,1fr)}}';
  document.head.appendChild(style);
}
function renderEmployment(x){
  const host=$('#activity-hub .v204-employment-grid');if(!host)return;
  const m=meta(x.metadata),deadline=txt(m.deadline);
  if(!m.employer||!/^\d{4}-\d{2}-\d{2}$/.test(deadline)||!x.publicUrl||!/^https:\/\//i.test(x.publicUrl))return;
  if(Date.now()>Date.parse(`${deadline}T23:59:59-04:00`))return;
  const el=document.createElement('article');el.className='v26-notice v202-managed-activity';
  el.innerHTML=`<div class="v26-notice-top"><span class="v26-badge confirmed">OPEN VACANCY</span><small>${m.employerType==='THA'?'THA / Division':'Community Employer'}</small></div><h4>${escapeHtml(x.title)}</h4>${x.summary?`<p>${escapeHtml(x.summary)}</p>`:''}<div class="v204-employment-meta"><span><b>Employer:</b> ${escapeHtml(m.employer)}</span><span><b>Apply by:</b> ${escapeHtml(fmtDate(`${deadline}T12:00:00-04:00`))}</span></div><a class="v204-employment-link" href="${escapeAttr(x.publicUrl)}" target="_blank" rel="noopener noreferrer">VIEW OFFICIAL NOTICE →</a>`;
  host.appendChild(el);
  const empty=$('#activity-hub .v204-employment-empty');if(empty)empty.hidden=true;
}
function refreshActivityCounts(records){
  const hub=$('#activity-hub');if(!hub)return;
  const summaries=$$('.v26-summary article',hub);
  const notices=$$('.v26-notice',hub).filter(x=>!x.hidden&&x.style.display!=='none').length;
  const projects=$$('.v26-project',hub).filter(x=>!x.hidden&&x.style.display!=='none').length;
  if(summaries[0]){const n=$('.v26-summary-num',summaries[0]);if(n)n.textContent=String(notices).padStart(2,'0')}
  if(summaries[2]){const n=$('.v26-summary-num',summaries[2]);if(n)n.textContent='06'}
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
    subtype==='employment'?renderEmployment(x):subtype==='project'?renderProject(x):renderNotice(x);
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
    nav .links a.v206-language-link{position:absolute;top:18px;left:20px;box-sizing:border-box;display:inline-flex!important;align-items:center;justify-content:center;width:auto!important;height:auto!important;min-height:32px;padding:7px 12px!important;margin:0!important;transform:none!important;border:1px solid rgba(201,163,74,.75)!important;border-radius:999px!important;color:#f5e3ae!important;background:#17364d!important;font-size:11px!important;font-weight:900!important;line-height:1.2!important;letter-spacing:.08em;text-decoration:none!important;white-space:nowrap;box-shadow:none!important}
    nav .links a.v206-language-link:hover{background:#244b67!important;border-color:#f5e3ae!important;color:#fff!important}
    @media(max-width:900px){nav .links a.v206-language-link{position:static;flex:0 0 auto;margin-right:10px!important}}
    nav .v206-language-link:focus-visible{outline:3px solid #c9a34a;outline-offset:2px}
    #service-forms .v205-collection{box-sizing:border-box;max-width:100%;min-width:0;overflow:hidden;margin:30px 0;padding:22px;border:1px solid #d7e3e9;border-radius:18px;background:#f8fbfc;color:#17394e}
    #service-forms .v205-collection-head h3{margin:5px 0 8px;color:#0b2e48;font:600 24px Georgia,serif}
    #service-forms .v205-collection-head small{font-size:11px;font-weight:900;letter-spacing:.09em;color:#4b6171}
    #service-forms .v205-collection-head p,#service-forms .v205-collection-source{font-size:13px;line-height:1.6;color:#385669}
    #service-forms .v205-collection-rail{box-sizing:border-box;display:flex;width:100%;max-width:100%;min-width:0;gap:11px;margin-top:17px;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:thin;padding:3px 2px 13px}
    #service-forms .v205-office-card{position:relative;overflow:hidden;flex:0 0 calc((100% - 22px)/3);min-height:250px;display:flex;flex-direction:column;scroll-snap-align:start;padding:17px;border:1px solid rgba(11,53,83,.12);border-radius:12px;background:linear-gradient(145deg,#fff,#faf8f1);box-shadow:0 12px 27px rgba(7,35,55,.062)}
    #service-forms .v205-office-card::after{content:'';position:absolute;right:-28px;top:-34px;width:82px;height:82px;border-radius:50%;border:1px solid rgba(23,79,116,.065);box-shadow:0 0 0 15px rgba(201,163,74,.018);pointer-events:none}
    #service-forms .v205-office-card>small{color:#8e7843;font-size:10px;font-weight:900;letter-spacing:.08em}
    #service-forms .v205-office-card h4{margin:9px 0;color:#174f74;font:600 18px Georgia,serif;line-height:1.3}
    #service-forms .v205-office-card address{white-space:pre-line;font-style:normal;font-size:12px;line-height:1.55;color:#385669}
    #service-forms .v205-office-status{margin-top:auto;padding:9px 10px;border-top:1px solid rgba(11,53,83,.075);border-bottom:1px solid rgba(11,53,83,.075);background:rgba(237,244,246,.62)}
    #service-forms .v205-office-status span{display:block;color:#617886;font-size:10px;font-weight:900;letter-spacing:.07em}
    #service-forms .v205-office-status strong{display:block;margin-top:3px;color:#365c70;font-size:12px}
    #service-forms .v205-office-card>a{display:block;margin-top:10px;padding:11px;border-radius:8px;background:#0b3553;color:#fff;text-align:center;text-decoration:none;font-size:12px;font-weight:900}
    #service-forms .v205-office-card>a:focus-visible,#service-forms .v205-collection-nav button:focus-visible{outline:3px solid #c9a34a;outline-offset:2px}
    #service-forms .v205-collection-nav{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:8px}
    #service-forms .v205-collection-nav>button{width:34px;height:34px;border:1px solid #b9ccd6;border-radius:8px;background:#fff;color:#0b3553;font-size:22px;cursor:pointer}
    #service-forms .v205-dots{display:flex;gap:5px}
    #service-forms .v205-dots button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#b5c8d2;cursor:pointer}
    #service-forms .v205-dots button.is-active{background:#0b3553;box-shadow:0 0 0 2px #d2bb78}
    #service-forms .v205-collection-source a{color:#0b3553;font-weight:800}
    #service-forms .v202-managed-form .v16-pdf-icon{font-size:8px}
    @media(max-width:900px){#service-forms .v205-office-card{flex-basis:calc((100% - 11px)/2)}}
    @media(max-width:600px){#service-forms .v205-office-card{flex-basis:min(85vw,305px)}}
    body.v112-dark .v202-public-date,body.v112-dark .v202-open-document{color:#f0d895}
    /* Keep dark-mode copy crisp on navy, while retaining navy copy on light cards. */
    body.v112-dark{--v110-text:#fff;--v110-muted:#fff;--v110-soft:#fff;--v113-heading:#fff;--v113-strong:#fff;--v113-body:#fff;--v113-muted:#fff;--v113-faint:#fff}
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) :is(h1,h2,h3,h4,h5,p,li,small,span,em,label,strong,b,dd,dt,td,th,address){color:#fff!important}
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) :is(.v55-start-main,.v55-start-grid,.v90-status-overview>article,.v205-collection,.v205-office-card,.v55-forms-help,.v88-privacy-panel,.v18-townhall,.v21-action-copy,.v170-island-map-card,.v170-island-map-note,.v26-townhall-tool,.v151-note) :is(h1,h2,h3,h4,h5,p,li,small,span,em,label,strong,b,dd,dt,td,th,address){color:#0b2e48!important}
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) :is(.v3-eyebrow,.v26-eyebrow,.v51-primary-label,.v12-label,.v17-purpose,.v106-track-kicker,.v59-section-marker,.v121-kicker,.v151-kicker,.v205-office-card>small,.v139-clock-label) :is(span,small,strong,b),
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) :is(.v3-eyebrow,.v26-eyebrow,.v51-primary-label,.v12-label,.v17-purpose,.v106-track-kicker,.v59-section-marker,.v121-kicker,.v151-kicker,.v205-office-card>small,.v139-clock-label){color:#e1c879!important}
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) :is(.v55-start-main,.v55-start-grid,.v90-status-overview>article,.v205-collection,.v205-office-card,.v55-forms-help,.v88-privacy-panel,.v18-townhall,.v21-action-copy,.v170-island-map-card,.v170-island-map-note,.v26-townhall-tool,.v151-note) :is(a,button){color:#0b2e48!important}
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) :is(.v55-start-main,.v55-start-grid,.v90-status-overview>article,.v205-collection,.v205-office-card,.v55-forms-help,.v88-privacy-panel,.v18-townhall,.v21-action-copy,.v170-island-map-card,.v170-island-map-note,.v26-townhall-tool,.v151-note) :is(a,button):is(.primary,.btn-primary,.v205-office-card>a){color:#fff!important}
    body.v112-dark #main-content .v139-live-clock :is(span,strong,small,b,p){color:#fff!important}
    body.v112-dark #main-content .v139-live-clock .v139-clock-label{color:#e1c879!important}
    body.v112-dark #main-content .v205-office-card>a{color:#fff!important}
    body.v112-dark #main-content .v207-on-light{color:#0b2e48!important}
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) .v207-on-light{color:#0b2e48!important}
    body.v112-dark #main-content :is(.v3-eyebrow,.v26-eyebrow,.v26-summary-num,.v51-primary-label,.v12-label,.v17-purpose,.v106-track-kicker,.v59-section-marker,.v121-kicker,.v151-kicker,.v139-clock-label,.v205-office-card>small){color:#e1c879!important}
    body.v112-dark #main-content :is(#resident-start,#portal-hub,#activity-hub,#community-compass,#contact-us,#service-forms,#enquiry,#gallery,#v51-more-gateway,#services,#about,#team,#leadership,#district-profile,#how-we-help,#help-selector,#support-areas,#resident-guide,#resident-faq,#resources,#privacy-accessibility,#documents,#resident-programmes,#community-engagement,#v141-public-plans,#v142-public-matters,#v145-public-cms,#v151-resident-voice) :is(.v3-eyebrow,.v26-eyebrow,.v26-summary-num,.v51-primary-label,.v12-label,.v17-purpose,.v106-track-kicker,.v59-section-marker,.v121-kicker,.v151-kicker,.v139-clock-label,.v205-office-card>small){color:#e1c879!important}
    body.v112-dark #main-content #v51-more-gateway .v51-more-card :is(.eyebrow,h2,p,.v51-more-links button){color:#0b2e48!important}
    body.v112-dark #main-content #v51-more-gateway .v51-more-card .v51-more-toggle{color:#fff!important}
    body.v112-dark #main-content #v51-more-gateway :is(.v70-info-card,.v21-finder-copy) :is(h2,h3,h4,p,span,small,strong,b,button){color:#0b2e48!important}
    body.v112-dark #main-content #v51-more-gateway .v70-info-card small{color:#927a42!important}
    body.v112-dark #main-content .v208-grey-effect{color:#0b2e48!important;-webkit-text-fill-color:#0b2e48!important;-webkit-text-stroke-color:#0b2e48!important}
    body.v112-dark #main-content #resident-start .v55-office-today,
    body.v112-dark #main-content #resident-start .v55-office-today *{color:#fff!important;-webkit-text-fill-color:#fff!important;-webkit-text-stroke-width:0!important;text-shadow:none!important}
    body.v112-dark #main-content #privacy-accessibility .v88-rule,
    body.v112-dark #main-content #privacy-accessibility .v88-rule *{color:#fff!important;-webkit-text-fill-color:#fff!important;-webkit-text-stroke-width:0!important;text-shadow:none!important}
    body.v112-dark #main-content #community-engagement .v18-calendar.v18-calendar :is(span,strong,small){color:#c9a34a!important;-webkit-text-fill-color:#c9a34a!important;-webkit-text-stroke-color:#c9a34a!important}
    body.v112-dark #main-content #v133-title{color:#c9a34a!important;-webkit-text-fill-color:#c9a34a!important;-webkit-text-stroke-color:#c9a34a!important}
    body:not(.v112-dark) #main-content #resident-programmes :is(.v17-head h2,.v17-start>strong,.v17-start-items span){color:#0b2e48!important;-webkit-text-fill-color:#0b2e48!important;-webkit-text-stroke-color:#0b2e48!important;text-shadow:none!important}
    body:not(.v112-dark) #main-content #team .v32-team-banner strong{color:#0b2e48!important;-webkit-text-fill-color:#0b2e48!important;text-shadow:none!important}
    body:not(.v112-dark) #main-content #team .v32-team-intro h2{color:#80621e!important;-webkit-text-fill-color:#80621e!important;text-shadow:none!important}
    /* Team portraits share the Start Centre card treatment. */
    body #main-content #team .member{position:relative!important;overflow:hidden!important;min-width:0!important;border:1px solid rgba(11,53,83,.12)!important;border-top:3px solid rgba(201,163,74,.7)!important;border-radius:16px!important;background:linear-gradient(145deg,#fff 0%,#f7faf9 72%,#f3ecdc 100%)!important;box-shadow:0 12px 27px rgba(7,35,55,.08)!important;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important}
    body #main-content #team .member::after{content:'';position:absolute;right:-14px;bottom:-18px;width:48px;height:48px;border-radius:50%;border:1px solid rgba(23,79,116,.08);box-shadow:0 0 0 10px rgba(201,163,74,.025);pointer-events:none}
    body #main-content #team .member:hover{transform:translateY(-3px)!important;border-color:rgba(201,163,74,.75)!important;box-shadow:0 16px 32px rgba(7,35,55,.14)!important}
    body #main-content #team .member :is(strong,span){color:#0b2e48!important;-webkit-text-fill-color:#0b2e48!important;text-shadow:none!important}
    body #main-content #team .member .v71-role-note{color:#80621e!important;-webkit-text-fill-color:#80621e!important;font-weight:900!important;letter-spacing:.08em!important}
    body #main-content #team .member .v7-member-frame{border:1px solid rgba(201,163,74,.45)!important;box-shadow:none!important}
    body #main-content #team .member .v8-staff-meta{border-color:rgba(11,53,83,.1)!important}
    @media(prefers-reduced-motion:reduce){body #main-content #team .member{transition:none!important}body #main-content #team .member:hover{transform:none!important}}
    body.v112-dark #main-content #resident-programmes .v17-card :is(ul,li,p:not(.v17-purpose),.v17-facts strong,.v17-facts small){color:#fff!important;-webkit-text-fill-color:#fff!important;-webkit-text-stroke-width:0!important;text-shadow:none!important}
    body.v112-dark #main-content #resident-programmes .v17-card.v17-card :is(.v98-source-detail,.v98-source-detail *,.v72-source-chip,.v17-facts,.v17-facts *){color:#0b2e48!important;-webkit-text-fill-color:#0b2e48!important;-webkit-text-stroke-color:#0b2e48!important;text-shadow:none!important}
    body.v112-dark #main-content #resident-programmes :is(.v98-source-note,.v98-source-note *,.v72-source-banner,.v72-source-banner *,.v17-top b,.v17-card .v27-pdf-mini,.v17-start-items span){color:#0b2e48!important;-webkit-text-fill-color:#0b2e48!important;-webkit-text-stroke-color:#0b2e48!important;text-shadow:none!important}
  `;
  document.head.appendChild(s);
}
function markLightCardText(root){
  const main=$('#main-content');if(!main)return;
  const coloredSurface=element=>{
    const style=getComputedStyle(element);
    const colors=[...style.backgroundImage.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g)].map(m=>[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]);
    const solid=style.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if(solid)colors.push([+solid[1],+solid[2],+solid[3],solid[4]===undefined?1:+solid[4]]);
    return colors.find(c=>c[3]>=.5);
  };
  const nodes=root===main?[main,...main.querySelectorAll('*')]:[root,...root.querySelectorAll('*')];
  for(const element of nodes){
    if(!element.isConnected||!element.childNodes.length||![...element.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()))continue;
    const textStyle=getComputedStyle(element);
    const hasGrey=value=>[...value.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g)].some(m=>{
      const rgb=[+m[1],+m[2],+m[3]],alpha=m[4]===undefined?1:+m[4];
      return alpha>0&&Math.max(...rgb)-Math.min(...rgb)<=24&&rgb[0]>=40&&rgb[0]<=220;
    });
    element.classList.toggle('v208-grey-effect',element.classList.contains('v208-grey-effect')||hasGrey(textStyle.textShadow)||(parseFloat(textStyle.webkitTextStrokeWidth)>0&&hasGrey(textStyle.webkitTextStrokeColor)));
    let surface=element;
    while(surface&&surface!==main.parentElement){
      const color=coloredSurface(surface);
      if(color){element.classList.toggle('v207-on-light',color[0]>=190&&color[1]>=190&&color[2]>=175);break;}
      surface=surface.parentElement;
    }
  }
}
function setupLightCardContrast(){
  const main=$('#main-content');if(!main)return;
  markLightCardText(main);
  new MutationObserver(records=>{
    if(!document.body.classList.contains('v112-dark'))return;
    for(const record of records)for(const node of record.addedNodes){
      if(node.nodeType===Node.ELEMENT_NODE&&main.contains(node))markLightCardText(node);
    }
  }).observe(main,{childList:true,subtree:true});
  new MutationObserver(()=>markLightCardText(main)).observe(document.body,{attributes:true,attributeFilter:['class']});
}
async function clarifySupportingDocuments(){
  const input=$('#supporting-files');
  if(!input||!input.disabled)return;
  const group=input.closest('.form-group');
  if(!group)return;
  input.hidden=true;
  input.style.display='none';
  input.setAttribute('aria-hidden','true');
  const label=$('label[for="supporting-files"]',group);
  if(label){label.removeAttribute('for');label.textContent='Supporting Documents (optional)';}
  const help=$('#v48-files-help',group);
  if(help)help.textContent='Uploads are not available on this staging site. Submit your enquiry without attachments and keep your reference number. The District Office will advise how to provide any documents it needs through an approved secure method.';
  $('.v33-file-note',group)?.remove();
  group.classList.add('v203-document-note');
  if(!$('.v203-document-status',group)){
    const status=document.createElement('strong');
    status.className='v203-document-status';
    status.textContent='Document uploads are currently unavailable';
    (label||input).after(status);
  }
  const style=document.createElement('style');
  style.id='v203-document-note-css';
  style.textContent='#enquiry .v203-document-note{display:block;padding:18px 20px;margin:20px 0;border:2px solid #244766;border-left:6px solid #b78b30;border-radius:10px;background:#f8fbfc}#enquiry .v203-document-note>label{display:block;margin:0 0 10px;color:#0b2e48;font-size:18px;font-weight:800;line-height:1.3}#enquiry .v203-document-status{display:block;margin-bottom:8px;color:#62470c;font-size:14px;line-height:1.4}#enquiry .v203-document-note .v48-form-help{display:block;margin:0;color:#244766;font-size:14px;line-height:1.6}';
  document.head.appendChild(style);
  let ready=false;
  try{const response=await fetch('/api/public/upload-status',{cache:'no-store'});ready=response.ok&&(await response.json()).enabled===true;}catch(e){}
  if(!ready)return;
  input.disabled=false;
  input.hidden=false;
  input.style.display='block';
  input.removeAttribute('aria-hidden');
  input.setAttribute('accept','.pdf,.jpg,.jpeg,.png');
  if(label)label.setAttribute('for','supporting-files');
  if(help)help.textContent='Attach up to three PDF, JPG or PNG files. Each file must be no larger than 12 MB. The files are stored privately with your enquiry for authorized District Office staff.';
  const status=$('.v203-document-status',group);
  if(status)status.textContent='Upload documents with your enquiry';
  const form=$('#district-enquiry-form');
  form?.addEventListener('submit',async event=>{
    if(!input.files.length)return;
    event.preventDefault();event.stopImmediatePropagation();
    const result=$('#v33-form-result'),button=form.querySelector('button[type="submit"]');
    if(!form.checkValidity()){form.reportValidity();return;}
    const files=[...input.files];
    if(files.length>3||files.some(f=>f.size>12*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(f.type))){result.className='v33-form-result show error';result.textContent='Choose up to three PDF, JPG or PNG files, each 12 MB or smaller.';return;}
    const value=id=>document.getElementById(id)?.value.trim()||'';
    const enquiry={fullName:value('name'),phone:value('phone'),dob:value('dob'),email:value('email'),address:value('address'),type:value('enquiry-type'),communityArea:value('community-area'),preferred:value('preferred-contact'),notificationConsent:!!$('#v138-status-consent')?.checked,reminderConsent:!!$('#v138-reminder-consent')?.checked,message:value('message')};
    const body=new FormData();body.append('enquiry',JSON.stringify(enquiry));files.forEach(file=>body.append('files',file));
    if(button){button.disabled=true;button.textContent='UPLOADING DOCUMENTS…';}
    try{
      const response=await fetch('/api/public/enquiries-with-documents',{method:'POST',body});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.detail||'The enquiry and documents could not be submitted.');
      form.reset();result.className='v33-form-result show ok';
      result.textContent=`Enquiry ${data.reference} received with ${data.documentCount} document(s). Keep this reference number to track your enquiry.`;
    }catch(error){result.className='v33-form-result show error';result.textContent=error.message||'Upload failed. Please try again.';}
    finally{if(button){button.disabled=false;button.textContent='CREATE ENQUIRY →';}}
  },true);
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
  setupLightCardContrast();
  const nav=$('nav[aria-label="Site navigation"] .nav-inner .links');
  if(nav&&!$('.v206-language-link',nav)){
    const link=document.createElement('a');link.className='v206-language-link';link.href='/es/';link.lang='es';link.hreflang='es';link.textContent='ESPAÑOL';link.setAttribute('aria-label','Orientación para residentes en español');nav.insertBefore(link,nav.firstChild);
  }
  showCollectionDirectory();
  clarifySupportingDocuments();
  improveActivityHubContrast();
  setupEmploymentTab();
  const jobs=[];
  if($('#service-forms'))jobs.push(getContent('forms').then(applyFormContent).catch(()=>{}));
  if($('#activity-hub'))jobs.push(getContent('activity').then(applyActivityContent).catch(()=>{}));
  await Promise.all(jobs);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
