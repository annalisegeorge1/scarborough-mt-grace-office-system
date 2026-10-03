'use strict';
const express=require('express');
const crypto=require('crypto');
const fs=require('fs/promises');
const path=require('path');
const db=require('../db');
const config=require('../config');
const {requirePermission}=require('../rbac');
const {audit}=require('../audit');
const router=express.Router();

const cleanText=(s='')=>String(s)
  .replace(/<[^>]*>/g,' ')
  .replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
  .replace(/&#39;/g,"'").replace(/&quot;/g,'"')
  .replace(/&ndash;|&#8211;/g,'–').replace(/&mdash;|&#8212;/g,'—')
  .replace(/\s+/g,' ').trim();

let snapshotCache=null;
async function buildSnapshot(){
  if(snapshotCache&&config.production)return snapshotCache;
  const html=await fs.readFile(path.join(config.staticRoot,'index-self-contained.html'),'utf8');
  const forms=[];
  for(const m of html.matchAll(/<article class="v16-form-card"([^>]*)>([\s\S]*?)<\/article>/g)){
    const attrs=m[1]||'',body=m[2]||'';
    const category=(attrs.match(/data-v21-category="([^"]+)"/)||[])[1]||'other';
    const pdf=(body.match(/data-v53-pdf="([^"]+)"/)||[])[1]||'';
    const openTitle=(body.match(/data-v53-title="Open ([^"]+)"/)||[])[1]||'';
    const h3=(body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)||[])[1]||'';
    const strong=(body.match(/<strong[^>]*>([\s\S]*?)<\/strong>/)||[])[1]||'';
    const title=cleanText(openTitle||h3||strong||pdf);
    if(title)forms.push({key:pdf||title,title,category,pdf});
  }
  const projects=[];
  for(const m of html.matchAll(/<article class="v26-project"([^>]*)>([\s\S]*?)<\/article>/g)){
    const attrs=m[1]||'',body=m[2]||'';
    const title=cleanText((body.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)||[])[1]||'');
    if(!title)continue;
    const code=cleanText((body.match(/class="v26-project-code"[^>]*>([\s\S]*?)<\/div>/)||[])[1]||'');
    const category=(attrs.match(/data-v26-category="([^"]+)"/)||[])[1]||'community';
    const status=(body.match(/<small>PUBLIC STATUS<\/small>\s*<b>([\s\S]*?)<\/b>/)||[])[1]
      ||(attrs.match(/data-v90-status="([^"]+)"/)||[])[1]||'';
    const role=(body.match(/<small>DISTRICT OFFICE ROLE<\/small>\s*<b>([\s\S]*?)<\/b>/)||[])[1]||'';
    const summary=(body.match(/<h4[^>]*>[\s\S]*?<\/h4>\s*<p[^>]*>([\s\S]*?)<\/p>/)||[])[1]||'';
    const note=(body.match(/class="v90-status-inline"[\s\S]*?<em>([\s\S]*?)<\/em>/)||[])[1]||'';
    projects.push({
      key:`project:${title}`,
      subtype:'project',
      title,
      category,
      code,
      status:cleanText(status),
      role:cleanText(role),
      summary:cleanText(summary),
      statusNote:cleanText(note)
    });
  }
  const notices=[];
  for(const m of html.matchAll(/<article class="v26-notice"([^>]*)>([\s\S]*?)<\/article>/g)){
    const body=m[2]||'';
    const title=cleanText((body.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)||[])[1]||'');
    if(!title)continue;
    const status=cleanText((body.match(/class="v26-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/)||[])[1]||'');
    const label=cleanText((body.match(/class="v26-notice-top"[\s\S]*?<small[^>]*>([\s\S]*?)<\/small>/)||[])[1]||'');
    const summary=cleanText((body.match(/<h4[^>]*>[\s\S]*?<\/h4>\s*<p[^>]*>([\s\S]*?)<\/p>/)||[])[1]||'');
    notices.push({
      key:`notice:${title}`,
      subtype:/town hall/i.test(label+title)?'townhall':'notice',
      title,
      category:label||'Notice',
      status,
      role:'',
      code:'',
      summary,
      statusNote:''
    });
  }
  snapshotCache={forms,activity:[...notices,...projects]};
  return snapshotCache;
}

function safeMeta(v){
  return v&&typeof v==='object'&&!Array.isArray(v)?v:{};
}
function has(obj,key){return Object.prototype.hasOwnProperty.call(obj,key)}
function nullable(v){return v===''||v===undefined?null:v}
function progressHistory(meta){
  const list=Array.isArray(safeMeta(meta).progressHistory)?safeMeta(meta).progressHistory:[];
  return list.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(-100);
}
function cleanProgressInput(body={}){
  const status=cleanText(body.status||'').slice(0,120);
  const summary=cleanText(body.summary||'').slice(0,1200);
  const note=cleanText(body.note||'').slice(0,1600);
  const rawDate=String(body.date||'').trim();
  if(!status||!summary)return {error:'Progress status and public update are required.'};
  const parsed=Date.parse(rawDate);
  if(!rawDate||!Number.isFinite(parsed))return {error:'A valid progress date is required.'};
  return {
    entry:{
      id:crypto.randomUUID(),
      status,
      summary,
      note:note||'',
      date:new Date(parsed).toISOString(),
      createdAt:new Date().toISOString()
    }
  };
}
const collectionOffices=new Set(['district','community','education','finance','food','health','infrastructure','chief','housing','tourism']);
function formAvailabilityError(x){
  if(x.type!=='form'||x.workflow!=='Published')return null;
  const m=safeMeta(x.metadata);
  if(m.delivery==='in_person')return collectionOffices.has(m.collectionOffice)&&!x.publicUrl&&!x.documentId?null:'Select a valid collection office and remove the PDF or URL for an in-person form.';
  return x.publicUrl||x.documentId?null:'Published forms require a public URL, uploaded PDF, or a verified in-person collection office.';
}
function employmentError(x){
  if(x.type!=='activity'||safeMeta(x.metadata).subtype!=='employment'||x.workflow!=='Published')return null;
  const m=safeMeta(x.metadata),deadline=String(m.deadline||'');
  if(!m.employer||!['THA','Community'].includes(m.employerType)||!/^\d{4}-\d{2}-\d{2}$/.test(deadline))return 'Employment notices require an employer, source and valid deadline.';
  try{if(new URL(x.publicUrl).protocol!=='https:')return 'An HTTPS official vacancy link is required.';}catch{return 'An HTTPS official vacancy link is required.';}
  const expires=Date.parse(x.expireOn);
  if(!Number.isFinite(expires)||expires<=Date.now()||expires<Date.parse(`${deadline}T00:00:00-04:00`))return 'Employment notices must expire after the application deadline.';
  return null;
}


const workflows=new Set(['Draft','In Review','Approved','Published','Archived']);
const routeBySection={
  forms:'/forms/#service-forms',
  activity:'/updates/#activity-hub',
  community:'/community/',
  updates:'/updates/',
  services:'/services/',
  programmes:'/services/#resident-programmes',
  gallery:'/community/#gallery',
  office:'/office/',
  contact:'/contact/'
};
function dbValue(row,snake,camel){
  if(has(row,snake))return row[snake];
  return row[camel||snake];
}
function publicPayload(row){
  return {
    id:dbValue(row,'id'),
    type:dbValue(row,'type'),
    section:dbValue(row,'section'),
    category:dbValue(row,'category'),
    title:dbValue(row,'title'),
    summary:dbValue(row,'summary'),
    body:dbValue(row,'body'),
    publicUrl:dbValue(row,'public_url','publicUrl'),
    publicStatus:dbValue(row,'public_status','publicStatus'),
    statusNote:dbValue(row,'status_note','statusNote'),
    responsibleAuthority:dbValue(row,'responsible_authority','responsibleAuthority'),
    eventDate:dbValue(row,'event_date','eventDate'),
    sortOrder:dbValue(row,'sort_order','sortOrder')||0,
    documentId:dbValue(row,'document_id','documentId'),
    isFeatured:!!dbValue(row,'is_featured','isFeatured'),
    metadata:safeMeta(dbValue(row,'metadata')),
    publishOn:dbValue(row,'publish_on','publishOn'),
    expireOn:dbValue(row,'expire_on','expireOn'),
    updatedAt:dbValue(row,'updated_at','updatedAt')
  };
}
function internalPayload(row){
  return {
    internalNotes:dbValue(row,'internal_notes','internalNotes')||'',
    sourceReference:dbValue(row,'source_reference','sourceReference')||'',
    verificationNote:dbValue(row,'verification_note','verificationNote')||''
  };
}
function residentRoute(row){
  const section=String(dbValue(row,'section')||'').toLowerCase();
  if(routeBySection[section])return routeBySection[section];
  const type=String(dbValue(row,'type')||'').toLowerCase();
  if(type==='form'||type==='form_override')return '/forms/#service-forms';
  if(type==='activity'||type==='activity_override'||type==='notice'||type==='newsletter'||type==='important')return '/updates/';
  if(type==='gallery')return '/community/#gallery';
  if(type==='programme'||type==='service'||type==='resource'||type==='faq')return '/services/';
  return '/';
}
function piiHints(row){
  const p=publicPayload(row);
  const text=[p.title,p.summary,p.body,p.statusNote].filter(Boolean).join(' ');
  const hints=[];
  if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text))hints.push('Public copy contains an email address. Confirm it is an approved public contact.');
  if(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(text))hints.push('Public copy contains a phone number. Confirm it is an approved public contact.');
  if(/\b\d{10,14}\b/.test(text))hints.push('Public copy contains a long numeric identifier. Confirm it is not resident-identifying information.');
  return hints;
}
function publishValidation(row){
  const p=publicPayload(row),internal=internalPayload(row),checks=[];
  const push=(key,label,ok,severity='warning',detail='')=>checks.push({key,label,ok:!!ok,severity,detail});
  push('title','Public title',!!cleanText(p.title),'blocker','A resident-facing title is required.');
  push('summary','Resident-facing summary',!!cleanText(p.summary),p.type==='form'?'warning':'warning','A short public summary makes the item understandable before opening details.');
  push('source','Source / reference',!!cleanText(internal.sourceReference),'warning','Record where the public information was checked.');
  push('verified','Factual verification',!!dbValue(row,'verified'),'blocker','Publishing requires factual/source verification.');
  if(p.type==='activity'||p.type==='activity_override'){
    push('status','Public status',!!cleanText(p.publicStatus),'warning','Activity items should state a public status.');
    push('date','Current/update date',!!p.eventDate||!!p.updatedAt,'warning','Show residents when the information was current.');
  }
  const docId=p.documentId,docSensitivity=dbValue(row,'document_sensitivity'),docReview=dbValue(row,'document_review_status');
  if(docId){
    push('document-public','Linked document is Public',docSensitivity==='Public','blocker','Private/Internal documents cannot be exposed publicly.');
    push('document-approved','Linked document is approved',docReview==='Approved','blocker','Linked public documents must complete records review.');
  }
  const formError=formAvailabilityError({
    type:p.type,workflow:'Published',publicUrl:p.publicUrl,documentId:p.documentId,metadata:p.metadata
  });
  if(formError)push('form-availability','Form availability',false,'blocker',formError);
  const vacancyError=employmentError({
    type:p.type,workflow:'Published',publicUrl:p.publicUrl,expireOn:p.expireOn,metadata:p.metadata
  });
  if(vacancyError)push('employment','Employment notice requirements',false,'blocker',vacancyError);
  for(const hint of piiHints(row))checks.push({key:'privacy-'+checks.length,label:'Privacy review',ok:false,severity:'warning',detail:hint});
  return {
    ready:checks.every(x=>x.severity!=='blocker'||x.ok),
    blockers:checks.filter(x=>x.severity==='blocker'&&!x.ok),
    warnings:checks.filter(x=>x.severity==='warning'&&!x.ok),
    checks
  };
}
async function writeRevision(client,row,action,actorUserId){
  await client.query(`
    INSERT INTO public_content_revisions(
      content_id,version,action,workflow,verified,public_payload,internal_payload,actor_user_id
    ) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)
    ON CONFLICT (content_id,version) DO NOTHING
  `,[
    row.id,row.version,action,row.workflow,!!row.verified,
    JSON.stringify(publicPayload(row)),JSON.stringify(internalPayload(row)),actorUserId
  ]);
}
async function contentWithDocument(client,id){
  const q=await client.query(`
    SELECT pc.*,
           d.record_reference AS document_reference,
           d.original_filename,
           d.mime_type AS document_mime_type,
           d.review_status AS document_review_status,
           d.sensitivity AS document_sensitivity
    FROM public_content pc
    LEFT JOIN documents d ON d.id=pc.document_id
    WHERE pc.id=$1
  `,[id]);
  return q.rows[0]||null;
}
function workflowTransition(current,action){
  const map={
    'submit-review':{from:['Draft'],to:'In Review'},
    'return-draft':{from:['In Review','Approved'],to:'Draft'},
    'approve':{from:['In Review'],to:'Approved'},
    'publish':{from:['Approved'],to:'Published'},
    'archive':{from:['Draft','In Review','Approved','Published'],to:'Archived'},
    'restore':{from:['Archived'],to:'Draft'}
  };
  const rule=map[action];
  if(!rule)return {error:'Unknown publishing workflow action.'};
  if(!rule.from.includes(current))return {error:`Cannot ${action.replace('-',' ')} content from ${current}.`};
  return rule;
}

