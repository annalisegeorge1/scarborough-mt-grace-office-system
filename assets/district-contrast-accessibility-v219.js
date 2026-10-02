(()=>{
  "use strict";
  if(document.body.classList.contains("v219-accessibility-ready"))return;
  document.body.classList.add("v219-accessibility-ready");

  const tray=document.querySelector(".v8-accessibility");
  if(!tray||tray.querySelector(".v219-access-trigger"))return;

  const trigger=document.createElement("button");
  trigger.type="button";
  trigger.className="v219-access-trigger";
  trigger.setAttribute("aria-expanded","false");
  trigger.setAttribute("aria-controls","v219-access-tools");
  trigger.setAttribute("aria-label","Open display and accessibility controls");
  trigger.innerHTML="<span>Aa</span>";
  tray.id="v219-access-tools";
  tray.appendChild(trigger);

  const textToggle=document.getElementById("v8-text-toggle");
  const contrastToggle=document.getElementById("v8-contrast-toggle");
  const textMenu=document.getElementById("v87-text-menu");

  function setOpen(open){
    tray.classList.toggle("v219-access-open",open);
    trigger.setAttribute("aria-expanded",String(open));
    trigger.setAttribute("aria-label",open?"Close display and accessibility controls":"Open display and accessibility controls");
    if(!open&&textMenu&&!textMenu.hidden){
      textToggle?.click();
    }
  }

  trigger.addEventListener("click",()=>{
    setOpen(!tray.classList.contains("v219-access-open"));
  });

  textToggle?.addEventListener("click",()=>{
    if(window.matchMedia("(max-width:900px)").matches&&!tray.classList.contains("v219-access-open")){
      setOpen(true);
    }
  },true);

  contrastToggle?.addEventListener("click",()=>{
    if(window.matchMedia("(max-width:900px)").matches&&!tray.classList.contains("v219-access-open")){
      setOpen(true);
    }
  },true);

  document.addEventListener("click",event=>{
    if(!window.matchMedia("(max-width:900px)").matches)return;
    if(!tray.classList.contains("v219-access-open"))return;
    if(tray.contains(event.target))return;
    if(textMenu&&!textMenu.hidden)return;
    setOpen(false);
  });

  document.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    if(!tray.classList.contains("v219-access-open"))return;
    setOpen(false);
    trigger.focus();
  });

  const media=window.matchMedia("(max-width:900px)");
  media.addEventListener?.("change",event=>{
    if(!event.matches)setOpen(false);
  });
})();