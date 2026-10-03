(()=>{
  "use strict";
  if(document.documentElement.classList.contains("v238-form-stabilization-ready"))return;
  document.documentElement.classList.add("v238-form-stabilization-ready");

  function normalizePreferences(){
    const box=document.getElementById("v138-notification-preferences");
    if(!box||box.dataset.v238Normalized==="true")return false;

    const specs=[
      {id:"v138-status-consent",phrase:"case-status"},
      {id:"v138-reminder-consent",phrase:"site-visit"}
    ];

    const pairs=specs.map(spec=>{
      const input=document.getElementById(spec.id);
      if(!input||!box.contains(input))return null;

      let label=box.querySelector('label[for="'+CSS.escape(spec.id)+'"]');
      if(!label)label=input.closest("label");
      if(!label){
        label=[...box.querySelectorAll("label")].find(node=>
          (node.textContent||"").toLowerCase().includes(spec.phrase)
        )||null;
      }
      return {input,label};
    }).filter(Boolean);

    if(!pairs.length)return false;

    const firstInput=pairs[0].input;
    let anchor=firstInput;
    while(anchor.parentElement&&anchor.parentElement!==box)anchor=anchor.parentElement;

    const list=document.createElement("div");
    list.className="v238-preference-list";
    box.insertBefore(list,anchor);

    const oldHosts=new Set();

    pairs.forEach(({input,label})=>{
      let host=input;
      while(host.parentElement&&host.parentElement!==box)host=host.parentElement;
      oldHosts.add(host);

      if(label){
        let labelHost=label;
        while(labelHost.parentElement&&labelHost.parentElement!==box)labelHost=labelHost.parentElement;
        oldHosts.add(labelHost);
      }

      const row=document.createElement("div");
      row.className="v238-pref-row";

      if(label&&label.contains(input)){
        if(!input.id)input.id="v238-pref-"+Math.random().toString(36).slice(2);
        if(!label.htmlFor)label.htmlFor=input.id;
        row.appendChild(input);
        row.appendChild(label);
      }else{
        row.appendChild(input);
        if(label){
          if(!label.htmlFor&&input.id)label.htmlFor=input.id;
          row.appendChild(label);
        }
      }
      list.appendChild(row);
    });

    oldHosts.forEach(host=>{
      if(host===list||!box.contains(host))return;
      const meaningful=[...host.childNodes].some(node=>{
        if(node.nodeType===Node.TEXT_NODE)return (node.textContent||"").trim().length>0;
        return node.nodeType===Node.ELEMENT_NODE;
      });
      if(!meaningful)host.remove();
    });

    [...box.querySelectorAll("p,small,.form-note")].forEach(node=>{
      const text=(node.textContent||"").toLowerCase();
      if(text.includes("preferences do not guarantee")||text.includes("notification service")){
        node.classList.add("v238-pref-note");
      }
    });

    box.dataset.v238Normalized="true";
    return true;
  }

  function install(){
    if(normalizePreferences())return;
    let attempts=0;
    const timer=window.setInterval(()=>{
      attempts+=1;
      if(normalizePreferences()||attempts>=20)window.clearInterval(timer);
    },150);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",install,{once:true});
  }else{
    install();
  }
})();