router.get('/snapshot',requirePermission('content.write'),async(req,res,next)=>{
  try{res.json(await buildSnapshot())}catch(e){next(e)}
});

router.get('/',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const q=await db.query(`
      SELECT pc.*,
             d.record_reference AS document_reference,
             d.original_filename,
             d.mime_type AS document_mime_type,
             d.review_status AS document_review_status,
             d.sensitivity AS document_sensitivity
      FROM public_content pc
      LEFT JOIN documents d ON d.id=pc.document_id
      ORDER BY pc.updated_at DESC
      LIMIT 1000
    `);
    res.json({content:q.rows});
  }catch(e){next(e)}
});

router.post('/',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const b=req.body||{};
    if(!b.type||!b.title)return res.status(400).json({detail:'Type and title are required.'});
    const workflow=workflows.has(b.workflow)?b.workflow:'Draft',verified=!!b.verified;
    if(workflow==='Published'&&!verified)return res.status(400).json({detail:'Content must be verified before it can be published.'});
    const formError=formAvailabilityError({...b,workflow});if(formError)return res.status(400).json({detail:formError});
    const vacancyError=employmentError({...b,workflow});if(vacancyError)return res.status(400).json({detail:vacancyError});
    const row=await db.tx(async client=>{
      const q=await client.query(`
        INSERT INTO public_content(
          type,section,category,title,summary,body,public_url,workflow,verified,
          publish_on,expire_on,public_status,status_note,responsible_authority,event_date,
          sort_order,document_id,is_featured,metadata,created_by,approved_by,
          internal_notes,source_reference,verification_note,reviewed_by,reviewed_at,
          verified_by,verified_at,published_by,published_at,archived_by,archived_at,version
        ) VALUES(
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20,$21,
          $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,1
        ) RETURNING *
      `,[
        b.type,b.section||null,b.category||null,b.title,b.summary||null,b.body||null,b.publicUrl||null,
        workflow,verified,nullable(b.publishOn),nullable(b.expireOn),b.publicStatus||null,b.statusNote||null,
        b.responsibleAuthority||null,nullable(b.eventDate),Number(b.sortOrder)||0,b.documentId||null,
        !!b.isFeatured,JSON.stringify(safeMeta(b.metadata)),req.user.id,
        ['Approved','Published'].includes(workflow)?req.user.id:null,
        b.internalNotes||null,b.sourceReference||null,b.verificationNote||null,
        workflow==='In Review'?req.user.id:null,workflow==='In Review'?new Date():null,
        verified?req.user.id:null,verified?new Date():null,
        workflow==='Published'?req.user.id:null,workflow==='Published'?new Date():null,
        workflow==='Archived'?req.user.id:null,workflow==='Archived'?new Date():null
      ]);
      await writeRevision(client,q.rows[0],'create',req.user.id);
      return q.rows[0];
    });
    await audit(db,{actorUserId:req.user.id,eventType:'content.create',objectType:'public_content',objectId:row.id,metadata:{workflow:row.workflow,type:row.type,section:row.section,version:row.version}});
    res.status(201).json({content:row});
  }catch(e){next(e)}
});

