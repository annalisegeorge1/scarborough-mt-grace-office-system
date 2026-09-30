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
function describeField(element){
  const tag=element.tagName.toLowerCase();
  const part=tag==='strong'||tag==='b'?'Card title':tag==='small'?'Short description':tag==='span'?'Label':/^h[1-6]$/.test(tag)?'Heading':tag==='p'?'Description':tag==='label'?'Form field label':tag==='button'?'Button text':'Explanation';
  const status=element.closest('.v90-status-overview article');
  if(status){
    const names={confirmed:'Confirmed information',planned:'Planned',development:'In development',followup:'Follow-up required'};
    const name=Object.keys(names).find(k=>status.classList.contains(k));
    return {group:'Status cards — the four cards below the Hub totals',label:(names[name]||'Status card')+' — '+(tag==='small'?'Status label':tag==='strong'?'Card title':'Explanation below the title'),help:'Changes this wording on the '+(names[name]||'status')+' card. The number is calculated automatically.'};
  }
  const summary=element.closest('.v26-summary article');
  if(summary){const title=summary.querySelector('strong')?.textContent.trim()||'Hub total';return {group:'Hub totals — notices, Town Hall, areas and tracked matters',label:title+' — '+(tag==='strong'?'Title under the number':'Description under the title'),help:'Changes the wording below this total. It does not change the automatic count.'};}
  const tab=element.closest('[data-v26-tab]');
  if(tab)return {group:'Navigation tabs — the four buttons across the Hub',label:(tabNames[tab.dataset.v26Tab]||'Tab')+' — '+(tag==='b'?'Tab name':tag==='small'?'Description under the tab name':'Number shown on the tab'),help:'Changes text on this navigation button. It does not change the content items inside the tab.'};
  if(element.closest('.v90-status-explainer'))return {group:'Status guide — “How to read these statuses”',label:tag==='strong'?'Status guide heading':'Status guide explanation',help:'Changes the public explanation of what Confirmed, Planned, In Development and Follow-up Required mean.'};
  const detail=element.closest('.v26-townhall-status>div');
  if(detail){const name=detail.querySelector('small')?.textContent.trim()||'Town Hall detail';return {group:'Town Hall — next meeting details',label:name+' — '+(tag==='small'?'Field label':'Value shown to residents'),help:'Use the confirmed date or venue, or keep “To be announced” until verified.'};}
  if(element.closest('.v26-townhall-feature'))return {group:'Town Hall — programme introduction',label:element.matches('.v26-big-line')?'Meeting frequency wording':part,help:'Changes the fixed introduction in the Town Hall tab. Individual meeting announcements use the Activity Hub item editor.'};
  if(element.closest('.v26-townhall-tool'))return {group:'Town Hall — resident discussion-note tool',label:part+(element.getAttribute('for')?' — '+element.getAttribute('for').replace('v26-','').replaceAll('-',' '):''),help:'Changes the instructions or labels in the tool residents use to prepare their discussion note.'};
  if(element.closest('.v26-townhall-purpose'))return {group:'Town Hall — meeting purposes',label:(element.closest('article')?.querySelector('strong')?.textContent.trim()||'Purpose')+' — '+part,help:'Changes this meeting-purpose card.'};
  const panel=element.closest('.v26-panel,[id="employment"]');
  if(panel)return {group:(tabNames[panel.id]||panel.id)+' — section introduction',label:part,help:'Changes the heading or introduction above the items in this tab.'};
  if(element.closest('.v26-hub-footer'))return {group:'Hub footer — contact and follow-up prompts',label:part,help:'Changes the contact prompt at the bottom of the Hub.'};
  return {group:'Hub introduction — main heading and opening text',label:part,help:'Changes fixed wording near the top of the District Activity Hub.'};
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
        const description=describeField(element);
        fields.push({selector,node:index,value:existing?existing.value:original,original,...description});
      });
    }
    const groups=[...new Set(fields.map(f=>f.group))];
    root.innerHTML='<p class="notice">Each field below names the public section it changes. Draft saves stay private; choose Published and confirm verification to show the changes on the website. Counts are automatic. Edit individual notices, projects and vacancies in the item editor below.</p><div class="formgrid"><div class="f6"><label>Find wording</label><input id="hub-word-search" placeholder="Search headings, venue, status…"></div><div class="f3"><label>Save as</label><select id="hub-config-workflow"><option>Draft</option><option>In Review</option><option>Approved</option><option>Published</option></select></div><div class="f3"><label>Have you checked this wording?</label><select id="hub-config-verified"><option value="false">Not checked yet</option><option value="true">Yes — checked and accurate</option></select></div></div><h3>Show and arrange the Hub tabs</h3><p>A checked box shows that tab on the public website. Order 1 appears first; order 4 appears last. Keep at least one tab visible.</p><div id="hub-tab-settings" class="formgrid">'+Object.entries(tabNames).map(([id,name],index)=>{
      const configured=record?.metadata?.tabs||[],tab=configured.find(t=>t.id===id);
      return '<div class="f3"><label><input type="checkbox" data-hub-visible="'+id+'" '+(tab?.visible===false?'':'checked')+'> Show '+esc(name)+'</label><label>Position on the website<input type="number" min="1" max="4" data-hub-order="'+id+'" value="'+(configured.findIndex(t=>t.id===id)>=0?configured.findIndex(t=>t.id===id)+1:index+1)+'"></label></div>';
    }).join('')+'</div>'+groups.map(group=>'<details open class="hub-word-group"><summary><strong>'+esc(group)+'</strong></summary><div class="formgrid">'+fields.map((field,index)=>field.group===group?'<div class="f6 hub-word-field"><label for="hub-word-'+index+'">'+esc(field.label)+'</label><p class="small">'+esc(field.help)+'</p><p class="small"><strong>Website default:</strong> '+esc(field.original)+'</p><textarea maxlength="4000" rows="2" id="hub-word-'+index+'" data-hub-field="'+index+'">'+esc(field.value)+'</textarea></div>':'').join('')+'</div></details>').join('')+'<div class="toolbar"><button type="button" class="btn gold" id="hub-config-save">Save these Hub changes</button><button type="button" class="btn" id="hub-config-reload">Discard unsaved edits and reload</button><button type="button" class="btn" id="hub-config-restore">Restore all original Hub wording and tabs</button></div><p id="hub-config-result" role="status" aria-live="polite"></p>';
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
