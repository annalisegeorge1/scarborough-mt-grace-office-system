(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v237-civic-flow-ready"))return;
  document.documentElement.classList.add("v237-civic-flow-ready");

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const configs={
    "/":{
      kicker:"Digital front door",
      title:"Start with what you need",
      intro:"One clear route into services, forms, current information and direct contact with the District Office.",
      state:"Choose a starting point",
      steps:[
        {num:"01",title:"Services",copy:"Find assistance, programmes and resident guidance.",href:"/services/"},
        {num:"02",title:"Forms",copy:"Open public forms, portals and enquiry tools.",href:"/forms/"},
        {num:"03",title:"Updates",copy:"Follow published activity, progress and public information.",href:"/updates/"},
        {num:"04",title:"Contact",copy:"Call, WhatsApp, visit or send an enquiry.",href:"/contact/"}
      ],
      foot:"Not sure where to start?",
      footHref:"/services/",
      footLabel:"Open Resident Services →"
    },
    "/community":{
      kicker:"Community flow",
      title:"See it, follow it, take part",
      intro:"Move from current district activity to project progress, participation and the visual community record.",
      steps:[
        {num:"01",title:"See",copy:"Start with current district activity.",href:"#activity-hub",target:"activity-hub"},
        {num:"02",title:"Follow",copy:"Review projects and published progress.",href:"#v133-public-action",target:"v133-public-action"},
        {num:"03",title:"Participate",copy:"Find engagement and participation pathways.",href:"#community-engagement",target:"community-engagement"},
        {num:"04",title:"Explore",copy:"Browse the community gallery and outreach record.",href:"#gallery",target:"gallery"}
      ],
      foot:"Have a question about a community matter?",
      footHref:"/forms/#enquiry",
      footLabel:"Send an enquiry →"
    },
    "/forms":{
      kicker:"Resident action flow",
      title:"Choose, find, send, follow up",
      intro:"A practical sequence for moving from the right public tool to a form, enquiry or existing reference.",
      steps:[
        {num:"01",title:"Choose",copy:"Start from the portal and task hub.",href:"#portal-hub",target:"portal-hub"},
        {num:"02",title:"Find",copy:"Open public forms and document guidance.",href:"#service-forms",target:"service-forms"},
        {num:"03",title:"Send",copy:"Submit a new District Office enquiry.",href:"#enquiry",target:"enquiry"},
        {num:"04",title:"Track",copy:"Follow an enquiry that already has a reference.",href:"/track/"}
      ],
      foot:"Need help understanding the wider process?",
      footHref:"/resident-guide/",
      footLabel:"Open Resident Guide →"
    },
    "/updates":{
      kicker:"Public information flow",
      title:"Latest, activity, progress, plans",
      intro:"Move through what is newest, what is active, what has progressed and what has been published next.",
      steps:[
        {num:"01",title:"Latest",copy:"See the newest published information.",href:"#v135-live-updates",target:"v135-live-updates"},
        {num:"02",title:"Activity",copy:"Review current district activity.",href:"#activity-hub",target:"activity-hub"},
        {num:"03",title:"Progress",copy:"Follow projects and public action.",href:"#v133-public-action",target:"v133-public-action"},
        {num:"04",title:"Plans",copy:"Review published plans and next steps.",href:"#v141-public-plans",target:"v141-public-plans"}
      ],
      foot:"Want the participation and community view?",
      footHref:"/community/",
      footLabel:"Open Community →"
    }
  };

  const cfg=configs[path];
  if(!cfg)return;

  const focused=document.body.classList.contains("v203-focused-view");
  if(focused&&!["/community","/forms","/updates"].includes(path))return;

  const root=document.createElement("section");
  root.className="v237-flow";
  root.setAttribute("aria-label",cfg.title);
  root.innerHTML=
    '<header class="v237-flow-head">'+
      '<div class="v237-flow-head-copy"><small>'+cfg.kicker+'</small><strong>'+cfg.title+'</strong><span>'+cfg.intro+'</span></div>'+
      '<span class="v237-flow-state" aria-live="polite">'+(cfg.state||"Stage 1 of 4")+'</span>'+
    '</header>'+
    '<nav class="v237-flow-track" aria-label="'+cfg.title+'">'+
      cfg.steps.map((step,index)=>
        '<a class="v237-flow-step'+(index===0&&focused?' is-active':'')+'" href="'+step.href+'"'+
          (step.target?' data-v237-target="'+step.target+'"':'')+'>'+
          '<span class="v237-flow-num">'+step.num+'</span>'+
          '<strong>'+step.title+'</strong>'+
          '<small>'+step.copy+'</small>'+
        '</a>'
      ).join("")+
    '</nav>'+
    '<footer class="v237-flow-foot"><span>'+cfg.foot+'</span><a href="'+cfg.footHref+'">'+cfg.footLabel+'</a></footer>';

  let host=null;
  if(focused){
    host=document.querySelector(".v204-main-column");
    if(!host)return;
    const identity=host.querySelector(":scope > .v207-identity-strip");
    if(identity)identity.insertAdjacentElement("afterend",root);
    else host.insertBefore(root,host.firstChild);
  }else{
    host=document.getElementById("main-content");
    if(!host)return;
    const residentStart=document.getElementById("resident-start");
    const locator=host.querySelector(":scope > .v170-locator-band");
    if(residentStart)residentStart.insertAdjacentElement("afterend",root);
    else if(locator)locator.insertAdjacentElement("afterend",root);
    else{
      const hero=document.getElementById("v51-home");
      if(hero)hero.insertAdjacentElement("afterend",root);
      else host.insertBefore(root,host.firstChild);
    }
  }

  const stateEl=root.querySelector(".v237-flow-state");
  const track=root.querySelector(".v237-flow-track");
  const steps=[...root.querySelectorAll(".v237-flow-step")];
  let activeIndex=0;
  let trackRaf=0;
  let pageRaf=0;
  let autoTrackUntil=0;

  function revealTarget(target){
    const collapsed=target.closest(".v208-secondary.v208-collapsed,.v209-secondary.v209-collapsed");
    if(!collapsed?.id)return;
    document.querySelector(
      '[data-v208-target="'+CSS.escape(collapsed.id)+'"],[data-v209-target="'+CSS.escape(collapsed.id)+'"]'
    )?.click();
  }

  function goTo(id){
    const target=document.getElementById(id);
    if(!target)return false;
    revealTarget(target);
    window.setTimeout(()=>{
      target.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
      try{history.replaceState(null,"","#"+id)}catch(_e){}
      target.classList.add("v222-deep-link-target");
      window.setTimeout(()=>target.classList.remove("v222-deep-link-target"),2400);
    },60);
    return true;
  }

  function moveActiveCardIntoView(index){
    if(!track||track.scrollWidth<=track.clientWidth+2)return;
    const step=steps[index];
    if(!step)return;
    const max=Math.max(0,track.scrollWidth-track.clientWidth);
    const left=Math.max(0,Math.min(max,step.offsetLeft-(track.clientWidth-step.offsetWidth)/2));
    if(Math.abs(track.scrollLeft-left)<4)return;
    autoTrackUntil=Date.now()+(reduce()?80:520);
    track.scrollTo({left,behavior:reduce()?"auto":"smooth"});
  }

  function apply(index,{revealCard=false}={}){
    const capped=Math.max(0,Math.min(cfg.steps.length-1,index));
    activeIndex=capped;
    steps.forEach((step,i)=>{
      step.classList.toggle("is-active",i===capped);
      step.classList.toggle("is-complete",i<capped);
      if(i===capped)step.setAttribute("aria-current","step");
      else step.removeAttribute("aria-current");
    });
    const progress=cfg.steps.length>1?(capped/(cfg.steps.length-1))*75:0;
    root.style.setProperty("--v237-progress",progress+"%");
    if(stateEl)stateEl.textContent="Stage "+(capped+1)+" of "+cfg.steps.length;
    if(revealCard)moveActiveCardIntoView(capped);
  }

  function nearestCardIndex(){
    if(!track||!steps.length)return activeIndex;
    const rect=track.getBoundingClientRect();
    const center=rect.left+rect.width/2;
    let best=activeIndex,bestDistance=Infinity;
    steps.forEach((step,index)=>{
      const r=step.getBoundingClientRect();
      if(!r.width)return;
      const distance=Math.abs((r.left+r.width/2)-center);
      if(distance<bestDistance){bestDistance=distance;best=index}
    });
    return best;
  }

  if(track){
    track.addEventListener("scroll",()=>{
      if(Date.now()<autoTrackUntil)return;
      if(trackRaf)return;
      trackRaf=requestAnimationFrame(()=>{
        trackRaf=0;
        apply(nearestCardIndex(),{revealCard:false});
      });
    },{passive:true});
    track.addEventListener("pointerdown",()=>{autoTrackUntil=0},{passive:true});
    track.addEventListener("touchstart",()=>{autoTrackUntil=0},{passive:true});
  }

  root.addEventListener("click",event=>{
    const link=event.target.closest(".v237-flow-step");
    if(!link)return;
    const index=steps.indexOf(link);
    if(index>=0)apply(index,{revealCard:true});
    const id=link.dataset.v237Target;
    if(!id||!document.getElementById(id))return;
    event.preventDefault();
    goTo(id);
  });

  if(!focused){
    root.style.setProperty("--v237-progress","0%");
    return;
  }

  function resolvedTargets(){
    return cfg.steps
      .map((step,index)=>step.target?{step,index,target:document.getElementById(step.target)}:null)
      .filter(item=>item?.target&&item.target.getClientRects().length);
  }

  function syncFromPage(){
    const tracked=resolvedTargets();
    if(!tracked.length)return;
    const targetY=Math.max(96,window.innerHeight*.34);
    let hit=tracked[0],best=Infinity;
    tracked.forEach(item=>{
      const r=item.target.getBoundingClientRect();
      const centerish=Math.min(Math.max(targetY,r.top),r.bottom);
      const distance=Math.abs(centerish-targetY)+(r.bottom<targetY?60:0);
      if(distance<best){best=distance;hit=item}
    });
    apply(hit.index,{revealCard:true});
  }

  function queuePageSync(){
    if(pageRaf)return;
    pageRaf=requestAnimationFrame(()=>{
      pageRaf=0;
      syncFromPage();
    });
  }

  window.addEventListener("scroll",queuePageSync,{passive:true});
  window.addEventListener("resize",queuePageSync,{passive:true});
  window.addEventListener("hashchange",queuePageSync);

  if("MutationObserver" in window){
    let mutationTimer=0;
    new MutationObserver(()=>{
      clearTimeout(mutationTimer);
      mutationTimer=window.setTimeout(syncFromPage,90);
    }).observe(host||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","hidden","style","id"]});
  }

  const initial=decodeURIComponent((location.hash||"").replace(/^#/,""));
  const initialIndex=cfg.steps.findIndex(step=>step.target===initial);
  apply(initialIndex>=0?initialIndex:0,{revealCard:true});
  window.setTimeout(syncFromPage,120);
  window.setTimeout(syncFromPage,420);
})();
