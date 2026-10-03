(()=>{'use strict';
const q=new URLSearchParams(location.search),caseId=q.get('caseId')||'',caseRef=q.get('case')||'',resident=q.get('resident')||'';
if(!caseId&&!caseRef&&!resident)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const file=location.pathname.split('/').filter(Boolean).pop()||'';
function set(id,value,onlyBlank=false){const e=document.getElementById(id);if(!e||value==null||value==='')return;if(onlyBlank&&String(e.value||'').trim())return;e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
function backUrl(){return 'index.html'+(caseId?'?case='+encodeURIComponent(caseId):'')}
function addBanner(){
 const main=document.querySelector('main'),msg=document.getElementById('msg');if(!main||document.getElementById('v251-context-bar'))return;
 const bar=document.createElement('div');bar.id='v251-context-bar';bar.className='v251-context-bar';
 bar.innerHTML='<strong>Case context: '+esc(caseRef||caseId||'Linked resident')+'</strong>'+(resident?' · '+esc(resident):'')+'<br><span>This module is scoped to the case you opened. Clear the context to return to the full register.</span><div class="v251-context-actions"><a class="primary" href="'+esc(backUrl())+'">Back to case</a><a href="'+esc(file)+'">Show full module</a></div>';
 if(msg)msg.after(bar);else main.prepend(bar);
}
function prefill(){
 if(file==='applications.html'){set('caseId',caseId);set('applicant',resident,true);const e=document.getElementById('q');if(e&&!e.value){e.value=resident||caseRef;e.dispatchEvent(new Event('input',{bubbles:true}))}}
 if(file==='correspondence.html'){set('linkedType','Case');set('linkedRef',caseRef||caseId)}
 if(file==='field.html'){set('linkedType','Case');set('linkedRef',caseRef||caseId)}
 if(file==='feedback.html'){set('caseRef',caseRef||caseId)}
 if(file==='records.html'){set('linkedType','Case');set('linkedId',caseId||caseRef);const e=document.getElementById('q');if(e&&!e.value){e.value=caseId||caseRef;e.dispatchEvent(new Event('input',{bubbles:true}))}}
}
function keys(){return [caseRef,caseId,resident].filter(Boolean).map(x=>x.toLowerCase())}
function filterRows(){
 if(file==='applications.html'||file==='records.html')return;
 const tbody=document.getElementById('rows');if(!tbody)return;const ks=keys();
 [...tbody.querySelectorAll('tr')].forEach(tr=>{
   if(tr.querySelector('.empty'))return;
   const txt=(tr.textContent||'').toLowerCase();
   const match=ks.some(k=>txt.includes(k));
   tr.classList.toggle('v251-context-hidden',!match);
 });
 if(file==='field.html'){const e=document.getElementById('total');if(e)e.textContent=[...tbody.querySelectorAll('tr:not(.v251-context-hidden)')].filter(x=>!x.querySelector('.empty')).length}
 if(file==='feedback.html'){
   const s=document.getElementById('feedbackId');if(s)[...s.options].forEach((o,i)=>{if(i===0)return;o.hidden=!ks.some(k=>(o.textContent||'').toLowerCase().includes(k))});
 }
}
function observe(){
 const rows=document.getElementById('rows');if(rows){const ob=new MutationObserver(()=>filterRows());ob.observe(rows,{childList:true,subtree:true});filterRows()}
 document.addEventListener('click',e=>{if(e.target.closest('#new'))setTimeout(()=>{prefill();filterRows()},30)},true);
}
function init(){addBanner();prefill();observe();setTimeout(()=>{prefill();filterRows()},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();