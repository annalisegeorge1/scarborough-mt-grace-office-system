'use strict';const {pool}=require('../src/db');
(async()=>{try{const s=await pool.query(`DELETE FROM sessions WHERE idle_expires_at < now() OR absolute_expires_at < now()`);console.log('Expired sessions removed:',s.rowCount);}finally{await pool.end();}})().catch(e=>{console.error(e);process.exit(1)});
