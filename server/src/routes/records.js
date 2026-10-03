'use strict';
const express=require('express');
const db=require('../db');
const {requirePermission}=require('../rbac');
const {audit}=require('../audit');
const router=express.Router();

const RECORD_SELECT=`SELECT d.id,d.record_reference,d.title,d.document_type,d.sensitivity,d.original_filename,d.mime_type,d.size_bytes,
  d.linked_type,d.linked_id,d.review_status,d.retention_class,d.review_date,d.expiry_date,d.created_at,d.updated_at,
  COALESCE(x.links,'[]'::json) links
FROM documents d
LEFT JOIN LATERAL (
  SELECT json_agg(json_build_object(
    'id',dl.id,'linkedType',dl.linked_type,'linkedId',dl.linked_id,
    'relationship',dl.relationship,'createdAt',dl.created_at
  ) ORDER BY dl.created_at) links
  FROM document_links dl WHERE dl.document_id=d.id
) x ON true`;

async function syncPrimaryLink(client,documentId,linkedType,linkedId,userId){
  await client.query("DELETE FROM document_links WHERE document_id=$1 AND relationship='Primary'",[documentId]);
  if(linkedType&&linkedId){
    await client.query(`INSERT INTO document_links(document_id,linked_type,linked_id,relationship,created_by)
      VALUES($1,$2,$3,'Primary',$4) ON CONFLICT DO NOTHING`,[documentId,linkedType,linkedId,userId]);
  }
}

router.get('/',requirePermission('records.read'),async(req,res,next)=>{try{
  const q=await db.query(RECORD_SELECT+' ORDER BY d.updated_at DESC LIMIT 1000');
  res.json({records:q.rows});
}catch(e){next(e)}});

router.post('/',requirePermission('records.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  if(!b.title)return res.status(400).json({detail:'Title is required.'});
  const record=await db.tx(async client=>{
    const q=await client.query(`INSERT INTO documents(
      title,document_type,sensitivity,storage_key,original_filename,mime_type,size_bytes,sha256,
      linked_type,linked_id,review_status,retention_class,review_date,expiry_date,uploaded_by
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [b.title,b.documentType||null,b.sensitivity||'Internal',b.storageKey||null,b.originalFilename||null,b.mimeType||null,b.sizeBytes||null,b.sha256||null,b.linkedType||null,b.linkedId||null,b.reviewStatus||'Needs Review',b.retentionClass||null,b.reviewDate||null,b.expiryDate||null,req.user.id]);
    await syncPrimaryLink(client,q.rows[0].id,b.linkedType||null,b.linkedId||null,req.user.id);
    await audit(client,{actorUserId:req.user.id,eventType:'record.create',objectType:'document',objectId:q.rows[0].id,metadata:{recordReference:q.rows[0].record_reference,sensitivity:q.rows[0].sensitivity}});
    return q.rows[0];
  });
  res.status(201).json({record});
}catch(e){next(e)}});

router.patch('/:id',requirePermission('records.write'),async(req,res,next)=>{try{
  const b=req.body||{};
  const record=await db.tx(async client=>{
    const current=(await client.query('SELECT * FROM documents WHERE id=$1',[req.params.id])).rows[0];
    if(!current){const er=new Error('Record not found.');er.statusCode=404;throw er;}
    const hasType=Object.prototype.hasOwnProperty.call(b,'linkedType');
    const hasId=Object.prototype.hasOwnProperty.call(b,'linkedId');
    const linkedType=hasType?(b.linkedType||null):current.linked_type;
    const linkedId=hasId?(b.linkedId||null):current.linked_id;
    const q=await client.query(`UPDATE documents SET
      title=COALESCE($2,title),document_type=COALESCE($3,document_type),sensitivity=COALESCE($4,sensitivity),
      linked_type=$5,linked_id=$6,review_status=COALESCE($7,review_status),retention_class=COALESCE($8,retention_class),
      review_date=$9,expiry_date=$10
      WHERE id=$1 RETURNING *`,
    [req.params.id,b.title||null,b.documentType||null,b.sensitivity||null,linkedType,linkedId,b.reviewStatus||null,b.retentionClass||null,b.reviewDate||null,b.expiryDate||null]);
    await syncPrimaryLink(client,req.params.id,linkedType,linkedId,req.user.id);
    await audit(client,{actorUserId:req.user.id,eventType:'record.update',objectType:'document',objectId:req.params.id,metadata:{recordReference:q.rows[0].record_reference}});
    return q.rows[0];
  });
  res.json({record});
}catch(e){if(e.statusCode)return res.status(e.statusCode).json({detail:e.message});next(e)}});

router.post('/:id/links',requirePermission('records.write'),async(req,res,next)=>{try{
  const b=req.body||{},linkedType=String(b.linkedType||'').trim(),linkedId=String(b.linkedId||'').trim();
  if(!linkedType||!linkedId)return res.status(400).json({detail:'Linked type and linked ID/reference are required.'});
  const exists=await db.query('SELECT 1 FROM documents WHERE id=$1',[req.params.id]);
  if(!exists.rowCount)return res.status(404).json({detail:'Record not found.'});
  let q=await db.query(`INSERT INTO document_links(document_id,linked_type,linked_id,relationship,created_by)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING *`,
    [req.params.id,linkedType,linkedId,b.relationship||'Evidence',req.user.id]);
  if(!q.rowCount)q=await db.query(`SELECT * FROM document_links WHERE document_id=$1 AND lower(linked_type)=lower($2) AND linked_id=$3 LIMIT 1`,[req.params.id,linkedType,linkedId]);
  await audit(db,{actorUserId:req.user.id,eventType:'record.link.add',objectType:'document',objectId:req.params.id,metadata:{linkedType,linkedId}});
  res.status(201).json({link:q.rows[0]});
}catch(e){next(e)}});

router.delete('/:id/links/:linkId',requirePermission('records.write'),async(req,res,next)=>{try{
  const q=await db.query(`DELETE FROM document_links
    WHERE id=$1 AND document_id=$2 AND relationship<>'Primary'
    RETURNING id,linked_type,linked_id`,[req.params.linkId,req.params.id]);
  if(!q.rowCount)return res.status(404).json({detail:'Secondary evidence link not found. Primary links must be changed through record metadata.'});
  await audit(db,{actorUserId:req.user.id,eventType:'record.link.remove',objectType:'document',objectId:req.params.id,metadata:{linkId:req.params.linkId,linkedType:q.rows[0].linked_type,linkedId:q.rows[0].linked_id}});
  res.json({deleted:true});
}catch(e){next(e)}});

module.exports=router;
