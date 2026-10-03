(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v235-service-workspace-ready"))return;
  document.documentElement.classList.add("v235-service-workspace-ready");

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  if(path!=="/services")return;

  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const main=document.querySelector(".v204-main-column");
  if(!main)return;

  document.body.classList.add("v235-service-workspace");

  function serviceCards(){
    const hosts=[
      document.getElementById("services"),
      document.getElementById("how-we-help"),
      document.getElementById("support-areas"),
      document.getElementById("resident-programmes")
    ].filter(Boolean);
    const seen=new Set(),cards=[];
    hosts.forEach(host=>{
      host.querySelectorAll("article,.service-card,[class*='service-card'],[class*='support-card'],[class*='programme-card']").forEach(card=>{
        if(card.closest(".v228-root,.v231-root"))return;
        if(seen.has(card))return;
        seen.add(card);
        cards.push(card);
      });
    });
    return cards;
  }

  function nearestCard(){
    const cards=serviceCards().filter(card=>card.getClientRects().length);
    if(!cards.length)return null;
    const target=Math.max(120,window.innerHeight*.42);
    return cards.slice().sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      const ad=Math.abs(ar.top-target)+(ar.bottom<90?260:0);
      const bd=Math.abs(br.top-target)+(br.bottom<90?260:0);
      return ad-bd;
    })[0]||cards[0];
  }

  function clickFirst(selectors){
    for(const selector of selectors){
      const el=[...document.querySelectorAll(selector)].find(node=>node&&!node.closest(".v235-workspace"));
      if(el){
        el.click();
        return true;
      }
    }
    return false;
  }

  function openJourney(){
    if(clickFirst(["[data-v225-open]",".v225-command-journey",".v225-drawer-journey"]))return;
    document.querySelector("[data-v226-journey]")?.click();
  }

  function openReadiness(){
    const card=nearestCard();
    const cardButton=card?.querySelector(".v228-card-button");
    if(cardButton){cardButton.click();return}
    clickFirst([".v228-launcher [data-v228-open]","[data-v228-open]"]);
  }

  function openIntelligence(){
    const card=nearestCard();
    const cardButton=card?.querySelector(".v231-service-button");
    if(cardButton){cardButton.click();return}
    if(clickFirst([".v231-launcher [data-v231-open]","[data-v231-open]"]))return;
    document.querySelector("[data-v231-smart]")?.click();
  }

  function openCommand(){
    if(clickFirst([".v224-rail-command",".v224-explore-command",".v224-command-open"]))return;
    document.dispatchEvent(new KeyboardEvent("keydown",{key:"k",ctrlKey:true,bubbles:true}));
  }

  const workspace=document.createElement("section");
  workspace.className="v235-workspace";
  workspace.setAttribute("aria-label","Resident Service Workspace");
  workspace.innerHTML=
    '<header class="v235-head">'+
      '<div>'+
        '<small>Resident Service Workspace</small>'+
        '<h2>One place to move from question to next step</h2>'+
        '<p>Use the same resident tools through one clear pathway. Nothing here decides eligibility or approval; it simply connects the public information and actions already available on this site.</p>'+
      '</div>'+
      '<button class="v235-all-tools" type="button" data-v235-command>Open all resident tools</button>'+
    '</header>'+
    '<div class="v235-flow" role="list" aria-label="Resident service pathway">'+
      '<button class="v235-step" type="button" role="listitem" data-v235-journey>'+
        '<span class="v235-step-num">01</span>'+
        '<span class="v235-step-copy"><strong>Start</strong><small>Not sure where to begin? Build a short resident path.</small></span>'+
        '<span class="v235-step-action">Resident Journey →</span>'+
      '</button>'+
      '<button class="v235-step" type="button" role="listitem" data-v235-intel>'+
        '<span class="v235-step-num">02</span>'+
        '<span class="v235-step-copy"><strong>Understand</strong><small>See a service together with relevant verified public context.</small></span>'+
        '<span class="v235-step-action">Service briefing →</span>'+
      '</button>'+
      '<button class="v235-step" type="button" role="listitem" data-v235-readiness>'+
        '<span class="v235-step-num">03</span>'+
        '<span class="v235-step-copy"><strong>Prepare</strong><small>Review the published service points before moving forward.</small></span>'+
        '<span class="v235-step-action">Readiness →</span>'+
      '</button>'+
      '<a class="v235-step" role="listitem" href="/forms/#service-forms">'+
        '<span class="v235-step-num">04</span>'+
        '<span class="v235-step-copy"><strong>Act</strong><small>Open current public forms or send an enquiry when needed.</small></span>'+
        '<span class="v235-step-action">Forms & enquiry →</span>'+
      '</a>'+
      '<a class="v235-step" role="listitem" href="/track/">'+
        '<span class="v235-step-num">05</span>'+
        '<span class="v235-step-copy"><strong>Follow up</strong><small>Use your reference number to check an existing enquiry.</small></span>'+
        '<span class="v235-step-action">Track enquiry →</span>'+
      '</a>'+
    '</div>'+
    '<div class="v235-context" aria-live="polite">'+
      '<span class="v235-context-dot" aria-hidden="true"></span>'+
      '<span class="v235-context-copy"><small>Now viewing</small><strong>Resident Services</strong><span>Move through the page normally; this line follows the section nearest your current view.</span></span>'+
      '<button class="v235-context-action" type="button" data-v235-next>Next section →</button>'+
    '</div>';

  const deck=main.querySelector(":scope > .v204-action-deck");
  const identity=main.querySelector(":scope > .v207-identity-strip");
  if(deck)deck.insertAdjacentElement("afterend",workspace);
  else if(identity)identity.insertAdjacentElement("afterend",workspace);
  else main.insertBefore(workspace,main.firstChild);

  workspace.querySelector("[data-v235-journey]").addEventListener("click",openJourney);
  workspace.querySelector("[data-v235-intel]").addEventListener("click",openIntelligence);
  workspace.querySelector("[data-v235-readiness]").addEventListener("click",openReadiness);
  workspace.querySelector("[data-v235-command]").addEventListener("click",openCommand);

  const titleEl=workspace.querySelector(".v235-context-copy strong");
  const detailEl=workspace.querySelector(".v235-context-copy span");
  const nextButton=workspace.querySelector("[data-v235-next]");

  function allSections(){
    return [...main.querySelectorAll(":scope > .v204-content-card")]
      .filter((el,index,array)=>array.indexOf(el)===index);
  }

  function visibleSections(){
    return allSections().filter(el=>{
      const style=getComputedStyle(el);
      return style.display!=="none"&&style.visibility!=="hidden"&&el.getClientRects().length>0;
    });
  }

  function labelFor(el){
    if(!el)return "Resident Services";
    const data=(el.dataset.v204Label||"").trim();
    if(data)return data;
    return (el.querySelector("h2,h3,h4")?.textContent||"Resident Services").replace(/\s+/g," ").trim();
  }

  function detailFor(el){
    if(!el)return "Use the pathway above whenever you need help deciding what to do next.";
    const p=el.querySelector("p");
    const text=(p?.textContent||"").replace(/\s+/g," ").trim();
    return text?text.slice(0,130):"Continue through the public information, or use the workspace above for guidance.";
  }

  let active=null;

  function applyActive(el){
    const list=visibleSections();
    if(!list.length)return;
    active=list.includes(el)?el:list[0];
    titleEl.textContent=labelFor(active);
    detailEl.textContent=detailFor(active);
    const index=Math.max(0,list.indexOf(active));
    const last=index>=list.length-1;
    nextButton.textContent=last?"Back to top ↑":"Next section →";
    nextButton.dataset.v235Last=last?"true":"false";
  }

  function chooseByViewport(){
    const list=visibleSections();
    if(!list.length)return;
    const targetY=Math.max(120,window.innerHeight*.31);
    const best=list.slice().sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      const ad=Math.abs(ar.top-targetY)+(ar.bottom<targetY?220:0);
      const bd=Math.abs(br.top-targetY)+(br.bottom<targetY?220:0);
      return ad-bd;
    })[0];
    if(best&&best!==active)applyActive(best);
  }

  nextButton.addEventListener("click",()=>{
    const list=visibleSections();
    if(!list.length)return;
    const index=Math.max(0,list.indexOf(active));
    if(index>=list.length-1){
      workspace.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
      return;
    }
    const next=list[index+1];
    next.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
    window.setTimeout(()=>applyActive(next),120);
  });

  if("IntersectionObserver" in window){
    const states=new Map();
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>states.set(entry.target,entry));
      const candidates=[...states.values()]
        .filter(entry=>entry.isIntersecting&&entry.target.getClientRects().length)
        .sort((a,b)=>{
          const targetY=window.innerHeight*.31;
          return Math.abs(a.boundingClientRect.top-targetY)-Math.abs(b.boundingClientRect.top-targetY);
        });
      if(candidates[0]?.target)applyActive(candidates[0].target);
      else chooseByViewport();
    },{root:null,rootMargin:"-14% 0px -58% 0px",threshold:[0,.04,.15,.35]});

    allSections().forEach(el=>observer.observe(el));

    new MutationObserver(()=>{
      allSections().forEach(el=>{
        if(!states.has(el))observer.observe(el);
      });
      window.setTimeout(chooseByViewport,60);
    }).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:["class","hidden","style"]});
  }else{
    let ticking=false;
    window.addEventListener("scroll",()=>{
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(()=>{chooseByViewport();ticking=false});
    },{passive:true});
  }

  window.setTimeout(chooseByViewport,180);
})();