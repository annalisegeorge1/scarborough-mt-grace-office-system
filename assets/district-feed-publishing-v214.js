(()=>{
  "use strict";
  if(document.body.classList.contains("v214-feed-publishing-ready"))return;
  document.body.classList.add("v214-feed-publishing-ready");

  const shell=document.querySelector(".v213-feed-shell");
  if(!shell)return;

  const path=(location.pathname||"/").replace(/\/+$/,"")||"/";
  const seenKey="smg.digitalFeed.lastSeenAt";
  const lastSeenRaw=localStorage.getItem(seenKey)||"";
  const lastSeen=lastSeenRaw?Date.parse(lastSeenRaw):0;
  const nowIso=new Date().toISOString();

  const slug=value=>String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const fmtDate=value=>{
    if(!value)return "";
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return "";
    return d.toLocaleDateString("en-TT",{day:"numeric",month:"short",year:"numeric"});
  };
  const permalink=id=>{
    const base=path==="/community"?"/community/":"/updates/";
    return base+"?post="+encodeURIComponent(id);
  };

  let records=[];
  let observer=null;
  let busy=false;

  const banner=document.createElement("div");
  banner.className="v214-feed-banner";
  banner.innerHTML='<div><strong></strong><br><span></span></div>';
  const head=shell.querySelector(".v213-feed-head");
  head?.insertAdjacentElement("afterend",banner);

  const foot=shell.querySelector(".v213-feed-foot");
  if(foot&&!foot.querySelector(".v214-feed-rss")){
    const rss=document.createElement("a");
    rss.className="v214-feed-rss";
    rss.href="/api/public/feed.xml";
    rss.target="_blank";
    rss.rel="alternate";
    rss.textContent="RSS feed";
    foot.appendChild(rss);
  }

  function bestRecordForTitle(title){
    const key=slug(title);
    const matches=records.filter(r=>slug(r.title)===key);
    if(!matches.length)return null;
    return matches.sort((a,b)=>{
      const af=a.isFeatured?1:0,bf=b.isFeatured?1:0;
      if(bf!==af)return bf-af;
      return Date.parse(b.updatedAt||b.publishOn||0)-Date.parse(a.updatedAt||a.publishOn||0);
    })[0];
  }

  function flagBox(item){
    let box=item.querySelector(".v214-item-flags");
    if(!box){
      box=document.createElement("div");
      box.className="v214-item-flags";
      const h3=item.querySelector("h3");
      h3?.insertAdjacentElement("afterend",box);
    }
    return box;
  }

  function addFlag(item,className,label){
    const box=flagBox(item);
    if(!box||box.querySelector("."+className))return;
    const flag=document.createElement("span");
    flag.className="v214-flag "+className;
    flag.textContent=label;
    box.appendChild(flag);
  }

  function addPermalink(item,record){
    const actions=item.querySelector(".v213-item-actions");
    if(!actions||actions.querySelector(".v214-permalink"))return;
    const a=document.createElement("a");
    a.className="v213-item-action v214-permalink";
    a.href=permalink(record.id);
    a.innerHTML='<span aria-hidden="true">#</span> Permalink';
    actions.appendChild(a);
  }

  function enrich(){
    if(busy)return;
    busy=true;
    observer?.disconnect();

    const items=[...shell.querySelectorAll(".v213-feed-item")];
    let newCount=0;

    items.forEach(item=>{
      item.classList.add("v214-feed-item");
      const title=item.querySelector("h3")?.textContent?.trim()||"";
      const record=bestRecordForTitle(title);
      if(!record)return;

      item.dataset.v214Id=record.id;
      item.dataset.v214Published=record.publishOn||record.updatedAt||"";

      if(record.isFeatured){
        item.classList.add("is-pinned");
        addFlag(item,"v214-flag-pin","Pinned");
      }

      const stamp=record.publishOn||record.updatedAt;
      const ts=stamp?Date.parse(stamp):0;
      if(lastSeen&&ts&&ts>lastSeen){
        item.classList.add("is-new");
        addFlag(item,"v214-flag-new","New");
        newCount++;
      }

      if(!item.querySelector(".v213-item-time")&&stamp){
        const top=item.querySelector(".v213-item-top");
        if(top){
          const dot=document.createElement("span");
          dot.className="v213-item-dot";
          const date=document.createElement("span");
          date.className="v214-feed-meta-date";
          date.textContent=fmtDate(stamp);
          top.insertBefore(dot,top.querySelector(".v213-status"));
          top.insertBefore(date,top.querySelector(".v213-status"));
        }
      }

      addPermalink(item,record);
    });

    const list=shell.querySelector(".v213-feed-list");
    if(list){
      const ordered=[...list.querySelectorAll(".v213-feed-item")].sort((a,b)=>{
        const ap=a.classList.contains("is-pinned")?1:0;
        const bp=b.classList.contains("is-pinned")?1:0;
        if(bp!==ap)return bp-ap;
        const ad=Date.parse(a.dataset.v214Published||0)||0;
        const bd=Date.parse(b.dataset.v214Published||0)||0;
        return bd-ad;
      });
      ordered.forEach(el=>list.appendChild(el));
    }

    if(lastSeen&&newCount>0){
      banner.classList.add("is-visible");
      banner.querySelector("strong").textContent=newCount+" new public update"+(newCount===1?"":"s")+" since your last visit";
      banner.querySelector("span").textContent="Pinned items remain at the top. Full source information is still available for every item.";
    }

    const target=new URLSearchParams(location.search).get("post");
    if(target){
      const item=shell.querySelector('[data-v214-id="'+CSS.escape(target)+'"]');
      if(item){
        item.classList.add("is-targeted");
        const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(()=>item.scrollIntoView({behavior:reduced?"auto":"smooth",block:"center"}),120);
      }
    }

    busy=false;
    observer?.observe(shell.querySelector(".v213-feed-list"),{childList:true});
  }

  function copyText(text,button){
    const finish=()=>{
      if(!button)return;
      const old=button.innerHTML;
      button.textContent="Link copied";
      window.setTimeout(()=>button.innerHTML=old,1300);
    };
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(finish).catch(()=>{});
    }else{
      const ta=document.createElement("textarea");
      ta.value=text;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");finish()}catch(_e){}
      ta.remove();
    }
  }

  shell.addEventListener("click",e=>{
    const button=e.target.closest("[data-v213-copy],[data-v213-share]");
    if(!button)return;
    const item=button.closest(".v213-feed-item");
    const id=item?.dataset?.v214Id;
    if(!id)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const url=new URL(permalink(id),location.origin).href;
    const title=item.querySelector("h3")?.textContent?.trim()||"District Office update";
    if(button.matches("[data-v213-share]")&&navigator.share){
      navigator.share({title,url}).catch(()=>{});
    }else{
      copyText(url,button);
    }
  },true);

  observer=new MutationObserver(()=>{
    window.clearTimeout(observer._t);
    observer._t=window.setTimeout(enrich,60);
  });

  fetch("/api/public/content",{credentials:"same-origin",cache:"no-store"})
    .then(r=>r.ok?r.json():Promise.reject(new Error("Public content unavailable")))
    .then(data=>{
      records=(data.content||[]).filter(r=>{
        const action=r.metadata&&typeof r.metadata==="object"?r.metadata.action:"";
        return action!=="hide";
      });
      enrich();
      try{localStorage.setItem(seenKey,nowIso)}catch(_e){}
    })
    .catch(()=>{
      const list=shell.querySelector(".v213-feed-list");
      if(list)observer.observe(list,{childList:true});
    });
})();