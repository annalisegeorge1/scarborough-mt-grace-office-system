(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v229-pwa-ready"))return;
  document.documentElement.classList.add("v229-pwa-ready");

  const path=(location.pathname||"/").replace(/\/+$/,"")||"/";
  if(path.startsWith("/staff"))return;

  const secure=location.protocol==="https:"||["localhost","127.0.0.1"].includes(location.hostname);
  const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent||"");
  const isSafari=/safari/i.test(navigator.userAgent||"")&&!/crios|fxios|edgios/i.test(navigator.userAgent||"");

  let installPrompt=null;
  let statusTimer=0;
  let hadController=!!navigator.serviceWorker?.controller;
  let controllerChanged=false;

  const status=document.createElement("div");
  status.className="v229-network-status";
  status.setAttribute("role","status");
  status.setAttribute("aria-live","polite");
  status.innerHTML='<span class="v229-network-dot" aria-hidden="true"></span><span class="v229-network-copy"></span><button class="v229-network-action" type="button" hidden></button>';
  document.body.appendChild(status);

  const statusCopy=status.querySelector(".v229-network-copy");
  const statusAction=status.querySelector(".v229-network-action");

  function showStatus(message,{kind="online",persist=false,actionLabel="",onAction=null}={}){
    clearTimeout(statusTimer);
    status.classList.remove("is-offline","is-update");
    if(kind==="offline")status.classList.add("is-offline");
    if(kind==="update")status.classList.add("is-update");
    statusCopy.textContent=message;

    if(actionLabel&&typeof onAction==="function"){
      statusAction.hidden=false;
      statusAction.textContent=actionLabel;
      statusAction.onclick=onAction;
    }else{
      statusAction.hidden=true;
      statusAction.textContent="";
      statusAction.onclick=null;
    }

    status.classList.add("is-visible");
    if(!persist){
      statusTimer=window.setTimeout(()=>status.classList.remove("is-visible"),2600);
    }
  }

  function applyConnectionState(announce=false){
    const online=navigator.onLine!==false;
    document.body.classList.toggle("v229-offline",!online);

    document.querySelectorAll(".v227-freshness,.v227-feed-freshness").forEach(el=>{
      if(!online){
        if(!el.dataset.v229OnlineText)el.dataset.v229OnlineText=el.textContent||"";
        el.textContent="Offline · reconnect for current information";
      }else if(el.dataset.v229OnlineText){
        el.textContent=el.dataset.v229OnlineText;
        delete el.dataset.v229OnlineText;
      }
    });

    if(!online){
      showStatus("Offline mode · live updates, enquiries and tracking are unavailable.",{kind:"offline",persist:true});
    }else if(announce){
      showStatus("Back online · live public information is available again.");
    }else{
      status.classList.remove("is-visible");
    }
  }

  function installMarkup(context="drawer"){
    const wrapper=document.createElement("div");
    wrapper.className=context==="command"?"v229-command-install":"";
    wrapper.innerHTML=
      '<button class="v229-install-control" type="button">'+
        '<span class="v229-install-copy"><strong>Install District Office app</strong><small>Faster return access with an offline-aware public shell.</small></span>'+
        '<span class="v229-install-mark" aria-hidden="true">↓</span>'+
      '</button>';
    return wrapper;
  }

  function installControls(){
    return [...document.querySelectorAll(".v229-install-control")];
  }

  function syncInstallVisibility(){
    const available=!isStandalone()&&(!!installPrompt||(isIOS&&isSafari));
    installControls().forEach(btn=>{
      btn.classList.toggle("is-available",available);
      const strong=btn.querySelector("strong");
      const small=btn.querySelector("small");
      if(isIOS&&isSafari&&!installPrompt){
        if(strong)strong.textContent="Add to Home Screen";
        if(small)small.textContent="Use Share → Add to Home Screen for app-style access.";
      }else{
        if(strong)strong.textContent="Install District Office app";
        if(small)small.textContent="Faster return access with an offline-aware public shell.";
      }
    });
  }

  async function installApp(){
    if(isStandalone())return;

    if(installPrompt){
      const prompt=installPrompt;
      installPrompt=null;
      try{
        await prompt.prompt();
        const result=await prompt.userChoice;
        if(result?.outcome==="accepted"){
          showStatus("District Office app installed.");
        }
      }catch(_e){}
      syncInstallVisibility();
      return;
    }

    if(isIOS&&isSafari){
      showStatus("On iPhone/iPad: tap Share, then choose “Add to Home Screen”.",{kind:"update",persist:true});
    }
  }

  function addInstallOpeners(){
    const drawer=document.querySelector(".v202-drawer-foot");
    if(drawer&&!drawer.querySelector(".v229-install-control")){
      const wrap=installMarkup("drawer");
      wrap.querySelector(".v229-install-control").addEventListener("click",installApp);
      drawer.appendChild(wrap);
    }

    const command=document.querySelector(".v224-command-shell");
    if(command&&!command.querySelector(".v229-install-control")){
      const wrap=installMarkup("command");
      wrap.querySelector(".v229-install-control").addEventListener("click",installApp);
      const foot=command.querySelector(".v224-command-foot");
      if(foot)foot.insertAdjacentElement("beforebegin",wrap);
      else command.appendChild(wrap);
    }

    syncInstallVisibility();
  }

  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    installPrompt=event;
    addInstallOpeners();
    syncInstallVisibility();
  });

  window.addEventListener("appinstalled",()=>{
    installPrompt=null;
    syncInstallVisibility();
    showStatus("District Office app installed.");
  });

  window.addEventListener("online",()=>applyConnectionState(true));
  window.addEventListener("offline",()=>applyConnectionState(true));

  if("serviceWorker" in navigator&&secure){
    window.addEventListener("load",async()=>{
      try{
        const registration=await navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"});

        registration.addEventListener("updatefound",()=>{
          const worker=registration.installing;
          if(!worker)return;
          worker.addEventListener("statechange",()=>{
            if(worker.state==="installed"&&navigator.serviceWorker.controller){
              showStatus("A newer public-site version is ready.",{
                kind:"update",
                persist:true,
                actionLabel:"Refresh",
                onAction:()=>location.reload()
              });
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange",()=>{
          if(controllerChanged)return;
          controllerChanged=true;
          if(hadController){
            showStatus("Site update activated.",{
              kind:"update",
              persist:true,
              actionLabel:"Refresh",
              onAction:()=>location.reload()
            });
          }
          hadController=true;
        });

        window.setTimeout(()=>registration.update().catch(()=>{}),15000);
      }catch(_e){
        /* PWA support is an enhancement; the website remains fully usable without it. */
      }
    },{once:true});
  }

  function addOfflineNotes(){
    const places=[
      document.querySelector(".v213-feed-heading"),
      document.querySelector(".v227-pulse-head"),
      document.querySelector("#track-enquiry")
    ].filter(Boolean);

    places.forEach(place=>{
      const host=place.closest("section,article,div")||place;
      if(host.querySelector(".v229-offline-inline"))return;
      const note=document.createElement("div");
      note.className="v229-offline-inline";
      note.textContent="You are offline. Reconnect before relying on current notices, statuses, requirements or tracker information.";
      place.insertAdjacentElement("afterend",note);
    });
  }

  applyConnectionState(false);
  addInstallOpeners();
  addOfflineNotes();

  if("MutationObserver" in window){
    let timer=0;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=window.setTimeout(()=>{
        addInstallOpeners();
        addOfflineNotes();
        applyConnectionState(false);
      },100);
    }).observe(document.body,{childList:true,subtree:true});
  }
})();