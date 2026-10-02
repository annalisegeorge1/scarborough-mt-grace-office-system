(()=>{
  "use strict";
  if(document.body.classList.contains("v213-digital-feed-ready"))return;
  document.body.classList.add("v213-digital-feed-ready");

  const normalizePath=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalizePath(location.pathname);
  const esc=value=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const text=(el,selector)=>{
    const node=selector?el?.querySelector(selector):el;
    return (node?.textContent||"").replace(/\s+/g," ").trim();
  };
  const slug=value=>String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const short=(value,max=270)=>{
    const s=String(value||"").replace(/\s+/g," ").trim();
    return s.length>max?s.slice(0,max-1).replace(/\s+\S*$/,"")+"…":s;
  };
  const tone=status=>{
    const s=slug(status);
    if(/confirm|complete|publish|resolved/.test(s))return "confirmed";
    if(/follow|await|hold/.test(s))return "followup";
    if(/develop|draft|prepar/.test(s))return "development";
    if(/plan|priority|advocacy/.test(s))return "planned";
    return "neutral";
  };
  const categoryClass=category=>{
    const s=slug(category);
    if(s.includes("project"))return "v213-project";
    if(s.includes("community")||s.includes("gallery"))return "v213-community";
    if(s.includes("update"))return "v213-update";
    return "";
  };
  const validDate=value=>{
    if(!value)return 0;
    const d=Date.parse(value);
    return Number.isFinite(d)?d:0;
  };

  function collectEntries(){
    const entries=[];

    document.querySelectorAll("#v135-live-grid .v135-live-card").forEach((card,index)=>{
      const title=text(card,"strong");
      if(!title)return;
      const spans=[...card.querySelectorAll("small span")];
      const category=text(spans[0])||"Office Update";
      const status=text(card,".v136-live-state")||text(spans[1])||"Published";
      const date=text(card,".v136-public-date");
      let location=text(card,".meta");
      if(date&&location.endsWith(date))location=location.slice(0,-date.length).replace(/[·•\s]+$/,"").trim();
      entries.push({
        key:"live:"+slug(title)+":"+index,
        title,
        summary:text(card,"p"),
        status,
        date,
        dateValue:validDate(date),
        location,
        category:"Updates",
        sourceLabel:category||"Staff-published update",
        sourceId:"v135-live-updates",
        priority:100
      });
    });

    document.querySelectorAll("#activity-hub .v26-notice").forEach((card,index)=>{
      const title=text(card,"h4");
      if(!title)return;
      entries.push({
        key:"notice:"+slug(title)+":"+index,
        title,
        summary:text(card,"p"),
        status:text(card,".v26-badge")||"Notice",
        date:"",
        dateValue:0,
        location:text(card,".v26-notice-top small"),
        category:"Notices",
        sourceLabel:"District notice",
        sourceId:"activity-hub",
        priority:88
      });
    });

    document.querySelectorAll("#activity-hub .v26-project").forEach((card,index)=>{
      const title=text(card,"h4");
      if(!title)return;
      entries.push({
        key:"project:"+slug(title)+":"+index,
        title,
        summary:text(card,"p")||text(card,".v90-status-inline em"),
        status:text(card,".v90-public-status")||card.dataset.v90Status||"Public status",
        date:"",
        dateValue:0,
        location:text(card,".v26-project-code"),
        category:"Projects",
        sourceLabel:"Project & follow-up",
        sourceId:"activity-hub",
        priority:82
      });
    });

    document.querySelectorAll("#v121-what-we-heard .v121-heard").forEach((card,index)=>{
      const title=text(card,"strong");
      if(!title)return;
      entries.push({
        key:"community:"+slug(title)+":"+index,
        title,
        summary:text(card,"p"),
        status:text(card,".v121-heard-status")||"Community matter",
        date:"",
        dateValue:0,
        location:text(card,"small"),
        category:"Community",
        sourceLabel:"What we heard",
        sourceId:"v121-what-we-heard",
        priority:74
      });
    });

    const action=document.getElementById("v133-public-action");
    if(action){
      const paragraphs=[...action.querySelectorAll("p")].map(p=>text(p)).filter(Boolean);
      const summary=paragraphs.find(p=>p.length>80&&p.length<700)||
        "Meetings, opportunities, public priorities and verified follow-up are brought together in the Public Action & Progress framework.";
      entries.push({
        key:"progress:public-action",
        title:"Public Action & Progress",
        summary,
        status:"Public framework",
        date:"",
        dateValue:0,
        location:"District-wide",
        category:"Progress",
        sourceLabel:"Public progress",
        sourceId:"v133-public-action",
        priority:58
      });
    }

    const gallery=document.getElementById("gallery");
    if(gallery){
      const allP=[...gallery.querySelectorAll("p")].map(p=>text(p)).filter(Boolean);
      const summary=allP.find(p=>/glimpse|people|programmes|moments/i.test(p)&&p.length<500)||
        "Community photographs and District Office imagery presented with context about what each image does and does not document.";
      const countMatch=text(gallery).match(/(\d+)\s+supplied community photographs/i);
      entries.push({
        key:"community:gallery",
        title:"Community in Focus",
        summary,
        status:countMatch?countMatch[1]+" photographs":"Community gallery",
        date:"",
        dateValue:0,
        location:"Scarborough / Mt. Grace",
        category:"Community",
        sourceLabel:"Gallery",
        sourceId:"gallery",
        priority:48
      });
    }

    const seen=new Set();
    return entries
      .sort((a,b)=>(b.dateValue-a.dateValue)||(b.priority-a.priority))
      .filter(item=>{
        const k=slug(item.title);
        if(seen.has(k))return false;
        seen.add(k);
        return true;
      });
  }

  const routeForSource=(sourceId,contextPath=path)=>{
    if(sourceId==="gallery")return contextPath==="/updates"?"/updates/#gallery":"/community/#gallery";
    if(sourceId==="v121-what-we-heard")return contextPath==="/community"?"/community/#v121-what-we-heard":"/updates/#v121-what-we-heard";
    if(sourceId==="v133-public-action")return contextPath==="/community"?"/community/#v133-public-action":"/updates/#v133-public-action";
    if(sourceId==="activity-hub")return contextPath==="/community"?"/community/#activity-hub":"/updates/#activity-hub";
    if(sourceId==="v135-live-updates")return "/updates/#v135-live-updates";
    return "/updates/#"+encodeURIComponent(sourceId);
  };

  function revealLocal(id){
    const el=document.getElementById(id);
    if(!el)return false;
    const v208=document.querySelector("[data-v208-target='"+CSS.escape(id)+"']");
    const v209=document.querySelector("[data-v209-target='"+CSS.escape(id)+"']");
    if(v208&&v208.getAttribute("aria-expanded")!=="true")v208.click();
    if(v209&&v209.getAttribute("aria-expanded")!=="true")v209.click();
    window.setTimeout(()=>{
      const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});
      try{history.replaceState(null,"","#"+id)}catch(_e){}
    },80);
    return true;
  }

  function goToSource(id,contextPath=path){
    const destination=routeForSource(id,contextPath);
    const u=new URL(destination,location.origin);
    if(normalizePath(u.pathname)===path&&revealLocal(id))return;
    location.href=destination;
  }

  function copySource(id,contextPath=path,button){
    const url=new URL(routeForSource(id,contextPath),location.origin).href;
    const finish=()=>{
      if(!button)return;
      const old=button.innerHTML;
      button.textContent="Link copied";
      window.setTimeout(()=>button.innerHTML=old,1300);
    };
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(url).then(finish).catch(()=>{});
    }else{
      const ta=document.createElement("textarea");
      ta.value=url;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");finish()}catch(_e){}
      ta.remove();
    }
  }

  function itemMarkup(item){
    const metaTime=item.date
      ?'<span class="v213-item-dot"></span><span class="v213-item-time">'+esc(item.date)+'</span>'
      :"";
    return '<article class="v213-feed-item" data-v213-category="'+esc(slug(item.category))+'" data-v213-search="'+esc(slug([item.title,item.summary,item.location,item.status,item.category,item.sourceLabel].join(" ")))+'">'+
      '<div class="v213-item-avatar '+categoryClass(item.category)+'" aria-hidden="true">SMG</div>'+
      '<div class="v213-feed-content">'+
        '<div class="v213-item-top">'+
          '<span class="v213-item-author">Scarborough / Mt. Grace District Office</span>'+
          '<span class="v213-item-dot"></span>'+
          '<span class="v213-item-source">'+esc(item.sourceLabel)+'</span>'+
          metaTime+
          '<span class="v213-status" data-tone="'+tone(item.status)+'">'+esc(item.status||item.category)+'</span>'+
        '</div>'+
        '<h3>'+esc(item.title)+'</h3>'+
        (item.summary?'<p>'+esc(short(item.summary))+'</p>':"")+
        (item.location?'<div class="v213-item-location">'+esc(item.location)+'</div>':"")+
        '<div class="v213-item-actions">'+
          '<button class="v213-item-action v213-open" type="button" data-v213-open="'+esc(item.sourceId)+'"><span aria-hidden="true">↗</span> Open full information</button>'+
          '<button class="v213-item-action" type="button" data-v213-copy="'+esc(item.sourceId)+'"><span aria-hidden="true">⌁</span> Copy link</button>'+
        '</div>'+
      '</div>'+
    '</article>';
  }

  function createFeed(mode){
    const isCommunity=mode==="community";
    const shell=document.createElement("section");
    shell.className="v213-feed-shell";
    shell.dataset.v213Mode=mode;
    shell.setAttribute("aria-label",isCommunity?"Community Stream":"District Digital Feed");
    shell.innerHTML=
      '<header class="v213-feed-head">'+
        '<div class="v213-feed-title-row">'+
          '<div class="v213-feed-avatar" aria-hidden="true">SMG</div>'+
          '<div class="v213-feed-heading">'+
            '<small>'+(isCommunity?"Community stream":"District digital feed")+'</small>'+
            '<h2>'+(isCommunity?"Community activity in one stream":"Updates that are easier to follow")+'</h2>'+
            '<p>'+(isCommunity
              ?"Projects, resident-facing community matters and visual updates in a compact stream. Full source information remains available below."
              :"Staff-published updates appear first when dates are available. Current notices, projects and community matters remain connected to their full source sections.")+'</p>'+
          '</div>'+
          '<span class="v213-feed-verified">Public information</span>'+
        '</div>'+
      '</header>'+
      '<div class="v213-feed-tools">'+
        '<div class="v213-feed-filters" role="group" aria-label="Filter feed">'+
          '<button type="button" class="v213-feed-filter is-active" data-v213-filter="all">All</button>'+
          (isCommunity?"":'<button type="button" class="v213-feed-filter" data-v213-filter="updates">Office updates</button>')+
          '<button type="button" class="v213-feed-filter" data-v213-filter="notices">Notices</button>'+
          '<button type="button" class="v213-feed-filter" data-v213-filter="projects">Projects</button>'+
          '<button type="button" class="v213-feed-filter" data-v213-filter="community">Community</button>'+
          (isCommunity?"":'<button type="button" class="v213-feed-filter" data-v213-filter="progress">Progress</button>')+
        '</div>'+
        '<label class="v213-feed-search"><span class="sr-only">Search this feed</span><input type="search" placeholder="Search this feed…" aria-label="Search this feed"></label>'+
      '</div>'+
      '<div class="v213-feed-list" aria-live="polite"></div>'+
      '<div class="v213-feed-empty">No items match this filter. The full information sections remain available below.</div>'+
      '<footer class="v213-feed-foot">'+
        '<span class="v213-feed-count"></span>'+
        '<a href="'+(isCommunity?"/updates/":"/community/")+'">'+(isCommunity?"Open all district updates":"Open the Community Hub")+' →</a>'+
      '</footer>';
    return shell;
  }

  function bindFeed(shell,mode){
    let active="all";
    let query="";
    const list=shell.querySelector(".v213-feed-list");
    const count=shell.querySelector(".v213-feed-count");
    const search=shell.querySelector(".v213-feed-search input");

    function availableEntries(){
      const all=collectEntries();
      if(mode==="community"){
        return all.filter(x=>["Notices","Projects","Community"].includes(x.category)).slice(0,9);
      }
      return all.slice(0,16);
    }

    function render(){
      const entries=availableEntries();
      list.innerHTML=entries.map(itemMarkup).join("");
      apply();
    }

    function apply(){
      let visible=0;
      list.querySelectorAll(".v213-feed-item").forEach(item=>{
        const cat=item.dataset.v213Category||"";
        const hay=item.dataset.v213Search||"";
        const show=(active==="all"||cat===active)&&(!query||hay.includes(query));
        item.classList.toggle("is-hidden",!show);
        if(show)visible++;
      });
      shell.classList.toggle("is-empty",visible===0);
      count.textContent=visible+" public item"+(visible===1?"":"s")+" shown";
    }

    shell.addEventListener("click",e=>{
      const filter=e.target.closest("[data-v213-filter]");
      if(filter){
        active=filter.dataset.v213Filter;
        shell.querySelectorAll("[data-v213-filter]").forEach(b=>b.classList.toggle("is-active",b===filter));
        apply();
        return;
      }
      const open=e.target.closest("[data-v213-open]");
      if(open){goToSource(open.dataset.v213Open,mode==="community"?"/community":"/updates");return}
      const copy=e.target.closest("[data-v213-copy]");
      if(copy){copySource(copy.dataset.v213Copy,mode==="community"?"/community":"/updates",copy)}
    });
    search.addEventListener("input",()=>{
      query=slug(search.value);
      apply();
    });
    render();

    const live=document.getElementById("v135-live-grid");
    if(live){
      let timer=0;
      new MutationObserver(()=>{
        clearTimeout(timer);
        timer=window.setTimeout(render,80);
      }).observe(live,{childList:true,subtree:true,characterData:true});
    }
  }

  function addFocusedFeed(){
    if(!["/updates","/community"].includes(path))return;
    const mainCol=document.querySelector(".v204-main-column");
    if(!mainCol||mainCol.querySelector(":scope > .v213-feed-shell"))return;
    const mode=path==="/community"?"community":"updates";
    const shell=createFeed(mode);
    const identity=mainCol.querySelector(":scope > .v207-identity-strip");
    const deck=mainCol.querySelector(":scope > .v204-action-deck");
    if(identity)identity.insertAdjacentElement("afterend",shell);
    else mainCol.insertBefore(shell,deck||mainCol.firstChild);
    bindFeed(shell,mode);
  }

  function pulseMarkup(item){
    const href=routeForSource(item.sourceId,"/");
    return '<article class="v213-pulse-item">'+
      '<small>'+esc(item.category)+' · '+esc(item.status||"Public information")+'</small>'+
      '<strong>'+esc(item.title)+'</strong>'+
      (item.summary?'<p>'+esc(short(item.summary,145))+'</p>':"")+
      '<a href="'+esc(href)+'" aria-label="Open '+esc(item.title)+'">Open</a>'+
    '</article>';
  }

  function addHomepagePulse(){
    if(!["/","/index.html","/index-self-contained.html"].includes(path))return;
    if(document.querySelector(".v213-pulse"))return;
    const activity=document.getElementById("activity-hub");
    if(!activity)return;
    const getPulseEntries=()=>collectEntries().filter(x=>["Updates","Notices","Projects","Community"].includes(x.category)).slice(0,4);
    const entries=getPulseEntries();
    if(!entries.length)return;
    const pulse=document.createElement("section");
    pulse.className="v213-pulse";
    pulse.setAttribute("aria-label","District Pulse");
    pulse.innerHTML=
      '<div class="v213-pulse-head">'+
        '<div><small>District Pulse</small><strong>What residents may want to follow</strong></div>'+
        '<a href="/updates/">Open all updates →</a>'+
      '</div>'+
      '<div class="v213-pulse-list">'+entries.map(pulseMarkup).join("")+'</div>';
    activity.insertAdjacentElement("afterend",pulse);

    const live=document.getElementById("v135-live-grid");
    if(live){
      let timer=0;
      new MutationObserver(()=>{
        clearTimeout(timer);
        timer=window.setTimeout(()=>{
          pulse.querySelector(".v213-pulse-list").innerHTML=getPulseEntries().map(pulseMarkup).join("");
        },80);
      }).observe(live,{childList:true,subtree:true,characterData:true});
    }
  }

  addFocusedFeed();
  addHomepagePulse();
})();