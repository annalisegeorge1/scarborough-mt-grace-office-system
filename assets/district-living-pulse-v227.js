(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v227-living-pulse-ready"))return;
  document.documentElement.classList.add("v227-living-pulse-ready");

  if(!document.body.classList.contains("v203-focused-view"))return;

  const normalize=value=>(value||"/").replace(/\/+$/,"")||"/";
  const path=normalize(location.pathname);
  const esc=value=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const slug=value=>String(value||"")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g," ")
    .trim();
  const short=(value,max=170)=>{
    const text=String(value||"").replace(/\s+/g," ").trim();
    if(text.length<=max)return text;
    return text.slice(0,max-1).replace(/\s+\S*$/,"")+"…";
  };
  const fmtDate=value=>{
    const time=Date.parse(value||"");
    if(!Number.isFinite(time))return "";
    return new Date(time).toLocaleDateString("en-TT",{day:"numeric",month:"short",year:"numeric"});
  };
  const relativeDate=value=>{
    const time=Date.parse(value||"");
    if(!Number.isFinite(time))return "";
    const days=Math.max(0,Math.floor((Date.now()-time)/86400000));
    if(days===0)return "Updated today";
    if(days===1)return "Updated yesterday";
    if(days<7)return "Updated "+days+" days ago";
    return "Updated "+fmtDate(value);
  };
  const tone=status=>{
    const s=slug(status);
    if(/complete|confirmed|resolved|approved|published|response received/.test(s))return "confirmed";
    if(/follow|await|hold|referral/.test(s))return "followup";
    if(/develop|draft|prepar|in progress/.test(s))return "development";
    return "neutral";
  };

  const routeInfo={
    "/office":{
      title:"Latest verified office information",
      copy:"Staff-published notices and office information relevant to this page.",
      keywords:"office staff opening hours closure contact district announcement notice",
      sections:["office"],
      types:["notice","important","newsletter"],
      fallback:"/updates/"
    },
    "/services":{
      title:"Latest verified service information",
      copy:"Recently published forms, programme information and service-related public updates.",
      keywords:"service assistance programme program grant housing repair education support agriculture medical funeral uniform equipment resident",
      sections:["forms","services"],
      types:["form","form_override","notice","important"],
      fallback:"/services/"
    },
    "/forms":{
      title:"Latest verified forms & documents",
      copy:"Recently published public forms and document-related information.",
      keywords:"form forms document application download collection programme service",
      sections:["forms"],
      types:["form","form_override"],
      fallback:"/forms/#service-forms"
    },
    "/contact":{
      title:"Latest verified contact information",
      copy:"Published notices that may affect contacting or visiting the District Office.",
      keywords:"contact phone whatsapp hours opening closure closed visit office email location",
      sections:["contact","office"],
      types:["notice","important","newsletter"],
      fallback:"/contact/"
    },
    "/community":{
      feedOnly:true,
      keywords:"community project town hall outreach participation gallery public",
      sections:["activity"],
      types:["activity","activity_override","notice","important","newsletter"]
    },
    "/updates":{
      feedOnly:true,
      keywords:"update notice project progress activity public",
      sections:["activity"],
      types:["activity","activity_override","notice","important","newsletter"]
    }
  };

  const cfg=routeInfo[path];
  if(!cfg)return;

  let records=[];
  let lastFetchAt=0;
  let busy=false;
  let pulse=null;

  function metadata(record){
    return record?.metadata&&typeof record.metadata==="object"?record.metadata:{};
  }
  function latestProgress(record){
    const list=metadata(record).progressHistory;
    if(!Array.isArray(list))return null;
    return list
      .filter(x=>x&&typeof x==="object"&&x.summary)
      .slice()
      .sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0))[0]||null;
  }
  function updatedValue(record){
    const p=latestProgress(record);
    return p?.date||record.updatedAt||record.publishOn||record.eventDate||"";
  }
  function daysSince(value){
    const time=Date.parse(value||"");
    if(!Number.isFinite(time))return 99999;
    return Math.max(0,(Date.now()-time)/86400000);
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
      if(record.publicUrl)return record.publicUrl;
      return "/forms/#service-forms";
    }
    if(section==="activity"||type.includes("activity")||["notice","important","newsletter"].some(t=>type.includes(t))){
      return "/updates/?post="+encodeURIComponent(record.id);
    }
    if(record.publicUrl)return record.publicUrl;
    return cfg.fallback||"/updates/";
  }
  function statusFor(record){
    const p=latestProgress(record);
    return p?.status||record.publicStatus||record.category||"Published";
  }
  function summaryFor(record){
    const p=latestProgress(record);
    return record.summary||record.statusNote||record.body||p?.summary||"Open the full public information for details.";
  }

  function relevance(record){
    if(!record||metadata(record).action==="hide")return -999;
    const type=slug(record.type);
    const section=slug(record.section);
    const category=slug(record.category);
    const hay=slug([
      record.title,record.summary,record.body,record.statusNote,
      record.publicStatus,record.responsibleAuthority,record.category,
      metadata(record).subtype,metadata(record).role
    ].join(" "));

    let score=0;
    if(cfg.sections?.some(x=>section===slug(x)))score+=90;
    if(cfg.types?.some(x=>type===slug(x)))score+=72;

    const words=slug(cfg.keywords).split(" ").filter(Boolean);
    let hits=0;
    words.forEach(word=>{
      if(hay.includes(word)||category.includes(word))hits++;
    });
    score+=Math.min(60,hits*10);

    if(record.isFeatured)score+=24;
    if(latestProgress(record))score+=18;

    const age=daysSince(updatedValue(record));
    if(age<=7)score+=34;
    else if(age<=30)score+=24;
    else if(age<=90)score+=14;
    else if(age<=365)score+=5;

    if(path==="/services"&&section==="forms")score+=18;
    if(path==="/office"&&section==="activity"&&hits===0)score-=25;
    if(path==="/contact"&&section==="activity"&&hits===0)score-=32;
    if(path==="/forms"&&section!=="forms"&&!type.includes("form"))score-=100;

    return score;
  }

  function relevant(){
    const threshold=path==="/office"||path==="/contact"?58:path==="/services"?46:30;
    return records
      .map(record=>({record,score:relevance(record),date:Date.parse(updatedValue(record)||0)||0}))
      .filter(x=>x.score>=threshold)
      .sort((a,b)=>(b.score-a.score)||(b.date-a.date))
      .slice(0,3)
      .map(x=>x.record);
  }

  function newestDate(list=records){
    return list
      .map(updatedValue)
      .filter(Boolean)
      .sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||"";
  }

  function copyLink(record,button){
    const url=new URL(destination(record),location.origin).href;
    const done=()=>{
      if(!button)return;
      const old=button.textContent;
      button.textContent="Copied";
      window.setTimeout(()=>button.textContent=old,1200);
    };
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(url).then(done).catch(()=>{});
      return;
    }
    const ta=document.createElement("textarea");
    ta.value=url;
    ta.style.position="fixed";
    ta.style.opacity="0";
    document.body.appendChild(ta);
    ta.select();
    try{document.execCommand("copy");done()}catch(_e){}
    ta.remove();
  }

  function itemMarkup(record,index){
    const progress=latestProgress(record);
    const status=statusFor(record);
    const date=updatedValue(record);
    const href=destination(record);
    const external=/^https?:\/\//i.test(href)&&!href.startsWith(location.origin);
    return '<article class="v227-pulse-item" data-v227-id="'+esc(record.id)+'">'+
      '<div class="v227-item-top">'+
        '<span class="v227-item-type">'+esc(typeLabel(record))+'</span>'+
        '<span class="v227-item-status" data-tone="'+tone(status)+'">'+esc(status)+'</span>'+
        (date?'<span class="v227-item-time">'+esc(relativeDate(date))+'</span>':"")+
      '</div>'+
      '<h3>'+esc(record.title||"Public information")+'</h3>'+
      '<p>'+esc(short(summaryFor(record)))+'</p>'+
      (progress?'<div class="v227-progress-note"><span><strong>Latest progress</strong><br>'+esc(short(progress.summary,115))+'</span></div>':"")+
      '<div class="v227-item-actions">'+
        '<a href="'+esc(href)+'"'+(external?' target="_blank" rel="noopener"':'')+' data-v227-open="'+index+'">Open source →</a>'+
        '<button type="button" data-v227-copy="'+index+'">Copy link</button>'+
      '</div>'+
    '</article>';
  }

  function ensurePulse(){
    if(cfg.feedOnly)return null;
    if(pulse)return pulse;

    const main=document.querySelector(".v204-main-column");
    if(!main)return null;

    pulse=document.createElement("section");
    pulse.className="v227-pulse is-empty";
    pulse.setAttribute("aria-label","Latest verified public information");
    pulse.innerHTML=
      '<header class="v227-pulse-head">'+
        '<div class="v227-pulse-title-row">'+
          '<span class="v227-live-dot" aria-hidden="true"></span>'+
          '<div class="v227-pulse-copy"><small>District Pulse · Published + Verified</small><strong>'+esc(cfg.title)+'</strong><span>'+esc(cfg.copy)+'</span></div>'+
        '</div>'+
        '<div class="v227-pulse-head-actions"><span class="v227-freshness">Checking…</span><button class="v227-refresh" type="button" aria-label="Refresh verified public information" title="Refresh"><span>↻</span></button></div>'+
      '</header>'+
      '<div class="v227-pulse-list"></div>'+
      '<footer class="v227-pulse-foot"><span>Only staff-published, verified, currently public records appear here.</span><a href="/updates/">Open all district updates →</a></footer>';

    const smart=main.querySelector(":scope > .v226-next-step");
    const journey=main.querySelector(":scope > .v225-launcher");
    const deck=main.querySelector(":scope > .v204-action-deck");
    if(smart)smart.insertAdjacentElement("afterend",pulse);
    else if(journey)journey.insertAdjacentElement("afterend",pulse);
    else if(deck)deck.insertAdjacentElement("afterend",pulse);
    else main.insertBefore(pulse,main.firstChild);

    pulse.querySelector(".v227-refresh")?.addEventListener("click",()=>load(true));

    pulse.addEventListener("click",event=>{
      const copy=event.target.closest("[data-v227-copy]");
      if(copy){
        const list=relevant();
        const record=list[Number(copy.dataset.v227Copy)];
        if(record)copyLink(record,copy);
      }
    });

    return pulse;
  }

  function renderPulse(){
    if(cfg.feedOnly){
      enhanceExistingFeed();
      return;
    }
    const shell=ensurePulse();
    if(!shell)return;

    const list=relevant();
    shell.classList.toggle("is-empty",list.length===0);
    shell.classList.remove("is-error");

    if(!list.length)return;

    shell.querySelector(".v227-pulse-list").innerHTML=list.map(itemMarkup).join("");
    const newest=newestDate(list);
    const freshness=shell.querySelector(".v227-freshness");
    if(freshness)freshness.textContent=newest?relativeDate(newest):"Verified public information";
  }

  function enhanceExistingFeed(){
    const shell=document.querySelector(".v213-feed-shell");
    if(!shell)return;
    const heading=shell.querySelector(".v213-feed-heading");
    if(!heading||heading.querySelector(".v227-feed-freshness"))return;

    const candidate=records
      .filter(record=>relevance(record)>25)
      .sort((a,b)=>Date.parse(updatedValue(b)||0)-Date.parse(updatedValue(a)||0))[0];
    if(!candidate)return;

    const badge=document.createElement("span");
    badge.className="v227-feed-freshness";
    badge.textContent=relativeDate(updatedValue(candidate))||"Verified public information";
    heading.appendChild(badge);
  }

  function setBusy(value){
    busy=value;
    const shell=ensurePulse();
    if(!shell)return;
    shell.querySelector(".v227-live-dot")?.classList.toggle("is-refreshing",value);
    shell.querySelector(".v227-refresh")?.classList.toggle("is-refreshing",value);
    const refresh=shell.querySelector(".v227-refresh");
    if(refresh)refresh.disabled=value;
  }

  async function load(force=false){
    if(busy)return;
    const age=Date.now()-lastFetchAt;
    if(!force&&records.length&&age<300000){
      renderPulse();
      return;
    }

    setBusy(true);
    try{
      const response=await fetch("/api/public/content",{credentials:"same-origin",cache:"no-store"});
      if(!response.ok)throw new Error("Public information unavailable");
      const data=await response.json();
      records=(data.content||[]).filter(record=>metadata(record).action!=="hide");
      lastFetchAt=Date.now();
      renderPulse();
    }catch(_e){
      const shell=ensurePulse();
      if(shell)shell.classList.add("is-error");
    }finally{
      setBusy(false);
    }
  }

  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState!=="visible")return;
    if(Date.now()-lastFetchAt>300000)load(false);
  });

  load(false);
})();