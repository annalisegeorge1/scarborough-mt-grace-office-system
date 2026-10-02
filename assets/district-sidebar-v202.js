(()=>{
  'use strict';
  if(document.querySelector('.v202-sidebar-root')) return;

  const ICONS={
    home:'<path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9.5 20v-6h5v6"></path>',
    services:'<path d="M12 3v18"></path><path d="M3 12h18"></path><circle cx="12" cy="12" r="8"></circle>',
    office:'<circle cx="12" cy="8" r="3.2"></circle><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6"></path>',
    community:'<circle cx="8" cy="9" r="3"></circle><circle cx="16.5" cy="10" r="2.5"></circle><path d="M2.8 20c.5-4 2.4-6 5.2-6 3.2 0 5.1 2 5.6 6"></path><path d="M13 15c1-.9 2.2-1.3 3.6-1.3 2.6 0 4.1 1.8 4.6 5.3"></path>',
    tools:'<path d="M5 4h14v16H5z"></path><path d="M8 8h8M8 12h8M8 16h5"></path>',
    updates:'<path d="M4 18h16"></path><path d="M6 15V9M11 15V5M16 15v-3"></path>',
    contact:'<path d="M4 5h16v12H8l-4 3z"></path><path d="M8 9h8M8 13h5"></path>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"></path>',
    search:'<circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path>',
    map:'<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"></path><path d="M9 4v14M15 6v14"></path>'
  };
  const svg=(name)=>`<svg aria-hidden="true" viewBox="0 0 24 24">${ICONS[name]||ICONS.map}</svg>`;

  const groups=[
    {key:'office',label:'Your District Office',hint:'People, hours and office information',icon:'office',items:[
      ['About the Office','about'],['Meet Our Team','team'],['Office Hours & Location','office-hours'],['Contact the Office','contact-us']
    ]},
    {key:'services',label:'Resident Services',hint:'Find help and service pathways',icon:'services',items:[
      ['Resident Services Hub','resident-start'],['Services & Assistance','services'],['Resident Guide','resident-guide'],['Frequently Asked Questions','resident-faq'],['Programmes','resident-programmes'],['Resources','resources']
    ]},
    {key:'community',label:'Community',hint:'Projects, events and participation',icon:'community',items:[
      ['Community Action Centre','community-action-centre'],['Community Engagement','community-engagement'],['Projects','projects'],['Events','events'],['Activity Hub','activity-hub'],['Gallery','gallery']
    ]},
    {key:'tools',label:'Forms & Portals',hint:'Apply, enquire and track',icon:'tools',items:[
      ['Portal Hub','portal-hub'],['Service Forms','service-forms'],['Submit an Enquiry','enquiry'],['Track an Enquiry','track-enquiry'],['Resident Tracker','/track/'],['Resident Guide Portal','/resident-guide/']
    ]},
    {key:'updates',label:'Updates & Information',hint:'Current activity and public information',icon:'updates',items:[
      ['Live Updates','v135-live-updates'],['District Activity','activity-hub'],['Programmes','resident-programmes'],['Resources','resources'],['Community Projects','projects']
    ]},
    {key:'contact',label:'Contact & Enquiries',hint:'Reach the office quickly',icon:'contact',items:[
      ['Contact Us','contact-us'],['Send an Enquiry','enquiry'],['Track Existing Enquiry','track-enquiry'],['Office Hours','office-hours']
    ]}
  ];

  const root=document.createElement('div');
  root.className='v202-sidebar-root';
  root.innerHTML=`
    <div class="v202-backdrop" data-v202-close aria-hidden="true"></div>
    <aside class="v202-drawer" id="v202-district-drawer" aria-label="District Office sections" aria-hidden="true">
      <div class="v202-drawer-head">
        <div class="v202-brand-row">
          <div class="v202-brand-mark" aria-hidden="true">SMG</div>
          <div class="v202-brand-copy"><strong>Explore the District Office</strong><span>Quick navigation</span></div>
          <button class="v202-close" type="button" data-v202-close aria-label="Close section menu">×</button>
        </div>
        <p class="v202-drawer-intro">Move between services, community information, forms and office resources without scrolling through the full page.</p>
      </div>
      <div class="v202-search-wrap">
        <div class="v202-search-box">${svg('search')}<input class="v202-search" type="search" placeholder="Find a section…" aria-label="Find a district office section"></div>
      </div>
      <nav class="v202-nav-scroll" aria-label="District Office section navigation">
        <button class="v202-home-link" type="button" data-v202-target="v51-home">${svg('home')}<span>Home</span></button>
        <div class="v202-groups"></div>
        <p class="v202-empty">No matching section found.</p>
      </nav>
      <div class="v202-drawer-foot">
        <div class="v202-quick-grid">
          <button class="v202-utility-link" type="button" data-v202-target="enquiry">Send enquiry</button>
          <button class="v202-utility-link" type="button" data-v202-target="track-enquiry">Track enquiry</button>
        </div>
        <a class="v202-staff-link" href="/staff/login.html">Staff sign-in</a>
      </div>
    </aside>
    <div class="v202-side-rail" aria-label="Quick section navigation">
      <button class="v202-rail-btn" type="button" data-v202-target="v51-home" aria-label="Home" title="Home">${svg('home')}</button>
      <button class="v202-rail-btn" type="button" data-v202-target="resident-start" aria-label="Resident services" title="Resident services">${svg('services')}</button>
      <button class="v202-rail-btn" type="button" data-v202-target="community-action-centre" aria-label="Community" title="Community">${svg('community')}</button>
      <button class="v202-rail-btn" type="button" data-v202-target="portal-hub" aria-label="Forms and portals" title="Forms and portals">${svg('tools')}</button>
      <button class="v202-rail-btn" type="button" data-v202-target="contact-us" aria-label="Contact" title="Contact">${svg('contact')}</button>
      <div class="v202-rail-divider"></div>
      <button class="v202-rail-btn" type="button" data-v202-open aria-label="Open all sections" title="Explore all sections">${svg('menu')}</button>
    </div>
    <button class="v202-menu-fab" type="button" data-v202-open aria-controls="v202-district-drawer" aria-expanded="false">${svg('menu')}<span>Explore</span></button>
  `;
  document.body.appendChild(root);

  const groupsHost=root.querySelector('.v202-groups');
  groups.forEach((group,index)=>{
    const box=document.createElement('section');
    box.className='v202-group'+(index===1?' is-open':'');
    box.dataset.v202Group=group.key;
    const links=group.items.map(([label,target])=>{
      const external=target.startsWith('/');
      return external
        ? `<a class="v202-sub-link" href="${target}" data-v202-label="${label.toLowerCase()}">${label}</a>`
        : `<button class="v202-sub-link" type="button" data-v202-target="${target}" data-v202-label="${label.toLowerCase()}">${label}</button>`;
    }).join('');
    box.innerHTML=`
      <button class="v202-group-toggle" type="button" aria-expanded="${index===1?'true':'false'}">
        <span class="v202-group-icon">${svg(group.icon)}</span>
        <span class="v202-group-copy"><strong>${group.label}</strong><span>${group.hint}</span></span>
        <span class="v202-chevron" aria-hidden="true">›</span>
      </button>
      <div class="v202-subnav"><div class="v202-subnav-inner"><div class="v202-sub-list">${links}</div></div></div>`;
    groupsHost.appendChild(box);
  });

  const drawer=root.querySelector('.v202-drawer');
  const openers=[...root.querySelectorAll('[data-v202-open]')];
  const search=root.querySelector('.v202-search');
  let lastFocus=null;

  function setOpen(open){
    document.body.classList.toggle('v202-nav-open',open);
    drawer.setAttribute('aria-hidden',String(!open));
    openers.forEach(btn=>btn.setAttribute('aria-expanded',String(open)));
    if(open){lastFocus=document.activeElement;window.setTimeout(()=>search.focus({preventScroll:true}),120)}
    else if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus({preventScroll:true});
  }
  openers.forEach(btn=>btn.addEventListener('click',()=>setOpen(true)));
  root.querySelectorAll('[data-v202-close]').forEach(btn=>btn.addEventListener('click',()=>setOpen(false)));

  root.querySelectorAll('.v202-group-toggle').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const group=btn.closest('.v202-group');
      const open=!group.classList.contains('is-open');
      group.classList.toggle('is-open',open);
      btn.setAttribute('aria-expanded',String(open));
    });
  });

  const routeByTarget={
    'v51-home':'/',
    'about':'/office/','team':'/office/','leadership':'/office/','district-profile':'/office/',
    'office-hours':'/contact/','contact-us':'/contact/',
    'resident-start':'/services/','services':'/services/','resident-guide':'/services/','resident-faq':'/services/','resident-programmes':'/services/','resources':'/services/','how-we-help':'/services/','help-selector':'/services/','support-areas':'/services/',
    'community-action-centre':'/community/','community-engagement':'/community/','projects':'/community/','events':'/community/','activity-hub':'/community/','gallery':'/community/',
    'portal-hub':'/forms/','service-forms':'/forms/','enquiry':'/forms/','track-enquiry':'/forms/','documents':'/forms/',
    'v135-live-updates':'/updates/','v133-public-action':'/updates/','v142-public-matters':'/updates/','v141-public-plans':'/updates/'
  };
  const normalizePath=(value)=>(value||'/').replace(/\/+$/,'')||'/';
  function navigateTo(target){
    const destination=routeByTarget[target]||'/';
    const current=normalizePath(location.pathname);
    const destinationPath=normalizePath(destination);
    const el=document.getElementById(target);
    const hidden=el?.closest?.('.v203-focus-hidden');

    if(destinationPath!==current||!el||hidden){
      window.location.href=destination+(target==='v51-home'?'':'#'+encodeURIComponent(target));
      return;
    }

    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    try{history.replaceState(null,'','#'+target)}catch(_e){}
    markActive(target);
    if(window.innerWidth<1180)setOpen(false);
  }

  root.addEventListener('click',e=>{
    const btn=e.target.closest('[data-v202-target]');
    if(!btn)return;
    e.preventDefault();
    navigateTo(btn.dataset.v202Target);
  });

  function markActive(target){
    root.querySelectorAll('[data-v202-target]').forEach(el=>el.classList.toggle('is-active',el.dataset.v202Target===target));
    groups.forEach(g=>{
      if(g.items.some(([,t])=>t===target&&!t.startsWith('/'))){
        const box=root.querySelector(`[data-v202-group="${g.key}"]`);
        if(box){box.classList.add('is-open');box.querySelector('.v202-group-toggle')?.setAttribute('aria-expanded','true')}
      }
    });
  }

  search.addEventListener('input',()=>{
    const q=search.value.trim().toLowerCase();
    let visibleCount=0;
    root.querySelectorAll('.v202-group').forEach(group=>{
      const groupText=group.textContent.toLowerCase();
      const groupMatch=!q||groupText.includes(q);
      group.hidden=!groupMatch;
      if(groupMatch){visibleCount++;if(q){group.classList.add('is-open');group.querySelector('.v202-group-toggle')?.setAttribute('aria-expanded','true')}}
      group.querySelectorAll('.v202-sub-link').forEach(link=>{
        if(!q){link.hidden=false;return}
        link.hidden=!(link.textContent.toLowerCase().includes(q)||group.querySelector('.v202-group-copy strong')?.textContent.toLowerCase().includes(q));
      });
    });
    root.querySelector('.v202-home-link').hidden=!!q&&!('home'.includes(q));
    root.classList.toggle('is-search-empty',visibleCount===0&&!!q);
  });

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('v202-nav-open'))setOpen(false)});

  const tracked=['v51-home','resident-start','services','portal-hub','activity-hub','community-action-centre','service-forms','enquiry','track-enquiry','gallery','about','team','resources','resident-programmes','contact-us'];
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const best=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(best?.target?.id)markActive(best.target.id);
    },{rootMargin:'-28% 0px -58% 0px',threshold:[0,.1,.25,.5]});
    tracked.forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el)});
  }

  const initial=decodeURIComponent((location.hash||'').replace(/^#/,''));
  const routeDefault={
    '/':'v51-home',
    '/office':'about',
    '/services':'resident-start',
    '/community':'community-action-centre',
    '/forms':'portal-hub',
    '/updates':'v135-live-updates',
    '/contact':'contact-us'
  };
  const currentPath=normalizePath(location.pathname);
  markActive(initial&&document.getElementById(initial)?initial:(routeDefault[currentPath]||'v51-home'));
})();
