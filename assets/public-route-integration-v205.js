(()=>{
  'use strict';

  const normalize=(value)=>(value||'/').replace(/\/+$/,'')||'/';
  const targetRoute={
    'v51-home':'/',
    'resident-start':'/services/#resident-start',
    'services':'/services/#services',
    'resident-guide':'/services/#resident-guide',
    'resident-programmes':'/services/#resident-programmes',
    'resources':'/services/#resources',
    'team':'/office/#team',
    'about':'/office/#about',
    'portal-hub':'/forms/#portal-hub',
    'service-forms':'/forms/#service-forms',
    'enquiry':'/forms/#enquiry',
    'track-enquiry':'/track/',
    'activity-hub':'/updates/#activity-hub',
    'gallery':'/community/#gallery',
    'community-action-centre':'/community/#community-action-centre',
    'community-engagement':'/community/#community-engagement',
    'v133-public-action':'/community/#v133-public-action',
    'v135-live-updates':'/updates/#v135-live-updates',
    'contact':'/contact/#contact-us',
    'contact-us':'/contact/#contact-us'
  };

  const routeGroupByPath={
    '/':'home',
    '/office':'office',
    '/services':'services',
    '/community':'community',
    '/forms':'forms',
    '/updates':'updates',
    '/contact':'contact'
  };
  const routeTargets={
    home:['v51-home'],
    office:['team','about'],
    services:['resident-start','services','resident-guide','resident-programmes','resources'],
    community:['gallery','community-action-centre','community-engagement','v133-public-action'],
    forms:['portal-hub','service-forms','enquiry'],
    updates:['activity-hub','v135-live-updates'],
    contact:['contact','contact-us']
  };

  function destinationForTarget(target){
    return targetRoute[target]||null;
  }

  function sameFocusedDestination(url){
    try{
      const u=new URL(url,location.origin);
      return normalize(u.pathname)===normalize(location.pathname);
    }catch(_e){return false}
  }

  document.addEventListener('click',e=>{
    const control=e.target.closest('[data-v51-go],[data-v60-go],[data-v25-scroll]');
    if(!control)return;

    const target=control.dataset.v51Go||control.dataset.v60Go||control.dataset.v25Scroll;
    if(target==='v51-more-gateway'){
      const opener=document.querySelector('[data-v202-open]');
      if(opener){
        e.preventDefault();
        e.stopImmediatePropagation();
        opener.click();
      }
      return;
    }

    const destination=destinationForTarget(target);
    if(!destination)return;

    if(sameFocusedDestination(destination)){
      const hash=destination.includes('#')?destination.split('#')[1]:'';
      const el=hash?document.getElementById(hash):null;
      if(el && !el.closest('.v203-focus-hidden'))return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
    location.href=destination;
  },true);

  const rewrites={
    '#services':'/services/#services',
    '#v133-public-action':'/community/#v133-public-action',
    '#resident-programmes':'/services/#resident-programmes',
    '#activity-hub':'/updates/#activity-hub',
    '#documents':'/forms/#documents',
    '#enquiry':'/forms/#enquiry'
  };
  document.querySelectorAll('#v132-public-paths a[href]').forEach(a=>{
    const next=rewrites[a.getAttribute('href')];
    if(next)a.setAttribute('href',next);
  });

  const path=normalize(location.pathname);
  const titles={
    '/office':'Your District Office',
    '/services':'Resident Services',
    '/community':'Community',
    '/forms':'Forms & Portals',
    '/updates':'Updates & Information',
    '/contact':'Contact & Enquiries'
  };
  if(titles[path]){
    document.title=`${titles[path]} | Scarborough / Mt. Grace District Office`;
  }

  const group=routeGroupByPath[path]||'home';
  const activeTargets=new Set(routeTargets[group]||[]);
  document.querySelectorAll('nav[aria-label="Site navigation"] .v51-nav-btn,.v125-mobile-nav-rail button').forEach(btn=>{
    const target=btn.dataset.v51Go||btn.dataset.v60Go||'';
    let active=activeTargets.has(target);
    if(group==='forms' && ['portal-hub','service-forms','enquiry'].includes(target))active=true;
    if(group==='updates' && target==='activity-hub')active=true;
    if(group==='community' && target==='gallery')active=true;
    if(group==='contact' && target==='contact-us')active=true;
    btn.classList.toggle('v205-route-active',active);
  });
})();