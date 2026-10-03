'use strict';
const express=require('express');
const db=require('../db');
const {requirePermission,has}=require('../rbac');
const {audit}=require('../audit');
const router=express.Router();

const empty=()=>Promise.resolve({rows:[]});

async function getResidentForUser(req,id){
  if(req.user.role==='Field Officer'){
    const q=await db.query(`
      SELECT r.*
      FROM residents r
      WHERE r.id=$1
        AND EXISTS(
          SELECT 1 FROM cases c
          WHERE c.resident_id=r.id
            AND (c.assigned_user_id=$2 OR c.case_owner_user_id=$2)
        )`,[id,req.user.id]);
    return q.rows[0]||null;
  }
  return (await db.query('SELECT * FROM residents WHERE id=$1',[id])).rows[0]||null;
}

router.get('/',requirePermission('cases.read'),async(req,res,next)=>{try{
  const q=String(req.query.q||'').trim();
  const like='%'+q.replace(/[%_]/g,'')+'%';
  let rows;
  if(req.user.role==='Field Officer'){
    rows=(await db.query(`
      SELECT r.id,r.reference,r.full_name,r.phone,r.email,r.date_of_birth,r.address,r.preferred_contact,r.household_name,
             count(c.id)::int cases_total,
             count(*) FILTER (WHERE c.status NOT IN ('Closed','Completed'))::int open_cases,
             max(c.updated_at) last_case_update
      FROM residents r
      JOIN cases c ON c.resident_id=r.id
        AND (c.assigned_user_id=$1 OR c.case_owner_user_id=$1)
      WHERE ($2='' OR r.reference ILIKE $3 OR r.full_name ILIKE $3 OR coalesce(r.phone,'') ILIKE $3 OR coalesce(r.email,'') ILIKE $3 OR coalesce(r.address,'') ILIKE $3)
      GROUP BY r.id
      ORDER BY max(c.updated_at) DESC NULLS LAST,r.full_name
      LIMIT 500`,[req.user.id,q,like])).rows;
  }else{
    rows=(await db.query(`
      SELECT r.id,r.reference,r.full_name,r.phone,r.email,r.date_of_birth,r.address,r.preferred_contact,r.household_name,
             count(c.id)::int cases_total,
             count(*) FILTER (WHERE c.status NOT IN ('Closed','Completed'))::int open_cases,
             max(c.updated_at) last_case_update
      FROM residents r
      LEFT JOIN cases c ON c.resident_id=r.id
      WHERE ($1='' OR r.reference ILIKE $2 OR r.full_name ILIKE $2 OR coalesce(r.phone,'') ILIKE $2 OR coalesce(r.email,'') ILIKE $2 OR coalesce(r.address,'') ILIKE $2)
      GROUP BY r.id
      ORDER BY max(c.updated_at) DESC NULLS LAST,r.full_name
      LIMIT 500`,[q,like])).rows;
  }
  res.json({residents:rows});
}catch(e){next(e)}});

