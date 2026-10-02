(()=>{
  "use strict";
  if(document.body.classList.contains("v215-progress-threads-ready"))return;
  document.body.classList.add("v215-progress-threads-ready");

  const slug=value=>String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const safe=value=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const tone=status=>{
    const s=slug(status);
    if(/confirm|complete|resolved|response received/.test(s))return "confirmed";
    if(/develop|draft|prepar|in progress/.test(s))return "development";
    if(/follow|await|hold|referral/.test(s))return "followup";
    if(/plan|scheduled|request submitted/.test(s))return "planned";
    return "neutral";
  };
  const fmt=value=>{
    if(!value)return "";
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return "";
    return d.toLocaleDateString("en-TT",{day:"numeric",month:"short",year:"numeric"});
  };
  const entriesOf=record=>{
    const m=record&&record.metadata&&typeof record.metadata==="object"?record.metadata:{};
    const list=Array.isArray(m.progressHistory)?m.progressHistory:[];
    return list
      .filter(x=>x&&typeof x==="object"&&x.summary&&x.date)
      .slice()
      .sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  };

  let records=[];
  const shell=document.querySelector(".v213-feed-shell");
  const activityHub=document.getElementById("activity-hub");
  let applying=false;
  let observer=null;

  function recordById(id){
    return records.find(r=>String(r.id)===String(id))||null;
  }
  function recordByTitle(title){
    const key=slug(title);
    const matches=records.filter(r=>slug(r.title)===key&&entriesOf(r).length);
    return matches.sort((a,b)=>Date.parse(b.updatedAt||b.publishOn||0)-Date.parse(a.updatedAt||a.publishOn||0))[0]||null;
  }

  function threadMarkup(record,compact=false){
    const entries=entriesOf(record);
    if(!entries.length)return "";
    return '<div class="v215-thread'+(compact?" v215-thread-compact":"")+'">'+
      '<div class="v215-thread-head">'+
        '<div><small>Public progress history</small><strong>'+safe(record.title)+'</strong></div>'+
        '<span>'+entries.length+' dated entr'+(entries.length===1?"y":"ies")+'</span>'+
      '</div>'+
      '<div class="v215-thread-list">'+
        entries.map((entry,index)=>
          '<article class="v215-thread-entry'+(index===entries.length-1?" is-latest":"")+'">'+
            '<div class="v215-thread-meta">'+
              '<span class="v215-thread-date">'+safe(fmt(entry.date))+'</span>'+
              '<span class="v215-thread-status" data-tone="'+tone(entry.status)+'">'+safe(entry.status||"Progress update")+'</span>'+
            '</div>'+
            '<p>'+safe(entry.summary)+'</p>'+
            (entry.note?'<em>'+safe(entry.note)+'</em>':"")+
          '</article>'
        ).join("")+
      '</div>'+
      '<div class="v215-thread-note">This history supplements the full public item above. Earlier entries are retained so residents can see how the matter progressed over time.</div>'+
    '</div>';
  }

  function ensureThreadFlag(item,count){
    let box=item.querySelector(".v214-item-flags");
    if(!box){
      box=document.createElement("div");
      box.className="v214-item-flags";
      item.querySelector("h3")?.insertAdjacentElement("afterend",box);
    }
    if(box&&!box.querySelector(".v215-thread-flag")){
      const flag=document.createElement("span");
      flag.className="v214-flag v215-thread-flag";
      flag.textContent=count+" progress "+(count===1?"entry":"entries");
      box.appendChild(flag);
    }
  }

  function enhanceFeed(){
    if(!shell)return;
    shell.querySelectorAll(".v213-feed-item[data-v214-id]").forEach(item=>{
      const record=recordById(item.dataset.v214Id);
      const entries=entriesOf(record);
      if(!record||!entries.length)return;
      ensureThreadFlag(item,entries.length);

      const actions=item.querySelector(".v213-item-actions");
      if(actions&&!actions.querySelector(".v215-thread-toggle")){
        const btn=document.createElement("button");
        btn.type="button";
        btn.className="v213-item-action v215-thread-toggle";
        btn.dataset.v215Thread=record.id;
        btn.setAttribute("aria-expanded","false");
        btn.innerHTML='<span aria-hidden="true">↳</span> Progress thread <span class="v215-thread-count">'+entries.length+'</span>';
        actions.insertBefore(btn,actions.firstChild);
      }

      if(!item.querySelector(":scope .v215-thread[data-v215-thread-panel]")){
        const panel=document.createElement("div");
        panel.dataset.v215ThreadPanel=record.id;
        panel.hidden=true;
        panel.innerHTML=threadMarkup(record);
        item.querySelector(".v213-feed-content")?.appendChild(panel);
      }
    });

    const params=new URLSearchParams(location.search);
    const target=params.get("post"),thread=params.get("thread");
    if(target&&thread==="1"){
      const item=shell.querySelector('[data-v214-id="'+CSS.escape(target)+'"]');
      const btn=item?.querySelector(".v215-thread-toggle");
      if(btn&&btn.getAttribute("aria-expanded")!=="true")btn.click();
    }
  }

  function enhanceSourceCards(){
    if(!activityHub)return;
    activityHub.querySelectorAll(".v26-project,.v26-notice").forEach(card=>{
      if(card.querySelector(":scope > .v215-source-thread"))return;
      const title=card.querySelector("h4")?.textContent?.trim()||"";
      const record=recordByTitle(title);
      const entries=entriesOf(record);
      if(!record||!entries.length)return;

      const details=document.createElement("details");
      details.className="v215-source-thread";
      details.innerHTML=
        '<summary><span>Public progress history <span class="cm-thread-count">'+entries.length+'</span></span></summary>'+
        threadMarkup(record,true);
      card.appendChild(details);
    });
  }

  function applyAll(){
    if(applying)return;
    applying=true;
    observer?.disconnect();
    enhanceFeed();
    enhanceSourceCards();
    applying=false;
    const watchTarget=document.querySelector(".v213-feed-list")||activityHub;
    if(watchTarget)observer?.observe(watchTarget,{childList:true,subtree:true});
  }

  if(shell){
    shell.addEventListener("click",event=>{
      const btn=event.target.closest("[data-v215-thread]");
      if(!btn)return;
      const item=btn.closest(".v213-feed-item");
      const panel=item?.querySelector('[data-v215-thread-panel="'+CSS.escape(btn.dataset.v215Thread)+'"]');
      if(!panel)return;
      const open=btn.getAttribute("aria-expanded")!=="true";
      btn.setAttribute("aria-expanded",String(open));
      panel.hidden=!open;
      if(open){
        const id=item.dataset.v214Id;
        const u=new URL(location.href);
        u.searchParams.set("post",id);
        u.searchParams.set("thread","1");
        history.replaceState(null,"",u.pathname+u.search+u.hash);
      }
    });
  }

  observer=new MutationObserver(()=>{
    clearTimeout(observer._timer);
    observer._timer=setTimeout(applyAll,70);
  });

  fetch("/api/public/content",{credentials:"same-origin",cache:"no-store"})
    .then(r=>r.ok?r.json():Promise.reject(new Error("Public content unavailable")))
    .then(data=>{
      records=(data.content||[]).filter(r=>{
        const m=r.metadata&&typeof r.metadata==="object"?r.metadata:{};
        return m.action!=="hide"&&["activity","activity_override"].includes(r.type);
      });
      applyAll();
    })
    .catch(()=>{});
})();