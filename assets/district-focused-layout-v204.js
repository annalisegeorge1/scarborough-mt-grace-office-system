(()=>{
  'use strict';
  if(!document.body.classList.contains('v203-focused-view'))return;
  if(document.querySelector('.v204-focus-shell'))return;

  const normalize=(value)=>(value||'/').replace(/\/+$/,'')||'/';
  const path=normalize(location.pathname);

  const configs={
    '/office':{
      label:'Your District Office',
      intro:'People, leadership and practical office information.',
      sections:[
        ['About the Office','#about'],['Meet Our Team','#team'],['Office Promise','.v8-office-promise'],
        ['Leadership','#leadership'],['District Profile','#district-profile'],['Office Scope','#v121-scope'],
        ['Office Vision','.v22-office-vision'],['Contact & Hours','#contact-us']
      ],
      actions:[
        ['TEAM','Meet the Team','Who works in the District Office.','/office/#team'],
        ['INFO','District Profile','Learn about the area the office serves.','/office/#district-profile'],
        ['CALL','Contact the Office','Office hours, phone and WhatsApp.','/contact/#contact-us'],
        ['HELP','Resident Services','Find the right service pathway.','/services/']
      ]
    },
    '/services':{
      label:'Resident Services',
      intro:'Move quickly from a need to the right service, programme or next step.',
      sections:[
        ['Start Here','#resident-start'],['Public Service Paths','#v132-public-paths'],['Service Finder','.v21-resident-finder'],
        ['Top Tasks','.v14-top-tasks'],['Service Overview','.v14-service-overview'],['Quick Route','.v25-quick-route'],
        ['Services & Assistance','#services'],['How We Help','#how-we-help'],['Help Selector','#help-selector'],
        ['Support Areas','#support-areas'],['Resident Guide','#resident-guide'],['Frequently Asked Questions','#resident-faq'],
        ['Resources','#resources'],['Programmes','#resident-programmes']
      ],
      actions:[
        ['START','Find a Service','Start with the Resident Services hub.','/services/#resident-start'],
        ['FORMS','Service Forms','Go directly to forms and downloads.','/forms/#service-forms'],
        ['PROG','Programmes','Browse public programme information.','/services/#resident-programmes'],
        ['ASK','Send an Enquiry','Tell the office what assistance you need.','/forms/#enquiry']
      ]
    },
    '/community':{
      label:'Community',
      intro:'District activity, projects, public matters and participation in one view.',
      sections:[
        ['Activity Hub','#activity-hub'],['Community Action Centre','#community-action-centre'],
        ['Projects & Progress','#v133-public-action'],['Public Matters','#v142-public-matters'],
        ['Public Plans','#v141-public-plans'],['Community Engagement','#community-engagement'],
        ['What We Heard','#v121-what-we-heard'],['Community Compass','#community-compass'],['Gallery','#gallery']
      ],
      actions:[
        ['LIVE','Activity Hub','See current district activity.','/community/#activity-hub'],
        ['ACT','Community Action','Projects, volunteering and participation.','/community/#community-action-centre'],
        ['PLAN','Projects & Progress','Review published district action.','/community/#v133-public-action'],
        ['SEE','Gallery','See recent community activity.','/community/#gallery']
      ]
    },
    '/forms':{
      label:'Forms & Portals',
      intro:'Applications, enquiries and tracking tools grouped into one practical workspace.',
      sections:[
        ['Portal Hub','#portal-hub'],['Service Forms','#service-forms'],['Submit an Enquiry','#enquiry'],
        ['Documents','#documents'],['Case Tracking','.v10-case-tracking'],['Resident Journey','.v11-journey']
      ],
      actions:[
        ['FORM','Service Forms','Browse available forms and downloads.','/forms/#service-forms'],
        ['NEW','New Enquiry','Send a matter to the District Office.','/forms/#enquiry'],
        ['TRACK','Track Enquiry','Check an existing reference.','/track/'],
        ['GUIDE','Resident Guide','Open the dedicated resident guide.','/resident-guide/']
      ]
    },
    '/updates':{
      label:'Updates & Information',
      intro:'Current activity, public matters, plans and progress without the rest of the homepage.',
      sections:[
        ['Live Updates','#v135-live-updates'],['Activity Hub','#activity-hub'],['Projects & Progress','#v133-public-action'],
        ['Public Matters','#v142-public-matters'],['Public Plans','#v141-public-plans'],
        ['What We Heard','#v121-what-we-heard'],['Gallery','#gallery']
      ],
      actions:[
        ['NOW','Live Updates','See the newest published updates.','/updates/#v135-live-updates'],
        ['HUB','Activity Hub','Review district activity by status.','/updates/#activity-hub'],
        ['PLAN','Public Plans','See published plans and next steps.','/updates/#v141-public-plans'],
        ['SEE','Gallery','Browse recent visual updates.','/updates/#gallery']
      ]
    },
    '/contact':{
      label:'Contact & Enquiries',
      intro:'Contact details, office hours, new enquiries and follow-up tools together.',
      sections:[
        ['Office Details','#contact-us'],['Send an Enquiry','#enquiry'],
        ['Resident Feedback','#v121-feedback-info'],['Resident Voice','#v151-resident-voice']
      ],
      actions:[
        ['CALL','Call the Office','Speak with the District Office.','tel:+18686106314'],
        ['WA','WhatsApp','Message the office on WhatsApp.','https://wa.me/18683445268'],
        ['NEW','New Enquiry','Submit a service enquiry online.','/forms/#enquiry'],
        ['TRACK','Track Enquiry','Check an existing reference.','/track/']
      ]
    }
  };

  const cfg=configs[path];
  const main=document.getElementById('main-content');
  const header=main?.querySelector(':scope > .v203-page-header');
  const end=main?.querySelector(':scope > .v203-page-end');
  if(!cfg||!main||!header||!end)return;

  const shell=document.createElement('div');
  shell.className='v204-focus-shell';
  const mainCol=document.createElement('div');
  mainCol.className='v204-main-column';
  const side=document.createElement('aside');
  side.className='v204-side-panel';
  side.setAttribute('aria-label',cfg.label+' page navigation');

  const actionDeck=document.createElement('nav');
  actionDeck.className='v204-action-deck';
  actionDeck.setAttribute('aria-label',cfg.label+' quick actions');
  actionDeck.innerHTML=cfg.actions.map(([icon,title,copy,href])=>`
    <a class="v204-action-card" href="${href}">
      <span class="v204-action-icon" aria-hidden="true">${icon}</span>
      <strong>${title}</strong>
      <span>${copy}</span>
    </a>`).join('');
  mainCol.appendChild(actionDeck);

  const moved=[];
  cfg.sections.forEach(([label,selector])=>{
    let el;
    try{el=document.querySelector(selector)}catch(_e){el=null}
    if(!el||el.closest('.v203-focus-hidden')||el.classList.contains('v203-focus-hidden'))return;
    if(moved.some(parent=>parent.contains(el)))return;
    el.classList.add('v204-content-card');
    el.dataset.v204Label=label;
    if(getComputedStyle(el).position==='static')el.style.position='relative';
    if(!el.querySelector(':scope > .v204-section-chip')){
      const chip=document.createElement('span');
      chip.className='v204-section-chip';
      chip.textContent=label;
      el.insertBefore(chip,el.firstChild);
    }
    mainCol.appendChild(el);
    moved.push(el);
  });

  const navItems=[];
  cfg.sections.forEach(([label,selector])=>{
    let el;
    try{el=document.querySelector(selector)}catch(_e){el=null}
    if(!el||!moved.includes(el)||!el.id)return;
    navItems.push([label,el.id]);
  });

  side.innerHTML=`
    <div class="v204-side-head">
      <small>Focused page</small>
      <strong>${cfg.label}</strong>
      <p>${cfg.intro}</p>
    </div>
    <nav class="v204-side-nav" aria-label="Sections on this page">
      ${navItems.map(([label,id],i)=>`<a href="#${id}" data-v204-target="${id}"><span class="v204-side-num">${String(i+1).padStart(2,'0')}</span><span>${label}</span><span class="v204-side-arrow">›</span></a>`).join('')}
    </nav>
    <div class="v204-side-actions">
      <a href="/forms/#enquiry">New enquiry</a>
      <a href="/track/">Track</a>
      <a href="tel:+18686106314">Call</a>
      <a class="v204-wa" href="https://wa.me/18683445268">WhatsApp</a>
    </div>
    <div class="v204-side-note">Use the Explore tab at the left to move between the District Office’s main public areas.</div>`;

  shell.append(mainCol,side);
  main.insertBefore(shell,end);

  const more=document.getElementById('v51-more-content');
  if(more && !more.querySelector(':scope > *:not(.v203-focus-hidden)'))more.classList.add('v204-emptied-host');

  function scrollToTarget(id){
    const el=document.getElementById(id);
    if(!el)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    try{history.replaceState(null,'','#'+id)}catch(_e){}
  }

  side.addEventListener('click',e=>{
    const a=e.target.closest('[data-v204-target]');
    if(!a)return;
    e.preventDefault();
    scrollToTarget(a.dataset.v204Target);
  });

  const links=[...side.querySelectorAll('[data-v204-target]')];
  if('IntersectionObserver' in window && links.length){
    const observer=new IntersectionObserver(entries=>{
      const hit=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!hit)return;
      links.forEach(link=>link.classList.toggle('is-active',link.dataset.v204Target===hit.target.id));
    },{rootMargin:'-24% 0px -62% 0px',threshold:[0,.08,.2,.4]});
    links.forEach(link=>{
      const el=document.getElementById(link.dataset.v204Target);
      if(el)observer.observe(el);
    });
  }

  const initial=decodeURIComponent((location.hash||'').replace(/^#/,''));
  if(initial && document.getElementById(initial)){
    window.setTimeout(()=>scrollToTarget(initial),180);
  }
})();