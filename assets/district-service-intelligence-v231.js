(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v231-service-intelligence-ready"))return;
  document.documentElement.classList.add("v231-service-intelligence-ready");

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  if(path!=="/services")return;

  const esc=value=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const slug=value=>clean(value).toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g," ").trim();
  const idSlug=value=>slug(value).replace(/\s+/g,"-").slice(0,72);
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const STOP=new Set([
    "the","and","for","with","from","your","you","our","this","that","into","what","when","where",
    "service","services","assistance","support","resident","residents","programme","programmes",
    "program","programs","information","public","office","district","tobago","grace","scarborough",
    "help","need","find","more","about","apply","application"
  ]);

  let records=[];
  let fetchedAt=0;
  let fetching=null;
  let active=null;
  let directoryMode=false;
  let lastFocus=null;

  function serviceHosts(){
    return [
      document.getElementById("services"),
      document.getElementById("how-we-help"),
      document.getElementById("support-areas"),
      document.getElementById("resident-programmes")
    ].filter(Boolean);
  }

  function ensureAnchor(card,label,hostId){
    if(card.id)return card.id;
    const base="v231-service-"+idSlug(hostId+"-"+label);
    let id=base,n=2;
    while(document.getElementById(id)&&document.getElementById(id)!==card)id=base+"-"+n++;
    card.id=id;
    return id;
  }

  function discoverServices(){
    const seen=new Set(),items=[];
    const generic=/^(resident services|services|services & assistance|programmes|resources|how we help|support areas|resident programmes|frequently asked questions)$/i;

    serviceHosts().forEach(host=>{
      const cards=[...host.querySelectorAll("article,.service-card,[class*='service-card'],[class*='support-card'],[class*='programme-card']")];
      cards.forEach(card=>{
        if(card.closest(".v231-root,.v228-root"))return;
        const heading=card.querySelector("h3,h4,strong");
        const label=clean(heading?.textContent);
        if(label.length<3||label.length>110||generic.test(label))return;
        const key=label.toLowerCase();
        if(seen.has(key))return;
        seen.add(key);

        const description=clean(card.querySelector("p")?.textContent).slice(0,220);
        const points=[...card.querySelectorAll("li")].map(li=>clean(li.textContent)).filter(Boolean).slice(0,10);
        const id=ensureAnchor(card,label,host.id||"services");
        items.push({id,label,description,points,card,hostId:host.id||"services"});
      });
    });
    return items.slice(0,20);
  }

  function metadata(record){
    return record?.metadata&&typeof record.metadata==="object"?record.metadata:{};
  }

  function latestProgress(record){
    const list=metadata(record).progressHistory;
    if(!Array.isArray(list))return null;
    return list.filter(x=>x&&typeof x==="object"&&x.summary).slice()
      .sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0))[0]||null;
  }

  function updatedValue(record){
    return latestProgress(record)?.date||record.updatedAt||record.publishOn||record.eventDate||"";
  }

  function relativeDate(value){
    const time=Date.parse(value||"");
    if(!Number.isFinite(time))return "";
    const days=Math.max(0,Math.floor((Date.now()-time)/86400000));
    if(days===0)return "Updated today";
    if(days===1)return "Updated yesterday";
    if(days<7)return "Updated "+days+" days ago";
    return new Date(time).toLocaleDateString("en-TT",{day:"numeric",month:"short",year:"numeric"});
  }

  function typeLabel(record){
    const section=slug(record.section);
    const type=slug(record.type);
    if(section==="forms"||type.includes("form"))return "Form";
    if(type.includes("newsletter"))return "Newsletter";
    if(type.includes("notice")||type.includes("important"))return "Notice";
    if(section==="activity"||type.includes("activity"))return record.category||"Activity";
    return record.category||record.type||"Public information";
  }

  function destination(record){
    const section=slug(record.section);
    const type=slug(record.type);
    if(section==="forms"||type.includes("form")){
      return record.publicUrl||"/forms/#service-forms";
    }
    if(section==="activity"||type.includes("activity")||type.includes("notice")||type.includes("important")||type.includes("newsletter")){
      return "/updates/?post="+encodeURIComponent(record.id);
    }
    return record.publicUrl||"/updates/";
  }

  function statusFor(record){
    return latestProgress(record)?.status||record.publicStatus||record.category||"Published";
  }

  function textFor(record){
    return clean([
      record.title,record.summary,record.body,record.statusNote,record.category,record.publicStatus,
      record.responsibleAuthority,metadata(record).subtype,metadata(record).role
    ].filter(Boolean).join(" "));
  }

  function tokensFor(service){
    const raw=slug([service.label,service.description,...service.points].join(" "));
    const tokens=raw.split(/\s+/).filter(word=>word.length>=4&&!STOP.has(word));
    return [...new Set(tokens)].slice(0,24);
  }

  function scoreRecord(service,record){
    if(!service||!record||metadata(record).action==="hide")return -999;
    const hay=slug(textFor(record));
    const label=slug(service.label);
    const tokens=tokensFor(service);

    let score=0;
    if(label&&hay.includes(label))score+=80;

    let hits=0;
    tokens.forEach(token=>{
      if(hay.includes(token))hits++;
    });
    score+=hits*14;

    const section=slug(record.section);
    const type=slug(record.type);
    if(section==="forms"||type.includes("form"))score+=Math.min(20,hits*5);
    if(latestProgress(record))score+=8;
    if(record.isFeatured)score+=5;

    const age=(Date.now()-(Date.parse(updatedValue(record)||0)||0))/86400000;
    if(age<=30)score+=10;
    else if(age<=180)score+=5;

    /* Generic service words alone should never create a match. */
    if(hits===0&&!hay.includes(label))score-=100;
    return score;
  }

  function matchesFor(service){
    return records
      .map(record=>({record,score:scoreRecord(service,record),date:Date.parse(updatedValue(record)||0)||0}))
      .filter(item=>item.score>=28)
      .sort((a,b)=>(b.score-a.score)||(b.date-a.date))
      .slice(0,4)
      .map(item=>item.record);
  }

  async function loadRecords(force=false){
    if(!force&&records.length&&Date.now()-fetchedAt<300000)return records;
    if(fetching)return fetching;
    fetching=(async()=>{
      try{
        const response=await fetch("/api/public/content",{credentials:"same-origin",cache:"no-store"});
        if(!response.ok)throw new Error("Public information unavailable");
        const data=await response.json();
        records=(data.content||[]).filter(record=>metadata(record).action!=="hide");
        fetchedAt=Date.now();
      }catch(_e){
        if(!records.length)records=[];
      }finally{
        fetching=null;
      }
      return records;
    })();
    return fetching;
  }

  const root=document.createElement("div");
  root.className="v231-root";
  root.setAttribute("aria-hidden","true");
  root.innerHTML=
    '<div class="v231-backdrop" data-v231-close></div>'+
    '<aside class="v231-sheet" role="dialog" aria-modal="true" aria-labelledby="v231-title">'+
      '<header class="v231-head">'+
        '<div class="v231-head-copy"><small>Service Intelligence · Published context</small><h2 id="v231-title">Service briefing</h2><p id="v231-intro">Connect a service with its public source, current verified information and next resident actions.</p></div>'+
        '<button class="v231-close" type="button" data-v231-close aria-label="Close Service Intelligence">×</button>'+
      '</header>'+
      '<div class="v231-body" id="v231-body"></div>'+
      '<footer class="v231-foot"><span>Correlation aid only · source documents and responsible authorities remain authoritative.</span><button type="button" id="v231-back" hidden>All services</button></footer>'+
    '</aside>';
  document.body.appendChild(root);

  const sheet=root.querySelector(".v231-sheet");
  const body=root.querySelector("#v231-body");
  const title=root.querySelector("#v231-title");
  const intro=root.querySelector("#v231-intro");
  const back=root.querySelector("#v231-back");

  function itemMarkup(record){
    const progress=latestProgress(record);
    const date=updatedValue(record);
    const href=destination(record);
    const external=/^https?:\/\//i.test(href)&&!href.startsWith(location.origin);
    return '<article class="v231-public-item">'+
      '<div class="v231-public-top">'+
        '<span class="v231-pill">'+esc(typeLabel(record))+'</span>'+
        '<span class="v231-pill v231-status">'+esc(statusFor(record))+'</span>'+
        (date?'<span class="v231-public-time">'+esc(relativeDate(date))+'</span>':"")+
      '</div>'+
      '<h3>'+esc(record.title||"Published public information")+'</h3>'+
      '<p>'+esc(clean(record.summary||record.statusNote||record.body||"Open the public source for details.").slice(0,190))+'</p>'+
      (progress?'<div class="v231-progress"><strong>Latest progress:</strong> '+esc(clean(progress.summary).slice(0,150))+'</div>':"")+
      '<div class="v231-public-actions"><a href="'+esc(href)+'"'+(external?' target="_blank" rel="noopener"':'')+'>Open public source →</a></div>'+
    '</article>';
  }

  function renderDirectory(){
    directoryMode=true;
    active=null;
    back.hidden=true;
    title.textContent="Choose a service briefing";
    intro.textContent="Open any service already published on this page. Match counts refer only to current Published + Verified public records.";

    const services=discoverServices();
    if(!services.length){
      body.innerHTML='<div class="v231-empty"><strong>No service cards were detected.</strong>Use Resident Services, the Resident Guide or the public enquiry route instead.</div>'+
        '<div class="v231-section"><div class="v231-action-grid">'+
          '<a class="v231-action" href="/services/#resident-guide"><strong>Resident Guide</strong><small>Review the wider service pathway.</small></a>'+
          '<a class="v231-action" href="/forms/#enquiry"><strong>Ask the Office</strong><small>Send a public enquiry.</small></a>'+
        '</div></div>';
      return;
    }

    body.innerHTML=
      '<div class="v231-directory">'+services.map((service,index)=>{
        const count=matchesFor(service).length;
        return '<button class="v231-directory-button" type="button" data-v231-service-index="'+index+'">'+
          '<span><strong>'+esc(service.label)+'</strong><small>'+esc(service.description||"Open the published service briefing and next actions.")+'</small></span>'+
          '<span class="v231-match-count" title="'+count+' verified public match'+(count===1?"":"es")+'">'+count+'</span>'+
        '</button>';
      }).join("")+'</div>'+
      '<div class="v231-section"><div class="v231-empty"><strong>How matching works</strong>The briefing compares the words already published in the service card with current Published + Verified public records. A match is contextual guidance, not proof that a form, notice or programme applies to you.</div></div>';
  }

  function renderService(service){
    directoryMode=false;
    active=service;
    back.hidden=false;
    title.textContent=service.label;
    intro.textContent=service.description||"Published service information with related verified public context and next resident actions.";

    const matches=matchesFor(service);
    const sourceHref="/services/#"+encodeURIComponent(service.id);

    body.innerHTML=
      '<section class="v231-summary">'+
        '<strong>Published service source</strong>'+
        '<p>'+esc(service.description||"Review the full service card on the Resident Services page for its published guidance.")+'</p>'+
        '<a class="v231-source-link" href="'+esc(sourceHref)+'" data-v231-source>Open this service on the page →</a>'+
      '</section>'+
      '<section class="v231-section">'+
        '<div class="v231-section-title"><small>Current verified context</small><span>'+matches.length+' matched record'+(matches.length===1?"":"s")+'</span></div>'+
        (matches.length
          ?'<div class="v231-public-list">'+matches.map(itemMarkup).join("")+'</div>'
          :'<div class="v231-empty"><strong>No specific current match found.</strong>No Published + Verified form, notice or progress item strongly matched this service by topic. This does not mean the service is unavailable; use the published service source, Forms Library or enquiry route for current guidance.</div>')+
      '</section>'+
      '<section class="v231-section">'+
        '<div class="v231-section-title"><small>Resident actions</small><span>No eligibility decision is made here</span></div>'+
        '<div class="v231-action-grid">'+
          '<button class="v231-action v231-primary" type="button" data-v231-readiness><strong>Review readiness</strong><small>Turn the published service points into a temporary personal checklist.</small></button>'+
          '<button class="v231-action" type="button" data-v231-journey><strong>Build a resident path</strong><small>Use the guided Journey to organize the next public steps.</small></button>'+
          '<a class="v231-action" href="/forms/#service-forms"><strong>Forms Library</strong><small>Browse public forms and document guidance.</small></a>'+
          '<a class="v231-action" href="/forms/#enquiry"><strong>Ask the Office</strong><small>Send an enquiry if the published information remains unclear.</small></a>'+
        '</div>'+
      '</section>'+
      '<section class="v231-section"><div class="v231-empty"><strong>Important</strong>Service Intelligence does not determine eligibility, completeness, entitlement, approval or current agency requirements. Confirm time-sensitive requirements with the published source and responsible authority.</div></section>';
  }

  async function openIntel(service=null){
    document.querySelector(".v224-command-root.is-open [data-v224-close]")?.click();
    document.querySelector(".v225-journey-root.is-open [data-v225-close]")?.click();
    document.querySelector(".v228-root.is-open [data-v228-close]")?.click();

    lastFocus=document.activeElement;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden","false");
    document.body.classList.add("v231-intel-open");

    title.textContent=service?.label||"Service Intelligence";
    intro.textContent="Loading current Published + Verified public context…";
    body.innerHTML='<div class="v231-empty"><strong>Loading public context…</strong>Connecting this service to the currently published public information.</div>';
    back.hidden=true;

    await loadRecords(false);
    if(service)renderService(service);
    else renderDirectory();

    window.setTimeout(()=>root.querySelector(".v231-close")?.focus({preventScroll:true}),30);
  }

  function closeIntel(){
    if(!root.classList.contains("is-open"))return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden","true");
    document.body.classList.remove("v231-intel-open");
    if(lastFocus&&typeof lastFocus.focus==="function")lastFocus.focus({preventScroll:true});
  }

  function nearestService(){
    const services=discoverServices();
    if(!services.length)return null;
    const targetY=Math.max(130,window.innerHeight*.42);
    return services.slice().sort((a,b)=>{
      const ar=a.card.getBoundingClientRect(),br=b.card.getBoundingClientRect();
      const ad=Math.abs(ar.top-targetY)+(ar.bottom<80?300:0);
      const bd=Math.abs(br.top-targetY)+(br.bottom<80?300:0);
      return ad-bd;
    })[0]||services[0];
  }

  body.addEventListener("click",event=>{
    const dir=event.target.closest("[data-v231-service-index]");
    if(dir){
      const service=discoverServices()[Number(dir.dataset.v231ServiceIndex)];
      if(service)renderService(service);
      return;
    }

    const source=event.target.closest("[data-v231-source]");
    if(source&&active?.card){
      event.preventDefault();
      const card=active.card;
      closeIntel();
      const collapsed=card.closest(".v208-secondary.v208-collapsed,.v209-secondary.v209-collapsed");
      if(collapsed?.id){
        document.querySelector('[data-v208-target="'+CSS.escape(collapsed.id)+'"],[data-v209-target="'+CSS.escape(collapsed.id)+'"]')?.click();
      }
      window.setTimeout(()=>{
        card.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
        try{history.replaceState(null,"","#"+active.id)}catch(_e){}
        card.classList.add("v222-deep-link-target");
        window.setTimeout(()=>card.classList.remove("v222-deep-link-target"),2600);
      },90);
      return;
    }

    if(event.target.closest("[data-v231-readiness]")&&active?.card){
      const button=active.card.querySelector(":scope > .v228-card-button,.v228-card-button");
      closeIntel();
      window.setTimeout(()=>button?.click(),70);
      return;
    }

    if(event.target.closest("[data-v231-journey]")){
      closeIntel();
      window.setTimeout(()=>{
        document.querySelector("[data-v225-open],.v225-command-journey,.v225-drawer-journey")?.click();
      },70);
    }
  });

  back.addEventListener("click",renderDirectory);
  root.querySelectorAll("[data-v231-close]").forEach(el=>el.addEventListener("click",closeIntel));

  sheet.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();closeIntel();return}
    if(event.key!=="Tab")return;
    const focusables=[...sheet.querySelectorAll('button:not([disabled]),a[href]')].filter(el=>el.offsetParent!==null);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&root.classList.contains("is-open")){
      event.preventDefault();closeIntel();
    }
  });

  function addCardButtons(){
    discoverServices().forEach(service=>{
      if(service.card.querySelector(":scope > .v231-service-button"))return;
      const button=document.createElement("button");
      button.type="button";
      button.className="v231-service-button";
      button.textContent="Service briefing";
      button.setAttribute("aria-label","Open service briefing for "+service.label);
      button.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        openIntel(service);
      });
      service.card.appendChild(button);
    });
  }

  function addLauncher(){
    const main=document.querySelector(".v204-main-column");
    if(!main||main.querySelector(":scope > .v231-launcher"))return;
    const launcher=document.createElement("section");
    launcher.className="v231-launcher";
    launcher.setAttribute("aria-label","Service Intelligence");
    launcher.innerHTML=
      '<div class="v231-launcher-copy"><small>Connected service view</small><strong>See a service in context</strong><span>Bring its published source, verified public information, readiness and next actions together.</span></div>'+
      '<button type="button" data-v231-open>Open Service Intelligence →</button>';

    const readiness=main.querySelector(":scope > .v228-launcher");
    const pulse=main.querySelector(":scope > .v227-pulse");
    if(readiness)readiness.insertAdjacentElement("afterend",launcher);
    else if(pulse)pulse.insertAdjacentElement("afterend",launcher);
    else main.appendChild(launcher);
  }

  function addSmartAction(){
    const actions=document.querySelector(".v226-next-step .v226-actions");
    if(!actions||actions.querySelector("[data-v231-smart]"))return;
    const button=document.createElement("button");
    button.type="button";
    button.className="v226-action";
    button.dataset.v231Smart="";
    button.title="Open the nearest service briefing";
    button.innerHTML='<span class="v226-action-icon" aria-hidden="true">◎</span><span>Briefing</span>';
    const next=actions.querySelector("[data-v226-next]");
    actions.insertBefore(button,next||null);
  }

  function addCommandAction(){
    const command=document.querySelector(".v224-command-shell");
    if(!command||command.querySelector(".v231-command-action"))return;
    const button=document.createElement("button");
    button.type="button";
    button.className="v225-command-journey v231-command-action";
    button.dataset.v231Open="";
    button.innerHTML='<span><strong>Open Service Intelligence</strong><small>Connect a service to current verified public context and next actions</small></span><span aria-hidden="true">◎</span>';
    const readiness=command.querySelector(".v228-command-action");
    if(readiness)readiness.insertAdjacentElement("afterend",button);
    else command.querySelector(".v224-quick-actions")?.insertAdjacentElement("afterend",button);
  }

  document.addEventListener("click",event=>{
    const generic=event.target.closest("[data-v231-open]");
    if(generic){
      event.preventDefault();
      openIntel();
      return;
    }
    const smart=event.target.closest("[data-v231-smart]");
    if(smart){
      event.preventDefault();
      openIntel(nearestService());
    }
  });

  function install(){
    addCardButtons();
    addLauncher();
    addSmartAction();
    addCommandAction();
  }

  install();
  window.setTimeout(install,280);
  loadRecords(false).then(()=>{
    if(directoryMode&&root.classList.contains("is-open"))renderDirectory();
  });

  if("MutationObserver" in window){
    let timer=0;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=window.setTimeout(install,100);
    }).observe(document.querySelector("main")||document.body,{childList:true,subtree:true});
  }
})();