router.get('/:id',requirePermission('cases.read'),async(req,res,next)=>{try{
  const resident=await getResidentForUser(req,req.params.id);
  if(!resident)return res.status(404).json({detail:'Resident profile not found or not available to your role.'});

  let cq,caseParams;
  if(req.user.role==='Field Officer'){
    cq=`SELECT c.*,au.display_name assigned_name,ou.display_name owner_name
         FROM cases c
         LEFT JOIN users au ON au.id=c.assigned_user_id
         LEFT JOIN users ou ON ou.id=c.case_owner_user_id
         WHERE c.resident_id=$1 AND (c.assigned_user_id=$2 OR c.case_owner_user_id=$2)
         ORDER BY c.updated_at DESC`;
    caseParams=[resident.id,req.user.id];
  }else{
    cq=`SELECT c.*,au.display_name assigned_name,ou.display_name owner_name
         FROM cases c
         LEFT JOIN users au ON au.id=c.assigned_user_id
         LEFT JOIN users ou ON ou.id=c.case_owner_user_id
         WHERE c.resident_id=$1
         ORDER BY c.updated_at DESC`;
    caseParams=[resident.id];
  }
  const cases=(await db.query(cq,caseParams)).rows;
  const caseIds=cases.map(x=>x.id);
  const refs=cases.flatMap(x=>[String(x.id),x.reference]).filter(Boolean);

  const canApplications=has(req.user,'applications.read');
  const canRecords=has(req.user,'records.read');
  const canCorrespondence=has(req.user,'correspondence.write');
  const canField=has(req.user,'field.write');
  const canFeedback=has(req.user,'feedback.write');
  const canAppointments=has(req.user,'appointments.write');

  const [applications,documents,correspondence,fieldVisits,feedback,appointments,activity]=await Promise.all([
    canApplications&&caseIds.length
      ? (req.user.role==='Field Officer'
        ? db.query(`SELECT id,reference,case_id,applicant_name,assistance_type,agency,stage,next_follow_up,outcome,updated_at FROM applications WHERE case_id=ANY($1::uuid[]) AND assigned_user_id=$2 ORDER BY updated_at DESC`,[caseIds,req.user.id])
        : db.query(`SELECT id,reference,case_id,applicant_name,assistance_type,agency,stage,next_follow_up,outcome,updated_at FROM applications WHERE case_id=ANY($1::uuid[]) ORDER BY updated_at DESC`,[caseIds]))
      : empty(),
    canRecords&&refs.length
      ? db.query(`SELECT id,record_reference,title,document_type,sensitivity,linked_id,review_status,original_filename,updated_at FROM documents WHERE lower(coalesce(linked_type,''))='case' AND linked_id=ANY($1::text[]) ORDER BY updated_at DESC`,[refs])
      : empty(),
    canCorrespondence&&refs.length
      ? db.query(`SELECT id,correspondence_reference,linked_reference,recipient_name,subject,workflow,issued_at,updated_at FROM correspondences WHERE lower(coalesce(linked_type,''))='case' AND linked_reference=ANY($1::text[]) ORDER BY updated_at DESC`,[refs])
      : empty(),
    canField&&refs.length
      ? (req.user.role==='Field Officer'
        ? db.query(`SELECT id,linked_reference,visit_type,scheduled_at,location_text,purpose,next_action,status,updated_at FROM field_visits WHERE lower(coalesce(linked_type,''))='case' AND linked_reference=ANY($1::text[]) AND lead_user_id=$2 ORDER BY updated_at DESC`,[refs,req.user.id])
        : db.query(`SELECT id,linked_reference,visit_type,scheduled_at,location_text,purpose,next_action,status,updated_at FROM field_visits WHERE lower(coalesce(linked_type,''))='case' AND linked_reference=ANY($1::text[]) ORDER BY updated_at DESC`,[refs]))
      : empty(),
    canFeedback&&refs.length
      ? db.query(`SELECT id,case_reference,feedback_type,theme,rating,status,follow_up_requested,details,updated_at FROM resident_feedback WHERE case_reference=ANY($1::text[]) ORDER BY updated_at DESC`,[refs])
      : empty(),
    canAppointments&&caseIds.length
      ? (req.user.role==='Field Officer'
        ? db.query(`SELECT id,case_id,appointment_type,starts_at,location,status,note FROM appointments WHERE case_id=ANY($1::uuid[]) AND assigned_user_id=$2 ORDER BY starts_at DESC`,[caseIds,req.user.id])
        : db.query(`SELECT id,case_id,appointment_type,starts_at,location,status,note FROM appointments WHERE case_id=ANY($1::uuid[]) ORDER BY starts_at DESC`,[caseIds]))
      : empty(),
    caseIds.length
      ? db.query(`SELECT a.case_id,a.occurred_at,a.activity_type,a.description,u.display_name actor_name,c.reference case_reference
                    FROM case_activity a
                    JOIN cases c ON c.id=a.case_id
                    LEFT JOIN users u ON u.id=a.actor_user_id
                   WHERE a.case_id=ANY($1::uuid[])
                   ORDER BY a.occurred_at DESC LIMIT 250`,[caseIds])
      : empty()
  ]);

  res.json({
    resident,
    permissions:{applications:canApplications,records:canRecords,correspondence:canCorrespondence,field:canField,feedback:canFeedback,appointments:canAppointments,edit:has(req.user,'cases.write')},
    summary:{
      cases:cases.length,
      openCases:cases.filter(x=>!['Closed','Completed'].includes(x.status)).length,
      applications:applications.rows.length,
      documents:documents.rows.length,
      correspondence:correspondence.rows.length,
      fieldVisits:fieldVisits.rows.length,
      feedback:feedback.rows.length
    },
    cases,
    applications:applications.rows,
    documents:documents.rows,
    correspondence:correspondence.rows,
    fieldVisits:fieldVisits.rows,
    feedback:feedback.rows,
    appointments:appointments.rows,
    activity:activity.rows
  });
}catch(e){next(e)}});

