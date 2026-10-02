(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v228-resident-readiness-ready"))return;
  document.documentElement.classList.add("v228-resident-readiness-ready");

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  if(path!=="/services")return;

  const esc=value=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const slug=value=>String(value||"")
    .toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70);
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state=new Map();
  let active=null;
  let lastFocus=null;

  function cleanText(value){
    return String(value||"").replace(/\s+/g," ").trim();
  }

  function serviceHosts(){
    return [
      document.getElementById("services"),
      document.getElementById("how-we-help"),
      document.getElementById("support-areas"),
      document.getElementById("resident-programmes")
    ].filter(Boolean);
  }

  function ensureAnchor(el,label,hostId){
    if(el.id)return el.id;
    const base="v228-service-"+slug(hostId+"-"+label);
    let id=base,n=2;
    while(document.getElementById(id)&&document.getElementById(id)!==el)id=base+"-"+n++;
    el.id=id;
    return id;
  }

  function discoverServices(){
    const seen=new Set(),items=[];
    const generic=/^(resident services|services|services & assistance|programmes|resources|how we help|support areas|resident programmes|frequently asked questions)$/i;

    serviceHosts().forEach(host=>{
      const cards=[...host.querySelectorAll("article,.service-card,[class*='service-card'],[class*='support-card'],[class*='programme-card']")];
      cards.forEach(card=>{
        if(card.closest(".v228-root"))return;
        const heading=card.querySelector("h3,h4,strong");
        const label=cleanText(heading?.textContent);
        if(label.length<3||label.length>100||generic.test(label))return;
        const key=label.toLowerCase();
        if(seen.has(key))return;
        seen.add(key);

        const id=ensureAnchor(card,label,host.id||"services");
        const description=cleanText(card.querySelector("p")?.textContent).slice(0,180);
        items.push({id,label,description,card,hostId:host.id||"services"});
      });
    });

    return items.slice(0,18);
  }

  function publishedPoints(service){
    if(!service?.card)return [];
    const list=[...service.card.querySelectorAll("li")]
      .map(li=>cleanText(li.textContent))
      .filter(text=>text.length>=4&&text.length<=280);

    const seen=new Set();
    const unique=list.filter(item=>{
      const key=item.toLowerCase();
      if(seen.has(key))return false;
      seen.add(key);return true;
    });

    return unique.slice(0,8);
  }

  function checklistFor(service){
    const points=publishedPoints(service);
    if(points.length){
      return points.map((text,index)=>({
        id:"published-"+index,
        title:text,
        hint:"Published point from this service card. Check this only after you have reviewed it."
      }));
    }
    return [
      {
        id:"read-service",
        title:"Read the full published service information",
        hint:"Review the service description on this page before deciding what to do next."
      },
      {
        id:"check-guidance",
        title:"Check the Resident Guide and Forms Library",
        hint:"Look for current guidance, forms, collection instructions or supporting documents."
      },
      {
        id:"verify-source",
        title:"Confirm the responsible source and current instructions",
        hint:"Use the published source information on the site and avoid relying on an old copy or message."
      },
      {
        id:"ask-if-unclear",
        title:"Ask the District Office if anything remains unclear",
        hint:"Use the public enquiry route when the published information does not answer your question."
      }
    ];
  }

  const root=document.createElement("div");
  root.className="v228-root";
  root.setAttribute("aria-hidden","true");
  root.innerHTML=
    '<div class="v228-backdrop" data-v228-close></div>'+
    '<section class="v228-shell" role="dialog" aria-modal="true" aria-labelledby="v228-title">'+
      '<aside class="v228-side">'+
        '<small>Resident readiness</small>'+
        '<h2>Review before you move to the next step.</h2>'+
        '<p>This workspace turns published service information into a temporary review list. It does not determine eligibility or approval.</p>'+
        '<div class="v228-meter"><div class="v228-meter-label"><span>Reviewed</span><span id="v228-meter-count">0 / 0</span></div><div class="v228-meter-track"><div class="v228-meter-fill"></div></div></div>'+
        '<div class="v228-side-note">Nothing in this checklist is submitted to the District Office. Closing or refreshing the page clears the review state.</div>'+
      '</aside>'+
      '<div class="v228-main">'+
        '<header class="v228-head">'+
          '<div><small>Private review workspace</small><h3 id="v228-title">Service readiness</h3><p id="v228-intro">Select the points you have reviewed. A checked box means “reviewed,” not “eligible.”</p></div>'+
          '<button class="v228-close" type="button" data-v228-close aria-label="Close Resident Readiness Workspace">×</button>'+
        '</header>'+
        '<div class="v228-body">'+
          '<div class="v228-disclaimer"><strong>Important:</strong> This is a personal review aid only. Published programme rules, responsible agencies, required documents and approval decisions remain authoritative.</div>'+
          '<div class="v228-list" id="v228-list"></div>'+
          '<div class="v228-divider">Useful next actions</div>'+
          '<div class="v228-next-actions">'+
            '<a class="v228-next-action" href="/services/#resident-guide"><strong>Resident Guide</strong><small>Review the wider service process and public guidance.</small></a>'+
            '<a class="v228-next-action" href="/forms/#service-forms"><strong>Forms Library</strong><small>Find current public forms and collection information.</small></a>'+
            '<a class="v228-next-action" href="/forms/#enquiry"><strong>Ask the Office</strong><small>Send an enquiry if the published information is still unclear.</small></a>'+
          '</div>'+
        '</div>'+
        '<footer class="v228-foot">'+
          '<div class="v228-foot-left"><button class="v228-btn" type="button" id="v228-clear">Clear checks</button><button class="v228-btn" type="button" id="v228-copy">Copy review list</button></div>'+
          '<div class="v228-foot-right"><span class="v228-private">In-memory only · not submitted</span><button class="v228-btn v228-btn-primary" type="button" id="v228-source">Open service source →</button></div>'+
        '</footer>'+
      '</div>'+
    '</section>';
  document.body.appendChild(root);

  const shell=root.querySelector(".v228-shell");
  const listEl=root.querySelector("#v228-list");
  const titleEl=root.querySelector("#v228-title");
  const introEl=root.querySelector("#v228-intro");
  const countEl=root.querySelector("#v228-meter-count");
  const fillEl=root.querySelector(".v228-meter-fill");
  const clearBtn=root.querySelector("#v228-clear");
  const copyBtn=root.querySelector("#v228-copy");
  const sourceBtn=root.querySelector("#v228-source");

  function keyFor(service){
    return service?.id||"general";
  }

  function checkedSet(service){
    const key=keyFor(service);
    if(!state.has(key))state.set(key,new Set());
    return state.get(key);
  }

  function render(){
    if(!active)return;
    const items=checklistFor(active);
    const checked=checkedSet(active);

    titleEl.textContent=active.label||"Service readiness";
    introEl.textContent=active.description
      ?active.description
      :"Select each item after you have reviewed it. This workspace does not decide whether a programme or service applies to you.";

    listEl.innerHTML=items.map((item,index)=>{
      const isChecked=checked.has(item.id);
      return '<label class="v228-check'+(isChecked?" is-reviewed":"")+'">'+
        '<input type="checkbox" data-v228-check="'+esc(item.id)+'"'+(isChecked?" checked":"")+'>'+
        '<span class="v228-box" aria-hidden="true"></span>'+
        '<span class="v228-check-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(item.hint)+'</small></span>'+
      '</label>';
    }).join("");

    const total=items.length;
    const completed=items.filter(item=>checked.has(item.id)).length;
    countEl.textContent=completed+" / "+total;
    fillEl.style.width=(total?Math.round((completed/total)*100):0)+"%";
    sourceBtn.disabled=!active.card;
  }

  function openWorkspace(service=null){
    const services=discoverServices();
    active=service||services[0]||{
      id:"resident-services",
      label:"Resident Services",
      description:"Use this review list before moving from general service information to forms or an enquiry.",
      card:document.getElementById("services")
    };

    document.querySelector(".v224-command-root.is-open [data-v224-close]")?.click();
    document.querySelector(".v225-journey-root.is-open [data-v225-close]")?.click();

    lastFocus=document.activeElement;
    render();
    root.classList.add("is-open");
    root.setAttribute("aria-hidden","false");
    document.body.classList.add("v228-readiness-open");
    window.setTimeout(()=>root.querySelector(".v228-close")?.focus({preventScroll:true}),40);
  }

  function closeWorkspace(){
    if(!root.classList.contains("is-open"))return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden","true");
    document.body.classList.remove("v228-readiness-open");
    if(lastFocus&&typeof lastFocus.focus==="function")lastFocus.focus({preventScroll:true});
  }

  listEl.addEventListener("change",event=>{
    const box=event.target.closest("[data-v228-check]");
    if(!box||!active)return;
    const checked=checkedSet(active);
    if(box.checked)checked.add(box.dataset.v228Check);
    else checked.delete(box.dataset.v228Check);
    render();
  });

  clearBtn.addEventListener("click",()=>{
    if(!active)return;
    checkedSet(active).clear();
    render();
  });

  copyBtn.addEventListener("click",async()=>{
    if(!active)return;
    const items=checklistFor(active);
    const checked=checkedSet(active);
    const lines=[
      "Scarborough / Mt. Grace District Office — Resident Readiness Review",
      active.label,
      "",
      ...items.map(item=>(checked.has(item.id)?"[x] ":"[ ] ")+item.title),
      "",
      "Review aid only. Checked means reviewed, not eligible or approved.",
      new URL("/services/#"+encodeURIComponent(active.id),location.origin).href
    ];
    const value=lines.join("\n");
    const old=copyBtn.textContent;
    try{
      await navigator.clipboard.writeText(value);
      copyBtn.textContent="Copied";
    }catch(_e){
      const ta=document.createElement("textarea");
      ta.value=value;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");copyBtn.textContent="Copied"}catch(_err){copyBtn.textContent="Copy unavailable"}
      ta.remove();
    }
    window.setTimeout(()=>copyBtn.textContent=old,1400);
  });

  sourceBtn.addEventListener("click",()=>{
    if(!active?.card)return;
    closeWorkspace();
    const collapsed=active.card.closest(".v208-secondary.v208-collapsed,.v209-secondary.v209-collapsed");
    if(collapsed?.id){
      document.querySelector('[data-v208-target="'+CSS.escape(collapsed.id)+'"],[data-v209-target="'+CSS.escape(collapsed.id)+'"]')?.click();
    }
    window.setTimeout(()=>{
      active.card.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
      try{history.replaceState(null,"","#"+active.id)}catch(_e){}
      active.card.classList.add("v222-deep-link-target");
      window.setTimeout(()=>active?.card?.classList.remove("v222-deep-link-target"),2600);
    },80);
  });

  root.querySelectorAll("[data-v228-close]").forEach(el=>el.addEventListener("click",closeWorkspace));

  shell.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();closeWorkspace();return}
    if(event.key!=="Tab")return;
    const focusables=[...shell.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')]
      .filter(el=>el.offsetParent!==null);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&root.classList.contains("is-open")){
      event.preventDefault();closeWorkspace();
    }
  });

  function addCardButtons(){
    discoverServices().forEach(service=>{
      const card=service.card;
      if(!card||card.querySelector(":scope > .v228-card-button"))return;
      const button=document.createElement("button");
      button.type="button";
      button.className="v228-card-button";
      button.textContent="Review readiness";
      button.setAttribute("aria-label","Review "+service.label+" information");
      button.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();
        openWorkspace(service);
      });
      card.appendChild(button);
    });
  }

  function addLauncher(){
    const main=document.querySelector(".v204-main-column");
    if(!main||main.querySelector(":scope > .v228-launcher"))return;

    const launcher=document.createElement("section");
    launcher.className="v228-launcher";
    launcher.setAttribute("aria-label","Resident Readiness Workspace");
    launcher.innerHTML=
      '<div><small>Private review workspace</small><strong>Review a service before moving forward</strong><span>Turn published service information into a temporary checklist. Nothing is submitted or saved.</span></div>'+
      '<button type="button" data-v228-open>Open readiness workspace →</button>';

    const pulse=main.querySelector(":scope > .v227-pulse");
    const smart=main.querySelector(":scope > .v226-next-step");
    const journey=main.querySelector(":scope > .v225-launcher");
    if(pulse)pulse.insertAdjacentElement("afterend",launcher);
    else if(smart)smart.insertAdjacentElement("afterend",launcher);
    else if(journey)journey.insertAdjacentElement("afterend",launcher);
    else main.insertBefore(launcher,main.firstChild);
  }

  function addSmartAction(){
    const actions=document.querySelector(".v226-next-step .v226-actions");
    if(!actions||actions.querySelector("[data-v228-open]"))return;
    const button=document.createElement("button");
    button.type="button";
    button.className="v226-action v228-smart-button";
    button.dataset.v228Open="";
    button.title="Open Resident Readiness Workspace";
    button.innerHTML='<span class="v226-action-icon" aria-hidden="true">✓</span><span>Readiness</span>';
    const command=actions.querySelector("[data-v226-command]");
    actions.insertBefore(button,command||actions.lastElementChild);
  }

  function addCommandAction(){
    const command=document.querySelector(".v224-command-shell");
    if(!command||command.querySelector(".v228-command-action"))return;
    const button=document.createElement("button");
    button.type="button";
    button.className="v225-command-journey v228-command-action";
    button.dataset.v228Open="";
    button.innerHTML='<span><strong>Review service readiness</strong><small>Turn published service information into a private checklist</small></span><span aria-hidden="true">✓</span>';
    const journey=command.querySelector(".v225-command-journey");
    if(journey)journey.insertAdjacentElement("afterend",button);
    else command.querySelector(".v224-quick-actions")?.insertAdjacentElement("afterend",button);
  }

  document.addEventListener("click",event=>{
    const opener=event.target.closest("[data-v228-open]");
    if(!opener)return;
    event.preventDefault();
    openWorkspace();
  });

  function install(){
    addLauncher();
    addCardButtons();
    addSmartAction();
    addCommandAction();
  }

  install();
  window.setTimeout(install,260);
  if("MutationObserver" in window){
    let timer=0;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=window.setTimeout(install,100);
    }).observe(document.querySelector("main")||document.body,{childList:true,subtree:true});
  }
})();