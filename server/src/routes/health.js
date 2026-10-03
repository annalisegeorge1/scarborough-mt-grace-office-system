'use strict';
const express=require('express');const db=require('../db');const config=require('../config');const storage=require('../storage');const virusScan=require('../virus-scan');const pkg=require('../../package.json');const router=express.Router();

router.get('/live',(req,res)=>res.json({status:'ok',service:'Scarborough / Mt. Grace Office API',version:pkg.version,time:new Date().toISOString()}));

router.get('/',async(req,res)=>{
  const out={status:'ok',service:'Scarborough / Mt. Grace Office API',version:pkg.version,time:new Date().toISOString(),database:'unknown',storage:config.storageDriver,uploadsEnabled:config.uploadsEnabled};
  try{await db.query('SELECT 1');out.database='ok';}catch(e){out.status='degraded';out.database='unavailable';}
  res.status(out.status==='ok'?200:503).json(out);
});

router.get('/readiness',async(req,res)=>{
  const checks={
    database:false,
    productionMode:config.production,
    productionOrigin:/^https:\/\//i.test(config.publicOrigin),
    trustProxy:Number(config.trustProxy)>=1,
    sessionIdlePolicy:config.sessionIdleMinutes>=5&&config.sessionIdleMinutes<=120,
    sessionAbsolutePolicy:config.sessionAbsoluteHours>=1&&config.sessionAbsoluteHours<=24,
    privateStorage:!config.uploadsEnabled||storage.readiness(),
    malwareScanner:!config.uploadsEnabled||!config.clamav.required||virusScan.configured(),
    residentProfiles:false,
    meetingOperations:false,
    evidenceLinks:false,
    directApiIsolation:false
  };
  try{
    await db.query('SELECT 1');checks.database=true;
    const rp=await db.query(`SELECT
      to_regclass('public.residents') IS NOT NULL residents_table,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='cases' AND column_name='resident_id'
      ) resident_id_column,
      (to_regclass('public.meetings') IS NOT NULL
       AND to_regclass('public.meeting_attendance') IS NOT NULL
       AND to_regclass('public.meeting_actions') IS NOT NULL
       AND to_regclass('public.meeting_timeline') IS NOT NULL) meeting_operations,
      (to_regclass('public.document_links') IS NOT NULL) evidence_links,
      NOT EXISTS(
        SELECT 1
        FROM information_schema.role_table_grants
        WHERE table_schema='public'
          AND table_name IN ('residents','public_content_revisions','document_links')
          AND grantee IN ('anon','authenticated')
          AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
      ) direct_api_isolation`);
    checks.residentProfiles=!!(rp.rows[0]?.residents_table&&rp.rows[0]?.resident_id_column);
    checks.meetingOperations=!!rp.rows[0]?.meeting_operations;
    checks.evidenceLinks=!!rp.rows[0]?.evidence_links;
    checks.directApiIsolation=!!rp.rows[0]?.direct_api_isolation;
  }catch{}
  const ready=Object.values(checks).every(Boolean);
  res.status(ready?200:503).json({
    ready,
    checks,
    uploadsEnabled:config.uploadsEnabled,
    environment:{
      production:config.production,
      trustProxy:Number(config.trustProxy)||0,
      sessionIdleMinutes:config.sessionIdleMinutes,
      sessionAbsoluteHours:config.sessionAbsoluteHours,
      storageDriver:config.storageDriver
    }
  });
});

module.exports=router;
