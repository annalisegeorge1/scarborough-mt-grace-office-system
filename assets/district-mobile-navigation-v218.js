(()=>{
  "use strict";
  if(document.body.classList.contains("v218-mobile-navigation-ready"))return;
  document.body.classList.add("v218-mobile-navigation-ready");

  const mobile=window.matchMedia("(max-width:900px)");
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function centerWithinRail(rail,item){
    if(!rail||!item||!mobile.matches)return;
    const target=item.offsetLeft-(rail.clientWidth-item.offsetWidth)/2;
    const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
    const left=Math.max(0,Math.min(max,target));
    rail.scrollTo({left,behavior:reduce()?"auto":"smooth"});
  }

  function centerPrimaryNav(){
    const rail=document.querySelector(".v125-mobile-nav-rail");
    if(!rail)return;
    const current=rail.querySelector(".v205-route-active,[aria-current='page']");
    if(current)window.setTimeout(()=>centerWithinRail(rail,current),40);
  }

  function setupFocusedTabs(){
    const rail=document.querySelector(".v203-page-tabs");
    if(!rail)return;

    const links=[...rail.querySelectorAll(".v203-page-tab[data-v203-target]")];
    if(!links.length)return;

    const setActive=link=>{
      links.forEach(item=>{
        const active=item===link;
        item.classList.toggle("is-active",active);
        if(active)item.setAttribute("aria-current","true");
        else item.removeAttribute("aria-current");
      });
      if(link)centerWithinRail(rail,link);
    };

    links.forEach(link=>{
      link.addEventListener("click",()=>setActive(link));
    });

    const currentHash=decodeURIComponent((location.hash||"").replace(/^#/,""));
    const hashLink=links.find(link=>link.dataset.v203Target===currentHash);
    if(hashLink)setActive(hashLink);
    else setActive(links[0]);

    if("IntersectionObserver" in window){
      const byId=new Map(links.map(link=>[link.dataset.v203Target,link]));
      const observed=[...byId.keys()]
        .map(id=>document.getElementById(id))
        .filter(Boolean);

      if(observed.length){
        const states=new Map();
        const observer=new IntersectionObserver(entries=>{
          entries.forEach(entry=>states.set(entry.target.id,entry));
          const candidates=[...states.values()]
            .filter(entry=>entry.isIntersecting)
            .sort((a,b)=>{
              const ay=Math.abs(a.boundingClientRect.top-window.innerHeight*.28);
              const by=Math.abs(b.boundingClientRect.top-window.innerHeight*.28);
              return ay-by;
            });
          if(!candidates.length)return;
          const link=byId.get(candidates[0].target.id);
          if(link&&!link.classList.contains("is-active"))setActive(link);
        },{root:null,rootMargin:"-18% 0px -62% 0px",threshold:[0,.08,.2,.5]});
        observed.forEach(el=>observer.observe(el));
      }
    }

    window.addEventListener("hashchange",()=>{
      const id=decodeURIComponent((location.hash||"").replace(/^#/,""));
      const link=links.find(item=>item.dataset.v203Target===id);
      if(link)setActive(link);
    });
  }

  function setupExploreAccordion(){
    const root=document.querySelector(".v202-sidebar-root");
    if(!root)return;
    const search=root.querySelector(".v202-search");
    const groups=[...root.querySelectorAll(".v202-group")];
    if(!groups.length)return;

    const routeMap={
      "/office":"office",
      "/services":"services",
      "/community":"community",
      "/forms":"tools",
      "/updates":"updates",
      "/contact":"contact"
    };
    const normalized=(location.pathname||"/").replace(/\/+$/,"")||"/";
    const currentKey=routeMap[normalized]||"";

    groups.forEach(group=>{
      group.classList.toggle("v218-current-group",group.dataset.v202Group===currentKey);
    });

    function closeGroup(group){
      if(!group)return;
      group.classList.remove("is-open");
      group.querySelector(".v202-group-toggle")?.setAttribute("aria-expanded","false");
    }

    function openOnly(group){
      if(!mobile.matches||search?.value.trim())return;
      groups.forEach(other=>{
        if(other!==group)closeGroup(other);
      });
      if(group){
        group.classList.add("is-open");
        group.querySelector(".v202-group-toggle")?.setAttribute("aria-expanded","true");
      }
    }

    if(mobile.matches){
      const current=groups.find(group=>group.dataset.v202Group===currentKey);
      groups.forEach(group=>closeGroup(group));
      if(current)openOnly(current);
    }

    root.addEventListener("click",event=>{
      const toggle=event.target.closest(".v202-group-toggle");
      if(!toggle||!mobile.matches||search?.value.trim())return;
      const clicked=toggle.closest(".v202-group");
      groups.forEach(other=>{
        if(other!==clicked)closeGroup(other);
      });
    },true);

    let enforcing=false;
    const observer=new MutationObserver(()=>{
      if(enforcing||!mobile.matches||search?.value.trim())return;
      const opened=groups.filter(group=>group.classList.contains("is-open"));
      if(opened.length<=1)return;
      enforcing=true;
      const preferred=opened.find(group=>group.classList.contains("v218-current-group"))||opened[opened.length-1];
      opened.forEach(group=>{if(group!==preferred)closeGroup(group)});
      enforcing=false;
    });
    groups.forEach(group=>observer.observe(group,{attributes:true,attributeFilter:["class"]}));

    search?.addEventListener("input",()=>{
      if(search.value.trim())return;
      const current=groups.find(group=>group.dataset.v202Group===currentKey);
      if(current)openOnly(current);
    });

    mobile.addEventListener?.("change",event=>{
      if(!event.matches)return;
      const current=groups.find(group=>group.dataset.v202Group===currentKey);
      groups.forEach(group=>closeGroup(group));
      if(current)openOnly(current);
    });
  }

  function boot(){
    centerPrimaryNav();
    setupFocusedTabs();
    setupExploreAccordion();
  }

  window.requestAnimationFrame(()=>window.setTimeout(boot,80));
  window.addEventListener("resize",()=>{
    window.clearTimeout(window.__v218ResizeTimer);
    window.__v218ResizeTimer=window.setTimeout(centerPrimaryNav,120);
  },{passive:true});
})();