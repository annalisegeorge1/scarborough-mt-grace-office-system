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
    const workflow=b.workflow||'Draft',verified=!!b.verified;
    if(workflow==='Published'&&!verified)return res.status(400).json({detail:'Content must be verified before it can be published.'});
    const formError=formAvailabilityError({...b,workflow});if(formError)return res.status(400).json({detail:formError});
    const vacancyError=employmentError({...b,workflow});if(vacancyError)return res.status(400).json({detail:vacancyError});
    const q=await db.query(`
      INSERT INTO public_content(
        type,section,category,title,summary,body,public_url,workflow,verified,
        publish_on,expire_on,public_status,status_note,responsible_authority,event_date,
        sort_order,document_id,is_featured,metadata,created_by,approved_by
      ) VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20,$21
      ) RETURNING *
    `,[
      b.type,b.section||null,b.category||null,b.title,b.summary||null,b.body||null,b.publicUrl||null,
      workflow,verified,nullable(b.publishOn),nullable(b.expireOn),b.publicStatus||null,b.statusNote||null,
      b.responsibleAuthority||null,nullable(b.eventDate),Number(b.sortOrder)||0,b.documentId||null,
      !!b.isFeatured,JSON.stringify(safeMeta(b.metadata)),req.user.id,
      ['Approved','Published'].includes(workflow)?req.user.id:null
    ]);
    await audit(db,{actorUserId:req.user.id,eventType:'content.create',objectType:'public_content',objectId:q.rows[0].id,metadata:{workflow:q.rows[0].workflow,type:q.rows[0].type,section:q.rows[0].section}});
    res.status(201).json({content:q.rows[0]});
  }catch(e){next(e)}
});

router.patch('/:id',requirePermission('content.write'),async(req,res,next)=>{
  try{
    const b=req.body||{};
    const cur=(await db.query('SELECT * FROM public_content WHERE id=$1',[req.params.id])).rows[0];
    if(!cur)return res.status(404).json({detail:'Content record not found.'});
    const next={
      type:has(b,'type')?b.type:cur.type,
      section:has(b,'section')?nullable(b.section):cur.section,
      category:has(b,'category')?nullable(b.category):cur.category,
      title:has(b,'title')?b.title:cur.title,
      summary:has(b,'summary')?nullable(b.summary):cur.summary,
      body:has(b,'body')?nullable(b.body):cur.body,
      publicUrl:has(b,'publicUrl')?nullable(b.publicUrl):cur.public_url,
      workflow:has(b,'workflow')?b.workflow:cur.workflow,
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
      metadata:has(b,'metadata')?safeMeta(b.metadata):safeMeta(cur.metadata)
    };
    if(!next.type||!next.title)return res.status(400).json({detail:'Type and title are required.'});
    if(next.workflow==='Published'&&!next.verified)return res.status(400).json({detail:'Published content must be verified.'});
    const formError=formAvailabilityError(next);if(formError)return res.status(400).json({detail:formError});
    const vacancyError=employmentError(next);if(vacancyError)return res.status(400).json({detail:vacancyError});
    const q=await db.query(`
      UPDATE public_content SET
        type=$2,section=$3,category=$4,title=$5,summary=$6,body=$7,public_url=$8,
        workflow=$9,verified=$10,publish_on=$11,expire_on=$12,public_status=$13,status_note=$14,
        responsible_authority=$15,event_date=$16,sort_order=$17,document_id=$18,is_featured=$19,
        metadata=$20::jsonb,
        approved_by=CASE WHEN $9 IN ('Approved','Published') THEN $21 ELSE approved_by END,
        updated_at=now()
      WHERE id=$1 RETURNING *
    `,[
      req.params.id,next.type,next.section,next.category,next.title,next.summary,next.body,next.publicUrl,
      next.workflow,next.verified,next.publishOn,next.expireOn,next.publicStatus,next.statusNote,
      next.responsibleAuthority,next.eventDate,next.sortOrder,next.documentId,next.isFeatured,
      JSON.stringify(next.metadata),req.user.id
    ]);
    await audit(db,{actorUserId:req.user.id,eventType:'content.update',objectType:'public_content',objectId:req.params.id,metadata:{workflow:q.rows[0].workflow,type:q.rows[0].type,section:q.rows[0].section}});
    res.json({content:q.rows[0]});
  }catch(e){next(e)}
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
