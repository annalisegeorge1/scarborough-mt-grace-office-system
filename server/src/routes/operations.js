'use strict';
const express=require('express');const db=require('../db');const {requirePermission,requireAnyRole}=require('../rbac');const {audit}=require('../audit');const router=express.Router();
const list=(table,order='updated_at DESC')=>async(req,res,next)=>{try{res.json({items:(await db.query(`SELECT * FROM ${table} ORDER BY ${order} LIMIT 1000`)).rows});}catch(e){next(e)}};
router.get('/community-matters',requirePermission('community.write'),list('community_matters'));
router.post('/community-matters',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};if(!b.title)return res.status(400).json({detail:'Title is required.'});const q=await db.query(`INSERT INTO community_matters(title,matter_type,area,priority,status,responsible_user_id,agency,next_follow_up,public_visible,public_summary,public_next_step,internal_notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[b.title,b.matterType||null,b.area||null,b.priority||'Standard',b.status||'Identified',b.responsibleUserId||null,b.agency||null,b.nextFollowUp||null,!!b.publicVisible,b.publicSummary||null,b.publicNextStep||null,b.internalNotes||null]);await audit(db,{actorUserId:req.user.id,eventType:'community_matter.create',objectType:'community_matter',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.patch('/community-matters/:id',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};const q=await db.query(`UPDATE community_matters SET title=COALESCE($2,title),matter_type=COALESCE($3,matter_type),area=COALESCE($4,area),priority=COALESCE($5,priority),status=COALESCE($6,status),agency=COALESCE($7,agency),next_follow_up=$8,public_visible=COALESCE($9,public_visible),public_summary=COALESCE($10,public_summary),public_next_step=COALESCE($11,public_next_step),internal_notes=COALESCE($12,internal_notes) WHERE id=$1 RETURNING *`,[req.params.id,b.title||null,b.matterType||null,b.area||null,b.priority||null,b.status||null,b.agency||null,b.nextFollowUp||null,b.publicVisible===undefined?null:!!b.publicVisible,b.publicSummary||null,b.publicNextStep||null,b.internalNotes||null]);if(!q.rowCount)return res.status(404).json({detail:'Community matter not found.'});await audit(db,{actorUserId:req.user.id,eventType:'community_matter.update',objectType:'community_matter',objectId:req.params.id});res.json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/initiatives',requirePermission('community.write'),list('initiatives'));
router.post('/initiatives',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};if(!b.title||!b.type)return res.status(400).json({detail:'Title and type are required.'});const q=await db.query(`INSERT INTO initiatives(title,type,stage,area,lead_user_id,responsible_agency,start_date,target_date,next_follow_up,public_visible,public_summary,internal_notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[b.title,b.type,b.stage||'Planned',b.area||null,b.leadUserId||null,b.responsibleAgency||null,b.startDate||null,b.targetDate||null,b.nextFollowUp||null,!!b.publicVisible,b.publicSummary||null,b.internalNotes||null]);await audit(db,{actorUserId:req.user.id,eventType:'initiative.create',objectType:'initiative',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/partners',requirePermission('community.write'),list('partners','created_at DESC'));
router.post('/partners',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};if(!b.name)return res.status(400).json({detail:'Partner name is required.'});const q=await db.query(`INSERT INTO partners(name,partner_type,area_served,contact_name,phone,email,agreement_status,next_follow_up,internal_note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[b.name,b.partnerType||null,b.areaServed||null,b.contactName||null,b.phone||null,b.email||null,b.agreementStatus||null,b.nextFollowUp||null,b.internalNote||null]);await audit(db,{actorUserId:req.user.id,eventType:'partner.create',objectType:'partner',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/field-visits',requirePermission('field.write'),async(req,res,next)=>{try{let sql='SELECT * FROM field_visits',p=[];if(req.user.role==='Field Officer'){sql+=' WHERE lead_user_id=$1';p=[req.user.id];}sql+=' ORDER BY updated_at DESC LIMIT 1000';res.json({items:(await db.query(sql,p)).rows});}catch(e){next(e)}});
router.post('/field-visits',requirePermission('field.write'),async(req,res,next)=>{try{const b=req.body||{};const q=await db.query(`INSERT INTO field_visits(visit_type,linked_type,linked_reference,lead_user_id,additional_staff,scheduled_at,location_text,purpose,internal_observations,public_outcome,outcome_category,next_action,next_follow_up,evidence_reference,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,[b.visitType,b.linkedType||null,b.linkedReference||null,b.leadUserId||req.user.id,b.additionalStaff||null,b.scheduledAt||null,b.locationText||null,b.purpose||null,b.internalObservations||null,b.publicOutcome||null,b.outcomeCategory||null,b.nextAction||null,b.nextFollowUp||null,b.evidenceReference||null,b.status||'Planned']);await audit(db,{actorUserId:req.user.id,eventType:'field_visit.create',objectType:'field_visit',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.patch('/field-visits/:id',requirePermission('field.write'),async(req,res,next)=>{try{if(req.user.role==='Field Officer'){const own=await db.query('SELECT 1 FROM field_visits WHERE id=$1 AND lead_user_id=$2',[req.params.id,req.user.id]);if(!own.rowCount)return res.status(403).json({detail:'This field record is not assigned to you.'});}const b=req.body||{};const q=await db.query(`UPDATE field_visits SET visit_type=COALESCE($2,visit_type),linked_type=COALESCE($3,linked_type),linked_reference=COALESCE($4,linked_reference),additional_staff=COALESCE($5,additional_staff),scheduled_at=$6,completed_at=CASE WHEN COALESCE($15,status)='Completed' AND completed_at IS NULL THEN now() ELSE completed_at END,location_text=COALESCE($7,location_text),purpose=COALESCE($8,purpose),internal_observations=COALESCE($9,internal_observations),public_outcome=COALESCE($10,public_outcome),outcome_category=COALESCE($11,outcome_category),next_action=COALESCE($12,next_action),next_follow_up=$13,evidence_reference=COALESCE($14,evidence_reference),status=COALESCE($15,status) WHERE id=$1 RETURNING *`,[req.params.id,b.visitType||null,b.linkedType||null,b.linkedReference||null,b.additionalStaff||null,b.scheduledAt||null,b.locationText||null,b.purpose||null,b.internalObservations||null,b.publicOutcome||null,b.outcomeCategory||null,b.nextAction||null,b.nextFollowUp||null,b.evidenceReference||null,b.status||null]);if(!q.rowCount)return res.status(404).json({detail:'Field record not found.'});await audit(db,{actorUserId:req.user.id,eventType:'field_visit.update',objectType:'field_visit',objectId:req.params.id});res.json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/events',requirePermission('community.write'),list('events'));
router.post('/events',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};if(!b.eventType||!b.title)return res.status(400).json({detail:'Event type and title are required.'});const q=await db.query(`INSERT INTO events(event_type,title,status,starts_at,venue,lead_user_id,linked_type,linked_reference,expected_attendance,actual_attendance,public_summary,internal_notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[b.eventType,b.title,b.status||'Planned',b.startsAt||null,b.venue||null,b.leadUserId||req.user.id,b.linkedType||null,b.linkedReference||null,b.expectedAttendance||null,b.actualAttendance||null,b.publicSummary||null,b.internalNotes||null]);await audit(db,{actorUserId:req.user.id,eventType:'event.create',objectType:'event',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.patch('/events/:id',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};const q=await db.query(`UPDATE events SET event_type=COALESCE($2,event_type),title=COALESCE($3,title),status=COALESCE($4,status),starts_at=$5,venue=COALESCE($6,venue),linked_type=COALESCE($7,linked_type),linked_reference=COALESCE($8,linked_reference),expected_attendance=$9,actual_attendance=$10,public_summary=COALESCE($11,public_summary),internal_notes=COALESCE($12,internal_notes) WHERE id=$1 RETURNING *`,[req.params.id,b.eventType||null,b.title||null,b.status||null,b.startsAt||null,b.venue||null,b.linkedType||null,b.linkedReference||null,b.expectedAttendance||null,b.actualAttendance||null,b.publicSummary||null,b.internalNotes||null]);if(!q.rowCount)return res.status(404).json({detail:'Event not found.'});await audit(db,{actorUserId:req.user.id,eventType:'event.update',objectType:'event',objectId:req.params.id});res.json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/events/:id',requirePermission('community.write'),async(req,res,next)=>{try{const [e,a,x]=await Promise.all([db.query('SELECT * FROM events WHERE id=$1',[req.params.id]),db.query('SELECT * FROM event_attendance WHERE event_id=$1 ORDER BY created_at',[req.params.id]),db.query('SELECT * FROM event_actions WHERE event_id=$1 ORDER BY created_at DESC',[req.params.id])]);if(!e.rowCount)return res.status(404).json({detail:'Event not found.'});res.json({event:e.rows[0],attendance:a.rows,actions:x.rows});}catch(e){next(e)}});
router.post('/events/:id/attendance',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};if(!b.attendeeName)return res.status(400).json({detail:'Participant name is required.'});const q=await db.query(`INSERT INTO event_attendance(event_id,attendee_name,participant_type,organization,contact_note) VALUES($1,$2,$3,$4,$5) RETURNING *`,[req.params.id,b.attendeeName,b.participantType||'Attendee',b.organization||null,b.contactNote||null]);await audit(db,{actorUserId:req.user.id,eventType:'event.attendance',objectType:'event',objectId:req.params.id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.post('/events/:id/actions',requirePermission('community.write'),async(req,res,next)=>{try{const b=req.body||{};if(!b.actionText)return res.status(400).json({detail:'Action text is required.'});const q=await db.query(`INSERT INTO event_actions(event_id,action_text,owner_user_id,due_date,status,linked_reference) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[req.params.id,b.actionText,b.ownerUserId||req.user.id,b.dueDate||null,b.status||'Open',b.linkedReference||null]);await audit(db,{actorUserId:req.user.id,eventType:'event.action',objectType:'event',objectId:req.params.id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/meetings',requirePermission('community.write'),async(req,res,next)=>{try{
  const q=await db.query(`
    SELECT m.*,
      COALESCE(a.attendance_count,0)::int attendance_count,
      COALESCE(x.open_actions,0)::int open_actions,
      COALESCE(x.overdue_actions,0)::int overdue_actions
    FROM meetings m
    LEFT JOIN LATERAL (
      SELECT count(*) attendance_count FROM meeting_attendance ma WHERE ma.meeting_id=m.id
    ) a ON true
    LEFT JOIN LATERAL (
      SELECT
        count(*) FILTER (WHERE status NOT IN ('Completed','Cancelled')) open_actions,
        count(*) FILTER (WHERE status NOT IN ('Completed','Cancelled') AND due_date<CURRENT_DATE) overdue_actions
      FROM meeting_actions mx WHERE mx.meeting_id=m.id
    ) x ON true
    ORDER BY m.meeting_date DESC,m.start_time DESC NULLS LAST,m.updated_at DESC
    LIMIT 1000`);
  res.json({items:q.rows});
}catch(e){next(e)}});

router.post('/meetings',requirePermission('community.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  if(!b.meetingType||!b.title||!b.meetingDate)return res.status(400).json({detail:'Meeting type, title and date are required.'});
  const item=await db.tx(async client=>{
    const q=await client.query(`INSERT INTO meetings(
      meeting_type,title,status,area,meeting_date,start_time,venue,lead_text,recorder_text,
      linked_type,linked_reference,purpose,agenda,internal_minutes,decisions,public_summary,next_follow_up,created_by
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [b.meetingType,b.title,b.status||'Planning',b.area||null,b.meetingDate,b.startTime||null,b.venue||null,b.leadText||null,b.recorderText||null,b.linkedType||null,b.linkedReference||null,b.purpose||null,b.agenda||null,b.internalMinutes||null,b.decisions||null,b.publicSummary||null,b.nextFollowUp||null,req.user.id]);
    await client.query(`INSERT INTO meeting_timeline(meeting_id,event_type,note,actor_user_id) VALUES($1,'Meeting created','Meeting record created.',$2)`,[q.rows[0].id,req.user.id]);
    await audit(client,{actorUserId:req.user.id,eventType:'meeting.create',objectType:'meeting',objectId:q.rows[0].id,metadata:{reference:q.rows[0].reference}});
    return q.rows[0];
  });
  res.status(201).json({item});
}catch(e){next(e)}});

router.get('/meetings/:id',requirePermission('community.write'),async(req,res,next)=>{try{
  const [m,a,x,t]=await Promise.all([
    db.query('SELECT * FROM meetings WHERE id=$1',[req.params.id]),
    db.query('SELECT * FROM meeting_attendance WHERE meeting_id=$1 ORDER BY created_at',[req.params.id]),
    db.query(`SELECT ma.*,u.display_name owner_user_name FROM meeting_actions ma LEFT JOIN users u ON u.id=ma.owner_user_id WHERE ma.meeting_id=$1 ORDER BY CASE WHEN ma.status IN ('Completed','Cancelled') THEN 1 ELSE 0 END,ma.due_date NULLS LAST,ma.created_at DESC`,[req.params.id]),
    db.query(`SELECT mt.*,u.display_name actor_name FROM meeting_timeline mt LEFT JOIN users u ON u.id=mt.actor_user_id WHERE mt.meeting_id=$1 ORDER BY mt.occurred_at DESC LIMIT 250`,[req.params.id])
  ]);
  if(!m.rowCount)return res.status(404).json({detail:'Meeting not found.'});
  res.json({meeting:m.rows[0],attendance:a.rows,actions:x.rows,timeline:t.rows});
}catch(e){next(e)}});

router.patch('/meetings/:id',requirePermission('community.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  const result=await db.tx(async client=>{
    const before=(await client.query('SELECT * FROM meetings WHERE id=$1',[req.params.id])).rows[0];
    if(!before){const er=new Error('Meeting not found.');er.statusCode=404;throw er;}
    const q=await client.query(`UPDATE meetings SET
      meeting_type=COALESCE($2,meeting_type),title=COALESCE($3,title),status=COALESCE($4,status),
      area=$5,meeting_date=COALESCE($6,meeting_date),start_time=$7,venue=$8,lead_text=$9,recorder_text=$10,
      linked_type=$11,linked_reference=$12,purpose=$13,agenda=$14,internal_minutes=$15,decisions=$16,
      public_summary=$17,next_follow_up=$18
      WHERE id=$1 RETURNING *`,
    [req.params.id,b.meetingType||null,b.title||null,b.status||null,b.area??before.area,b.meetingDate||null,b.startTime??before.start_time,b.venue??before.venue,b.leadText??before.lead_text,b.recorderText??before.recorder_text,b.linkedType??before.linked_type,b.linkedReference??before.linked_reference,b.purpose??before.purpose,b.agenda??before.agenda,b.internalMinutes??before.internal_minutes,b.decisions??before.decisions,b.publicSummary??before.public_summary,b.nextFollowUp??before.next_follow_up]);
    if(before.status!==q.rows[0].status){
      await client.query(`INSERT INTO meeting_timeline(meeting_id,event_type,note,actor_user_id) VALUES($1,'Status changed',$2,$3)`,[req.params.id,before.status+' → '+q.rows[0].status,req.user.id]);
    }
    await audit(client,{actorUserId:req.user.id,eventType:'meeting.update',objectType:'meeting',objectId:req.params.id,metadata:{reference:q.rows[0].reference,status:q.rows[0].status}});
    return q.rows[0];
  });
  res.json({item:result});
}catch(e){if(e.statusCode)return res.status(e.statusCode).json({detail:e.message});next(e)}});

router.post('/meetings/:id/attendance',requirePermission('community.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  if(!b.attendeeName)return res.status(400).json({detail:'Attendee name is required.'});
  const q=await db.query(`INSERT INTO meeting_attendance(meeting_id,attendee_name,organization,role_category,recorded_by) VALUES($1,$2,$3,$4,$5) RETURNING *`,[req.params.id,b.attendeeName,b.organization||null,b.roleCategory||null,req.user.id]);
  await audit(db,{actorUserId:req.user.id,eventType:'meeting.attendance.add',objectType:'meeting',objectId:req.params.id});
  res.status(201).json({item:q.rows[0]});
}catch(e){next(e)}});

router.delete('/meetings/:id/attendance/:attendanceId',requirePermission('community.write'),async(req,res,next)=>{try{
  const q=await db.query('DELETE FROM meeting_attendance WHERE id=$1 AND meeting_id=$2 RETURNING id',[req.params.attendanceId,req.params.id]);
  if(!q.rowCount)return res.status(404).json({detail:'Attendance entry not found.'});
  await audit(db,{actorUserId:req.user.id,eventType:'meeting.attendance.remove',objectType:'meeting',objectId:req.params.id,metadata:{attendanceId:req.params.attendanceId}});
  res.json({deleted:true});
}catch(e){next(e)}});

router.post('/meetings/:id/actions',requirePermission('community.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  if(!b.actionText)return res.status(400).json({detail:'Action description is required.'});
  const q=await db.query(`INSERT INTO meeting_actions(meeting_id,action_text,owner_text,owner_user_id,due_date,status,linked_reference,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[req.params.id,b.actionText,b.ownerText||null,b.ownerUserId||null,b.dueDate||null,b.status||'Open',b.linkedReference||null,req.user.id]);
  await audit(db,{actorUserId:req.user.id,eventType:'meeting.action.add',objectType:'meeting',objectId:req.params.id,metadata:{actionId:q.rows[0].id}});
  res.status(201).json({item:q.rows[0]});
}catch(e){next(e)}});

router.patch('/meetings/:id/actions/:actionId',requirePermission('community.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  const q=await db.query(`UPDATE meeting_actions SET action_text=COALESCE($3,action_text),owner_text=$4,owner_user_id=$5,due_date=$6,status=COALESCE($7,status),linked_reference=$8 WHERE id=$1 AND meeting_id=$2 RETURNING *`,[req.params.actionId,req.params.id,b.actionText||null,b.ownerText??null,b.ownerUserId||null,b.dueDate||null,b.status||null,b.linkedReference??null]);
  if(!q.rowCount)return res.status(404).json({detail:'Meeting action not found.'});
  await audit(db,{actorUserId:req.user.id,eventType:'meeting.action.update',objectType:'meeting',objectId:req.params.id,metadata:{actionId:req.params.actionId,status:q.rows[0].status}});
  res.json({item:q.rows[0]});
}catch(e){next(e)}});

router.delete('/meetings/:id/actions/:actionId',requirePermission('community.write'),async(req,res,next)=>{try{
  const q=await db.query('DELETE FROM meeting_actions WHERE id=$1 AND meeting_id=$2 RETURNING id',[req.params.actionId,req.params.id]);
  if(!q.rowCount)return res.status(404).json({detail:'Meeting action not found.'});
  await audit(db,{actorUserId:req.user.id,eventType:'meeting.action.remove',objectType:'meeting',objectId:req.params.id,metadata:{actionId:req.params.actionId}});
  res.json({deleted:true});
}catch(e){next(e)}});

router.post('/meetings/:id/timeline',requirePermission('community.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  if(!b.note)return res.status(400).json({detail:'Timeline note is required.'});
  const q=await db.query(`INSERT INTO meeting_timeline(meeting_id,event_type,note,actor_user_id) VALUES($1,$2,$3,$4) RETURNING *`,[req.params.id,b.eventType||'Staff meeting update',b.note,req.user.id]);
  await audit(db,{actorUserId:req.user.id,eventType:'meeting.timeline.add',objectType:'meeting',objectId:req.params.id});
  res.status(201).json({item:q.rows[0]});
}catch(e){next(e)}});

router.get('/correspondence',requirePermission('correspondence.write'),list('correspondences'));
router.post('/correspondence',requirePermission('correspondence.write'),async(req,res,next)=>{try{const b=req.body||{};if(['Approved','Issued'].includes(b.workflow)&&!['Manager','Administrative'].includes(req.user.role))return res.status(403).json({detail:'Only Manager or Administrative roles may approve or issue correspondence.'});if(!b.subject||!b.bodyText)return res.status(400).json({detail:'Subject and body are required.'});const q=await db.query(`INSERT INTO correspondences(template_key,linked_type,linked_reference,recipient_name,recipient_address,subject,body_text,signatory,workflow,created_by,approved_by,issued_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[b.templateKey||null,b.linkedType||null,b.linkedReference||null,b.recipientName||null,b.recipientAddress||null,b.subject,b.bodyText,b.signatory||null,b.workflow||'Draft',req.user.id,['Approved','Issued'].includes(b.workflow)?req.user.id:null,b.workflow==='Issued'?new Date():null]);await audit(db,{actorUserId:req.user.id,eventType:'correspondence.create',objectType:'correspondence',objectId:q.rows[0].id,metadata:{reference:q.rows[0].correspondence_reference}});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.patch('/correspondence/:id',requirePermission('correspondence.write'),async(req,res,next)=>{try{const b=req.body||{};if(['Approved','Issued'].includes(b.workflow)&&!['Manager','Administrative'].includes(req.user.role))return res.status(403).json({detail:'Only Manager or Administrative roles may approve or issue correspondence.'});const q=await db.query(`UPDATE correspondences SET template_key=COALESCE($2,template_key),linked_type=COALESCE($3,linked_type),linked_reference=COALESCE($4,linked_reference),recipient_name=COALESCE($5,recipient_name),recipient_address=COALESCE($6,recipient_address),subject=COALESCE($7,subject),body_text=COALESCE($8,body_text),signatory=COALESCE($9,signatory),workflow=COALESCE($10,workflow),approved_by=CASE WHEN COALESCE($10,workflow) IN ('Approved','Issued') THEN $11 ELSE approved_by END,issued_at=CASE WHEN COALESCE($10,workflow)='Issued' AND issued_at IS NULL THEN now() ELSE issued_at END WHERE id=$1 RETURNING *`,[req.params.id,b.templateKey||null,b.linkedType||null,b.linkedReference||null,b.recipientName||null,b.recipientAddress||null,b.subject||null,b.bodyText||null,b.signatory||null,b.workflow||null,req.user.id]);if(!q.rowCount)return res.status(404).json({detail:'Correspondence not found.'});await audit(db,{actorUserId:req.user.id,eventType:'correspondence.update',objectType:'correspondence',objectId:req.params.id,metadata:{workflow:q.rows[0].workflow}});res.json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/appointments',requirePermission('appointments.write'),async(req,res,next)=>{try{let sql='SELECT * FROM appointments',p=[];if(req.user.role==='Field Officer'){sql+=' WHERE assigned_user_id=$1';p=[req.user.id];}sql+=' ORDER BY starts_at DESC LIMIT 1000';res.json({items:(await db.query(sql,p)).rows});}catch(e){next(e)}});
router.post('/appointments',requirePermission('appointments.write'),async(req,res,next)=>{try{const b=req.body||{};const q=await db.query(`INSERT INTO appointments(case_id,application_id,appointment_type,starts_at,ends_at,assigned_user_id,location,status,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[b.caseId||null,b.applicationId||null,b.appointmentType,b.startsAt,b.endsAt||null,b.assignedUserId||req.user.id,b.location||null,b.status||'Scheduled',b.note||null]);await audit(db,{actorUserId:req.user.id,eventType:'appointment.create',objectType:'appointment',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.get('/roster',requirePermission('reports.read'),async(req,res,next)=>{try{const [r,a,c,h]=await Promise.all([db.query('SELECT * FROM staff_roster_assignments ORDER BY duty_date DESC LIMIT 1000'),db.query('SELECT * FROM staff_operational_absences ORDER BY start_date DESC LIMIT 1000'),db.query('SELECT * FROM staff_coverage_assignments ORDER BY start_date DESC LIMIT 1000'),db.query('SELECT * FROM staff_continuity_handovers ORDER BY handover_date DESC LIMIT 1000')]);res.json({roster:r.rows,absences:a.rows,coverage:c.rows,handovers:h.rows});}catch(e){next(e)}});
router.post('/roster/assignment',requireAnyRole('Manager','Administrative'),async(req,res,next)=>{try{const b=req.body||{};const q=await db.query(`INSERT INTO staff_roster_assignments(user_id,duty_date,duty_status,start_time,end_time,primary_duty,operational_notes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[b.userId,b.dutyDate,b.dutyStatus,b.startTime||null,b.endTime||null,b.primaryDuty||null,b.operationalNotes||null]);await audit(db,{actorUserId:req.user.id,eventType:'roster.assignment',objectType:'staff_roster',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.post('/roster/absence',requireAnyRole('Manager','Administrative'),async(req,res,next)=>{try{const b=req.body||{};const q=await db.query(`INSERT INTO staff_operational_absences(user_id,start_date,end_date,category,operational_status,coverage_required,operational_note) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[b.userId,b.startDate,b.endDate,b.category,b.operationalStatus||'Confirmed',!!b.coverageRequired,b.operationalNote||null]);await audit(db,{actorUserId:req.user.id,eventType:'roster.absence',objectType:'staff_absence',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
router.post('/roster/coverage',requireAnyRole('Manager','Administrative'),async(req,res,next)=>{try{const b=req.body||{};const q=await db.query(`INSERT INTO staff_coverage_assignments(unavailable_user_id,covering_user_id,start_date,end_date,responsibilities,linked_references) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[b.unavailableUserId,b.coveringUserId,b.startDate,b.endDate,b.responsibilities||null,b.linkedReferences||null]);await audit(db,{actorUserId:req.user.id,eventType:'roster.coverage',objectType:'staff_coverage',objectId:q.rows[0].id});res.status(201).json({item:q.rows[0]});}catch(e){next(e)}});
module.exports=router;