router.patch('/:id',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const b=req.body||{};
    const row=await db.tx(async client=>{
      const cur=await contentWithDocument(client,req.params.id);
      if(!cur){const err=new Error('Content record not found.');err.statusCode=404;throw err}
      const next={
        type:has(b,'type')?b.type:cur.type,
        section:has(b,'section')?nullable(b.section):cur.section,
        category:has(b,'category')?nullable(b.category):cur.category,
        title:has(b,'title')?b.title:cur.title,
        summary:has(b,'summary')?nullable(b.summary):cur.summary,
        body:has(b,'body')?nullable(b.body):cur.body,
        publicUrl:has(b,'publicUrl')?nullable(b.publicUrl):cur.public_url,
        workflow:has(b,'workflow')&&workflows.has(b.workflow)?b.workflow:cur.workflow,
        verified:has(b,'verified')?!!b.verified:cur.verified,
        publishOn:has(b,'publishOn')?nullable(b.publishOn):cur.publish_on,
        expireOn:has(b,'expireOn')?nullable(b.expireOn):cur.expire_on,
        publicStatus:has(b,'publicStatus')?nullable(b.publicStatus):cur.public_status,
        statusNote:has(b,'statusNote')?nullable(b.statusNote):cur.status_note,
        responsibleAuthority:has(b,'responsibleAuthority')?nullable(b.responsibleAuthority):cur.responsible_authority,
        eventDate:has(b,'eventDate')?nullable(b.eventDate):cur.event_date,
        sortOrder:has(b,'sortOrder')?(Number(b.sortOrder)||0):cur.sort_order,
        documentId:has(b,'documentId')?nullable(b.documentId):cur.document_id,
        isFeatured:has(b,'isFeatured')?!!b.isFeatured:cur.is_featured,
        metadata:has(b,'metadata')?safeMeta(b.metadata):safeMeta(cur.metadata),
        internalNotes:has(b,'internalNotes')?nullable(b.internalNotes):cur.internal_notes,
        sourceReference:has(b,'sourceReference')?nullable(b.sourceReference):cur.source_reference,
        verificationNote:has(b,'verificationNote')?nullable(b.verificationNote):cur.verification_note
      };
      if(!next.type||!next.title){const err=new Error('Type and title are required.');err.statusCode=400;throw err}
      if(next.workflow==='Published'&&!next.verified){const err=new Error('Published content must be verified.');err.statusCode=400;throw err}
      const formError=formAvailabilityError(next);if(formError){const err=new Error(formError);err.statusCode=400;throw err}
      const vacancyError=employmentError(next);if(vacancyError){const err=new Error(vacancyError);err.statusCode=400;throw err}
      const q=await client.query(`
        UPDATE public_content SET
          type=$2,section=$3,category=$4,title=$5,summary=$6,body=$7,public_url=$8,
          workflow=$9,verified=$10,publish_on=$11,expire_on=$12,public_status=$13,status_note=$14,
          responsible_authority=$15,event_date=$16,sort_order=$17,document_id=$18,is_featured=$19,
          metadata=$20::jsonb,internal_notes=$21,source_reference=$22,verification_note=$23,
          reviewed_by=CASE WHEN $9='In Review' AND workflow IS DISTINCT FROM 'In Review' THEN $24 ELSE reviewed_by END,
          reviewed_at=CASE WHEN $9='In Review' AND workflow IS DISTINCT FROM 'In Review' THEN now() ELSE reviewed_at END,
          approved_by=CASE WHEN $9 IN ('Approved','Published') AND workflow IS DISTINCT FROM $9 THEN $24 ELSE approved_by END,
          verified_by=CASE WHEN $10=true AND verified=false THEN $24 WHEN $10=false THEN NULL ELSE verified_by END,
          verified_at=CASE WHEN $10=true AND verified=false THEN now() WHEN $10=false THEN NULL ELSE verified_at END,
          published_by=CASE WHEN $9='Published' AND workflow IS DISTINCT FROM 'Published' THEN $24 ELSE published_by END,
          published_at=CASE WHEN $9='Published' AND workflow IS DISTINCT FROM 'Published' THEN now() ELSE published_at END,
          archived_by=CASE WHEN $9='Archived' AND workflow IS DISTINCT FROM 'Archived' THEN $24 ELSE archived_by END,
          archived_at=CASE WHEN $9='Archived' AND workflow IS DISTINCT FROM 'Archived' THEN now() WHEN $9<>'Archived' THEN NULL ELSE archived_at END,
          version=version+1,updated_at=now()
        WHERE id=$1 RETURNING *
      `,[
        req.params.id,next.type,next.section,next.category,next.title,next.summary,next.body,next.publicUrl,
        next.workflow,next.verified,next.publishOn,next.expireOn,next.publicStatus,next.statusNote,
        next.responsibleAuthority,next.eventDate,next.sortOrder,next.documentId,next.isFeatured,
        JSON.stringify(next.metadata),next.internalNotes,next.sourceReference,next.verificationNote,req.user.id
      ]);
      await writeRevision(client,q.rows[0],'update',req.user.id);
      return q.rows[0];
    });
    await audit(db,{actorUserId:req.user.id,eventType:'content.update',objectType:'public_content',objectId:req.params.id,metadata:{workflow:row.workflow,type:row.type,section:row.section,version:row.version}});
    res.json({content:row});
  }catch(e){
    if(e.statusCode)return res.status(e.statusCode).json({detail:e.message});
    next(e);
  }
});

