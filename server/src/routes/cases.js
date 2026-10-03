'use strict';
const express=require('express');
const db=require('../db');
const {requirePermission,has}=require('../rbac');
const {audit}=require('../audit');
const {toClient,fromClient}=require('../case-shape');
const router=express.Router();

const CASE_SELECT=`SELECT c.*,au.display_name assigned_name,ou.display_name owner_name FROM cases c LEFT JOIN users au ON au.id=c.assigned_user_id LEFT JOIN users ou ON ou.id=c.case_owner_user_id`;

async function getCaseForUser(req,id){
  const q=await db.query(CASE_SELECT+' WHERE c.id=$1',[id]);
  if(!q.rowCount)return {status:404,detail:'Case not found.'};
  const row=q.rows[0];
  if(req.user.role==='Field Officer'&&String(row.assigned_user_id)!==String(req.user.id)&&String(row.case_owner_user_id)!==String(req.user.id)){
    return {status:403,detail:'This case is not assigned to you.'};
  }
  return {row};
}
const empty=()=>Promise.resolve({rows:[]});
const changed=(a,b)=>String(a??'')!==String(b??'');

router.get('/',requirePermission('cases.read'),async(req,res,next)=>{try{
  let sql=CASE_SELECT,params=[];
  if(req.user.role==='Field Officer'){sql+=' WHERE c.assigned_user_id=$1 OR c.case_owner_user_id=$1';params=[req.user.id];}
  sql+=' ORDER BY c.updated_at DESC LIMIT 1000';
  const q=await db.query(sql,params);
  const ids=q.rows.map(r=>r.id);
  const docs=ids.length?await db.query(`SELECT id,linked_id,original_filename,size_bytes,sensitivity,review_status,record_reference FROM documents WHERE linked_type='Case' AND linked_id=ANY($1::text[]) ORDER BY created_at DESC`,[ids]):{rows:[]};
  const byCase=new Map();
  for(const d of docs.rows){const list=byCase.get(d.linked_id)||[];list.push({id:d.id,name:d.original_filename,size:d.size_bytes,sensitivity:d.sensitivity,reviewStatus:d.review_status,reference:d.record_reference,category:'Supporting Document',source:'Public enquiry'});byCase.set(d.linked_id,list);}
  res.json({cases:q.rows.map(r=>({...toClient(r),documents:byCase.get(String(r.id))||[]}))});
}catch(e){next(e)}});

