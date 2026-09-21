'use strict';
const path=require('path');
function bool(v,d=false){if(v==null)return d;return /^(1|true|yes)$/i.test(String(v));}
function int(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
const root=path.resolve(__dirname,'..','..');
const production=(process.env.NODE_ENV||'development')==='production';
const config={
  production,
  port:int(process.env.PORT,8080),
  publicOrigin:process.env.PUBLIC_ORIGIN||(process.env.RENDER_EXTERNAL_HOSTNAME?`https://${process.env.RENDER_EXTERNAL_HOSTNAME}`:'http://localhost:8080'),
  databaseUrl:process.env.DATABASE_URL||'',
  databaseSsl:(process.env.DATABASE_SSL||'').toLowerCase(),
  dbPoolMax:int(process.env.DB_POOL_MAX,production?5:12),
  trustProxy:int(process.env.TRUST_PROXY,production?1:0),
  cookieName:process.env.SESSION_COOKIE_NAME||'smg_session',
  sessionIdleMinutes:int(process.env.SESSION_IDLE_MINUTES,30),
  sessionAbsoluteHours:int(process.env.SESSION_ABSOLUTE_HOURS,12),
  storageDriver:process.env.PRIVATE_STORAGE_DRIVER||'local',
  storagePath:path.resolve(__dirname,'..',process.env.PRIVATE_STORAGE_PATH||'storage/private'),
  allowLocalPrivateStorage:bool(process.env.ALLOW_LOCAL_PRIVATE_STORAGE,false),
  maxUploadMb:int(process.env.MAX_UPLOAD_MB,12),
  uploadsEnabled:bool(process.env.UPLOADS_ENABLED,false),
  clamav:{host:process.env.CLAMAV_HOST||'',port:int(process.env.CLAMAV_PORT,3310),required:bool(process.env.MALWARE_SCAN_REQUIRED,production),timeoutMs:int(process.env.CLAMAV_TIMEOUT_MS,15000)},
  s3:{endpoint:process.env.S3_ENDPOINT||'',region:process.env.S3_REGION||'auto',bucket:process.env.S3_BUCKET||'',accessKeyId:process.env.S3_ACCESS_KEY_ID||'',secretAccessKey:process.env.S3_SECRET_ACCESS_KEY||'',forcePathStyle:bool(process.env.S3_FORCE_PATH_STYLE,false)},
  staticRoot:root
};
if(production && !config.databaseUrl) throw new Error('DATABASE_URL is required in production.');
if(production && config.storageDriver==='local' && !config.allowLocalPrivateStorage) {
  console.warn('[SECURITY] Local private storage is disabled for production. Configure managed private object storage before document uploads.');
}
module.exports=config;
