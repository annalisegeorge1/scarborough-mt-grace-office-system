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
 (SELECT count(*) FROM events WHERE starts_at>=now() AND status NOT IN ('Cancelled','Completed')) upcoming_events`);res.json({summary:q.rows[0]});}catch(e){next(e)}});module.exports=router;