router.get('/:id/workspace',requirePermission('cases.read'),async(req,res,next)=>{try{
  const access=await getCaseForUser(req,req.params.id);
  if(!access.row)return res.status(access.status).json({detail:access.detail});
  const row=access.row,refs=[String(row.id),row.reference].filter(Boolean);

  const canApplications=has(req.user,'applications.read');
  const canRecords=has(req.user,'records.read');
  const canCorrespondence=has(req.user,'correspondence.write');
  const canField=has(req.user,'field.write');
  const canFeedback=has(req.user,'feedback.write');
  const canAppointments=has(req.user,'appointments.write');

  const appQuery=canApplications
    ? (req.user.role==='Field Officer'
      ? db.query('SELECT id,reference,applicant_name,assistance_type,agency,stage,agency_reference,submission_date,next_follow_up,outcome,outcome_date,public_status,updated_at FROM applications WHERE case_id=$1 AND assigned_user_id=$2 ORDER BY updated_at DESC',[row.id,req.user.id])
      : db.query('SELECT id,reference,applicant_name,assistance_type,agency,stage,agency_reference,submission_date,next_follow_up,outcome,outcome_date,public_status,updated_at FROM applications WHERE case_id=$1 ORDER BY updated_at DESC',[row.id]))
    : empty();

  const fieldQuery=canField
    ? (req.user.role==='Field Officer'
      ? db.query(`SELECT id,visit_type,linked_type,linked_reference,scheduled_at,completed_at,location_text,purpose,public_outcome,outcome_category,next_action,next_follow_up,evidence_reference,status,updated_at FROM field_visits WHERE lower(coalesce(linked_type,''))='case' AND linked_reference=ANY($1::text[]) AND lead_user_id=$2 ORDER BY updated_at DESC`,[refs,req.user.id])
      : db.query(`SELECT id,visit_type,linked_type,linked_reference,scheduled_at,completed_at,location_text,purpose,public_outcome,outcome_category,next_action,next_follow_up,evidence_reference,status,updated_at FROM field_visits WHERE lower(coalesce(linked_type,''))='case' AND linked_reference=ANY($1::text[]) ORDER BY updated_at DESC`,[refs]))
    : empty();

  const appointmentQuery=canAppointments
    ? (req.user.role==='Field Officer'
      ? db.query('SELECT id,appointment_type,starts_at,ends_at,location,status,note,created_at FROM appointments WHERE case_id=$1 AND assigned_user_id=$2 ORDER BY starts_at DESC',[row.id,req.user.id])
      : db.query('SELECT id,appointment_type,starts_at,ends_at,location,status,note,created_at FROM appointments WHERE case_id=$1 ORDER BY starts_at DESC',[row.id]))
    : empty();

  const [notes,activity,applications,documents,correspondence,fieldVisits,feedback,recovery,appointments]=await Promise.all([
    db.query(`SELECT n.id,n.note_text,n.created_at,u.display_name author_name FROM case_notes n LEFT JOIN users u ON u.id=n.author_user_id WHERE n.case_id=$1 ORDER BY n.created_at DESC LIMIT 250`,[row.id]),
    db.query(`SELECT a.id,a.occurred_at,a.activity_type,a.description,a.public_visible,u.display_name actor_name FROM case_activity a LEFT JOIN users u ON u.id=a.actor_user_id WHERE a.case_id=$1 ORDER BY a.occurred_at DESC LIMIT 500`,[row.id]),
    appQuery,
    canRecords?db.query(`SELECT id,record_reference,title,document_type,sensitivity,original_filename,size_bytes,review_status,retention_class,review_date,expiry_date,created_at,updated_at FROM documents WHERE lower(coalesce(linked_type,''))='case' AND linked_id=ANY($1::text[]) ORDER BY updated_at DESC`,[refs]):empty(),
    canCorrespondence?db.query(`SELECT id,correspondence_reference,recipient_name,subject,workflow,issued_at,created_at,updated_at FROM correspondences WHERE lower(coalesce(linked_type,''))='case' AND linked_reference=ANY($1::text[]) ORDER BY updated_at DESC`,[refs]):empty(),
    fieldQuery,
    canFeedback?db.query(`SELECT id,feedback_type,theme,rating,clarity_rating,respect_rating,details,follow_up_requested,status,source,created_at,updated_at FROM resident_feedback WHERE case_reference=ANY($1::text[]) ORDER BY updated_at DESC`,[refs]):empty(),
    canFeedback?db.query(`SELECT r.id,r.feedback_id,r.action_text,r.priority,r.due_date,r.status,r.outcome_note,r.created_at,r.updated_at FROM service_recovery_actions r JOIN resident_feedback f ON f.id=r.feedback_id WHERE f.case_reference=ANY($1::text[]) ORDER BY r.updated_at DESC`,[refs]):empty(),
    appointmentQuery
  ]);

  res.json({
    case:toClient(row),
    permissions:{applications:canApplications,records:canRecords,correspondence:canCorrespondence,field:canField,feedback:canFeedback,appointments:canAppointments,notes:has(req.user,'cases.write')},
    notes:notes.rows,
    activity:activity.rows,
    applications:applications.rows,
    documents:documents.rows,
    correspondence:correspondence.rows,
    fieldVisits:fieldVisits.rows,
    feedback:feedback.rows,
    recovery:recovery.rows,
    appointments:appointments.rows,
    generatedAt:new Date().toISOString()
  });
}catch(e){next(e)}});

