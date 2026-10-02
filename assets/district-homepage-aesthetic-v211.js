(()=>{
  'use strict';

  const path=(location.pathname||'/').replace(/\/+$/,'')||'/';
  if(!['/','/index.html','/index-self-contained.html'].includes(path))return;
  if(document.body.classList.contains('v211-home-aesthetic'))return;
  document.body.classList.add('v211-home-aesthetic');

  const heroText=document.querySelector('#v51-home .hero-text');
  if(heroText&&!heroText.querySelector('.v211-home-edition')){
    const edition=document.createElement('span');
    edition.className='v211-home-edition';
    edition.textContent='District Office • Public Service';
    const quote=heroText.querySelector('.quote');
    if(quote)quote.insertAdjacentElement('afterend',edition);
    else heroText.appendChild(edition);
  }

  const chapters=[
    ['01','Resident access','Find your starting point','resident-start'],
    ['02','Service directory','Focused resident portals','portal-hub'],
    ['03','District life','Activity, notices & follow-up','activity-hub'],
    ['04','Office access','Reach the District Office','contact-us'],
    ['05','Community record','People, programmes & moments','gallery'],
    ['06','Explore more','The wider District Office','v51-more-gateway']
  ];

  chapters.forEach(([no,kicker,title,targetId])=>{
    const target=document.getElementById(targetId);
    if(!target||target.previousElementSibling?.classList?.contains('v211-home-chapter'))return;
    const chapter=document.createElement('div');
    chapter.className='v211-home-chapter';
    chapter.setAttribute('aria-hidden','true');
    chapter.innerHTML=`
      <div class="v211-home-chapter-core">
        <span class="v211-home-chapter-no">${no}</span>
        <span class="v211-home-chapter-copy"><small>${kicker}</small><strong>${title}</strong></span>
      </div>`;
    target.parentNode.insertBefore(chapter,target);
  });

  const paths=document.getElementById('v132-public-paths');
  if(paths&&!document.querySelector('.v211-gateway-pair')){
    const pair=document.createElement('section');
    pair.className='v211-gateway-pair';
    pair.setAttribute('aria-label','Explore the District Office');
    pair.innerHTML=`
      <a class="v211-gateway-card v211-office" href="/office/">
        <span class="v211-gateway-seal" aria-hidden="true">SMG</span>
        <span class="v211-gateway-kicker">Your District Office</span>
        <strong>Meet the people behind the office.</strong>
        <p>Explore the team, leadership, district information and practical office details.</p>
      </a>
      <a class="v211-gateway-card v211-community" href="/community/">
        <span class="v211-gateway-seal" aria-hidden="true">COM</span>
        <span class="v211-gateway-kicker">Community Action</span>
        <strong>See the district beyond service forms.</strong>
        <p>Explore activity, projects, participation, engagement and community updates.</p>
      </a>`;
    paths.insertAdjacentElement('afterend',pair);
  }

  const folios=[
    ['resident-start','01'],
    ['portal-hub','02'],
    ['activity-hub','03'],
    ['contact-us','04'],
    ['gallery','05'],
    ['v51-more-gateway','06'],
    ['about','07'],
    ['community-action-centre','08']
  ];
  folios.forEach(([id,no])=>{
    const section=document.getElementById(id);
    if(!section||section.querySelector(':scope > .v211-home-folio'))return;
    const folio=document.createElement('span');
    folio.className='v211-home-folio';
    folio.setAttribute('aria-hidden','true');
    folio.textContent=no;
    section.appendChild(folio);
  });

  // Make the original District Office and Community Action blocks feel like
  // deliberate "inside the office" destinations when the More area is opened.
  const about=document.getElementById('about');
  if(about)about.dataset.v211Chapter='district-office';
  const action=document.getElementById('community-action-centre');
  if(action)action.dataset.v211Chapter='community-action';
})();