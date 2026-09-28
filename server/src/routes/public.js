'use strict';
const express=require('express');
const rateLimit=require('express-rate-limit');
const db=require('../db');
const storage=require('../storage');
const {audit}=require('../audit');
const router=express.Router();

const publicLimit=rateLimit({
  windowMs:10*60*1000,limit:40,standardHeaders:'draft-8',legacyHeaders:false,
  message:{detail:'Too many requests. Please try again shortly.'}
});
router.use(publicLimit);

const digits=s=>String(s||'').replace(/\D/g,'');
async function matchedCase(reference,contact){
  const ref=String(reference||'').trim().toUpperCase(),c=String(contact||'').trim();
  if(!ref||!c)return null;
  const q=await db.query(`SELECT * FROM cases WHERE upper(reference)=$1 AND resident_visible=true`,[ref]);
  const row=q.rows[0];if(!row)return null;
  const ok=c.includes('@')?String(row.email||'').toLowerCase()===c.toLowerCase():digits(row.phone)===digits(c);
  return ok?row:null;
}

/* Public-safe website content. Only Published + Verified + in-window records are exposed. */
router.get('/content',async(req,res,next)=>{
  try{
    const section=String(req.query.section||'').trim()||null;
    const q=await db.query(`
      SELECT pc.id,pc.type,pc.section,pc.category,pc.title,pc.summary,pc.body,pc.public_url,
             pc.public_status,pc.status_note,pc.responsible_authority,pc.event_date,pc.sort_order,
             pc.document_id,pc.is_featured,pc.metadata,pc.publish_on,pc.expire_on,pc.updated_at,
             d.original_filename,d.mime_type
      FROM public_content pc
      LEFT JOIN documents d ON d.id=pc.document_id
      WHERE pc.workflow='Published'
        AND pc.verified=true
        AND (pc.publish_on IS NULL OR pc.publish_on<=now())
        AND (pc.expire_on IS NULL OR pc.expire_on>now())
        AND ($1::text IS NULL OR pc.section=$1)
      ORDER BY pc.sort_order ASC, COALESCE(pc.publish_on,pc.created_at) DESC, pc.updated_at DESC
    `,[section]);
    res.json({content:q.rows.map(x=>({
      id:x.id,type:x.type,section:x.section,category:x.category,title:x.title,summary:x.summary,body:x.body,
      publicUrl:x.document_id?`/api/public/documents/${x.document_id}`:x.public_url,
      publicStatus:x.public_status,statusNote:x.status_note,responsibleAuthority:x.responsible_authority,
      eventDate:x.event_date,sortOrder:x.sort_order,isFeatured:x.is_featured,metadata:x.metadata||{},
      publishOn:x.publish_on,expireOn:x.expire_on,updatedAt:x.updated_at,originalFilename:x.original_filename||null
    }))});
  }catch(e){next(e)}
});

/* Deliberately public download route, restricted to a document referenced by
   currently Published + Verified content and marked Public in the records table. */
