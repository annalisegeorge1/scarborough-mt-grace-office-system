'use strict';
const {Pool}=require('pg');
const config=require('./config');
const ssl=config.databaseSsl==='require'?{rejectUnauthorized:false}:undefined;
const pool=new Pool({connectionString:config.databaseUrl||undefined,ssl,max:config.dbPoolMax,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});
async function query(text,params){return pool.query(text,params);}
async function tx(fn){const c=await pool.connect();try{await c.query('BEGIN');const out=await fn(c);await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
module.exports={pool,query,tx};
