(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v226-smart-next-step-ready"))return;
  document.documentElement.classList.add("v226-smart-next-step-ready");

  if(!document.body.classList.contains("v203-focused-view"))return;

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const routeConfig={
    "/office":{
      label:"Your District Office",
      primary:{label:"Contact",href:"/contact/#contact-us",icon:"☎"},
      fallback:"Office information"
    },
    "/services":{
      label:"Resident Services",
      primary:{label:"Forms",href:"/forms/#service-forms",icon:"▤"},
      fallback:"Resident services"
    },
    "/community":{
      label:"Community",
      primary:{label:"Enquire",href:"/forms/#enquiry",icon:"+"},
      fallback:"Community information"
    },
    "/forms":{
      label:"Forms & Portals",
      primary:{label:"Track",href:"/track/",icon:"↗"},
      fallback:"Forms and resident actions"
    },
    "/updates":{
      label:"Updates & Information",
      primary:{label:"Enquire",href:"/forms/#enquiry",icon:"+"},
      fallback:"Published updates"
    },
    "/contact":{
      label:"Contact & Enquiries",
      primary:{label:"Enquire",href:"/forms/#enquiry",icon:"+"},
      fallback:"Contact information"
    }
  };

  const cfg=routeConfig[path];
  const main=document.querySelector(".v204-main-column");
  if(!cfg||!main||main.querySelector(":scope > .v226-next-step"))return;

  const bar=document.createElement("aside");
  bar.className="v226-next-step";
  bar.setAttribute("aria-label","Smart next step");
  bar.innerHTML=
    '<div class="v226-context">'+
      '<div class="v226-context-copy">'+
        '<small>Smart next step · '+cfg.label+'</small>'+
        '<strong>'+cfg.fallback+'</strong>'+
        '<span>Context-aware guidance as you move through this page.</span>'+
      '</div>'+
      '<div class="v226-progress" aria-label="Page section progress">'+
        '<span class="v226-progress-track"><span class="v226-progress-fill"></span></span>'+
        '<span class="v226-progress-label">1 / 1</span>'+
      '</div>'+
    '</div>'+
    '<div class="v226-actions">'+
      '<a class="v226-action v226-action-primary" href="'+cfg.primary.href+'"><span class="v226-action-icon" aria-hidden="true">'+cfg.primary.icon+'</span><span>'+cfg.primary.label+'</span></a>'+
      '<button class="v226-action" type="button" data-v226-journey title="Build a guided Resident Journey"><span class="v226-action-icon" aria-hidden="true">◇</span><span>Path</span></button>'+
      '<button class="v226-action" type="button" data-v226-command title="Open Resident Command Center"><span class="v226-action-icon" aria-hidden="true">⌕</span><span>Command</span></button>'+
      '<button class="v226-action v226-next" type="button" data-v226-next aria-label="Go to next section" title="Next section"><span class="v226-action-icon" aria-hidden="true">↓</span></button>'+
    '</div>';

  const deck=main.querySelector(":scope > .v204-action-deck");
  const launcher=main.querySelector(":scope > .v225-launcher");
  const identity=main.querySelector(":scope > .v207-identity-strip");
  if(deck)deck.insertAdjacentElement("afterend",bar);
  else if(launcher)launcher.insertAdjacentElement("afterend",bar);
  else if(identity)identity.insertAdjacentElement("afterend",bar);
  else main.insertBefore(bar,main.firstChild);

  const titleEl=bar.querySelector(".v226-context-copy strong");
  const detailEl=bar.querySelector(".v226-context-copy span");
  const progressFill=bar.querySelector(".v226-progress-fill");
  const progressLabel=bar.querySelector(".v226-progress-label");
  const nextButton=bar.querySelector("[data-v226-next]");
  const primary=bar.querySelector(".v226-action-primary");

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
    if(!el)return cfg.fallback;
    const data=(el.dataset.v204Label||"").trim();
    if(data)return data;
    const heading=el.querySelector("h2,h3,h4");
    return (heading?.textContent||cfg.fallback).replace(/\s+/g," ").trim();
  }

  function detailFor(el){
    if(!el)return "Context-aware guidance as you move through this page.";
    const p=el.querySelector("p");
    const text=(p?.textContent||"").replace(/\s+/g," ").trim();
    if(text)return text.slice(0,110);
    return "Use the actions at right for the most useful next steps from this section.";
  }

  function primaryFor(el){
    const id=el?.id||"";
    if(path==="/office"){
      if(id==="contact-us")return {label:"Services",href:"/services/",icon:"→"};
      if(id==="team")return {label:"Contact",href:"/contact/#contact-us",icon:"☎"};
    }
    if(path==="/services"){
      if(["resident-guide","resident-programmes","resources","resident-faq"].includes(id))return {label:"Forms",href:"/forms/#service-forms",icon:"▤"};
      if(id==="resident-start")return {label:"Guide",href:"/services/#resident-guide",icon:"→"};
    }
    if(path==="/community"){
      if(id==="gallery")return {label:"Activity",href:"/updates/#activity-hub",icon:"↗"};
      if(["activity-hub","v133-public-action","v142-public-matters","v141-public-plans"].includes(id))return {label:"Enquire",href:"/forms/#enquiry",icon:"+"};
    }
    if(path==="/forms"){
      if(id==="enquiry")return {label:"Track",href:"/track/",icon:"↗"};
      if(id==="service-forms")return {label:"Guide",href:"/services/#resident-guide",icon:"→"};
    }
    if(path==="/updates"){
      if(id==="gallery")return {label:"Community",href:"/community/",icon:"→"};
      return {label:"Enquire",href:"/forms/#enquiry",icon:"+"};
    }
    if(path==="/contact"){
      if(id==="enquiry")return {label:"Track",href:"/track/",icon:"↗"};
      return {label:"Enquire",href:"/forms/#enquiry",icon:"+"};
    }
    return cfg.primary;
  }

  let active=null;
  let activeIndex=0;

  function applyActive(el){
    const list=visibleSections();
    if(!list.length)return;
    const index=Math.max(0,list.indexOf(el));
    active=list.includes(el)?el:list[0];
    activeIndex=Math.max(0,list.indexOf(active));

    titleEl.textContent=labelFor(active);
    detailEl.textContent=detailFor(active);

    const count=list.length;
    const current=activeIndex+1;
    progressLabel.textContent=current+" / "+count;
    progressFill.style.width=Math.max(6,(current/count)*100)+"%";

    const action=primaryFor(active);
    primary.href=action.href;
    primary.querySelector(".v226-action-icon").textContent=action.icon;
    primary.querySelector("span:last-child").textContent=action.label;

    const last=activeIndex>=count-1;
    nextButton.classList.toggle("is-last",last);
    nextButton.setAttribute("aria-label",last?"Return to top of page":"Go to next section");
    nextButton.title=last?"Back to top":"Next section";
  }

  function chooseByViewport(){
    const list=visibleSections();
    if(!list.length)return;
    const targetY=Math.max(120,window.innerHeight*.30);
    const best=list.slice().sort((a,b)=>{
      const ar=a.getBoundingClientRect();
      const br=b.getBoundingClientRect();
      const ad=Math.abs(ar.top-targetY)+(ar.bottom<targetY?220:0);
      const bd=Math.abs(br.top-targetY)+(br.bottom<targetY?220:0);
      return ad-bd;
    })[0];
    if(best&&best!==active)applyActive(best);
  }

  if("IntersectionObserver" in window){
    const states=new Map();
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>states.set(entry.target,entry));
      const intersecting=[...states.values()]
        .filter(entry=>entry.isIntersecting&&entry.target.getClientRects().length)
        .sort((a,b)=>{
          const targetY=window.innerHeight*.30;
          return Math.abs(a.boundingClientRect.top-targetY)-Math.abs(b.boundingClientRect.top-targetY);
        });
      if(intersecting[0]?.target)applyActive(intersecting[0].target);
      else chooseByViewport();
    },{root:null,rootMargin:"-16% 0px -62% 0px",threshold:[0,.04,.12,.28,.5]});

    allSections().forEach(el=>observer.observe(el));

    const mutations=new MutationObserver(()=>{
      allSections().forEach(el=>{
        if(!states.has(el))observer.observe(el);
      });
      window.setTimeout(chooseByViewport,60);
    });
    mutations.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:["class","hidden","style"]});
  }else{
    let ticking=false;
    window.addEventListener("scroll",()=>{
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(()=>{chooseByViewport();ticking=false});
    },{passive:true});
  }

  nextButton.addEventListener("click",()=>{
    const list=visibleSections();
    if(!list.length)return;
    const index=Math.max(0,list.indexOf(active));
    if(index>=list.length-1){
      const header=document.querySelector(".v203-page-header");
      (header||main).scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
      return;
    }
    const next=list[index+1];
    next.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
    window.setTimeout(()=>applyActive(next),120);
  });

  bar.querySelector("[data-v226-command]").addEventListener("click",()=>{
    const opener=document.querySelector(".v224-rail-command,.v224-explore-command");
    if(opener){opener.click();return}
    document.dispatchEvent(new KeyboardEvent("keydown",{key:"k",ctrlKey:true,bubbles:true}));
  });

  bar.querySelector("[data-v226-journey]").addEventListener("click",()=>{
    const opener=document.querySelector("[data-v225-open],.v225-command-journey,.v225-drawer-journey");
    if(opener)opener.click();
  });

  window.addEventListener("resize",()=>{
    window.clearTimeout(window.__v226Resize);
    window.__v226Resize=window.setTimeout(()=>{
      bar.classList.toggle("is-compact",bar.clientWidth<560);
      chooseByViewport();
    },100);
  },{passive:true});

  bar.classList.toggle("is-compact",bar.clientWidth<560);
  window.setTimeout(chooseByViewport,180);
})();