router.get('/documents/:id',async(req,res,next)=>{
  try{
    const q=await db.query(`
      SELECT d.id,d.storage_key,d.original_filename,d.mime_type
      FROM documents d
      JOIN public_content pc ON pc.document_id=d.id
      WHERE d.id=$1
        AND d.sensitivity='Public'
        AND pc.workflow='Published'
        AND pc.verified=true
        AND (pc.publish_on IS NULL OR pc.publish_on<=now())
        AND (pc.expire_on IS NULL OR pc.expire_on>now())
      LIMIT 1
    `,[req.params.id]);
    if(!q.rowCount||!q.rows[0].storage_key)return res.status(404).json({detail:'Public document not found.'});
    const r=q.rows[0],buf=await storage.readBuffer(r.storage_key);
    res.setHeader('Content-Type',r.mime_type||'application/pdf');
    res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(r.original_filename||'document.pdf')}`);
    res.setHeader('Cache-Control','public, max-age=300');
    res.send(buf);
    await audit(db,{eventType:'document.public_download',objectType:'document',objectId:req.params.id});
  }catch(e){next(e)}
});

router.post('/enquiries',async(req,res,next)=>{
  try{
    const b=req.body||{};
    const name=String(b.fullName||'').trim().slice(0,250),phone=String(b.phone||'').trim().slice(0,80),
      email=String(b.email||'').trim().toLowerCase().slice(0,250),address=String(b.address||'').trim().slice(0,1000),
      type=String(b.type||'General Enquiry').trim().slice(0,200),message=String(b.message||'').trim().slice(0,8000);
    if(!name||!phone||!address||!message)return res.status(400).json({detail:'Name, phone, address and enquiry details are required.'});
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({detail:'Please enter a valid email address.'});
    const docs=Array.isArray(b.documents)?b.documents.slice(0,20).map(d=>({name:String(d.name||'').slice(0,250),size:Number(d.size)||0,type:String(d.type||'').slice(0,120)})):[];
    const q=await db.query(`INSERT INTO cases(status,priority,resident_name,phone,email,date_of_birth,address,category,preferred_contact,enquiry_message,community_area,notification_consent,reminder_consent,submitted_document_metadata,public_status,public_update,public_next_step,public_updated_at,resident_visible) VALUES('New','Standard',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,'Received',$13,$14,now(),true) RETURNING id,reference,created_at`,[name,phone,email||null,b.dob||null,address,type,String(b.preferred||'').slice(0,80)||null,message,String(b.communityArea||'').slice(0,200)||null,!!b.notificationConsent,!!b.reminderConsent,JSON.stringify(docs),'Your enquiry has been received by the District Office and is awaiting initial review.','The office will review your enquiry and determine the appropriate follow-up.']);
    await db.query(`INSERT INTO case_activity(case_id,activity_type,description,public_visible) VALUES($1,'public_intake','Enquiry received through the public website.',false)`,[q.rows[0].id]);
    await audit(db,{eventType:'case.public_create',objectType:'case',objectId:q.rows[0].id,metadata:{reference:q.rows[0].reference,hasEmail:!!email,documentMetadataCount:docs.length}});
    res.status(201).json({reference:q.rows[0].reference,receivedAt:q.rows[0].created_at});
  }catch(e){next(e)}
});

router.post('/track',async(req,res,next)=>{
  try{
    const row=await matchedCase(req.body?.reference,req.body?.contact);
    if(!row)return res.status(404).json({detail:'We could not match those details. Check the reference and contact information and try again.'});
    res.json({case:{reference:row.reference,type:row.category||'General Enquiry',createdAt:row.created_at,preferred:row.preferred_contact||'Not specified',publicStatus:row.public_status||'Received',publicUpdate:row.public_update||'',publicNextStep:row.public_next_step||'',publicUpdatedAt:row.public_updated_at||row.created_at,residentVisible:true}});
  }catch(e){next(e)}
});

router.post('/feedback',async(req,res,next)=>{
  try{
    const b=req.body||{},reference=b.reference||b.caseReference;
    const row=await matchedCase(reference,b.contact);
    if(!row)return res.status(404).json({detail:'The case reference and contact information could not be matched.'});
    const clarity=Number(b.clarity||b.clarityRating),respect=Number(b.respect||b.respectRating),
      comment=String(b.comment||b.details||'').trim().slice(0,5000);
    if(![1,2,3,4,5].includes(clarity)||![1,2,3,4,5].includes(respect))return res.status(400).json({detail:'Please provide valid service ratings.'});
    const q=await db.query(`INSERT INTO resident_feedback(case_reference,feedback_type,theme,clarity_rating,respect_rating,details,follow_up_requested,source) VALUES($1,'Service Feedback','Resident Experience',$2,$3,$4,$5,'Public') RETURNING id,created_at`,[row.reference,clarity,respect,comment,!!b.followUpRequested]);
    await audit(db,{eventType:'feedback.public_submit',objectType:'feedback',objectId:q.rows[0].id,metadata:{caseReference:row.reference,followUpRequested:!!b.followUpRequested}});
    res.status(201).json({received:true});
  }catch(e){next(e)}
});

module.exports=router;
