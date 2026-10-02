(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v222-cohesion-ready"))return;
  document.documentElement.classList.add("v222-cohesion-ready");

  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc=value=>{
    if(window.CSS&&typeof CSS.escape==="function")return CSS.escape(value);
    return String(value).replace(/["\\]/g,"\\$&");
  };

  /* Signal horizontal overflow without adding more buttons or changing destinations. */
  const railSelectors=[
    ".v125-mobile-nav-rail",
    ".v203-page-tabs",
    ".v213-feed-filters",
    "#activity-hub .v26-tabs"
  ];

  function edgeState(rail){
    if(!rail)return;
    const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
    if(max<5){
      rail.dataset.v222Edges="none";
      return;
    }
    const left=rail.scrollLeft>5;
    const right=rail.scrollLeft<max-5;
    rail.dataset.v222Edges=left&&right?"both":left?"left":right?"right":"none";
  }

  function registerRail(rail){
    if(!rail||rail.dataset.v222RailReady==="true")return;
    rail.dataset.v222RailReady="true";
    edgeState(rail);
    rail.addEventListener("scroll",()=>edgeState(rail),{passive:true});
    if("ResizeObserver" in window){
      const ro=new ResizeObserver(()=>edgeState(rail));
      ro.observe(rail);
      [...rail.children].forEach(child=>ro.observe(child));
    }
  }

  function setupRails(){
    railSelectors.forEach(selector=>{
      document.querySelectorAll(selector).forEach(registerRail);
    });

    if("MutationObserver" in window){
      const observer=new MutationObserver(records=>{
        let found=false;
        for(const record of records){
          for(const node of record.addedNodes){
            if(!(node instanceof Element))continue;
            if(railSelectors.some(selector=>node.matches?.(selector)||node.querySelector?.(selector))){
              found=true;break;
            }
          }
          if(found)break;
        }
        if(found)railSelectors.forEach(selector=>document.querySelectorAll(selector).forEach(registerRail));
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }
  }

  /* Expand a supporting-information parent before highlighting a deep-linked child. */
  function revealCollapsedParent(target){
    const parent=target?.closest?.(".v208-secondary,.v209-secondary");
    if(!parent||!parent.id)return;
    if(parent.classList.contains("v208-collapsed")){
      const toggle=document.querySelector('[data-v208-target="'+esc(parent.id)+'"]');
      if(toggle&&toggle.getAttribute("aria-expanded")!=="true")toggle.click();
    }
    if(parent.classList.contains("v209-collapsed")){
      const toggle=document.querySelector('[data-v209-target="'+esc(parent.id)+'"]');
      if(toggle&&toggle.getAttribute("aria-expanded")!=="true")toggle.click();
    }
  }

  let highlightTimer=0;
  let activeTarget=null;

  function highlightTarget(id,{scroll=false}={}){
    if(!id)return;
    const target=document.getElementById(id);
    if(!target)return;

    revealCollapsedParent(target);

    window.clearTimeout(highlightTimer);
    if(activeTarget&&activeTarget!==target)activeTarget.classList.remove("v222-deep-link-target");
    activeTarget=target;

    window.setTimeout(()=>{
      target.classList.remove("v222-deep-link-target");
      /* Force restart if the same destination is linked repeatedly. */
      void target.offsetWidth;
      target.classList.add("v222-deep-link-target");

      if(scroll){
        target.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
      }

      highlightTimer=window.setTimeout(()=>{
        target.classList.remove("v222-deep-link-target");
        if(activeTarget===target)activeTarget=null;
      },reduce()?3600:2600);
    },80);
  }

  function currentHashId(){
    try{return decodeURIComponent((location.hash||"").replace(/^#/,""))}
    catch(_e){return (location.hash||"").replace(/^#/,"")}
  }

  function setupDeepLinks(){
    const initial=currentHashId();
    if(initial){
      /* V203/V204 already perform route/hash positioning. Wait for those layout passes. */
      window.setTimeout(()=>highlightTarget(initial,{scroll:false}),320);
    }

    window.addEventListener("hashchange",()=>{
      const id=currentHashId();
      if(id)window.setTimeout(()=>highlightTarget(id,{scroll:false}),120);
    });

    document.addEventListener("click",event=>{
      const control=event.target.closest(
        'a[href*="#"],button[data-v203-target],button[data-v208-target],button[data-v209-target],[data-v213-open]'
      );
      if(!control)return;

      let id="";
      if(control.dataset.v203Target)id=control.dataset.v203Target;
      else if(control.dataset.v208Target)id=control.dataset.v208Target;
      else if(control.dataset.v209Target)id=control.dataset.v209Target;
      else if(control.dataset.v213Open)id=control.dataset.v213Open;
      else{
        const href=control.getAttribute("href")||"";
        if(href.includes("#")){
          try{
            const url=new URL(href,location.href);
            if(url.origin===location.origin&&url.pathname.replace(/\/+$/,"")===location.pathname.replace(/\/+$/,"")){
              id=decodeURIComponent(url.hash.replace(/^#/,""));
            }
          }catch(_e){}
        }
      }

      if(id)window.setTimeout(()=>highlightTarget(id,{scroll:false}),240);
    },{passive:true});
  }

  /* Add a stable route marker for styling/QA without changing navigation logic. */
  function markRoute(){
    const path=(location.pathname||"/").replace(/\/+$/,"")||"/";
    document.documentElement.dataset.v222Route=path;
  }

  function boot(){
    markRoute();
    setupRails();
    setupDeepLinks();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();