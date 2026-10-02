(()=>{
  'use strict';
  if(!document.body.classList.contains('v203-focused-view'))return;
  if(document.querySelector('.v207-identity-strip'))return;

  const normalize=(value)=>(value||'/').replace(/\/+$/,'')||'/';
  const path=normalize(location.pathname);

  const config={
    '/office':{
      mark:'OFF',
      kicker:'Office directory',
      title:'People, leadership and district information',
      copy:'A people-first view of the office: who serves here, what the office covers, and how to reach the team.',
      principles:['People','Leadership','District'],
      header:'Office view'
    },
    '/services':{
      mark:'SRV',
      kicker:'Service dashboard',
      title:'Find help, understand the pathway, take the next step',
      copy:'This view is organised around resident needs so you can move from a question to the right service, programme or action.',
      principles:['Find help','Requirements','Next step'],
      header:'Resident services'
    },
    '/community':{
      mark:'COM',
      kicker:'Community hub',
      title:'Projects, participation and district activity',
      copy:'A focused place for community action, engagement, published project information and visual updates.',
      principles:['Projects','Participation','Activity'],
      header:'Community view'
    },
    '/forms':{
      mark:'FOR',
      kicker:'Task workspace',
      title:'Apply, enquire and track without extra searching',
      copy:'Forms and resident actions are grouped here so the practical tasks stay front and centre.',
      principles:['Apply','Enquire','Track'],
      header:'Forms & portals'
    },
    '/updates':{
      mark:'UPD',
      kicker:'Public information desk',
      title:'Current activity, plans and published progress',
      copy:'A streamlined view of what has been published, what is active and what residents may want to follow.',
      principles:['Current','Published','Progress'],
      header:'Updates view'
    },
    '/contact':{
      mark:'CON',
      kicker:'Help centre',
      title:'Reach the office in the way that works best for you',
      copy:'Phone, WhatsApp, office information, enquiries and follow-up tools are kept together here.',
      principles:['Call','WhatsApp','Visit'],
      header:'Contact centre'
    }
  };

  const cfg=config[path];
  if(!cfg)return;

  const mainCol=document.querySelector('.v204-main-column');
  const headerCopy=document.querySelector('.v203-page-header .v203-title-grid > div:first-child');
  if(!mainCol)return;

  const strip=document.createElement('section');
  strip.className='v207-identity-strip';
  strip.setAttribute('aria-label',cfg.kicker);
  strip.innerHTML=`
    <div class="v207-identity-main">
      <div class="v207-identity-mark" aria-hidden="true">${cfg.mark}</div>
      <div class="v207-identity-copy">
        <small>${cfg.kicker}</small>
        <strong>${cfg.title}</strong>
        <p>${cfg.copy}</p>
      </div>
    </div>
    <div class="v207-principles" aria-label="Page focus">
      ${cfg.principles.map(item=>`<span class="v207-principle">${item}</span>`).join('')}
    </div>`;

  const actionDeck=mainCol.querySelector(':scope > .v204-action-deck');
  mainCol.insertBefore(strip,actionDeck||mainCol.firstChild);

  if(headerCopy && !headerCopy.querySelector('.v207-header-badge')){
    const badge=document.createElement('span');
    badge.className='v207-header-badge';
    badge.innerHTML=`<span class="v207-header-dot" aria-hidden="true"></span><span>${cfg.header}</span>`;
    headerCopy.appendChild(badge);
  }
})();