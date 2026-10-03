'use strict';
const express=require('express');const db=require('../db');const {requirePermission}=require('../rbac');const router=express.Router();
router.get('/summary',requirePermission('reports.read'),async(req,res,next)=>{try{const q=await db.query(`SELECT
 (SELECT count(*) FROM cases) cases_total,
 (SELECT count(*) FROM cases WHERE status NOT IN ('Closed','Completed')) cases_open,
 (SELECT count(*) FROM cases WHERE next_follow_up<CURRENT_DATE AND status NOT IN ('Closed','Completed')) cases_overdue,
 (SELECT count(*) FROM applications WHERE stage<>'Closed') applications_open,
 (SELECT count(*) FROM applications WHERE next_follow_up<CURRENT_DATE AND stage<>'Closed') applications_overdue,
 (SELECT count(*) FROM community_matters WHERE status<>'Resolved') community_open,
 (SELECT count(*) FROM field_visits WHERE status<>'Completed') field_open,
 (SELECT count(*) FROM service_recovery_actions WHERE status<>'Completed') recovery_open,
 (SELECT count(*) FROM documents WHERE review_status='Needs Review') records_review,
 (SELECT count(*) FROM events WHERE starts_at>=now() AND status NOT IN ('Cancelled','Completed')) upcoming_events`);res.json({summary:q.rows[0]});}catch(e){next(e)}});
router.get('/management',requirePermission('reports.read'),async(req,res,next)=>{try{
  const [headline,statuses,closures,categories,trend,officers]=await Promise.all([
    db.query(`SELECT
      (SELECT count(*)::int FROM cases) cases_total,
      (SELECT count(*)::int FROM cases WHERE status NOT IN ('Closed','Completed')) cases_open,
      (SELECT count(*)::int FROM cases WHERE status='Completed') cases_completed,
      (SELECT count(*)::int FROM cases WHERE status='Closed') cases_closed,
      (SELECT count(*)::int FROM cases WHERE created_at>=date_trunc('month',CURRENT_DATE)) cases_created_month,
      (SELECT count(*)::int FROM cases WHERE closed_at>=date_trunc('month',CURRENT_DATE)) cases_closed_month,
      (SELECT count(*)::int FROM cases WHERE next_follow_up<CURRENT_DATE AND status NOT IN ('Closed','Completed')) cases_overdue,
      (SELECT count(*)::int FROM applications WHERE stage<>'Closed') applications_open,
      (SELECT count(*)::int FROM applications WHERE next_follow_up<CURRENT_DATE AND stage<>'Closed') applications_overdue,
      (SELECT count(*)::int FROM field_visits WHERE status<>'Completed') field_open,
      (SELECT count(*)::int FROM field_visits WHERE status='Completed' AND completed_at>=date_trunc('month',CURRENT_DATE)) field_completed_month,
      (SELECT count(*)::int FROM community_matters WHERE status<>'Resolved') community_open,
      (SELECT count(*)::int FROM resident_feedback WHERE status<>'Closed') feedback_open,
      (SELECT count(*)::int FROM service_recovery_actions WHERE status NOT IN ('Completed','Closed','Cancelled')) recovery_open,
      (SELECT count(*)::int FROM documents WHERE review_status='Needs Review') records_review,
      (SELECT count(*)::int FROM meeting_actions WHERE status NOT IN ('Completed','Cancelled')) meeting_actions_open,
      (SELECT count(*)::int FROM meeting_actions WHERE status NOT IN ('Completed','Cancelled') AND due_date<CURRENT_DATE) meeting_actions_overdue,
      (SELECT count(*)::int FROM event_actions WHERE status NOT IN ('Completed','Cancelled')) event_actions_open,
      (SELECT count(*)::int FROM appointments WHERE starts_at>=CURRENT_DATE AND status<>'Cancelled') upcoming_appointments,
      (SELECT round(avg(extract(epoch FROM (closed_at-created_at))/86400.0)::numeric,1) FROM cases WHERE closed_at IS NOT NULL AND closed_at>=created_at) avg_days_to_close`),
    db.query(`SELECT status,count(*)::int n
      FROM cases GROUP BY status ORDER BY count(*) DESC,status`),
    db.query(`SELECT coalesce(nullif(trim(closure_reason),''),'Not recorded') reason,count(*)::int n
      FROM cases WHERE status='Closed'
      GROUP BY coalesce(nullif(trim(closure_reason),''),'Not recorded')
      ORDER BY count(*) DESC,reason`),
    db.query(`SELECT coalesce(nullif(trim(category),''),'Uncategorized') category,
      count(*)::int total,
      count(*) FILTER (WHERE status NOT IN ('Closed','Completed'))::int open,
      count(*) FILTER (WHERE status='Closed')::int closed
      FROM cases
      GROUP BY coalesce(nullif(trim(category),''),'Uncategorized')
      ORDER BY count(*) DESC,category
      LIMIT 20`),
    db.query(`WITH months AS (
        SELECT generate_series(
          date_trunc('month',CURRENT_DATE)-interval '5 months',
          date_trunc('month',CURRENT_DATE),
          interval '1 month'
        ) month
      )
      SELECT to_char(m.month,'YYYY-MM') month,
        count(c.id) FILTER (WHERE c.created_at>=m.month AND c.created_at<m.month+interval '1 month')::int opened,
        count(c.id) FILTER (WHERE c.closed_at>=m.month AND c.closed_at<m.month+interval '1 month')::int closed
      FROM months m
      LEFT JOIN cases c ON
        (c.created_at>=m.month AND c.created_at<m.month+interval '1 month')
        OR (c.closed_at>=m.month AND c.closed_at<m.month+interval '1 month')
      GROUP BY m.month ORDER BY m.month`),
    db.query(`SELECT coalesce(u.display_name,'Unassigned') staff,
      count(c.id) FILTER (WHERE c.status NOT IN ('Closed','Completed'))::int open_cases,
      count(c.id) FILTER (WHERE c.next_follow_up<CURRENT_DATE AND c.status NOT IN ('Closed','Completed'))::int overdue_cases
      FROM cases c
      LEFT JOIN users u ON u.id=c.case_owner_user_id
      GROUP BY coalesce(u.display_name,'Unassigned')
      ORDER BY open_cases DESC,staff`)
  ]);
  res.json({
    generatedAt:new Date().toISOString(),
    headline:headline.rows[0]||{},
    caseStatuses:statuses.rows,
    closureReasons:closures.rows,
    categories:categories.rows,
    sixMonthTrend:trend.rows,
    ownerWorkload:officers.rows
  });
}catch(e){next(e)}});

module.exports=router;
