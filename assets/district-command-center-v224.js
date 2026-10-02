(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v224-command-center-ready"))return;
  document.documentElement.classList.add("v224-command-center-ready");

  const normalizePath=value=>(value||"/").replace(/\/+$/,"")||"/";
  const currentPath=normalizePath(location.pathname);
  const esc=value=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const slug=value=>String(value||"")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g," ")
    .trim();
  const safeId=value=>slug(value).replace(/\s+/g,"-").slice(0,72)||"section";
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const routeBySection={
    "v51-home":"/",
    "about":"/office/","team":"/office/","leadership":"/office/","district-profile":"/office/","v121-scope":"/office/",
    "resident-start":"/services/","services":"/services/","resident-guide":"/services/","resident-programmes":"/services/",
    "resources":"/services/","resident-faq":"/services/","how-we-help":"/services/","help-selector":"/services/","support-areas":"/services/",
    "community-action-centre":"/community/","community-engagement":"/community/","projects":"/community/","events":"/community/",
    "gallery":"/community/","v121-what-we-heard":"/community/","community-compass":"/community/",
    "portal-hub":"/forms/","service-forms":"/forms/","enquiry":"/forms/","documents":"/forms/",
    "v135-live-updates":"/updates/","activity-hub":"/updates/","v133-public-action":"/updates/","v142-public-matters":"/updates/","v141-public-plans":"/updates/",
    "contact-us":"/contact/","office-hours":"/contact/","v121-feedback-info":"/contact/","v151-resident-voice":"/contact/"
  };

  const catalog=[
    {label:"Home",hint:"District Office homepage and public starting point",url:"/",group:"Navigate",mark:"HM",aliases:"home start district office"},
    {label:"Your District Office",hint:"People, office information, leadership and district profile",url:"/office/",group:"Navigate",mark:"OFF",aliases:"office about team staff people leadership"},
    {label:"Resident Services",hint:"Find assistance, programmes, guidance and resources",url:"/services/",group:"Navigate",mark:"SRV",aliases:"help assistance service programme resident support"},
    {label:"Community",hint:"Projects, participation, activity and public matters",url:"/community/",group:"Navigate",mark:"COM",aliases:"community projects events outreach participation"},
    {label:"Forms & Portals",hint:"Forms, enquiries, public portals and process guidance",url:"/forms/",group:"Navigate",mark:"FOR",aliases:"forms documents apply portal application"},
    {label:"Updates & Information",hint:"District Digital Feed, notices and public progress",url:"/updates/",group:"Navigate",mark:"UPD",aliases:"updates notices news feed projects progress"},
    {label:"Contact & Enquiries",hint:"Office contact details, hours, enquiry and follow-up",url:"/contact/",group:"Navigate",mark:"CON",aliases:"contact phone whatsapp hours enquiry visit"},

    {label:"Submit an Enquiry",hint:"Send a new resident enquiry to the District Office",url:"/forms/#enquiry",group:"Resident actions",mark:"NEW",aliases:"submit enquiry ask question request assistance message"},
    {label:"Track an Enquiry",hint:"Check an existing enquiry using the resident tracker",url:"/track/",group:"Resident actions",mark:"TRK",aliases:"track status reference existing enquiry case"},
    {label:"Service Forms",hint:"Browse available public forms and collection information",url:"/forms/#service-forms",group:"Resident actions",mark:"PDF",aliases:"forms documents download application collect"},
    {label:"Resident Guide",hint:"Step-by-step guidance for finding and using services",url:"/services/#resident-guide",group:"Resident actions",mark:"GDE",aliases:"guide help how to service steps"},
    {label:"Programmes",hint:"Resident programmes and published programme guidance",url:"/services/#resident-programmes",group:"Resident actions",mark:"PRG",aliases:"programme program assistance grant support"},
    {label:"Frequently Asked Questions",hint:"Common resident questions and service guidance",url:"/services/#resident-faq",group:"Resident actions",mark:"FAQ",aliases:"faq questions answers help"},
    {label:"Resources",hint:"Resident resources and supporting public information",url:"/services/#resources",group:"Resident actions",mark:"RES",aliases:"resources information documents help"},
    {label:"Portal Hub",hint:"Open resident-facing service portals",url:"/forms/#portal-hub",group:"Resident actions",mark:"HUB",aliases:"portal online tools forms"},

    {label:"Meet the Team",hint:"District Office staff directory",url:"/office/#team",group:"Office",mark:"TM",aliases:"team staff people directory office"},
    {label:"About the Office",hint:"District Office purpose and public role",url:"/office/#about",group:"Office",mark:"ABT",aliases:"about office purpose role"},
    {label:"Office Hours & Location",hint:"When and where to visit the District Office",url:"/contact/#office-hours",group:"Office",mark:"HRS",aliases:"hours location address visit open"},
    {label:"Contact the Office",hint:"Phone, WhatsApp and public contact information",url:"/contact/#contact-us",group:"Office",mark:"TEL",aliases:"contact call phone whatsapp email address"},

    {label:"Community Action Centre",hint:"Community activity, participation and project information",url:"/community/#community-action-centre",group:"Community",mark:"ACT",aliases:"community action centre projects participation"},
    {label:"Community Engagement",hint:"Engagement, outreach and participation information",url:"/community/#community-engagement",group:"Community",mark:"ENG",aliases:"community engagement outreach participation"},
    {label:"Projects",hint:"District projects and public follow-up",url:"/community/#projects",group:"Community",mark:"PRJ",aliases:"projects works infrastructure progress"},
    {label:"Activity Hub",hint:"Notices, town halls, projects and follow-up",url:"/updates/#activity-hub",group:"Updates",mark:"HUB",aliases:"activity notices town hall projects follow up"},
    {label:"Live Updates",hint:"Staff-published District Office updates",url:"/updates/#v135-live-updates",group:"Updates",mark:"LIVE",aliases:"live latest update news notice"},
    {label:"Public Action & Progress",hint:"Published public progress and action information",url:"/updates/#v133-public-action",group:"Updates",mark:"PRG",aliases:"progress action status public"},
    {label:"Gallery",hint:"Community and District Office photographs",url:"/community/#gallery",group:"Community",mark:"IMG",aliases:"gallery photos images community events"}
  ];

  let dynamicEntries=[];
  let selectedIndex=0;
  let visibleResults=[];
  let lastFocus=null;
  let rebuildTimer=0;

  function routeForAncestor(id){
    if(routeBySection[id])return routeBySection[id];
    if(currentPath==="/office")return "/office/";
    if(currentPath==="/services")return "/services/";
    if(currentPath==="/community")return "/community/";
    if(currentPath==="/forms")return "/forms/";
    if(currentPath==="/updates")return "/updates/";
    if(currentPath==="/contact")return "/contact/";
    return "/";
  }

  function buildDynamicIndex(){
    const entries=[];
    const seen=new Set();
    const counters=new Map();

    document.querySelectorAll("main h2,main h3,main h4").forEach(heading=>{
      if(heading.closest(".v224-command-root,nav,footer"))return;
      const label=(heading.textContent||"").replace(/\s+/g," ").trim();
      if(label.length<3||label.length>110)return;

      const ancestor=heading.closest("section[id],article[id],div[id]");
      if(!ancestor?.id)return;
      const parentId=ancestor.id;
      const route=routeForAncestor(parentId);
      const key=slug(label)+"|"+route+"|"+parentId;
      if(seen.has(key))return;
      seen.add(key);

      if(!heading.id){
        const base="v224-"+safeId(parentId)+"-"+safeId(label);
        const count=(counters.get(base)||0)+1;
        counters.set(base,count);
        heading.id=count===1?base:base+"-"+count;
      }

      const context=(ancestor.querySelector(":scope > p")?.textContent||"").replace(/\s+/g," ").trim();
      entries.push({
        label,
        hint:context.slice(0,130)||"Jump directly to this public section",
        url:route+"#"+encodeURIComponent(heading.id),
        group:"On this site",
        mark:"GO",
        aliases:[ancestor.id,parentId,ancestor.className].join(" ")
      });
    });

    dynamicEntries=entries.slice(0,120);
  }

  function score(entry,query){
    if(!query)return 1;
    const q=slug(query);
    const words=q.split(/\s+/).filter(Boolean);
    const label=slug(entry.label);
    const hint=slug(entry.hint);
    const aliases=slug(entry.aliases);
    const hay=label+" "+hint+" "+aliases;

    let total=0;
    if(label===q)total+=140;
    if(label.startsWith(q))total+=90;
    if(label.includes(q))total+=65;
    if(aliases.includes(q))total+=42;
    if(hint.includes(q))total+=28;

    for(const word of words){
      if(label.startsWith(word))total+=24;
      else if(label.includes(word))total+=18;
      else if(aliases.includes(word))total+=12;
      else if(hay.includes(word))total+=7;
      else return 0;
    }

    if(entry.url.startsWith(location.pathname))total+=4;
    return total;
  }

  const root=document.createElement("div");
  root.className="v224-command-root";
  root.setAttribute("aria-hidden","true");
  root.innerHTML=
    '<div class="v224-command-backdrop" data-v224-close></div>'+
    '<section class="v224-command-shell" role="dialog" aria-modal="true" aria-labelledby="v224-command-title">'+
      '<header class="v224-command-head">'+
        '<div class="v224-command-kicker">Resident Command Center</div>'+
        '<div class="v224-command-title-row">'+
          '<div><h2 id="v224-command-title">Where do you want to go?</h2><p>Search services, forms, community information, updates and office resources from one place.</p></div>'+
          '<button class="v224-command-close" type="button" data-v224-close aria-label="Close Resident Command Center">×</button>'+
        '</div>'+
      '</header>'+
      '<div class="v224-command-search-wrap">'+
        '<label class="v224-command-search">'+
          '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>'+
          '<input class="v224-command-input" type="search" autocomplete="off" spellcheck="false" placeholder="Try “forms”, “track”, “team”, “project”…" aria-label="Search District Office commands and public information">'+
          '<span class="v224-command-shortcut">Ctrl / ⌘ + K</span>'+
        '</label>'+
      '</div>'+
      '<div class="v224-quick-actions" aria-label="Quick resident actions">'+
        '<a class="v224-quick" href="/forms/#enquiry"><span class="v224-quick-icon">+</span><span><strong>Enquire</strong><small>Start a new enquiry</small></span></a>'+
        '<a class="v224-quick" href="/track/"><span class="v224-quick-icon">↗</span><span><strong>Track</strong><small>Check existing status</small></span></a>'+
        '<a class="v224-quick" href="tel:+18686106314"><span class="v224-quick-icon">☎</span><span><strong>Call</strong><small>(868) 610-6314</small></span></a>'+
        '<a class="v224-quick" href="https://wa.me/18683445268" target="_blank" rel="noopener"><span class="v224-quick-icon">WA</span><span><strong>WhatsApp</strong><small>(868) 344-5268</small></span></a>'+
      '</div>'+
      '<div class="v224-command-results" id="v224-command-results"></div>'+
      '<div class="v224-command-empty"><strong>No exact match yet.</strong><span>Try a broader term such as service, form, programme, project, team, contact or track.</span></div>'+
      '<footer class="v224-command-foot">'+
        '<span class="v224-desktop-help"><span class="v224-key">↑↓</span> move <span class="v224-key">Enter</span> open <span class="v224-key">Esc</span> close</span>'+
        '<span>Public navigation only · no personal information is stored</span>'+
      '</footer>'+
    '</section>';
  document.body.appendChild(root);

  const shell=root.querySelector(".v224-command-shell");
  const input=root.querySelector(".v224-command-input");
  const results=root.querySelector(".v224-command-results");
  const empty=root.querySelector(".v224-command-empty");

  function resultMarkup(entry,index){
    return '<a class="v224-result'+(index===selectedIndex?" is-selected":"")+'" href="'+esc(entry.url)+'" data-v224-index="'+index+'">'+
      '<span class="v224-result-mark">'+esc(entry.mark||"GO")+'</span>'+
      '<span class="v224-result-copy"><strong>'+esc(entry.label)+'</strong><small>'+esc(entry.hint||"Open public information")+'</small></span>'+
      '<span class="v224-result-route">'+esc(entry.group||"Open")+'</span>'+
    '</a>';
  }

  function render(){
    const query=input.value.trim();
    const source=[...catalog,...dynamicEntries];
    const dedupe=new Map();

    source.forEach(entry=>{
      const key=slug(entry.label)+"|"+entry.url;
      if(!dedupe.has(key))dedupe.set(key,entry);
    });

    let ranked=[...dedupe.values()]
      .map(entry=>({entry,score:score(entry,query)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||a.entry.label.localeCompare(b.entry.label));

    if(!query){
      const preferredGroups=["Resident actions","Navigate","Office","Community","Updates"];
      ranked=ranked
        .filter(x=>preferredGroups.includes(x.entry.group))
        .sort((a,b)=>preferredGroups.indexOf(a.entry.group)-preferredGroups.indexOf(b.entry.group))
        .slice(0,12);
    }else{
      ranked=ranked.slice(0,18);
    }

    visibleResults=ranked.map(x=>x.entry);
    selectedIndex=Math.max(0,Math.min(selectedIndex,visibleResults.length-1));

    if(!visibleResults.length){
      results.innerHTML="";
      empty.classList.add("is-visible");
      return;
    }
    empty.classList.remove("is-visible");

    const grouped=new Map();
    visibleResults.forEach((entry,index)=>{
      const group=entry.group||"Results";
      if(!grouped.has(group))grouped.set(group,[]);
      grouped.get(group).push({entry,index});
    });

    results.innerHTML=[...grouped.entries()].map(([group,items])=>
      '<section class="v224-result-section"><div class="v224-result-heading">'+esc(group)+'</div>'+
      items.map(({entry,index})=>resultMarkup(entry,index)).join("")+
      '</section>'
    ).join("");

    const selected=results.querySelector('.v224-result[data-v224-index="'+selectedIndex+'"]');
    selected?.scrollIntoView({block:"nearest"});
  }

  function setSelected(next){
    if(!visibleResults.length)return;
    selectedIndex=(next+visibleResults.length)%visibleResults.length;
    results.querySelectorAll(".v224-result").forEach(el=>{
      const selected=Number(el.dataset.v224Index)===selectedIndex;
      el.classList.toggle("is-selected",selected);
    });
    results.querySelector('.v224-result[data-v224-index="'+selectedIndex+'"]')?.scrollIntoView({block:"nearest"});
  }

  function closeExplore(){
    if(!document.body.classList.contains("v202-nav-open"))return;
    document.querySelector(".v202-sidebar-root [data-v202-close]")?.click();
  }

  function openCommand(seed=""){
    closeExplore();
    buildDynamicIndex();
    lastFocus=document.activeElement;
    input.value=seed;
    selectedIndex=0;
    render();
    root.classList.add("is-open");
    root.setAttribute("aria-hidden","false");
    document.body.classList.add("v224-command-open");
    window.setTimeout(()=>{
      input.focus({preventScroll:true});
      if(seed)input.setSelectionRange(seed.length,seed.length);
    },40);
  }

  function closeCommand(){
    if(!root.classList.contains("is-open"))return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden","true");
    document.body.classList.remove("v224-command-open");
    if(lastFocus&&typeof lastFocus.focus==="function")lastFocus.focus({preventScroll:true});
  }

  function openUrl(url){
    if(!url)return;
    let parsed;
    try{parsed=new URL(url,location.origin)}catch(_e){location.href=url;return}

    const sameOrigin=parsed.origin===location.origin;
    const samePath=sameOrigin&&normalizePath(parsed.pathname)===currentPath;
    const id=decodeURIComponent(parsed.hash.replace(/^#/,""));

    if(samePath&&id){
      const target=document.getElementById(id);
      if(target){
        closeCommand();
        const collapsed=target.closest(".v208-secondary.v208-collapsed,.v209-secondary.v209-collapsed");
        if(collapsed?.id){
          document.querySelector('[data-v208-target="'+CSS.escape(collapsed.id)+'"],[data-v209-target="'+CSS.escape(collapsed.id)+'"]')?.click();
        }
        window.setTimeout(()=>{
          target.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
          try{history.replaceState(null,"","#"+id)}catch(_e){}
          target.classList.add("v222-deep-link-target");
          window.setTimeout(()=>target.classList.remove("v222-deep-link-target"),2600);
        },80);
        return;
      }
    }

    closeCommand();
    location.href=parsed.href;
  }

  input.addEventListener("input",()=>{
    selectedIndex=0;
    render();
  });

  input.addEventListener("keydown",event=>{
    if(event.key==="ArrowDown"){
      event.preventDefault();setSelected(selectedIndex+1);
    }else if(event.key==="ArrowUp"){
      event.preventDefault();setSelected(selectedIndex-1);
    }else if(event.key==="Enter"){
      if(!visibleResults.length)return;
      event.preventDefault();
      openUrl(visibleResults[selectedIndex]?.url);
    }
  });

  results.addEventListener("mousemove",event=>{
    const item=event.target.closest(".v224-result");
    if(!item)return;
    const index=Number(item.dataset.v224Index);
    if(Number.isFinite(index)&&index!==selectedIndex)setSelected(index);
  });

  results.addEventListener("click",event=>{
    const item=event.target.closest(".v224-result");
    if(!item)return;
    const entry=visibleResults[Number(item.dataset.v224Index)];
    if(!entry)return;
    const parsed=new URL(entry.url,location.origin);
    if(parsed.origin===location.origin){
      event.preventDefault();
      openUrl(entry.url);
    }
  });

  root.querySelectorAll("[data-v224-close]").forEach(el=>el.addEventListener("click",closeCommand));

  shell.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
      event.preventDefault();closeCommand();return;
    }
    if(event.key!=="Tab")return;
    const focusables=[...shell.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')]
      .filter(el=>!el.hidden&&el.offsetParent!==null);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });

  document.addEventListener("keydown",event=>{
    const typing=document.activeElement?.matches?.("input,textarea,select,[contenteditable='true']");
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
      event.preventDefault();
      root.classList.contains("is-open")?closeCommand():openCommand();
      return;
    }
    if(event.key==="/"&&!typing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();openCommand();
      return;
    }
    if(event.key==="Escape"&&root.classList.contains("is-open")){
      event.preventDefault();closeCommand();
    }
  });

  function addOpeners(){
    const drawerHead=document.querySelector(".v202-drawer-head");
    if(drawerHead&&!drawerHead.querySelector(".v224-explore-command")){
      const button=document.createElement("button");
      button.type="button";
      button.className="v224-explore-command";
      button.innerHTML='<span><strong>Resident Command Center</strong><small>Search the whole public site from one place</small></span><kbd>Ctrl K</kbd>';
      button.addEventListener("click",()=>openCommand());
      drawerHead.appendChild(button);
    }

    const rail=document.querySelector(".v202-side-rail");
    if(rail&&!rail.querySelector(".v224-rail-command")){
      const button=document.createElement("button");
      button.type="button";
      button.className="v202-rail-btn v224-rail-command";
      button.setAttribute("aria-label","Open Resident Command Center");
      button.title="Resident Command Center (Ctrl/⌘ + K)";
      button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>';
      button.addEventListener("click",()=>openCommand());
      const divider=rail.querySelector(".v202-rail-divider");
      rail.insertBefore(button,divider||rail.lastElementChild);
    }
  }

  addOpeners();
  window.setTimeout(addOpeners,250);

  /* The original public search remains valid. Enter can hand its query to the
     Command Center without removing the existing field or its filtering behavior. */
  const legacySearch=document.getElementById("v27-site-search-input");
  legacySearch?.addEventListener("keydown",event=>{
    if(event.key!=="Enter"||!legacySearch.value.trim())return;
    event.preventDefault();
    openCommand(legacySearch.value.trim());
  });

  if("MutationObserver" in window){
    new MutationObserver(()=>{
      clearTimeout(rebuildTimer);
      rebuildTimer=window.setTimeout(buildDynamicIndex,180);
    }).observe(document.querySelector("main")||document.body,{childList:true,subtree:true});
  }

  buildDynamicIndex();
  render();
})();