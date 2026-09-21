'use strict';
async function audit(db,{actorUserId=null,eventType,objectType=null,objectId=null,outcome='success',metadata={}}){
  const safe=JSON.parse(JSON.stringify(metadata,(k,v)=>/password|token|csrf|cookie|secret/i.test(k)?'[REDACTED]':v));
  await db.query(`INSERT INTO audit_log(actor_user_id,event_type,object_type,object_id,outcome,metadata) VALUES($1,$2,$3,$4,$5,$6::jsonb)`,[actorUserId,eventType,objectType,objectId,outcome,JSON.stringify(safe)]);
}
module.exports={audit};
