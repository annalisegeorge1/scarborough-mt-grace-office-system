(()=>{
  'use strict';
  if(document.body.classList.contains('v212-global-polish'))return;
  document.body.classList.add('v212-global-polish');

  const normalize=(value)=>(value||'/').replace(/\/+$/,'')||'/';
  const path=normalize(location.pathname);

  // Accessibility: provide a keyboard-first way past repeated navigation.
  if(!document.querySelector('.v212-skip-link')){
    const skip=document.createElement('a');
    skip.className='v212-skip-link';
    skip.href='#main-content';
    skip.textContent='Skip to main content';
    document.body.insertBefore(skip,document.body.firstChild);
  }

  // The site now has six real public areas. Make the original masthead speak that language.
  const navItems=[
    {label:'Home',target:'v51-home',group:'home'},
    {label:'Office',target:'about',group:'office'},
    {label:'Services',target:'resident-start',group:'services'},
    {label:'Community',target:'community-action-centre',group:'community'},
    {label:'Forms',target:'portal-hub',group:'forms'},
    {label:'Updates',target:'activity-hub',group:'updates'},
    {label:'Contact',target:'contact-us',group:'contact'},
    {label:'Explore',target:'v51-more-gateway',group:'explore'}
  ];
  const routeGroup={
    '/':'home',
    '/index.html':'home',
    '/index-self-contained.html':'home',
    '/office':'office',
    '/services':'services',
    '/community':'community',
    '/forms':'forms',
    '/updates':'updates',
    '/contact':'contact'
  };
  const currentGroup=routeGroup[path]||'';

  function applyNav(buttons){
    buttons.forEach((btn,index)=>{
      const item=navItems[index];
      if(!item)return;
      btn.textContent=item.label;
      btn.dataset.v51Go=item.target;
      delete btn.dataset.v60Go;
      btn.setAttribute('aria-label',item.label==='Explore'?'Explore all District Office sections':item.label);
      btn.title=item.label;
      if(item.group===currentGroup){
        btn.classList.add('v205-route-active');
        btn.setAttribute('aria-current','page');
      }else{
        btn.removeAttribute('aria-current');
        if(item.group!=='explore')btn.classList.remove('v205-route-active');
      }
    });
  }

  applyNav([...document.querySelectorAll('nav[aria-label="Site navigation"] .v51-nav-btn')]);
  applyNav([...document.querySelectorAll('.v125-mobile-nav-rail button[data-v51-go]')]);

  // Focused routes reuse the same public document, so legacy relative links must be
  // made root-absolute or they resolve beneath /services/, /community/, etc.
  const relativeRoots=['track/','resident-guide/','portals/','staff/'];
  document.querySelectorAll('a[href]').forEach(a=>{
    const raw=a.getAttribute('href')||'';
    if(relativeRoots.some(prefix=>raw.startsWith(prefix))){
      if(raw==='track/index.html')a.setAttribute('href','/track/');
      else if(raw==='resident-guide/index.html')a.setAttribute('href','/resident-guide/');
      else if(raw==='portals/index.html')a.setAttribute('href','/portals/');
      else if(raw.startsWith('portals/'))a.setAttribute('href','/'+raw);
      else if(raw.startsWith('staff/'))a.setAttribute('href','/'+raw);
    }
  });

  // Footer utility links need to land on the correct focused route from every page.
  const footer=document.querySelector('footer');
  if(footer){
    footer.classList.add('v212-footer');
    footer.querySelectorAll('a[href="#resident-faq"]').forEach(a=>a.setAttribute('href','/services/#resident-faq'));
    footer.querySelectorAll('a[href="#privacy-accessibility"]').forEach(a=>a.setAttribute('href','/#privacy-accessibility'));
  }

  // The mobile dock is global. Make Enquiry route correctly when the local form
  // is not present in the current focused view.
  document.addEventListener('click',e=>{
    const enquiry=e.target.closest('.v7-mobile-dock [data-v50-scroll="enquiry"]');
    if(!enquiry)return;
    const local=document.getElementById('enquiry');
    const hidden=local?.closest?.('.v203-focus-hidden')||local?.classList?.contains('v203-focus-hidden');
    if(path!=='/forms' || !local || hidden){
      e.preventDefault();
      e.stopImmediatePropagation();
      location.href='/forms/#enquiry';
    }
  },true);

  // Improve state semantics for the Explore control.
  const explore=[...document.querySelectorAll('[data-v51-go="v51-more-gateway"]')];
  explore.forEach(btn=>{
    btn.setAttribute('aria-haspopup','dialog');
    btn.removeAttribute('aria-current');
  });

  // Make the public search describe its purpose without depending on placeholder text.
  const search=document.getElementById('v27-site-search-input');
  if(search){
    search.setAttribute('aria-label','Search District Office services, forms, staff and community information');
    search.setAttribute('placeholder','Search the District Office…');
  }

  // Give the global footer a concise document landmark name.
  if(footer)footer.setAttribute('aria-label','District Office information and public links');
})();