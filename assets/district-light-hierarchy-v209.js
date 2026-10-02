(()=>{
  'use strict';
  if(!document.body.classList.contains('v203-focused-view'))return;
  if(document.querySelector('.v209-more-hub'))return;

  const path=(location.pathname||'/').replace(/\/+$/,'')||'/';
  const configs={
    '/office':{
      kicker:'Office information',
      title:'Explore more about the District Office',
      description:'The office overview, team and leadership stay visible. Open these details when you need them.',
      primary:['#about','#team','#leadership'],
      secondary:[
        ['Office Promise','.v8-office-promise','Service commitments and office approach.'],
        ['District Profile','#district-profile','More information about the district served.'],
        ['Office Scope','#v121-scope','What falls within the office’s public-facing scope.'],
        ['Office Vision','.v22-office-vision','The wider direction and service vision.'],
        ['Contact & Hours','#contact-us','Office contact details and visiting information.']
      ]
    },
    '/community':{
      kicker:'More community information',
      title:'Explore plans, engagement & public matters',
      description:'Current activity, Community Action, projects and the gallery remain visible. Open deeper information as needed.',
      primary:['#activity-hub','#community-action-centre','#v133-public-action','#gallery'],
      secondary:[
        ['Public Matters','#v142-public-matters','Published matters residents may want to follow.'],
        ['Public Plans','#v141-public-plans','Plans and forward-looking community information.'],
        ['Community Engagement','#community-engagement','Participation and engagement information.'],
        ['What We Heard','#v121-what-we-heard','Resident themes and community feedback.'],
        ['Community Compass','#community-compass','Additional community orientation and information.']
      ]
    },
    '/updates':{
      kicker:'More published information',
      title:'Explore plans, public matters & supporting updates',
      description:'Live updates, district activity and project progress stay visible first. Open the supporting information you want to review.',
      primary:['#v135-live-updates','#activity-hub','#v133-public-action'],
      secondary:[
        ['Public Matters','#v142-public-matters','Published matters and resident-facing information.'],
        ['Public Plans','#v141-public-plans','Plans and future-facing updates.'],
        ['What We Heard','#v121-what-we-heard','Resident themes and feedback information.'],
        ['Gallery','#gallery','Visual updates from district activity.']
      ]
    },
    '/contact':{
      kicker:'More ways to participate',
      title:'Feedback & resident voice',
      description:'Office contact details and the enquiry path stay visible. Open these sections when you want to provide broader feedback.',
      primary:['#contact-us','#enquiry'],
      secondary:[
        ['Resident Feedback','#v121-feedback-info','Learn how resident feedback is received and used.'],
        ['Resident Voice','#v151-resident-voice','Open additional resident participation information.']
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
  const secondary=cfg.secondary.map(([label,selector,copy],index)=>({
    label,selector,copy,index,el:findOne(selector)
  })).filter(item=>item.el&&mainCol.contains(item.el));

  if(!primary.length||!secondary.length)return;

  let anchor=actionDeck;
  primary.forEach((el,index)=>{
    mainCol.insertBefore(el,anchor.nextSibling);
    anchor=el;
    if(index===0&&!el.querySelector(':scope > .v209-primary-note')){
      const note=document.createElement('span');
      note.className='v209-primary-note';
      note.textContent='Featured information';
      const chip=el.querySelector(':scope > .v204-section-chip');
      if(chip?.nextSibling)el.insertBefore(note,chip.nextSibling);
      else if(chip)el.appendChild(note);
      else el.insertBefore(note,el.firstChild);
    }
  });

  const hub=document.createElement('section');
  hub.className='v209-more-hub';
  hub.setAttribute('aria-label',cfg.title);
  hub.innerHTML=`
    <div class="v209-more-head">
      <div>
        <small>${cfg.kicker}</small>
        <strong>${cfg.title}</strong>
        <p>${cfg.description}</p>
      </div>
      <span class="v209-more-count" aria-label="${secondary.length} supporting sections">${secondary.length}</span>
    </div>
    <div class="v209-more-list"></div>`;
  mainCol.insertBefore(hub,anchor.nextSibling);

  const list=hub.querySelector('.v209-more-list');
  const byId=new Map();

  secondary.forEach((item,index)=>{
    const el=item.el;
    if(!el.id)el.id='v209-more-'+(index+1);
    item.id=el.id;
    byId.set(item.id,item);
    el.classList.add('v209-secondary','v209-collapsed');
    el.setAttribute('aria-hidden','true');

    const button=document.createElement('button');
    button.className='v209-more-btn';
    button.type='button';
    button.dataset.v209Target=item.id;
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-controls',item.id);
    button.innerHTML=`
      <span class="v209-more-copy"><strong>${item.label}</strong><span>${item.copy}</span></span>
      <span class="v209-more-arrow" aria-hidden="true">›</span>`;
    list.appendChild(button);

    const sideLink=document.querySelector(`.v204-side-nav [data-v204-target="${CSS.escape(item.id)}"]`);
    if(sideLink)sideLink.hidden=true;
  });

  function buttonFor(item){
    return list.querySelector(`[data-v209-target="${CSS.escape(item.id)}"]`);
  }
  function collapse(item){
    item.el.classList.add('v209-collapsed');
    item.el.setAttribute('aria-hidden','true');
    buttonFor(item)?.setAttribute('aria-expanded','false');
  }
  function reveal(item,scroll=true){
    secondary.forEach(other=>{if(other!==item)collapse(other)});
    item.el.classList.remove('v209-collapsed');
    item.el.setAttribute('aria-hidden','false');
    buttonFor(item)?.setAttribute('aria-expanded','true');
    if(scroll){
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(()=>item.el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}),30);
    }
  }
  function toggle(item){
    if(item.el.classList.contains('v209-collapsed'))reveal(item,true);
    else collapse(item);
  }

  list.addEventListener('click',e=>{
    const button=e.target.closest('[data-v209-target]');
    if(!button)return;
    const item=byId.get(button.dataset.v209Target);
    if(item)toggle(item);
  });

  document.addEventListener('click',e=>{
    const control=e.target.closest('[data-v202-target],[data-v204-target],[data-v203-target]');
    if(!control)return;
    const target=control.dataset.v202Target||control.dataset.v204Target||control.dataset.v203Target;
    const item=byId.get(target);
    if(item&&item.el.classList.contains('v209-collapsed'))reveal(item,false);
  },true);

  const initial=decodeURIComponent((location.hash||'').replace(/^#/,''));
  if(initial&&byId.has(initial)){
    const item=byId.get(initial);
    reveal(item,false);
    window.setTimeout(()=>{
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      item.el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    },220);
  }
})();