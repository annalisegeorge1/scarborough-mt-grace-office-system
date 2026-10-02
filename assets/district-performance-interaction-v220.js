(()=>{
  "use strict";
  if(document.body.classList.contains("v220-performance-ready"))return;
  document.body.classList.add("v220-performance-ready");

  const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Defer rendering work for long sections that start well below the fold.
     The class is removed before the section reaches the viewport. */
  function setupDeferredRendering(){
    if(!("IntersectionObserver" in window))return;
    const hashId=decodeURIComponent((location.hash||"").replace(/^#/,""));
    const seen=new Set();
    const candidates=[
      ...document.querySelectorAll("main > section"),
      ...document.querySelectorAll("#v51-more-content > section"),
      ...document.querySelectorAll(".v204-main-column > section")
    ].filter(el=>{
      if(!el||seen.has(el))return false;
      seen.add(el);
      if(hashId&&el.id===hashId)return false;
      const style=getComputedStyle(el);
      if(style.display==="none"||style.visibility==="hidden")return false;
      const rect=el.getBoundingClientRect();
      return rect.height>60&&rect.top>window.innerHeight*1.35;
    });

    if(!candidates.length)return;
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting||entry.boundingClientRect.top<window.innerHeight*1.2){
          entry.target.classList.remove("v220-render-deferred");
          observer.unobserve(entry.target);
        }
      });
    },{rootMargin:"700px 0px 700px 0px",threshold:0});

    candidates.forEach(el=>{
      el.classList.add("v220-render-deferred");
      observer.observe(el);
    });

    window.addEventListener("hashchange",()=>{
      const id=decodeURIComponent((location.hash||"").replace(/^#/,""));
      const target=id&&document.getElementById(id);
      if(target){
        target.classList.remove("v220-render-deferred");
        observer.unobserve(target);
      }
    });
  }

  /* Hint the browser to decode non-critical imagery asynchronously.
     Existing image sources/alt text are never changed. */
  function setupImageHints(){
    document.querySelectorAll("img").forEach(img=>{
      img.decoding="async";
      const critical=!!img.closest(".identity-banner,#v51-home,.topbar,nav");
      if(critical)return;
      const rect=img.getBoundingClientRect();
      if(rect.top>window.innerHeight*1.15){
        if(!img.hasAttribute("loading"))img.loading="lazy";
        try{img.fetchPriority="low"}catch(_e){}
        img.dataset.v220Lazy="true";
      }
    });
  }

  /* Keep persistent mobile controls from covering the field being edited when
     an on-screen keyboard reduces the visual viewport. */
  function setupKeyboardAwareness(){
    const vv=window.visualViewport;
    if(!vv)return;
    let baseline=Math.max(window.innerHeight,vv.height);

    const editable=el=>!!el&&(
      el.matches?.("input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']),textarea,select,[contenteditable='true']")
    );

    const update=()=>{
      if(vv.height>baseline)baseline=vv.height;
      const active=editable(document.activeElement);
      const reduction=baseline-vv.height;
      const open=active&&(reduction>150||vv.height<baseline*.78);
      document.body.classList.toggle("v220-keyboard-open",!!open);
    };

    vv.addEventListener("resize",update,{passive:true});
    vv.addEventListener("scroll",update,{passive:true});
    window.addEventListener("focusin",()=>{
      window.setTimeout(update,60);
    });
    window.addEventListener("focusout",()=>{
      window.setTimeout(update,180);
    });
    window.addEventListener("orientationchange",()=>{
      window.setTimeout(()=>{
        baseline=Math.max(window.innerHeight,vv.height);
        update();
      },300);
    });
  }

  function setupEnquiryForm(){
    const form=document.getElementById("district-enquiry-form");
    if(!form)return;

    const message=form.querySelector("#message");
    if(message&&!form.querySelector(".v220-message-counter")){
      const max=Number(message.getAttribute("maxlength"))||2000;
      const counter=document.createElement("div");
      counter.className="v220-message-counter";
      counter.id="v220-message-counter";
      counter.setAttribute("aria-live","polite");
      message.insertAdjacentElement("afterend",counter);
      const described=message.getAttribute("aria-describedby")||"";
      if(!described.includes(counter.id)){
        message.setAttribute("aria-describedby",(described+" "+counter.id).trim());
      }
      const updateCounter=()=>{
        const count=message.value.length;
        counter.textContent=count+" / "+max+" characters";
        counter.classList.toggle("is-near-limit",count>=max*.85&&count<max);
        counter.classList.toggle("is-at-limit",count>=max);
      };
      message.addEventListener("input",updateCounter);
      updateCounter();
    }

    const button=form.querySelector(".btn-send");
    const result=form.querySelector("#v33-form-result");
    if(!button)return;

    const originalLabel=button.textContent.trim();
    let safetyTimer=0;

    const setBusy=busy=>{
      button.classList.toggle("v220-submitting",busy);
      button.setAttribute("aria-busy",String(busy));
      if(busy){
        button.dataset.v220OriginalLabel=originalLabel;
        button.textContent="SUBMITTING ENQUIRY…";
        clearTimeout(safetyTimer);
        safetyTimer=window.setTimeout(()=>setBusy(false),15000);
      }else{
        clearTimeout(safetyTimer);
        button.textContent=button.dataset.v220OriginalLabel||originalLabel;
      }
    };

    form.addEventListener("submit",()=>{
      window.setTimeout(()=>setBusy(true),0);
    });

    if(result&&"MutationObserver" in window){
      const observer=new MutationObserver(()=>{
        const visible=result.classList.contains("show")||result.textContent.trim().length>0;
        if(!visible)return;
        setBusy(false);
        result.setAttribute("tabindex","-1");
        const ok=result.classList.contains("ok")||/reference|submitted|success/i.test(result.textContent);
        if(ok){
          window.setTimeout(()=>{
            result.focus({preventScroll:true});
            result.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"center"});
          },80);
        }
      });
      observer.observe(result,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class"]});
    }
  }

  function runIdle(fn){
    if("requestIdleCallback" in window)requestIdleCallback(fn,{timeout:900});
    else window.setTimeout(fn,120);
  }

  setupKeyboardAwareness();
  setupEnquiryForm();
  runIdle(()=>{
    setupDeferredRendering();
    setupImageHints();
  });
})();