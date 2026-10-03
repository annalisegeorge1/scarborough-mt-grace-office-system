'use strict';
const express=require('express');
const db=require('../db');
const {requirePermission,has}=require('../rbac');
const router=express.Router();

const openCaseStatuses=['Closed','Completed'];
const openApplicationStage='Closed';

router.get('/',requirePermission('cases.read'),async(req,res,next)=>{try{
  const isField=req.user.role==='Field Officer';
  const uid=req.user.id;
  const permissions={
    applications:has(req.user,'applications.read'),
    field:has(req.user,'field.write'),
    feedback:has(req.user,'feedback.write'),
    appointments:has(req.user,'appointments.write'),
    community:has(req.user,'community.write'),
    reports:has(req.user,'reports.read'),
    records:has(req.user,'records.read')
  };

  const caseWhere=isField?'(c.assigned_user_id=$1 OR c.case_owner_user_id=$1)':'TRUE';
  const caseParams=isField?[uid]:[];
  const cases=await db.query(
    `SELECT c.id,c.reference,c.resident_name,c.status,c.priority,c.next_follow_up,c.next_action,c.updated_at,
            au.display_name assigned_name,ou.display_name owner_name
       FROM cases c
       LEFT JOIN users au ON au.id=c.assigned_user_id
       LEFT JOIN users ou ON ou.id=c.case_owner_user_id
      WHERE ${caseWhere}
      ORDER BY
        CASE WHEN c.next_follow_up<CURRENT_DATE AND c.status NOT IN ('Closed','Completed') THEN 0
             WHEN c.next_follow_up=CURRENT_DATE AND c.status NOT IN ('Closed','Completed') THEN 1
             WHEN c.priority='Urgent' AND c.status NOT IN ('Closed','Completed') THEN 2
             ELSE 3 END,
        c.next_follow_up NULLS LAST,c.updated_at DESC
      LIMIT 12`,caseParams);

  const caseSummary=await db.query(
    `SELECT
       count(*) FILTER (WHERE c.status NOT IN ('Closed','Completed'))::int open,
       count(*) FILTER (WHERE c.next_follow_up<CURRENT_DATE AND c.status NOT IN ('Closed','Completed'))::int overdue,
       count(*) FILTER (WHERE c.next_follow_up=CURRENT_DATE AND c.status NOT IN ('Closed','Completed'))::int due_today,
       count(*) FILTER (WHERE c.priority IN ('Urgent','High') AND c.status NOT IN ('Closed','Completed'))::int high_priority
       FROM cases c WHERE ${caseWhere}`,caseParams);

  const applicationCount=permissions.applications
    ? await db.query(isField
      ? "SELECT count(*)::int n FROM applications WHERE assigned_user_id=$1 AND stage<>$2"
      : "SELECT count(*)::int n FROM applications WHERE stage<>$1",isField?[uid,openApplicationStage]:[openApplicationStage])
    : {rows:[{n:0}]};

  const applications=permissions.applications
    ? await db.query(
      isField
        ? `SELECT id,reference,applicant_name,assistance_type,agency,stage,next_follow_up,updated_at
             FROM applications WHERE assigned_user_id=$1 AND stage<>$2
             ORDER BY CASE WHEN next_follow_up<CURRENT_DATE THEN 0 WHEN next_follow_up=CURRENT_DATE THEN 1 ELSE 2 END,next_follow_up NULLS LAST,updated_at DESC LIMIT 8`
        : `SELECT id,reference,applicant_name,assistance_type,agency,stage,next_follow_up,updated_at
             FROM applications WHERE stage<>$1
             ORDER BY CASE WHEN next_follow_up<CURRENT_DATE THEN 0 WHEN next_follow_up=CURRENT_DATE THEN 1 ELSE 2 END,next_follow_up NULLS LAST,updated_at DESC LIMIT 8`,
      isField?[uid,openApplicationStage]:[openApplicationStage])
    : {rows:[]};

  const fieldCount=permissions.field
    ? await db.query(isField
      ? "SELECT count(*)::int n FROM field_visits WHERE lead_user_id=$1 AND status<>'Completed'"
      : "SELECT count(*)::int n FROM field_visits WHERE status<>'Completed'",isField?[uid]:[])
    : {rows:[{n:0}]};

  const field=permissions.field
    ? await db.query(
      isField
        ? `SELECT id,visit_type,linked_type,linked_reference,scheduled_at,location_text,purpose,next_action,next_follow_up,status
             FROM field_visits WHERE lead_user_id=$1 AND status<>'Completed'
             ORDER BY COALESCE(scheduled_at,now()+interval '100 years') ASC,updated_at DESC LIMIT 8`
        : `SELECT id,visit_type,linked_type,linked_reference,scheduled_at,location_text,purpose,next_action,next_follow_up,status
             FROM field_visits WHERE status<>'Completed'
             ORDER BY COALESCE(scheduled_at,now()+interval '100 years') ASC,updated_at DESC LIMIT 8`,
      isField?[uid]:[])
    : {rows:[]};

  const appointmentCount=permissions.appointments
    ? await db.query(isField
      ? "SELECT count(*)::int n FROM appointments WHERE assigned_user_id=$1 AND starts_at>=CURRENT_DATE AND status<>'Cancelled'"
      : "SELECT count(*)::int n FROM appointments WHERE starts_at>=CURRENT_DATE AND status<>'Cancelled'",isField?[uid]:[])
    : {rows:[{n:0}]};

  const appointments=permissions.appointments
    ? await db.query(
      isField
        ? `SELECT id,case_id,application_id,appointment_type,starts_at,location,status,note
             FROM appointments WHERE assigned_user_id=$1 AND starts_at>=CURRENT_DATE AND status<>'Cancelled'
             ORDER BY starts_at ASC LIMIT 8`
        : `SELECT id,case_id,application_id,appointment_type,starts_at,location,status,note
             FROM appointments WHERE starts_at>=CURRENT_DATE AND status<>'Cancelled'
             ORDER BY starts_at ASC LIMIT 8`,
      isField?[uid]:[])
    : {rows:[]};

  const feedbackCount=permissions.feedback
    ? await db.query("SELECT count(*)::int n FROM resident_feedback WHERE status<>'Closed'")
    : {rows:[{n:0}]};

  const feedback=permissions.feedback
    ? await db.query(`SELECT id,case_reference,feedback_type,theme,status,follow_up_requested,updated_at
                         FROM resident_feedback
                        WHERE status<>'Closed'
                        ORDER BY follow_up_requested DESC,updated_at DESC LIMIT 6`)
    : {rows:[]};

  const community=permissions.community
    ? await db.query(`SELECT id,title,matter_type,area,priority,status,next_follow_up,updated_at
                         FROM community_matters
                        WHERE status<>'Resolved'
                        ORDER BY CASE WHEN next_follow_up<CURRENT_DATE THEN 0 WHEN next_follow_up=CURRENT_DATE THEN 1 ELSE 2 END,
                                 next_follow_up NULLS LAST,updated_at DESC LIMIT 6`)
    : {rows:[]};


  const communityFollowups=permissions.community
    ? await db.query(`SELECT count(*)::int n FROM community_matters
                       WHERE status<>'Resolved' AND next_follow_up IS NOT NULL AND next_follow_up<=CURRENT_DATE`)
    : {rows:[{n:0}]};

  const meetingActionCount=permissions.community
    ? await db.query(`SELECT count(*)::int n FROM meeting_actions
                       WHERE status NOT IN ('Completed','Cancelled')`)
    : {rows:[{n:0}]};

  const caseAttention=await db.query(
    `SELECT c.id,c.reference,c.resident_name,c.status,c.priority,c.next_follow_up,c.next_action
       FROM cases c
      WHERE `+caseWhere+`
        AND c.status NOT IN ('Closed','Completed')
        AND (c.next_follow_up<=CURRENT_DATE OR c.priority IN ('Urgent','High'))
      ORDER BY c.next_follow_up NULLS LAST,c.updated_at DESC
      LIMIT 15`,caseParams);

  const applicationAttention=permissions.applications
    ? await db.query(
      isField
        ? `SELECT id,reference,applicant_name,assistance_type,agency,stage,next_follow_up
             FROM applications
            WHERE assigned_user_id=$1 AND stage<>$2 AND next_follow_up<=CURRENT_DATE
            ORDER BY next_follow_up,updated_at DESC LIMIT 10`
        : `SELECT id,reference,applicant_name,assistance_type,agency,stage,next_follow_up
             FROM applications
            WHERE stage<>$1 AND next_follow_up<=CURRENT_DATE
            ORDER BY next_follow_up,updated_at DESC LIMIT 10`,
      isField?[uid,openApplicationStage]:[openApplicationStage])
    : {rows:[]};

  const fieldAttention=permissions.field
    ? await db.query(
      isField
        ? `SELECT id,visit_type,linked_type,linked_reference,scheduled_at,location_text,next_action,next_follow_up,status
             FROM field_visits
            WHERE lead_user_id=$1 AND status<>'Completed'
              AND (next_follow_up<=CURRENT_DATE OR scheduled_at::date<=CURRENT_DATE)
            ORDER BY COALESCE(next_follow_up,scheduled_at::date),updated_at DESC LIMIT 10`
        : `SELECT id,visit_type,linked_type,linked_reference,scheduled_at,location_text,next_action,next_follow_up,status
             FROM field_visits
            WHERE status<>'Completed'
              AND (next_follow_up<=CURRENT_DATE OR scheduled_at::date<=CURRENT_DATE)
            ORDER BY COALESCE(next_follow_up,scheduled_at::date),updated_at DESC LIMIT 10`,
      isField?[uid]:[])
    : {rows:[]};

  const communityAttention=permissions.community
    ? await db.query(`SELECT id,title,matter_type,area,priority,status,next_follow_up
                       FROM community_matters
                      WHERE status<>'Resolved' AND next_follow_up<=CURRENT_DATE
                      ORDER BY next_follow_up,updated_at DESC LIMIT 10`)
    : {rows:[]};

  const meetingAttention=permissions.community
    ? await db.query(`SELECT ma.id,ma.meeting_id,ma.action_text,ma.owner_text,ma.due_date,ma.status,
                             m.reference,m.title
                        FROM meeting_actions ma
                        JOIN meetings m ON m.id=ma.meeting_id
                       WHERE ma.status NOT IN ('Completed','Cancelled') AND ma.due_date<=CURRENT_DATE
                       ORDER BY ma.due_date,ma.updated_at DESC LIMIT 12`)
    : {rows:[]};

  const feedbackAttention=permissions.feedback
    ? await db.query(`SELECT id,case_reference,feedback_type,theme,status,updated_at
                       FROM resident_feedback
                      WHERE status<>'Closed' AND follow_up_requested=true
                      ORDER BY updated_at DESC LIMIT 8`)
    : {rows:[]};

  const attention=[
    ...caseAttention.rows.map(x=>({kind:'Case',reference:x.reference,title:x.resident_name||'Resident case',subtitle:(x.priority||'Standard')+' · '+(x.status||'Open'),detail:x.next_action||'Case follow-up requires attention.',dueDate:x.next_follow_up||null,url:'index.html?case='+encodeURIComponent(x.id)})),
    ...applicationAttention.rows.map(x=>({kind:'Application',reference:x.reference,title:x.applicant_name||'Application',subtitle:(x.assistance_type||'Assistance')+' · '+(x.stage||'Open'),detail:x.agency?'Agency: '+x.agency:'Application follow-up is due.',dueDate:x.next_follow_up||null,url:'applications.html'})),
    ...fieldAttention.rows.map(x=>({kind:'Field',reference:x.linked_reference||x.visit_type,title:x.visit_type||'Field visit',subtitle:(x.status||'Planned')+' · '+(x.location_text||'Location not recorded'),detail:x.next_action||'Field activity requires attention.',dueDate:x.next_follow_up||String(x.scheduled_at||'').slice(0,10)||null,url:'field.html'})),
    ...communityAttention.rows.map(x=>({kind:'Community',reference:x.matter_type||'Community matter',title:x.title,subtitle:(x.area||'No area')+' · '+(x.status||'Open'),detail:'Community follow-up is due.',dueDate:x.next_follow_up||null,url:'community.html'})),
    ...meetingAttention.rows.map(x=>({kind:'Meeting action',reference:x.reference,title:x.title,subtitle:(x.owner_text||'Unassigned')+' · '+(x.status||'Open'),detail:x.action_text,dueDate:x.due_date||null,url:'meetings.html?meeting='+encodeURIComponent(x.meeting_id)+'&tab=manage'})),
    ...feedbackAttention.rows.map(x=>({kind:'Feedback',reference:x.case_reference||x.feedback_type||'Resident feedback',title:x.theme||x.feedback_type||'Follow-up requested',subtitle:x.status||'Open',detail:'Resident follow-up has been requested.',dueDate:null,url:'feedback.html'}))
  ];

  const todayKey=new Date().toISOString().slice(0,10);
  const stateOf=v=>!v?'attention':String(v).slice(0,10)<todayKey?'overdue':String(v).slice(0,10)===todayKey?'today':'upcoming';
  attention.forEach(x=>x.state=stateOf(x.dueDate));
  const rank={overdue:0,today:1,attention:2,upcoming:3};
  attention.sort((a,b)=>(rank[a.state]??9)-(rank[b.state]??9)||String(a.dueDate||'9999-12-31').localeCompare(String(b.dueDate||'9999-12-31')));
  const attentionQueue=attention.slice(0,30);

  const recent=await db.query(
    `SELECT a.case_id,a.occurred_at,a.activity_type,a.description,c.reference,c.resident_name
       FROM case_activity a JOIN cases c ON c.id=a.case_id
      WHERE ${isField?'(c.assigned_user_id=$1 OR c.case_owner_user_id=$1)':'TRUE'}
      ORDER BY a.occurred_at DESC LIMIT 10`,isField?[uid]:[]);

  const summary=caseSummary.rows[0]||{open:0,overdue:0,due_today:0,high_priority:0};
  res.json({
    generatedAt:new Date().toISOString(),
    user:{name:req.user.name||req.user.email,role:req.user.role},
    scope:isField?'assigned':'office',
    permissions,
    summary:{
      casesOpen:summary.open||0,
      casesOverdue:summary.overdue||0,
      casesDueToday:summary.due_today||0,
      highPriority:summary.high_priority||0,
      applicationsOpen:applicationCount.rows[0]?.n||0,
      fieldOpen:fieldCount.rows[0]?.n||0,
      upcomingAppointments:appointmentCount.rows[0]?.n||0,
      feedbackOpen:feedbackCount.rows[0]?.n||0,
      communityFollowUps:communityFollowups.rows[0]?.n||0,
      meetingActionsOpen:meetingActionCount.rows[0]?.n||0,
      attentionOpen:attentionQueue.length,
      attentionOverdue:attentionQueue.filter(x=>x.state==='overdue').length,
      attentionDueToday:attentionQueue.filter(x=>x.state==='today').length
    },
    attention:attentionQueue,
    cases:cases.rows,
    applications:applications.rows,
    field:field.rows,
    appointments:appointments.rows,
    feedback:feedback.rows,
    community:community.rows,
    recentActivity:recent.rows
  });
}catch(e){next(e)}});

module.exports=router;
