'use strict';
const ROLE_PERMISSIONS={
  Manager:['*'],
  Administrative:['search.use','cases.read','cases.write','applications.read','applications.write','records.read','records.write','correspondence.write','community.write','reports.read','feedback.write','audit.read','appointments.write','content.write'],
  'Senior Officer':['search.use','cases.read','cases.write','applications.read','applications.write','community.write','field.write','feedback.write','appointments.write','correspondence.write'],
  'Field Officer':['search.use','cases.read.assigned','cases.write.assigned','field.write','community.write','applications.read.assigned','appointments.write'],
  'Senior Staff':['cases.read','records.read','community.write','reports.read','search.use']
};
function has(user,permission){const set=ROLE_PERMISSIONS[user?.role]||[];return set.includes('*')||set.includes(permission)||set.includes(permission+'.assigned')||set.includes(permission.replace(/\.assigned$/,''));}
function requirePermission(permission){return (req,res,next)=>{if(!req.user)return res.status(401).json({detail:'Authentication required.'});if(!has(req.user,permission))return res.status(403).json({detail:'Permission denied.'});next();};}
function requireAnyRole(...roles){return (req,res,next)=>{if(!req.user)return res.status(401).json({detail:'Authentication required.'});if(!roles.includes(req.user.role))return res.status(403).json({detail:'This action requires additional administrative authority.'});next();};}
module.exports={ROLE_PERMISSIONS,has,requirePermission,requireAnyRole};