router.post('/',requirePermission('cases.write'),async(req,res,next)=>{try{
  const b=req.body||{},name=String(b.fullName||'').trim();
  if(!name)return res.status(400).json({detail:'Resident name is required.'});
  const q=await db.query(`INSERT INTO residents(full_name,phone,email,date_of_birth,address,preferred_contact,household_name,created_by)
                           VALUES($1,$2,$3,$4,$5,$6,$7,$8)
                           RETURNING *`,
    [name,b.phone||null,b.email||null,b.dateOfBirth||null,b.address||null,b.preferredContact||null,b.householdName||null,req.user.id]);
  await audit(db,{actorUserId:req.user.id,eventType:'resident.create',objectType:'resident',objectId:q.rows[0].id,metadata:{reference:q.rows[0].reference}});
  res.status(201).json({resident:q.rows[0]});
}catch(e){next(e)}});

router.patch('/:id',requirePermission('cases.write'),async(req,res,next)=>{try{
  const existing=await getResidentForUser(req,req.params.id);
  if(!existing)return res.status(404).json({detail:'Resident profile not found or not available to your role.'});
  const b=req.body||{};
  const q=await db.query(`UPDATE residents SET
      full_name=COALESCE(NULLIF($2,''),full_name),
      phone=$3,email=$4,date_of_birth=$5,address=$6,preferred_contact=$7,household_name=$8
      WHERE id=$1 RETURNING *`,
    [req.params.id,b.fullName??null,b.phone??existing.phone,b.email??existing.email,b.dateOfBirth??existing.date_of_birth,b.address??existing.address,b.preferredContact??existing.preferred_contact,b.householdName??existing.household_name]);
  await audit(db,{actorUserId:req.user.id,eventType:'resident.update',objectType:'resident',objectId:req.params.id,metadata:{reference:q.rows[0].reference}});
  res.json({resident:q.rows[0]});
}catch(e){next(e)}});

router.post('/:id/link-case',requirePermission('cases.write'),async(req,res,next)=>{try{
  const resident=await getResidentForUser(req,req.params.id);
  if(!resident)return res.status(404).json({detail:'Resident profile not found or not available to your role.'});
  const ref=String(req.body?.caseReference||'').trim();
  if(!ref)return res.status(400).json({detail:'Case reference is required.'});
  let q;
  if(req.user.role==='Field Officer'){
    q=await db.query(`SELECT id,reference,resident_id FROM cases WHERE reference=$1 AND (assigned_user_id=$2 OR case_owner_user_id=$2)`,[ref,req.user.id]);
  }else q=await db.query('SELECT id,reference,resident_id FROM cases WHERE reference=$1',[ref]);
  if(!q.rowCount)return res.status(404).json({detail:'Case not found or not available to your role.'});
  const c=q.rows[0];
  if(c.resident_id&&String(c.resident_id)!==String(resident.id)&&req.body?.confirmReassign!==true){
    return res.status(409).json({detail:'This case is already linked to a different resident profile. Confirm reassignment before changing the link.',currentResidentId:c.resident_id});
  }
  await db.query('UPDATE cases SET resident_id=$2,updated_at=now() WHERE id=$1',[c.id,resident.id]);
  await audit(db,{actorUserId:req.user.id,eventType:'resident.case.link',objectType:'resident',objectId:resident.id,metadata:{caseId:c.id,caseReference:c.reference,previousResidentId:c.resident_id||null}});
  res.json({linked:true,caseId:c.id,caseReference:c.reference,residentId:resident.id});
}catch(e){next(e)}});

module.exports=router;
