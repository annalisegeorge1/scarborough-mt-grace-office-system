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
  const steps=[...root.querySelectorAll(".v237-flow-step")];

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

  root.addEventListener("click",event=>{
    const link=event.target.closest("[data-v237-target]");
    if(!link)return;
    const id=link.dataset.v237Target;
    if(!document.getElementById(id))return;
    event.preventDefault();
    goTo(id);
  });

  if(!focused){
    root.style.setProperty("--v237-progress","0%");
    return;
  }

  const tracked=cfg.steps
    .map((step,index)=>step.target?{step,index,target:document.getElementById(step.target)}:null)
    .filter(item=>item?.target);

  function apply(index){
    const capped=Math.max(0,Math.min(cfg.steps.length-1,index));
    steps.forEach((step,i)=>{
      step.classList.toggle("is-active",i===capped);
      step.classList.toggle("is-complete",i<capped);
      if(i===capped)step.setAttribute("aria-current","step");
      else step.removeAttribute("aria-current");
    });
    const progress=cfg.steps.length>1?(capped/(cfg.steps.length-1))*75:0;
    root.style.setProperty("--v237-progress",progress+"%");
    if(stateEl)stateEl.textContent="Stage "+(capped+1)+" of "+cfg.steps.length;
  }

  if("IntersectionObserver" in window&&tracked.length){
    const state=new Map();
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>state.set(entry.target,entry));
      const visible=[...state.values()]
        .filter(entry=>entry.isIntersecting&&entry.target.getClientRects().length)
        .sort((a,b)=>{
          const targetY=window.innerHeight*.34;
          return Math.abs(a.boundingClientRect.top-targetY)-Math.abs(b.boundingClientRect.top-targetY);
        });
      if(!visible.length)return;
      const hit=tracked.find(item=>item.target===visible[0].target);
      if(hit)apply(hit.index);
    },{root:null,rootMargin:"-16% 0px -58% 0px",threshold:[0,.04,.16,.35]});

    tracked.forEach(item=>observer.observe(item.target));
  }

  const initial=decodeURIComponent((location.hash||"").replace(/^#/,""));
  const initialIndex=cfg.steps.findIndex(step=>step.target===initial);
  apply(initialIndex>=0?initialIndex:0);
})();