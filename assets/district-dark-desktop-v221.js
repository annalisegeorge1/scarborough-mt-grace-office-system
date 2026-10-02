(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v221-theme-sync-ready"))return;
  document.documentElement.classList.add("v221-theme-sync-ready");

  let theme=document.querySelector('meta[name="theme-color"]');
  if(!theme){
    theme=document.createElement("meta");
    theme.name="theme-color";
    document.head.appendChild(theme);
  }

  let scheme=document.querySelector('meta[name="color-scheme"]');
  if(!scheme){
    scheme=document.createElement("meta");
    scheme.name="color-scheme";
    scheme.content="light dark";
    document.head.appendChild(scheme);
  }

  const sync=()=>{
    const dark=document.body.classList.contains("v112-dark");
    document.documentElement.dataset.v221Theme=dark?"dark":"light";
    theme.content=dark?"#041724":"#0b3553";
  };

  sync();
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:["class"]});
})();