router.get('/:id/preview',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const row=await contentWithDocument(db,req.params.id);
    if(!row)return res.status(404).json({detail:'Content record not found.'});
    res.json({
      content:publicPayload(row),
      workflow:{
        state:row.workflow,
        verified:!!row.verified,
        version:row.version,
        reviewedAt:row.reviewed_at,
        verifiedAt:row.verified_at,
        publishedAt:row.published_at,
        archivedAt:row.archived_at
      },
      internal:internalPayload(row),
      readiness:publishValidation(row),
      residentRoute:residentRoute(row)
    });
  }catch(e){next(e)}
});

router.get('/:id/revisions',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const q=await db.query(`
      SELECT r.id,r.version,r.action,r.workflow,r.verified,r.public_payload,r.internal_payload,r.created_at,
             u.display_name AS actor_name,u.email AS actor_email
      FROM public_content_revisions r
      LEFT JOIN users u ON u.id=r.actor_user_id
      WHERE r.content_id=$1
      ORDER BY r.version DESC
      LIMIT 100
    `,[req.params.id]);
    res.json({revisions:q.rows});
  }catch(e){next(e)}
});

router.post('/:id/workflow',requirePermission('content.publish'),async(req,res,next)=>{
  try{
    const action=String(req.body?.action||'').trim().toLowerCase();
    const note=cleanText(req.body?.note||'').slice(0,1600);
    const sourceReference=cleanText(req.body?.sourceReference||'').slice(0,1200);
    const row=await db.tx(async client=>{
      const cur=await contentWithDocument(client,req.params.id);
      if(!cur){const err=new Error('Content record not found.');err.statusCode=404;throw err}
      if(action==='verify'){
        if(cur.workflow==='Archived'){const err=new Error('Restore archived content before verification.');err.statusCode=400;throw err}
        const q=await client.query(`
          UPDATE public_content SET
            verified=true,verified_by=$2,verified_at=now(),
            verification_note=COALESCE(NULLIF($3,''),verification_note),
            source_reference=COALESCE(NULLIF($4,''),source_reference),
            version=version+1,updated_at=now()
          WHERE id=$1 RETURNING *
        `,[req.params.id,req.user.id,note,sourceReference]);
        await writeRevision(client,q.rows[0],'verify',req.user.id);
        return q.rows[0];
      }
      if(action==='unverify'){
        if(cur.workflow==='Published'){const err=new Error('Published content must leave Published before verification can be removed.');err.statusCode=400;throw err}
        const q=await client.query(`
          UPDATE public_content SET verified=false,verified_by=NULL,verified_at=NULL,
            verification_note=COALESCE(NULLIF($3,''),verification_note),
            version=version+1,updated_at=now()
          WHERE id=$1 RETURNING *
        `,[req.params.id,req.user.id,note]);
        await writeRevision(client,q.rows[0],'unverify',req.user.id);
        return q.rows[0];
      }
      const rule=workflowTransition(cur.workflow,action);
      if(rule.error){const err=new Error(rule.error);err.statusCode=400;throw err}
      if(action==='publish'){
        const candidate={...cur,workflow:'Published'};
        const ready=publishValidation(candidate);
        if(!ready.ready){
          const err=new Error('Publication blocked: '+ready.blockers.map(x=>x.detail||x.label).join(' '));
          err.statusCode=400;throw err;
        }
      }
      const q=await client.query(`
        UPDATE public_content SET
          workflow=$2,
          reviewed_by=CASE WHEN $3='submit-review' THEN $4 ELSE reviewed_by END,
          reviewed_at=CASE WHEN $3='submit-review' THEN now() ELSE reviewed_at END,
          approved_by=CASE WHEN $3='approve' THEN $4 ELSE approved_by END,
          published_by=CASE WHEN $3='publish' THEN $4 ELSE published_by END,
          published_at=CASE WHEN $3='publish' THEN now() ELSE published_at END,
          publish_on=CASE WHEN $3='publish' THEN COALESCE(publish_on,now()) ELSE publish_on END,
          archived_by=CASE WHEN $3='archive' THEN $4 WHEN $3='restore' THEN NULL ELSE archived_by END,
          archived_at=CASE WHEN $3='archive' THEN now() WHEN $3='restore' THEN NULL ELSE archived_at END,
          verified=CASE WHEN $3='restore' THEN false ELSE verified END,
          verified_by=CASE WHEN $3='restore' THEN NULL ELSE verified_by END,
          verified_at=CASE WHEN $3='restore' THEN NULL ELSE verified_at END,
          version=version+1,updated_at=now()
        WHERE id=$1 RETURNING *
      `,[req.params.id,rule.to,action,req.user.id]);
      await writeRevision(client,q.rows[0],action,req.user.id);
      return q.rows[0];
    });
    await audit(db,{
      actorUserId:req.user.id,eventType:'content.workflow',objectType:'public_content',objectId:req.params.id,
      metadata:{action,workflow:row.workflow,verified:row.verified,version:row.version}
    });
    res.json({content:row,readiness:publishValidation(row),residentRoute:residentRoute(row)});
  }catch(e){
    if(e.statusCode)return res.status(e.statusCode).json({detail:e.message});
    next(e);
  }
});

