(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v239-civic-shell-ready"))return;
  document.documentElement.classList.add("v239-civic-shell-ready");

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  const routes={
    "/":{key:"home",label:"Home"},
    "/office":{key:"office",label:"Your District Office"},
    "/services":{key:"services",label:"Resident Services"},
    "/community":{key:"community",label:"Community"},
    "/forms":{key:"forms",label:"Forms & Portals"},
    "/updates":{key:"updates",label:"Updates & Information"},
    "/contact":{key:"contact",label:"Contact & Enquiries"}
  };
  const route=routes[path]||{key:"home",label:"District Office"};

  document.body.classList.add("v239-civic-shell");
  document.body.dataset.v239Route=route.key;

  function installProgress(){
    if(document.querySelector(".v239-scroll-progress"))return;
    const progress=document.createElement("div");
    progress.className="v239-scroll-progress";
    progress.setAttribute("aria-hidden","true");
    progress.innerHTML="<span></span>";
    document.body.appendChild(progress);
  }

  function installRouteIndicator(){
    if(document.querySelector(".v239-route-indicator"))return;
    const nav=document.querySelector('nav[aria-label="Site navigation"]');
    if(!nav)return;
    const brand=nav.querySelector(".v7-brandmark")||nav.querySelector(".nav-inner");
    if(!brand)return;
    const indicator=document.createElement("span");
    indicator.className="v239-route-indicator";
    indicator.textContent=route.label;
    indicator.setAttribute("aria-hidden","true");
    brand.appendChild(indicator);
  }

  function composeFooter(){
    const footer=document.querySelector("footer");
    if(!footer||footer.querySelector(":scope > .v239-footer-deck"))return;

    const items=[
      footer.querySelector(".v20-footer-signature"),
      footer.querySelector(".v14-access-note"),
      footer.querySelector(".v10-staff-entry")
    ].filter(Boolean);

    if(items.length<2)return;

    const deck=document.createElement("div");
    deck.className="v239-footer-deck";
    deck.setAttribute("data-v239-composed","true");

    const first=items[0];
    first.parentNode.insertBefore(deck,first);
    items.forEach(item=>deck.appendChild(item));
  }

  let ticking=false;
  function updateShell(){
    ticking=false;
    const y=Math.max(0,window.scrollY||window.pageYOffset||0);
    const doc=document.documentElement;
    const max=Math.max(1,doc.scrollHeight-window.innerHeight);
    const pct=Math.max(0,Math.min(100,(y/max)*100));
    doc.style.setProperty("--v239-progress",pct.toFixed(2)+"%");
    document.body.classList.toggle("v239-scrolled",y>72);
  }

  function requestUpdate(){
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(updateShell);
  }

  function install(){
    installProgress();
    installRouteIndicator();
    composeFooter();
    updateShell();

    window.addEventListener("scroll",requestUpdate,{passive:true});
    window.addEventListener("resize",requestUpdate,{passive:true});

    if("ResizeObserver" in window){
      const observer=new ResizeObserver(requestUpdate);
      observer.observe(document.documentElement);
    }

    requestAnimationFrame(()=>document.body.classList.add("v239-mounted"));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",install,{once:true});
  }else{
    install();
  }
})();