(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v225-resident-journey-ready"))return;
  document.documentElement.classList.add("v225-resident-journey-ready");

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  const esc=value=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const slug=value=>String(value||"")
    .toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70);
  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let state={step:1,goal:null,detail:null,service:null};
  let lastFocus=null;
  let currentPathSteps=[];

  const goals=[
    {id:"help",mark:"HELP",title:"Find help or a service",hint:"Start with the service information that best matches what you need."},
    {id:"form",mark:"FORM",title:"Get a form or document",hint:"Find the forms library or get guidance if you are not sure which form applies."},
    {id:"enquiry",mark:"NEW",title:"Send a new enquiry",hint:"Build a short path to the right information before contacting the office."},
    {id:"track",mark:"TRACK",title:"Track something already submitted",hint:"Use a reference number to check an existing enquiry, or find the right follow-up route."},
    {id:"community",mark:"COM",title:"Follow a community matter",hint:"Find projects, public progress, engagement and community information."},
    {id:"contact",mark:"CALL",title:"Contact or visit the office",hint:"Choose phone, WhatsApp, office-hours/location or email."}
  ];

  const root=document.createElement("div");
  root.className="v225-journey-root";
  root.setAttribute("aria-hidden","true");
  root.innerHTML=
    '<div class="v225-journey-backdrop" data-v225-close></div>'+
    '<section class="v225-journey-shell" role="dialog" aria-modal="true" aria-labelledby="v225-title">'+
      '<aside class="v225-journey-rail" aria-label="Resident Journey progress">'+
        '<div class="v225-rail-kicker">Resident Journey</div>'+
        '<div class="v225-rail-title">A clearer path from question to next step.</div>'+
        '<div class="v225-rail-steps">'+
          '<div class="v225-rail-step is-active" data-v225-rail="1"><span class="v225-rail-num">01</span><span><strong>Need</strong><small>What are you trying to do?</small></span></div>'+
          '<div class="v225-rail-step" data-v225-rail="2"><span class="v225-rail-num">02</span><span><strong>Detail</strong><small>Narrow the route.</small></span></div>'+
          '<div class="v225-rail-step" data-v225-rail="3"><span class="v225-rail-num">03</span><span><strong>Your path</strong><small>Open the next steps.</small></span></div>'+
        '</div>'+
        '<div class="v225-rail-note">This guide does not decide eligibility or approval. It only organizes the public information already available.</div>'+
      '</aside>'+
      '<div class="v225-journey-main">'+
        '<header class="v225-journey-head">'+
          '<div><small id="v225-kicker">Step 1 · Your need</small><h2 id="v225-title">What are you trying to do?</h2><p id="v225-intro">Choose the option closest to your goal. You can go back or start over at any time.</p></div>'+
          '<button class="v225-close" type="button" data-v225-close aria-label="Close Resident Journey">×</button>'+
        '</header>'+
        '<div class="v225-journey-body" id="v225-body"></div>'+
        '<footer class="v225-journey-foot">'+
          '<div class="v225-foot-left"><button class="v225-foot-btn" type="button" id="v225-back" hidden>← Back</button><button class="v225-foot-btn" type="button" id="v225-reset">Start over</button></div>'+
          '<div class="v225-foot-right"><span class="v225-private-note">Choices stay on this page · no resident profile is created</span><button class="v225-foot-btn" type="button" id="v225-copy" hidden>Copy path</button><button class="v225-foot-btn v225-primary" type="button" id="v225-open-first" hidden>Open first step →</button></div>'+
        '</footer>'+
      '</div>'+
    '</section>';
  document.body.appendChild(root);

  const shell=root.querySelector(".v225-journey-shell");
  const body=root.querySelector("#v225-body");
  const title=root.querySelector("#v225-title");
  const intro=root.querySelector("#v225-intro");
  const kicker=root.querySelector("#v225-kicker");
  const back=root.querySelector("#v225-back");
  const reset=root.querySelector("#v225-reset");
  const copy=root.querySelector("#v225-copy");
  const openFirst=root.querySelector("#v225-open-first");

  function ensureAnchor(el,titleText,hostId){
    if(el.id)return el.id;
    const base="v225-service-"+slug(hostId+"-"+titleText);
    let id=base,n=2;
    while(document.getElementById(id)&&document.getElementById(id)!==el){id=base+"-"+n++}
    el.id=id;
    return id;
  }

  function collectServiceOptions(){
    const hosts=[
      document.getElementById("services"),
      document.getElementById("how-we-help"),
      document.getElementById("support-areas"),
      document.getElementById("resident-programmes")
    ].filter(Boolean);
    const seen=new Set(),items=[];
    const generic=/^(resident services|services|services & assistance|programmes|resources|how we help|support areas|resident programmes|frequently asked questions)$/i;

    hosts.forEach(host=>{
      const cards=[...host.querySelectorAll("article,.service-card,[class*='service-card'],[class*='support-card'],[class*='programme-card']")];
      cards.forEach(card=>{
        const h=card.querySelector("h3,h4,strong");
        const label=(h?.textContent||"").replace(/\s+/g," ").trim();
        if(label.length<3||label.length>95||generic.test(label))return;
        const key=label.toLowerCase();
        if(seen.has(key))return;
        seen.add(key);
        const description=(card.querySelector("p")?.textContent||"").replace(/\s+/g," ").trim().slice(0,150);
        const id=ensureAnchor(card,label,host.id||"services");
        items.push({
          id,
          label,
          hint:description||"Open the published service information for this area.",
          url:"/services/#"+encodeURIComponent(id)
        });
      });
    });

    if(items.length)return items.slice(0,12);
    return [
      {id:"resident-start",label:"Resident Services Hub",hint:"Start with the District Office resident-services overview.",url:"/services/#resident-start"},
      {id:"services",label:"Services & Assistance",hint:"Browse the main service and assistance information.",url:"/services/#services"},
      {id:"resident-programmes",label:"Programmes",hint:"Review published resident programme information.",url:"/services/#resident-programmes"},
      {id:"resident-guide",label:"Resident Guide",hint:"Use the step-by-step resident guide to understand the process.",url:"/services/#resident-guide"}
    ];
  }

  function detailOptions(){
    if(state.goal==="help"){
      return collectServiceOptions().map((x,index)=>({
        id:"service:"+x.id,
        mark:String(index+1).padStart(2,"0"),
        title:x.label,
        hint:x.hint,
        service:x
      }));
    }
    if(state.goal==="form")return [
      {id:"know-form",mark:"PDF",title:"I know which form I need",hint:"Go directly to the public forms and collection library."},
      {id:"unsure-form",mark:"?",title:"I am not sure which form applies",hint:"Use resident guidance first, then open the forms library or enquire if needed."}
    ];
    if(state.goal==="enquiry")return [
      {id:"service-question",mark:"SRV",title:"Service or assistance question",hint:"Review resident services first, then send an enquiry if you still need help."},
      {id:"community-question",mark:"COM",title:"Community or project matter",hint:"Check published community/project information before sending a follow-up enquiry."},
      {id:"general-question",mark:"OFF",title:"General District Office question",hint:"Go directly to contact information or the public enquiry form."}
    ];
    if(state.goal==="track")return [
      {id:"have-reference",mark:"REF",title:"I have my reference number",hint:"Open the resident tracker and check the existing enquiry."},
      {id:"no-reference",mark:"HELP",title:"I cannot find or do not have a reference",hint:"Use the contact/enquiry route so the office can guide the follow-up."}
    ];
    if(state.goal==="community")return [
      {id:"project-progress",mark:"PRJ",title:"Project or public progress",hint:"See tracked projects, public status and progress information."},
      {id:"community-activity",mark:"ACT",title:"Community activity or participation",hint:"Open community engagement and the Community Action Centre."},
      {id:"community-gallery",mark:"IMG",title:"Community photographs and outreach",hint:"Open the gallery and community information."}
    ];
    if(state.goal==="contact")return [
      {id:"call",mark:"TEL",title:"Call the office",hint:"Use the public office number: (868) 610-6314."},
      {id:"whatsapp",mark:"WA",title:"WhatsApp the office",hint:"Use the public WhatsApp number: (868) 344-5268."},
      {id:"visit",mark:"MAP",title:"Visit the office",hint:"See office hours and location before travelling."},
      {id:"email",mark:"@",title:"Email the office",hint:"Use the public District Office email address."}
    ];
    return [];
  }

  function pathStep(label,titleText,hint,url){
    return {label,title:titleText,hint,url};
  }

  function buildPath(){
    const detail=state.detail;
    if(state.goal==="help"&&state.service){
      return [
        pathStep("Review","Read "+state.service.label,"Start with the published information for the service area you selected.",state.service.url),
        pathStep("Prepare","Check forms & guidance","If the published service information points to a form or document, use the forms library and resident guide.","/forms/#service-forms"),
        pathStep("Ask / follow up","Enquire if anything remains unclear","Send a public enquiry. If the office issues a reference, you can use the tracker afterward.","/forms/#enquiry")
      ];
    }
    if(state.goal==="form"&&detail==="know-form")return [
      pathStep("Find","Open Service Forms","Browse the public form/document library and collection information.","/forms/#service-forms"),
      pathStep("Verify","Read the source guidance","Confirm the latest instructions and responsible office shown with the form.","/services/#resident-guide"),
      pathStep("Ask","Contact the office if unsure","Use the enquiry route if the published information does not answer your question.","/forms/#enquiry")
    ];
    if(state.goal==="form")return [
      pathStep("Understand","Open the Resident Guide","Use the step-by-step guidance before choosing a form.","/services/#resident-guide"),
      pathStep("Find","Browse Service Forms","Open the public forms and collection library.","/forms/#service-forms"),
      pathStep("Clarify","Send an enquiry if needed","Ask the District Office if you still cannot identify the correct route.","/forms/#enquiry")
    ];
    if(state.goal==="enquiry"&&detail==="service-question")return [
      pathStep("Check","Review Resident Services","See whether the answer or service pathway is already published.","/services/"),
      pathStep("Contact","Submit a new enquiry","Use the public enquiry form for the question that remains.","/forms/#enquiry"),
      pathStep("Follow up","Track after a reference is issued","Use the resident tracker for an existing enquiry.","/track/")
    ];
    if(state.goal==="enquiry"&&detail==="community-question")return [
      pathStep("Check","Review community/project information","Look at published activity and project status first.","/updates/#activity-hub"),
      pathStep("Contact","Submit a new enquiry","Send the remaining question to the District Office.","/forms/#enquiry"),
      pathStep("Follow up","Track after a reference is issued","Use the resident tracker for an existing enquiry.","/track/")
    ];
    if(state.goal==="enquiry")return [
      pathStep("Reference","Open Contact & Enquiries","Review office contact information and public enquiry routes.","/contact/"),
      pathStep("Contact","Submit a new enquiry","Send your question through the public enquiry form.","/forms/#enquiry"),
      pathStep("Follow up","Track after a reference is issued","Use the resident tracker for the existing enquiry.","/track/")
    ];
    if(state.goal==="track"&&detail==="have-reference")return [
      pathStep("Track","Open the Resident Tracker","Use the reference details already provided for the existing enquiry.","/track/"),
      pathStep("Need help?","Contact the District Office","If the tracker does not resolve your question, use the public contact route.","/contact/#contact-us")
    ];
    if(state.goal==="track")return [
      pathStep("Recover","Contact the District Office","Use the public contact information if you cannot locate the reference.","/contact/#contact-us"),
      pathStep("Explain","Use the enquiry form if needed","Send enough context for the office to guide the follow-up route.","/forms/#enquiry")
    ];
    if(state.goal==="community"&&detail==="project-progress")return [
      pathStep("Status","Open the Activity Hub","Review notices, projects, statuses and published follow-up.","/updates/#activity-hub"),
      pathStep("History","Open Public Action & Progress","See published public action and progress information.","/updates/#v133-public-action"),
      pathStep("Question","Send an enquiry if you need clarification","Use the public enquiry form for a specific unresolved question.","/forms/#enquiry")
    ];
    if(state.goal==="community"&&detail==="community-activity")return [
      pathStep("Participate","Open Community Engagement","Review published engagement and participation information.","/community/#community-engagement"),
      pathStep("Explore","Open the Community Action Centre","See community activity, projects and participation pathways.","/community/#community-action-centre"),
      pathStep("Contact","Reach the office","Use the public contact route for participation questions.","/contact/#contact-us")
    ];
    if(state.goal==="community")return [
      pathStep("View","Open the Gallery","Browse community and District Office photographs with their published context.","/community/#gallery"),
      pathStep("Context","Open the Community Hub","Review the wider community information around the images and activity.","/community/")
    ];
    if(state.goal==="contact"&&detail==="call")return [
      pathStep("Call","Call (868) 610-6314","Use the public District Office telephone number.","tel:+18686106314"),
      pathStep("Alternative","Open Contact & Enquiries","See WhatsApp, office information and other contact options.","/contact/")
    ];
    if(state.goal==="contact"&&detail==="whatsapp")return [
      pathStep("Message","WhatsApp (868) 344-5268","Open WhatsApp using the District Office public number.","https://wa.me/18683445268"),
      pathStep("Alternative","Open Contact & Enquiries","See phone, office information and other contact options.","/contact/")
    ];
    if(state.goal==="contact"&&detail==="visit")return [
      pathStep("Plan","Check office hours & location","Review the published hours and location before visiting.","/contact/#office-hours"),
      pathStep("Confirm","Contact the office if needed","Call or WhatsApp if you need to confirm before travelling.","/contact/#contact-us")
    ];
    if(state.goal==="contact")return [
      pathStep("Email","Email the District Office","Use the public office email address.","mailto:smgofficestaff@yahoo.com"),
      pathStep("Alternative","Open Contact & Enquiries","See phone, WhatsApp, hours and location.","/contact/")
    ];
    return [];
  }

  function updateRail(){
    root.querySelectorAll("[data-v225-rail]").forEach(el=>{
      const n=Number(el.dataset.v225Rail);
      el.classList.toggle("is-active",n===state.step);
      el.classList.toggle("is-done",n<state.step);
    });
    back.hidden=state.step===1;
    copy.hidden=state.step!==3;
    openFirst.hidden=state.step!==3||!currentPathSteps.length;
  }

  function renderStepOne(){
    kicker.textContent="Step 1 · Your need";
    title.textContent="What are you trying to do?";
    intro.textContent="Choose the option closest to your goal. This does not decide eligibility or approval — it simply builds a route through the public information.";
    body.innerHTML='<div class="v225-choice-grid">'+goals.map(goal=>
      '<button class="v225-choice" type="button" data-v225-goal="'+goal.id+'">'+
        '<span class="v225-choice-mark">'+esc(goal.mark)+'</span>'+
        '<strong>'+esc(goal.title)+'</strong><small>'+esc(goal.hint)+'</small>'+
      '</button>'
    ).join("")+'</div>';
  }

  function renderStepTwo(){
    const goal=goals.find(x=>x.id===state.goal);
    kicker.textContent="Step 2 · A little more detail";
    title.textContent=state.goal==="help"?"Which published service area is closest?":"Narrow the route";
    intro.textContent=state.goal==="help"
      ?"These options are taken from the service information already present on the site. Choose the closest match; the final path will still give you a way to enquire if needed."
      :"Choose the option that best describes where you are now.";
    const options=detailOptions();
    body.innerHTML=
      (state.goal==="help"?'<p class="v225-detail-note">The guide does not assume that a service applies to you. The service page remains the source for published requirements and next steps.</p>':"")+
      '<div class="v225-detail-list">'+options.map(opt=>
        '<button class="v225-detail-choice" type="button" data-v225-detail="'+esc(opt.id)+'">'+
          '<span class="v225-detail-icon">'+esc(opt.mark)+'</span>'+
          '<span class="v225-detail-copy"><strong>'+esc(opt.title)+'</strong><small>'+esc(opt.hint)+'</small></span>'+
          '<span class="v225-detail-arrow">→</span>'+
        '</button>'
      ).join("")+'</div>';
  }

  function renderStepThree(){
    currentPathSteps=buildPath();
    kicker.textContent="Step 3 · Your resident path";
    title.textContent="Here is a practical next-step path";
    intro.textContent="Open any step below. Earlier information is not replaced; this guide simply organizes the existing public routes in a useful order.";
    body.innerHTML=
      '<div class="v225-path">'+currentPathSteps.map((step,index)=>
        '<article class="v225-path-step" data-step="'+String(index+1).padStart(2,"0")+'">'+
          '<small>'+esc(step.label)+'</small><strong>'+esc(step.title)+'</strong><p>'+esc(step.hint)+'</p>'+
          '<a href="'+esc(step.url)+'" data-v225-path-link="'+index+'">Open this step →</a>'+
        '</article>'
      ).join("")+'</div>'+
      '<div class="v225-summary-note">This path is navigation guidance only. Programme eligibility, required documents, approvals and agency decisions remain governed by the published source information and the responsible office.</div>';
  }

  function render(){
    updateRail();
    if(state.step===1)renderStepOne();
    else if(state.step===2)renderStepTwo();
    else renderStepThree();
    body.scrollTop=0;
  }

  function closeCommandCenter(){
    const command=document.querySelector(".v224-command-root.is-open");
    command?.querySelector("[data-v224-close]")?.click();
  }

  function openJourney(goal=null){
    closeCommandCenter();
    lastFocus=document.activeElement;
    state={step:goal?2:1,goal:goal||null,detail:null,service:null};
    currentPathSteps=[];
    render();
    root.classList.add("is-open");
    root.setAttribute("aria-hidden","false");
    document.body.classList.add("v225-journey-open");
    window.setTimeout(()=>root.querySelector(".v225-close")?.focus({preventScroll:true}),40);
  }

  function closeJourney(){
    if(!root.classList.contains("is-open"))return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden","true");
    document.body.classList.remove("v225-journey-open");
    if(lastFocus&&typeof lastFocus.focus==="function")lastFocus.focus({preventScroll:true});
  }

  function sameRouteOpen(url){
    let u;
    try{u=new URL(url,location.origin)}catch(_e){return false}
    if(u.origin!==location.origin||normalize(u.pathname)!==path||!u.hash)return false;
    const id=decodeURIComponent(u.hash.slice(1));
    const target=document.getElementById(id);
    if(!target)return false;
    closeJourney();
    const collapsed=target.closest(".v208-secondary.v208-collapsed,.v209-secondary.v209-collapsed");
    if(collapsed?.id){
      document.querySelector('[data-v208-target="'+CSS.escape(collapsed.id)+'"],[data-v209-target="'+CSS.escape(collapsed.id)+'"]')?.click();
    }
    window.setTimeout(()=>{
      target.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
      try{history.replaceState(null,"","#"+id)}catch(_e){}
      target.classList.add("v222-deep-link-target");
      window.setTimeout(()=>target.classList.remove("v222-deep-link-target"),2600);
    },90);
    return true;
  }

  root.addEventListener("click",event=>{
    const goal=event.target.closest("[data-v225-goal]");
    if(goal){
      state.goal=goal.dataset.v225Goal;
      state.detail=null;state.service=null;state.step=2;
      render();return;
    }
    const detail=event.target.closest("[data-v225-detail]");
    if(detail){
      const id=detail.dataset.v225Detail;
      state.detail=id;
      if(id.startsWith("service:")){
        const serviceId=id.slice("service:".length);
        state.service=collectServiceOptions().find(x=>x.id===serviceId)||null;
      }
      state.step=3;render();return;
    }
    const link=event.target.closest("[data-v225-path-link]");
    if(link){
      const step=currentPathSteps[Number(link.dataset.v225PathLink)];
      if(step&&sameRouteOpen(step.url)){event.preventDefault()}
    }
  });

  root.querySelectorAll("[data-v225-close]").forEach(el=>el.addEventListener("click",closeJourney));

  back.addEventListener("click",()=>{
    if(state.step===3){state.step=2;state.detail=null;state.service=null}
    else if(state.step===2){state={step:1,goal:null,detail:null,service:null}}
    render();
  });
  reset.addEventListener("click",()=>{
    state={step:1,goal:null,detail:null,service:null};
    currentPathSteps=[];render();
  });

  openFirst.addEventListener("click",()=>{
    const first=currentPathSteps[0];
    if(!first)return;
    if(!sameRouteOpen(first.url))location.href=first.url;
  });

  copy.addEventListener("click",async()=>{
    if(!currentPathSteps.length)return;
    const lines=["Scarborough / Mt. Grace District Office — Resident Journey",""];
    currentPathSteps.forEach((step,index)=>{
      const url=new URL(step.url,location.origin).href;
      lines.push((index+1)+". "+step.title,"   "+url);
    });
    lines.push("","Navigation guidance only; check the published source information for requirements and eligibility.");
    const value=lines.join("\n");
    const old=copy.textContent;
    try{
      await navigator.clipboard.writeText(value);
      copy.textContent="Path copied";
    }catch(_e){
      const ta=document.createElement("textarea");
      ta.value=value;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");copy.textContent="Path copied"}catch(_err){copy.textContent="Copy unavailable"}
      ta.remove();
    }
    window.setTimeout(()=>copy.textContent=old,1400);
  });

  shell.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();closeJourney();return}
    if(event.key!=="Tab")return;
    const focusables=[...shell.querySelectorAll('button:not([disabled]):not([hidden]),a[href]')]
      .filter(el=>el.offsetParent!==null);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&root.classList.contains("is-open")){
      event.preventDefault();closeJourney();
    }
  });

  function launcherMarkup(){
    const wrap=document.createElement("section");
    wrap.className="v225-launcher";
    wrap.setAttribute("aria-label","Guided Resident Journey");
    wrap.innerHTML=
      '<div class="v225-launcher-copy"><small>Guided resident path</small><strong>Not sure where to start?</strong><span>Answer two short questions and get a practical route through the services, forms and follow-up tools already on this site.</span></div>'+
      '<button type="button" data-v225-open>Build my path →</button>';
    return wrap;
  }

  function addLaunchers(){
    if(path==="/services"){
      const main=document.querySelector(".v204-main-column");
      if(main&&!main.querySelector(":scope > .v225-launcher")){
        const launcher=launcherMarkup();
        const identity=main.querySelector(":scope > .v207-identity-strip");
        const deck=main.querySelector(":scope > .v204-action-deck");
        if(identity)identity.insertAdjacentElement("afterend",launcher);
        else main.insertBefore(launcher,deck||main.firstChild);
      }
    }

    const command=document.querySelector(".v224-command-shell");
    if(command&&!command.querySelector(".v225-command-journey")){
      const button=document.createElement("button");
      button.type="button";
      button.className="v225-command-journey";
      button.innerHTML='<span><strong>Build a guided resident path</strong><small>Two short questions → a practical next-step route</small></span><span aria-hidden="true">→</span>';
      const quicks=command.querySelector(".v224-quick-actions");
      quicks?.insertAdjacentElement("afterend",button);
    }

    const drawer=document.querySelector(".v202-drawer-foot");
    if(drawer&&!drawer.querySelector(".v225-drawer-journey")){
      const button=document.createElement("button");
      button.type="button";
      button.className="v202-utility-link v225-drawer-journey";
      button.dataset.v225Open="";
      button.textContent="Guided resident path";
      drawer.querySelector(".v202-quick-grid")?.appendChild(button);
    }
  }

  document.addEventListener("click",event=>{
    const opener=event.target.closest("[data-v225-open],.v225-command-journey");
    if(!opener)return;
    event.preventDefault();
    openJourney();
  });

  addLaunchers();
  window.setTimeout(addLaunchers,260);

  if("MutationObserver" in window){
    new MutationObserver(()=>window.setTimeout(addLaunchers,40))
      .observe(document.body,{childList:true,subtree:true});
  }

  /* If a deterministic dynamic service anchor is part of a cross-route journey,
     assign it and complete the scroll after V225 has indexed the destination page. */
  const initialHash=decodeURIComponent((location.hash||"").replace(/^#/,""));
  if(initialHash.startsWith("v225-service-")){
    window.setTimeout(()=>{
      collectServiceOptions();
      const target=document.getElementById(initialHash);
      if(target){
        target.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
        target.classList.add("v222-deep-link-target");
        window.setTimeout(()=>target.classList.remove("v222-deep-link-target"),2600);
      }
    },320);
  }

  render();
})();