router.post('/:id/notes',requirePermission('cases.write'),async(req,res,next)=>{try{
  const access=await getCaseForUser(req,req.params.id);
  if(!access.row)return res.status(access.status).json({detail:access.detail});
  const text=String(req.body?.text||'').trim();
  if(!text)return res.status(400).json({detail:'Note text is required.'});
  if(text.length>10000)return res.status(400).json({detail:'Note is too long.'});
  const q=await db.query(`INSERT INTO case_notes(case_id,author_user_id,note_text) VALUES($1,$2,$3) RETURNING id,note_text,created_at`,[req.params.id,req.user.id,text]);
  const a=await db.query(`INSERT INTO case_activity(case_id,actor_user_id,activity_type,description,public_visible) VALUES($1,$2,'Internal note','Internal note added.',false) RETURNING id,occurred_at,activity_type,description,public_visible`,[req.params.id,req.user.id]);
  await audit(db,{actorUserId:req.user.id,eventType:'case.note.create',objectType:'case',objectId:req.params.id});
  res.status(201).json({note:{...q.rows[0],author_name:req.user.name||req.user.email},activity:{...a.rows[0],actor_name:req.user.name||req.user.email}});
}catch(e){next(e)}});

router.post('/',requirePermission('cases.write'),async(req,res,next)=>{try{
  const body=req.body?.case||req.body||{},x=fromClient(body);
  const created=await db.tx(async client=>{
    let residentId=x.resident_id||null,resident=null;
    if(residentId){
      if(req.user.role==='Field Officer'){
        const rq=await client.query(`SELECT r.* FROM residents r WHERE r.id=$1 AND EXISTS(
          SELECT 1 FROM cases c WHERE c.resident_id=r.id AND (c.assigned_user_id=$2 OR c.case_owner_user_id=$2)
        )`,[residentId,req.user.id]);
        resident=rq.rows[0]||null;
      }else resident=(await client.query('SELECT * FROM residents WHERE id=$1',[residentId])).rows[0]||null;
      if(!resident){const e=new Error('Resident profile not found or not available to your role.');e.statusCode=404;throw e;}
      x.resident_name=x.resident_name||resident.full_name;
      x.phone=x.phone||resident.phone;
      x.email=x.email||resident.email;
      x.date_of_birth=x.date_of_birth||resident.date_of_birth;
      x.address=x.address||resident.address;
      x.preferred_contact=x.preferred_contact||resident.preferred_contact;
    }else{
      const rq=await client.query(`INSERT INTO residents(full_name,phone,email,date_of_birth,address,preferred_contact,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [x.resident_name||'Unnamed resident',x.phone,x.email,x.date_of_birth,x.address,x.preferred_contact,req.user.id]);
      resident=rq.rows[0];residentId=resident.id;
    }
    const q=await client.query(`INSERT INTO cases(resident_id,status,priority,resident_name,phone,email,date_of_birth,address,category,preferred_contact,enquiry_message,next_follow_up,due_date,escalation,next_action,public_status,public_update,public_next_step,resident_visible,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id,reference`,
      [residentId,x.status,x.priority,x.resident_name,x.phone,x.email,x.date_of_birth,x.address,x.category,x.preferred_contact,x.enquiry_message,x.next_follow_up,x.due_date,x.escalation,x.next_action,x.public_status,x.public_update,x.public_next_step,x.resident_visible,req.user.id]);
    await client.query(`INSERT INTO case_activity(case_id,actor_user_id,activity_type,description,public_visible) VALUES($1,$2,'Case created','Case record created.',false)`,[q.rows[0].id,req.user.id]);
    await audit(client,{actorUserId:req.user.id,eventType:'case.create',objectType:'case',objectId:q.rows[0].id,metadata:{reference:q.rows[0].reference,residentId}});
    const full=await client.query(CASE_SELECT+' WHERE c.id=$1',[q.rows[0].id]);
    return full.rows[0];
  });
  res.status(201).json({case:toClient(created)});
}catch(e){if(e.statusCode)return res.status(e.statusCode).json({detail:e.message});next(e)}});

router.put('/:id',requirePermission('cases.write'),async(req,res,next)=>{try{
  const id=req.params.id,body=req.body?.case||{};
  const access=await getCaseForUser(req,id);
  if(!access.row)return res.status(access.status).json({detail:access.detail});
  const before=access.row,x=fromClient(body);
  let assignedId=body.assignedUserId||null,ownerId=body.caseOwnerUserId||null;
  if(!assignedId&&body.assigned&&body.assigned!=='Unassigned'){const u=await db.query('SELECT id FROM users WHERE display_name=$1 AND is_active=true',[body.assigned]);assignedId=u.rows[0]?.id||null;}
  if(!ownerId&&body.caseOwner&&body.caseOwner!=='Unassigned'){const u=await db.query('SELECT id FROM users WHERE display_name=$1 AND is_active=true',[body.caseOwner]);ownerId=u.rows[0]?.id||null;}
  await db.query(`UPDATE cases SET status=$2,priority=$3,resident_name=$4,phone=$5,email=$6,date_of_birth=$7,address=$8,category=$9,preferred_contact=$10,enquiry_message=$11,assigned_user_id=COALESCE($12,assigned_user_id),case_owner_user_id=COALESCE($13,case_owner_user_id),next_follow_up=$14,due_date=$15,escalation=$16,next_action=$17,referral_agency=$18,referral_reference=$19,referral_date=$20,referral_purpose=$21,referral_contact=$22,referral_ack_date=$23,referral_response_status=$24,referral_follow_up_date=$25,referral_response_note=$26,closure_reason=$27,public_status=$28,public_update=$29,public_next_step=$30,public_updated_at=CASE WHEN public_update IS DISTINCT FROM $29 OR public_status IS DISTINCT FROM $28 THEN now() ELSE public_updated_at END,resident_visible=$31,resident_id=COALESCE($32,resident_id),updated_at=now() WHERE id=$1`,[id,x.status,x.priority,x.resident_name,x.phone,x.email,x.date_of_birth,x.address,x.category,x.preferred_contact,x.enquiry_message,assignedId,ownerId,x.next_follow_up,x.due_date,x.escalation,x.next_action,x.referral_agency,x.referral_reference,x.referral_date,x.referral_purpose,x.referral_contact,x.referral_ack_date,x.referral_response_status,x.referral_follow_up_date,x.referral_response_note,x.closure_reason,x.public_status,x.public_update,x.public_next_step,x.resident_visible,body.residentId||null]);
  const full=await db.query(CASE_SELECT+' WHERE c.id=$1',[id]);
  if(!full.rowCount)return res.status(404).json({detail:'Case not found.'});
  const after=full.rows[0],changes=[];
  const add=(label,a,b)=>{if(changed(a,b))changes.push(`${label} changed from ${a??'not set'} to ${b??'not set'}.`)};
  add('Status',before.status,after.status);add('Priority',before.priority,after.priority);add('Assigned officer',before.assigned_name,after.assigned_name);add('Case owner',before.owner_name,after.owner_name);add('Follow-up date',before.next_follow_up,after.next_follow_up);add('Target date',before.due_date,after.due_date);add('Escalation',before.escalation,after.escalation);add('Next action',before.next_action,after.next_action);add('Referral agency',before.referral_agency,after.referral_agency);add('Public status',before.public_status,after.public_status);add('Resident profile',before.resident_id,after.resident_id);
  for(const description of changes)await db.query(`INSERT INTO case_activity(case_id,actor_user_id,activity_type,description,public_visible) VALUES($1,$2,'Case update',$3,false)`,[id,req.user.id,description]);
  await audit(db,{actorUserId:req.user.id,eventType:'case.update',objectType:'case',objectId:id,metadata:{reference:body.reference,status:x.status,changeCount:changes.length}});
  res.json({case:toClient(after)});
}catch(e){next(e)}});

module.exports=router;