router.post('/:id/progress',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const cur=(await db.query('SELECT * FROM public_content WHERE id=$1',[req.params.id])).rows[0];
    if(!cur)return res.status(404).json({detail:'Content record not found.'});
    if(!['activity','activity_override'].includes(cur.type))return res.status(400).json({detail:'Progress threads are available only for Activity Hub items.'});
    const parsed=cleanProgressInput(req.body||{});
    if(parsed.error)return res.status(400).json({detail:parsed.error});
    const setCurrentStatus=req.body?.setCurrentStatus!==false;
    const metadata={...safeMeta(cur.metadata),progressHistory:[...progressHistory(cur.metadata).slice(-99),parsed.entry]};
    const q=await db.query('UPDATE public_content SET metadata=$2::jsonb, public_status=CASE WHEN $3 THEN $4 ELSE public_status END, updated_at=now() WHERE id=$1 RETURNING *',[req.params.id,JSON.stringify(metadata),setCurrentStatus,parsed.entry.status]);
    await audit(db,{actorUserId:req.user.id,eventType:'content.progress_add',objectType:'public_content',objectId:req.params.id,metadata:{progressId:parsed.entry.id,status:parsed.entry.status,date:parsed.entry.date,setCurrentStatus}});
    res.status(201).json({content:q.rows[0],progress:parsed.entry});
  }catch(e){next(e)}
});

router.delete('/:id/progress/:progressId',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const cur=(await db.query('SELECT * FROM public_content WHERE id=$1',[req.params.id])).rows[0];
    if(!cur)return res.status(404).json({detail:'Content record not found.'});
    if(!['activity','activity_override'].includes(cur.type))return res.status(400).json({detail:'Progress threads are available only for Activity Hub items.'});
    const list=progressHistory(cur.metadata),entry=list.find(x=>String(x.id)===String(req.params.progressId));
    if(!entry)return res.status(404).json({detail:'Progress entry not found.'});
    const metadata={...safeMeta(cur.metadata),progressHistory:list.filter(x=>String(x.id)!==String(req.params.progressId))};
    const q=await db.query('UPDATE public_content SET metadata=$2::jsonb, updated_at=now() WHERE id=$1 RETURNING *',[req.params.id,JSON.stringify(metadata)]);
    await audit(db,{actorUserId:req.user.id,eventType:'content.progress_remove',objectType:'public_content',objectId:req.params.id,metadata:{progressId:entry.id,status:entry.status,date:entry.date}});
    res.json({content:q.rows[0],removed:true});
  }catch(e){next(e)}
});

module.exports=router;
