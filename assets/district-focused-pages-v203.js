(()=>{
  'use strict';
  const path=(location.pathname||'/').replace(/\/+$/,'')||'/';
  const viewByPath={
    '/office':'office',
    '/services':'services',
    '/community':'community',
    '/forms':'forms',
    '/updates':'updates',
    '/contact':'contact'
  };
  const view=viewByPath[path];
  if(!view)return;

  const configs={
    office:{
      title:'Your District Office',
      eyebrow:'Scarborough / Mt. Grace',
      intro:'Meet the people behind the office, understand how the district is represented, and find the practical information you need before visiting or getting in touch.',
      summary:'A focused view of the District Office team, leadership, district profile and public contact information.',
      top:['#contact-us'],
      more:['#about','#team','.v8-office-promise','#leadership','#district-profile','#v121-scope','.v22-office-vision'],
      tabs:[['About the Office','about'],['Meet the Team','team'],['Leadership','leadership'],['District Profile','district-profile'],['Contact & Hours','contact-us']]
    },
    services:{
      title:'Resident Services',
      eyebrow:'Start with the right pathway',
      intro:'Find assistance, understand how the office can help, review programme information and prepare what you need before making an enquiry.',
      summary:'Service pathways are grouped here so residents can move from “What do I need?” to the right form, programme or office contact without searching the full homepage.',
      top:['#resident-start','#v132-public-paths'],
      more:['.v21-resident-finder','.v14-top-tasks','.v14-service-overview','.v25-quick-route','#services','#how-we-help','#help-selector','#support-areas','#resident-guide','#resident-faq','#resources','#resident-programmes'],
      tabs:[['Start Here','resident-start'],['Services','services'],['How We Help','how-we-help'],['Resident Guide','resident-guide'],['Programmes','resident-programmes'],['Resources','resources']]
    },
    community:{
      title:'Community',
      eyebrow:'Participation • Projects • Outreach',
      intro:'See what is happening across Scarborough / Mt. Grace, explore community projects and activities, and find ways to participate in local initiatives.',
      summary:'Community information, engagement opportunities, projects and public activity are brought together in one place.',
      top:['#activity-hub','#v121-what-we-heard','#community-compass','#gallery'],
      more:['#community-action-centre','#v133-public-action','#v142-public-matters','#v141-public-plans','#community-engagement'],
      tabs:[['Activity Hub','activity-hub'],['Community Action','community-action-centre'],['Projects & Progress','v133-public-action'],['Public Matters','v142-public-matters'],['Engagement','community-engagement'],['Gallery','gallery']]
    },
    forms:{
      title:'Forms & Portals',
      eyebrow:'Apply • Enquire • Track',
      intro:'Use the District Office’s public tools from one focused workspace: find forms, open service portals, submit an enquiry and follow an existing matter.',
      summary:'This page concentrates the practical actions residents are most likely to need, without the extra informational sections of the homepage.',
      top:['#portal-hub','#service-forms','#enquiry'],
      more:['#documents','.v10-case-tracking','.v11-journey'],
      tabs:[['Portal Hub','portal-hub'],['Service Forms','service-forms'],['Send an Enquiry','enquiry'],['Track an Enquiry','track-enquiry'],['Documents','documents']]
    },
    updates:{
      title:'Updates & Information',
      eyebrow:'District activity at a glance',
      intro:'Review notices, current activities, project progress, public matters and recent visual updates from the District Office.',
      summary:'A cleaner information view for residents who want to see what the office is doing and what is currently happening in the district.',
      top:['#activity-hub','#v121-what-we-heard','#gallery'],
      more:['#v133-public-action','#v142-public-matters','#v141-public-plans'],
      tabs:[['Activity Hub','activity-hub'],['Live Updates','v135-live-updates'],['Progress','v133-public-action'],['Public Matters','v142-public-matters'],['Plans','v141-public-plans'],['Gallery','gallery']]
    },
    contact:{
      title:'Contact & Enquiries',
      eyebrow:'Reach the District Office',
      intro:'Find the office hours and contact details, prepare before your visit, submit a new enquiry or track an existing matter.',
      summary:'Everything related to contacting the office is placed together here, including the public enquiry workflow and resident feedback information.',
      top:['#contact-us','#enquiry','#v121-feedback-info','#v151-resident-voice'],
      more:[],
      tabs:[['Office Details','contact-us'],['Before You Visit','before-you-visit'],['Send an Enquiry','enquiry'],['Track an Enquiry','track-enquiry'],['Resident Feedback','v121-feedback-info']]
    }
  };

  const cfg=configs[view];
  const main=document.getElementById('main-content');
  if(!cfg||!main)return;

  document.body.classList.add('v203-focused-view');
  document.body.dataset.districtView=view;

  const topChildren=[...main.children];
  const more=document.getElementById('v51-more-content');
  const moreChildren=more?[...more.children]:[];

  const matchesAny=(el,selectors)=>selectors.some(selector=>{
    try{return el.matches(selector)}catch(_e){return false}
  });

  topChildren.forEach(el=>{
    if(el===more){
      el.classList.toggle('v203-focus-hidden',cfg.more.length===0);
      return;
    }
    el.classList.toggle('v203-focus-hidden',!matchesAny(el,cfg.top));
  });

  if(more){
    moreChildren.forEach(el=>el.classList.toggle('v203-focus-hidden',!matchesAny(el,cfg.more)));
  }

  const header=document.createElement('section');
  header.className='v203-page-header';
  header.setAttribute('aria-labelledby','v203-page-title');
  header.innerHTML=`
    <div class="v203-wrap">
      <div class="v203-breadcrumb"><a href="/">District Office Home</a><span>›</span><span>${cfg.title}</span></div>
      <div class="v203-title-grid">
        <div>
          <p class="v203-eyebrow">${cfg.eyebrow}</p>
          <h1 id="v203-page-title">${cfg.title}</h1>
          <p class="v203-intro">${cfg.intro}</p>
        </div>
        <aside class="v203-summary-card"><strong>On this page</strong><p>${cfg.summary}</p></aside>
      </div>
      <nav class="v203-page-tabs" aria-label="${cfg.title} sections">
        ${cfg.tabs.map(([label,target])=>`<a class="v203-page-tab" href="#${target}" data-v203-target="${target}">${label}</a>`).join('')}
      </nav>
    </div>`;
  main.insertBefore(header,main.firstChild);

  const selected=[...main.querySelectorAll(':scope > *:not(.v203-focus-hidden), #v51-more-content > *:not(.v203-focus-hidden)')];
  selected.forEach(el=>{if(el.id)el.classList.add('v203-section-marker')});

  const end=document.createElement('section');
  end.className='v203-page-end';
  end.innerHTML=`<div class="v203-wrap"><p>Need something from another part of the District Office website?</p><div class="v203-page-end-actions"><a href="/">Return Home</a><a href="/forms/">Forms & Portals</a><a href="/contact/">Contact the Office</a></div></div>`;
  main.appendChild(end);

  function goTo(target){
    const el=document.getElementById(target);
    if(!el)return;
    const hidden=el.closest('.v203-focus-hidden');
    if(hidden)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    try{history.replaceState(null,'','#'+target)}catch(_e){}
  }

  header.addEventListener('click',e=>{
    const link=e.target.closest('[data-v203-target]');
    if(!link)return;
    const target=link.dataset.v203Target;
    if(document.getElementById(target)){
      e.preventDefault();
      goTo(target);
    }
  });

  const initial=decodeURIComponent((location.hash||'').replace(/^#/,''));
  if(initial){
    window.setTimeout(()=>goTo(initial),140);
  }
})();