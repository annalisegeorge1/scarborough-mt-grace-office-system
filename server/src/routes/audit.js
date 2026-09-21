'use strict';
const express=require('express');const db=require('../db');const {requirePermission}=require('../rbac');const router=express.Router();
router.get('/',requirePermission('audit.read'),async(req,res,next)=>{try{const limit=Math.min(Number(req.query.limit)||200,1000);const q=await db.query(`SELECT a.id,a.occurred_at,a.event_type,a.object_type,a.object_id,a.outcome,a.metadata,u.display_name actor_name FROM audit_log a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.occurred_at DESC LIMIT $1`,[limit]);res.json({events:q.rows});}catch(e){next(e)}});module.exports=router;
