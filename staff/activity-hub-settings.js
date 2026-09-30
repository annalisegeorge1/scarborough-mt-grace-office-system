(()=>{'use strict';
const root=document.getElementById('hub-settings-root');if(!root)return;
let record=null,fields=[],settingsRecords=[];
const esc=SMG.esc;
const tabNames={notices:'Latest Notices',events:'Town Hall',projects:'Projects & Follow-up',employment:'Employment Opportunities'};
function selectorFor(element,hub){
  const parts=[];
  while(element!==hub){
    if(element.id){parts.unshift('#'+CSS.escape(element.id));break;}
    const tag=element.tagName.toLowerCase();
    const siblings=[...element.parentElement.children].filter(e=>e.tagName===element.tagName);
    const uniqueClass=[...element.classList].find(c=>siblings.filter(e=>e.classList.contains(c)).length===1);
    parts.unshift(uniqueClass?tag+'.'+CSS.escape(uniqueClass):tag+':nth-of-type('+(siblings.indexOf(element)+1)+')');element=element.parentElement;
  }
  return '#activity-hub '+parts.join(' > ');
}
async function reload(){
  try{
    const [response,html]=await Promise.all([SMG.api('/api/content'),fetch('/',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Cannot load public Hub defaults.');return r.text()})]);
    settingsRecords=(response.content||[]).filter(x=>x.type==='activity_settings'&&x.workflow!=='Archived').sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
    record=settingsRecords[0]||null;
    const documentCopy=new DOMParser().parseFromString(html,'text/html'),hub=documentCopy.querySelector('#activity-hub');if(!hub)throw Error('Public Activity Hub could not be found.');
    const tabs=hub.querySelector('.v26-tabs'),panels=hub.querySelector('.v26-panels');
    tabs.insertAdjacentHTML('beforeend','<button id="v204-employment-tab" data-v26-tab="employment"><span>04</span><b>Employment Opportunities</b><small>THA &amp; community vacancies</small></button>');
    panels.insertAdjacentHTML('beforeend','<div id="employment"><div class="v26-panel-head"><div><span>VERIFIED OPEN VACANCIES</span><h3>Employment Opportunities</h3></div><p>Apply directly through the employer’s official notice. The District Office does not receive applications here.</p></div></div>');
    const saved=record?.metadata?.fields||[];
    fields=[];
    for(const element of hub.querySelectorAll('*')){
      if(element.closest('.v26-notice,.v26-project,svg,script,style,select,textarea,input,.v26-note-result')||element.matches('.v26-summary-num,.v90-status-count'))continue;
      const nodes=[...element.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
      nodes.forEach((node,index)=>{
        const selector=selectorFor(element,hub),original=node.textContent.trim();
        const existing=saved.find(x=>x.selector===selector&&(x.node||0)===index);
        const panel=element.closest('.v26-panel,[id="employment"]');
        fields.push({selector,node:index,value:existing?existing.value:original,original,group:panel?tabNames[panel.id]||panel.id:element.closest('.v26-tabs')?'Tab labels':'Hub heading, summaries & status guide'});
      });
    }
    const groups=[...new Set(fields.map(f=>f.group))];
    root.innerHTML='<p class="notice">Changes appear publicly only when Published and Verified. Leave a field unchanged to retain its existing wording. Text is stored as plain text.</p><div class="formgrid"><div class="f6"><label>Find wording</label><input id="hub-word-search" placeholder="Search headings, venue, status…"></div><div class="f3"><label>Workflow</label><select id="hub-config-workflow"><option>Draft</option><option>In Review</option><option>Approved</option><option>Published</option></select></div><div class="f3"><label>Verified</label><select id="hub-config-verified"><option value="false">No</option><option value="true">Yes</option></select></div></div><h3>Public tabs</h3><p>Choose which tabs are visible and their order. Keep at least one visible.</p><div id="hub-tab-settings" class="formgrid">'+Object.entries(tabNames).map(([id,name],index)=>{
      const configured=record?.metadata?.tabs||[],tab=configured.find(t=>t.id===id);
      return '<div class="f3"><label><input type="checkbox" data-hub-visible="'+id+'" '+(tab?.visible===false?'':'checked')+'> '+esc(name)+'</label><label>Order<input type="number" min="1" max="4" data-hub-order="'+id+'" value="'+(configured.findIndex(t=>t.id===id)>=0?configured.findIndex(t=>t.id===id)+1:index+1)+'"></label></div>';
    }).join('')+'</div>'+groups.map(group=>'<details open class="hub-word-group"><summary><strong>'+esc(group)+'</strong></summary><div class="formgrid">'+fields.map((field,index)=>field.group===group?'<div class="f6 hub-word-field"><label for="hub-word-'+index+'">'+esc(field.original.slice(0,110))+'</label><textarea maxlength="4000" rows="2" id="hub-word-'+index+'" data-hub-field="'+index+'">'+esc(field.value)+'</textarea></div>':'').join('')+'</div></details>').join('')+'<div class="toolbar"><button type="button" class="btn gold" id="hub-config-save">Save Hub settings</button><button type="button" class="btn" id="hub-config-reload">Reload saved settings</button><button type="button" class="btn" id="hub-config-restore">Restore website defaults</button></div><p id="hub-config-result" role="status" aria-live="polite"></p>';
    document.getElementById('hub-config-workflow').value=record?.workflow||'Draft';
    document.getElementById('hub-config-verified').value=String(!!record?.verified);
    document.getElementById('hub-word-search').oninput=event=>{
      const value=event.target.value.toLowerCase();root.querySelectorAll('.hub-word-field').forEach(e=>e.hidden=!e.textContent.toLowerCase().includes(value)&&!e.querySelector('textarea').value.toLowerCase().includes(value));
    };
    document.getElementById('hub-config-save').onclick=save;
    document.getElementById('hub-config-reload').onclick=reload;
    document.getElementById('hub-config-restore').onclick=async()=>{
      if(!record)return result('Website defaults are already active.');
      try{for(const current of settingsRecords)await SMG.api('/api/content/'+current.id,{method:'PATCH',body:{workflow:'Archived'}});await reload();result('Website defaults restored.')}catch(e){result(e.message,true)}
    };
  }catch(e){root.textContent=e.message;}
}
function result(message,error=false){const node=document.getElementById('hub-config-result');if(node){node.textContent=message;node.style.color=error?'#9c2323':'#0b3553';}}
async function save(){
  const button=document.getElementById('hub-config-save');
  const tabs=Object.keys(tabNames).map(id=>({id,visible:root.querySelector('[data-hub-visible="'+id+'"]').checked,order:Number(root.querySelector('[data-hub-order="'+id+'"]').value)})).sort((a,b)=>a.order-b.order);
  if(!tabs.some(t=>t.visible))return result('Keep at least one public tab visible.',true);
  const workflow=document.getElementById('hub-config-workflow').value,verified=document.getElementById('hub-config-verified').value==='true';
  if(workflow==='Published'&&!verified)return result('Verify the wording before publishing.',true);
  const changed=fields.map((f,i)=>({selector:f.selector,node:f.node,value:document.getElementById('hub-word-'+i).value})).filter((f,i)=>f.value!==fields[i].original);
  const body={type:'activity_settings',section:'activity',title:'District Activity Hub settings',workflow,verified,metadata:{schemaVersion:1,fields:changed,tabs:tabs.map(({id,visible})=>({id,visible}))}};
  button.disabled=true;
  try{
    record&&!(record.workflow==='Published'&&workflow!=='Published')?await SMG.api('/api/content/'+record.id,{method:'PATCH',body}):await SMG.api('/api/content',{method:'POST',body});
    await reload();result(workflow==='Published'?'Verified Hub settings published. Refresh the public website to see them.':'Hub settings saved as '+workflow+'.');
  }catch(e){result(e.message,true)}finally{button.disabled=false;}
}
reload();
})();
