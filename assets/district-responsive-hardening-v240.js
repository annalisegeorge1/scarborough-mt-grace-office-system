(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v240-responsive-hardening-ready"))return;
  document.documentElement.classList.add("v240-responsive-hardening-ready");

  const root=document.documentElement;
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function visible(el){
    if(!el)return false;
    const style=getComputedStyle(el);
    const rect=el.getBoundingClientRect();
    return style.display!=="none"&&style.visibility!=="hidden"&&rect.width>0&&rect.height>0;
  }

  function measureStickyOffset(){
    const candidates=[
      document.querySelector('nav[aria-label="Site navigation"]'),
      document.querySelector(".v125-mobile-nav-shell")
    ].filter(visible);

    let offset=0;
    candidates.forEach(el=>{
      const style=getComputedStyle(el);
      if(style.position!=="sticky"&&style.position!=="fixed")return;
      const rect=el.getBoundingClientRect();
      /* A sticky element may not yet be touching the viewport. Its height is
         still the safe clearance once a hash navigation causes it to stick. */
      offset=Math.max(offset,Math.ceil(rect.height));
    });

    if(offset<48)offset=window.innerWidth<=900?64:72;
    root.style.setProperty("--v240-sticky-offset",offset+"px");
    return offset;
  }

  function currentHashTarget(){
    const raw=decodeURIComponent((location.hash||"").replace(/^#/,""));
    if(!raw)return null;
    try{return document.getElementById(raw)||document.querySelector('[name="'+CSS.escape(raw)+'"]')}
    catch(_e){return document.getElementById(raw)}
  }

  function ensureTargetClear(target){
    if(!target||!target.getClientRects().length)return;
    if(target.closest(
      'nav[aria-label="Site navigation"],.v125-mobile-nav-shell,.v202-drawer,.v224-root,.v225-root,.v228-root,.v231-root'
    ))return;

    const offset=measureStickyOffset()+12;
    const rect=target.getBoundingClientRect();
    if(rect.top>=offset)return;

    window.scrollBy({
      top:rect.top-offset,
      left:0,
      behavior:reduce()?"auto":"auto"
    });
  }

  let frame=0;
  function requestMeasure(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      measureStickyOffset();
    });
  }

  function restoreHashClearance(){
    const target=currentHashTarget();
    if(!target)return;
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>ensureTargetClear(target));
    });
  }

  function install(){
    measureStickyOffset();

    window.addEventListener("resize",requestMeasure,{passive:true});
    window.addEventListener("orientationchange",()=>{
      window.setTimeout(()=>{
        measureStickyOffset();
        restoreHashClearance();
      },180);
    },{passive:true});

    window.addEventListener("hashchange",()=>{
      window.setTimeout(restoreHashClearance,80);
    });

    document.addEventListener("focusin",event=>{
      const target=event.target;
      if(!(target instanceof HTMLElement))return;
      if(!target.matches('a,button,input,select,textarea,[role="button"],[tabindex]'))return;
      window.setTimeout(()=>ensureTargetClear(target),0);
    });

    if("ResizeObserver" in window){
      const observer=new ResizeObserver(requestMeasure);
      [
        document.querySelector('nav[aria-label="Site navigation"]'),
        document.querySelector(".v125-mobile-nav-shell")
      ].filter(Boolean).forEach(el=>observer.observe(el));
    }

    if(window.visualViewport){
      window.visualViewport.addEventListener("resize",requestMeasure,{passive:true});
    }

    window.setTimeout(restoreHashClearance,260);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",install,{once:true});
  }else{
    install();
  }
})();