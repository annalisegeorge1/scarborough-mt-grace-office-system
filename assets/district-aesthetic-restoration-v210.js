(()=>{
  'use strict';
  if(!document.body.classList.contains('v203-focused-view'))return;
  if(document.body.classList.contains('v210-aesthetic-ready'))return;
  document.body.classList.add('v210-aesthetic-ready');

  const ornamentHTML=`
    <span class="v210-orbit"></span>
    <span class="v210-orbit2"></span>
    <span class="v210-thread"></span>
    <span class="v210-node"></span>
    <span class="v210-node"></span>
    <span class="v210-node"></span>
    <span class="v210-node"></span>`;

  document.querySelectorAll('.v204-main-column .v204-content-card').forEach((card,index)=>{
    if(card.id==='gallery')return;
    if(card.querySelector(':scope > .v210-card-ornament'))return;
    const ornament=document.createElement('span');
    ornament.className='v210-card-ornament';
    ornament.setAttribute('aria-hidden','true');
    ornament.innerHTML=ornamentHTML;
    card.appendChild(ornament);
    if(index%3===1)ornament.style.transform='rotate(8deg) scale(.88)';
    if(index%3===2)ornament.style.transform='rotate(-13deg) scale(.82)';
  });

  const mainCol=document.querySelector('.v204-main-column');
  if(mainCol){
    const primaryCards=[...mainCol.children].filter(el=>
      el.classList?.contains('v204-content-card') &&
      !el.classList.contains('v208-secondary') &&
      !el.classList.contains('v209-secondary')
    );
    primaryCards.forEach((card,index)=>{
      if((index+1)%2!==0 || index===primaryCards.length-1)return;
      if(card.nextElementSibling?.classList?.contains('v210-editorial-break'))return;
      const divider=document.createElement('div');
      divider.className='v210-editorial-break';
      divider.setAttribute('aria-hidden','true');
      divider.innerHTML='<span></span>';
      card.insertAdjacentElement('afterend',divider);
    });
  }

  const summary=document.querySelector('.v203-summary-card');
  if(summary&&!summary.querySelector('.v210-summary-seal')){
    const seal=document.createElement('span');
    seal.className='v210-summary-seal';
    seal.setAttribute('aria-hidden','true');
    seal.innerHTML='<span>SMG</span>';
    summary.insertBefore(seal,summary.firstChild);
  }

  // Give the top-level focused blocks a small editorial sequence number.
  document.querySelectorAll('.v204-main-column > .v204-content-card:not(.v208-secondary):not(.v209-secondary)').forEach((card,index)=>{
    if(card.querySelector(':scope > .v210-folio-no'))return;
    const folio=document.createElement('span');
    folio.className='v210-folio-no';
    folio.setAttribute('aria-hidden','true');
    folio.textContent=String(index+1).padStart(2,'0');
    card.appendChild(folio);
  });
})();