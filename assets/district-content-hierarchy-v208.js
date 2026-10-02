(()=>{
  'use strict';
  if(!document.body.classList.contains('v203-focused-view'))return;
  if(document.querySelector('.v208-support-hub'))return;

  const path=(location.pathname||'/').replace(/\/+$/,'')||'/';

  const configs={
    '/services':{
      title:'More guidance & service information',
      kicker:'Supporting information',
      description:'The main service actions stay visible above. Open only the guidance you need, then close it when you are finished.',
      primary:['#resident-start','#services','#resident-programmes'],
      secondary:[
        ['Public Service Paths','#v132-public-paths','See the main public pathways at a glance.'],
        ['Service Finder','.v21-resident-finder','Use guided questions to narrow the right service.'],
        ['Top Resident Tasks','.v14-top-tasks','Common tasks and useful starting points.'],
        ['Service Overview','.v14-service-overview','Browse the wider service overview.'],
        ['Quick Route','.v25-quick-route','Move quickly to the right office action.'],
        ['How We Help','#how-we-help','Understand the District Office support role.'],
        ['Help Selector','#help-selector','Choose assistance by need or situation.'],
        ['Support Areas','#support-areas','Review the main types of support.'],
        ['Resident Guide','#resident-guide','Read practical guidance before contacting the office.'],
        ['Frequently Asked Questions','#resident-faq','Open common questions and answers.'],
        ['Resources','#resources','Find useful resident information and references.']
      ]
    },
    '/forms':{
      title:'Additional tools & process guidance',
      kicker:'Supporting tools',
      description:'Forms, portals and the enquiry form stay visible above. Open these supporting sections only when you need more detail.',
      primary:['#portal-hub','#service-forms','#enquiry'],
      secondary:[
        ['Documents','#documents','Review document-related guidance and resources.'],
        ['Case Tracking Guide','.v10-case-tracking','Understand the public tracking process.'],
        ['Resident Journey','.v11-journey','See how an enquiry moves through the service process.']
      ]
    }
  };

  const cfg=configs[path];
  if(!cfg)return;

  const mainCol=document.querySelector('.v204-main-column');
  const actionDeck=mainCol?.querySelector(':scope > .v204-action-deck');
  if(!mainCol||!actionDeck)return;

  const findOne=(selector)=>{
    try{return document.querySelector(selector)}catch(_e){return null}
  };

  const primary=cfg.primary.map(findOne).filter(el=>el&&mainCol.contains(el));
  const secondary=cfg.secondary.map(([label,selector,copy])=>({
    label,selector,copy,el:findOne(selector)
  })).filter(item=>item.el&&mainCol.contains(item.el));

  if(!primary.length||!secondary.length)return;

  // Put the primary resident tasks immediately after the quick-action deck.
  let anchor=actionDeck;
  primary.forEach((el,index)=>{
    el.dataset.v208Primary='true';
    mainCol.insertBefore(el,anchor.nextSibling);
    anchor=el;
    if(!el.querySelector(':scope > .v208-priority-ribbon')){
      const ribbon=document.createElement('span');
      ribbon.className='v208-priority-ribbon';
      ribbon.textContent=index===0?'Start here':'Primary information';
      const chip=el.querySelector(':scope > .v204-section-chip');
      if(chip?.nextSibling)el.insertBefore(ribbon,chip.nextSibling);
      else if(chip)el.appendChild(ribbon);
      else el.insertBefore(ribbon,el.firstChild);
    }
  });

  const hub=document.createElement('section');
  hub.className='v208-support-hub';
  hub.setAttribute('aria-label',cfg.title);
  hub.innerHTML=`
    <div class="v208-support-head">
      <div>
        <small>${cfg.kicker}</small>
        <strong>${cfg.title}</strong>
        <p>${cfg.description}</p>
      </div>
      <button class="v208-collapse-all" type="button">Collapse all</button>
    </div>
    <div class="v208-support-list"></div>`;
  mainCol.insertBefore(hub,anchor.nextSibling);

  const list=hub.querySelector('.v208-support-list');
  const collapseAll=hub.querySelector('.v208-collapse-all');
  const itemById=new Map();

  secondary.forEach((item,index)=>{
    const el=item.el;
    if(!el.id)el.id='v208-support-'+(index+1);
    item.id=el.id;
    itemById.set(item.id,item);

    el.classList.add('v208-secondary','v208-collapsed');
    el.setAttribute('aria-hidden','true');

    const btn=document.createElement('button');
    btn.className='v208-support-toggle';
    btn.type='button';
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls',item.id);
    btn.dataset.v208Target=item.id;
    btn.innerHTML=`
      <span class="v208-toggle-index">${String(index+1).padStart(2,'0')}</span>
      <span class="v208-toggle-copy"><strong>${item.label}</strong><span>${item.copy}</span></span>
      <span class="v208-toggle-arrow" aria-hidden="true">›</span>`;
    list.appendChild(btn);

    // Remove secondary sections from the always-visible sticky page index.
    const sideLink=document.querySelector(`.v204-side-nav [data-v204-target="${CSS.escape(item.id)}"]`);
    if(sideLink)sideLink.hidden=true;
  });

  function reveal(item,scroll=true){
    if(!item)return;
    item.el.classList.remove('v208-collapsed');
    item.el.classList.add('v208-revealed');
    item.el.setAttribute('aria-hidden','false');
    const btn=list.querySelector(`[data-v208-target="${CSS.escape(item.id)}"]`);
    btn?.setAttribute('aria-expanded','true');
    window.setTimeout(()=>item.el.classList.remove('v208-revealed'),320);
    if(scroll){
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(()=>item.el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}),30);
    }
  }

  function collapse(item){
    if(!item)return;
    item.el.classList.add('v208-collapsed');
    item.el.setAttribute('aria-hidden','true');
    const btn=list.querySelector(`[data-v208-target="${CSS.escape(item.id)}"]`);
    btn?.setAttribute('aria-expanded','false');
  }

  function toggle(item){
    if(!item)return;
    const closed=item.el.classList.contains('v208-collapsed');
    if(closed)reveal(item,true); else collapse(item);
  }

  list.addEventListener('click',e=>{
    const btn=e.target.closest('[data-v208-target]');
    if(!btn)return;
    toggle(itemById.get(btn.dataset.v208Target));
  });

  collapseAll.addEventListener('click',()=>{
    secondary.forEach(collapse);
    hub.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
  });

  // If a side drawer or other site control targets a collapsed supporting section,
  // reveal it before the existing navigation handler attempts to scroll to it.
  document.addEventListener('click',e=>{
    const control=e.target.closest('[data-v202-target],[data-v204-target],[data-v203-target]');
    if(!control)return;
    const target=control.dataset.v202Target||control.dataset.v204Target||control.dataset.v203Target;
    const item=itemById.get(target);
    if(item&&item.el.classList.contains('v208-collapsed'))reveal(item,false);
  },true);

  // Preserve deep links such as /services/#resources.
  const initial=decodeURIComponent((location.hash||'').replace(/^#/,''));
  if(initial&&itemById.has(initial)){
    const item=itemById.get(initial);
    reveal(item,false);
    window.setTimeout(()=>{
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      item.el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    },220);
  }
})();