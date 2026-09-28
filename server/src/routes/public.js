'use strict';
const express=require('express');
const rateLimit=require('express-rate-limit');
const multer=require('multer');
const db=require('../db');
const storage=require('../storage');
const config=require('../config');
const virusScan=require('../virus-scan');
const {audit}=require('../audit');
const router=express.Router();

const publicLimit=rateLimit({
  windowMs:10*60*1000,limit:40,standardHeaders:'draft-8',legacyHeaders:false,
  message:{detail:'Too many requests. Please try again shortly.'}
});
router.use(publicLimit);
const publicUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:config.maxUploadMb*1024*1024,files:3,fields:1,fieldSize:12000}}).array('files',3);
function uploadsReady(){return config.uploadsEnabled&&config.storageDriver==='s3'&&storage.readiness()&&virusScan.configured();}
function uploadType(file){const b=file.buffer,m=file.mimetype;
  if(m==='application/pdf'&&b.subarray(0,5).toString()==='%PDF-')return true;
  if(m==='image/png'&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return true;
  if(m==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255)return true;
  return false;
}
router.get('/upload-status',(req,res)=>res.json({enabled:uploadsReady(),maxFiles:3,maxFileMb:config.maxUploadMb,types:['PDF','JPG','PNG']}));

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
    const docs=[];
    const q=await db.query(`INSERT INTO cases(status,priority,resident_name,phone,email,date_of_birth,address,category,preferred_contact,enquiry_message,community_area,notification_consent,reminder_consent,submitted_document_metadata,public_status,public_update,public_next_step,public_updated_at,resident_visible) VALUES('New','Standard',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,'Received',$13,$14,now(),true) RETURNING id,reference,created_at`,[name,phone,email||null,b.dob||null,address,type,String(b.preferred||'').slice(0,80)||null,message,String(b.communityArea||'').slice(0,200)||null,!!b.notificationConsent,!!b.reminderConsent,JSON.stringify(docs),'Your enquiry has been received by the District Office and is awaiting initial review.','The office will review your enquiry and determine the appropriate follow-up.']);
    await db.query(`INSERT INTO case_activity(case_id,activity_type,description,public_visible) VALUES($1,'public_intake','Enquiry received through the public website.',false)`,[q.rows[0].id]);
    await audit(db,{eventType:'case.public_create',objectType:'case',objectId:q.rows[0].id,metadata:{reference:q.rows[0].reference,hasEmail:!!email,documentMetadataCount:docs.length}});
    res.status(201).json({reference:q.rows[0].reference,receivedAt:q.rows[0].created_at});
  }catch(e){next(e)}
});

router.post('/enquiries-with-documents',(req,res,next)=>{
  if(!uploadsReady())return res.status(503).json({detail:'Secure document upload is not configured. Please submit without files.'});
  publicUpload(req,res,err=>err?res.status(400).json({detail:err.code==='LIMIT_FILE_SIZE'?`Each file must be no larger than ${config.maxUploadMb} MB.`:'Upload limit exceeded. Select at most three files.'}):next());
},async(req,res,next)=>{
  const saved=[];
  try{
    const b=JSON.parse(req.body.enquiry||'{}'),files=req.files||[];
    const name=String(b.fullName||'').trim().slice(0,250),phone=String(b.phone||'').trim().slice(0,80),email=String(b.email||'').trim().toLowerCase().slice(0,250),address=String(b.address||'').trim().slice(0,1000),type=String(b.type||'General Enquiry').trim().slice(0,200),message=String(b.message||'').trim().slice(0,8000);
    if(!name||!phone||!address||!message||!files.length)return res.status(400).json({detail:'Complete the required enquiry fields and select at least one file.'});
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({detail:'Please enter a valid email address.'});
    if(files.some(f=>!uploadType(f)))return res.status(415).json({detail:'Only valid PDF, JPG and PNG files are accepted.'});
    for(const f of files){await virusScan.scanBuffer(f.buffer);saved.push({...await storage.saveBuffer(f.buffer,f.originalname,f.mimetype),filename:f.originalname.slice(0,250),mimeType:f.mimetype});}
    const row=await db.tx(async client=>{
      const q=await client.query(`INSERT INTO cases(status,priority,resident_name,phone,email,date_of_birth,address,category,preferred_contact,enquiry_message,community_area,notification_consent,reminder_consent,submitted_document_metadata,public_status,public_update,public_next_step,public_updated_at,resident_visible) VALUES('New','Standard',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,'Received',$13,$14,now(),true) RETURNING id,reference,created_at`,[name,phone,email||null,b.dob||null,address,type,String(b.preferred||'').slice(0,80)||null,message,String(b.communityArea||'').slice(0,200)||null,!!b.notificationConsent,!!b.reminderConsent,JSON.stringify([]),'Your enquiry has been received by the District Office and is awaiting initial review.','The office will review your enquiry and determine the appropriate follow-up.']);
      for(const f of saved)await client.query(`INSERT INTO documents(title,document_type,sensitivity,storage_key,original_filename,mime_type,size_bytes,sha256,linked_type,linked_id,review_status) VALUES($1,'Supporting Document','Restricted',$2,$3,$4,$5,$6,'Case',$7,'Needs Review')`,[f.filename,f.key,f.filename,f.mimeType,f.sizeBytes,f.sha256,q.rows[0].id]);
      await client.query(`INSERT INTO case_activity(case_id,activity_type,description,public_visible) VALUES($1,'public_intake','Enquiry received with supporting documents.',false)`,[q.rows[0].id]);
      await audit(client,{eventType:'case.public_create',objectType:'case',objectId:q.rows[0].id,metadata:{reference:q.rows[0].reference,documentCount:saved.length}});
      return q.rows[0];
    });
    res.status(201).json({reference:row.reference,receivedAt:row.created_at,documentCount:saved.length});
  }catch(e){await Promise.allSettled(saved.map(f=>storage.deleteObject(f.key)));next(e);}
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
