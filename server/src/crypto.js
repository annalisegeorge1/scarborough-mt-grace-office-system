'use strict';
const crypto=require('crypto');
const {promisify}=require('util');
const scrypt=promisify(crypto.scrypt);
const random=(bytes=32)=>crypto.randomBytes(bytes).toString('base64url');
const sha256=v=>crypto.createHash('sha256').update(String(v)).digest('hex');
async function hashPassword(password){const salt=random(16);const key=await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024});return `scrypt$16384$8$1$${salt}$${Buffer.from(key).toString('base64')}`;}
async function verifyPassword(password,stored){try{const [alg,N,r,p,salt,b64]=String(stored).split('$');if(alg!=='scrypt')return false;const expected=Buffer.from(b64,'base64');const key=await scrypt(password,salt,expected.length,{N:Number(N),r:Number(r),p:Number(p),maxmem:64*1024*1024});return crypto.timingSafeEqual(expected,Buffer.from(key));}catch{return false;}}
module.exports={random,sha256,hashPassword,verifyPassword};
