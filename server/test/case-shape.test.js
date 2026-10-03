'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {toClient,fromClient}=require('../src/case-shape');

test('case shape exposes formal closure and resident visibility fields',()=>{
  const row={
    id:'case-1',reference:'SMG-2026-000001',resident_id:'resident-1',
    status:'Closed',priority:'High',resident_name:'Test Resident',
    resident_visible:false,closure_reason:'Resolved / Assistance Completed',
    closed_at:'2026-10-03T18:00:00.000Z',
    created_at:'2026-10-01T12:00:00.000Z',updated_at:'2026-10-03T18:00:00.000Z'
  };
  const c=toClient(row);
  assert.equal(c.status,'Closed');
  assert.equal(c.residentId,'resident-1');
  assert.equal(c.residentVisible,false);
  assert.equal(c.closureReason,'Resolved / Assistance Completed');
  assert.equal(c.closedAt,'2026-10-03T18:00:00.000Z');
});

test('case shape defaults an absent closure timestamp without inventing a value',()=>{
  const c=toClient({id:'case-2',reference:'SMG-2026-000002',status:'Completed',created_at:'2026-10-03T12:00:00Z',updated_at:'2026-10-03T12:00:00Z'});
  assert.equal(c.closedAt,'');
  assert.equal(c.closureReason,'');
  assert.equal(c.residentVisible,true);
});

test('fromClient preserves closure reason, visibility and central workflow fields',()=>{
  const row=fromClient({
    status:'Closed',
    priority:'Standard',
    residentId:'resident-3',
    closureReason:'Information / Guidance Provided',
    residentVisible:false,
    publicStatus:'Closed',
    publicUpdate:'Matter concluded.',
    nextAction:'No further action.',
    referralAgency:'Test Agency'
  });
  assert.equal(row.status,'Closed');
  assert.equal(row.resident_id,'resident-3');
  assert.equal(row.closure_reason,'Information / Guidance Provided');
  assert.equal(row.resident_visible,false);
  assert.equal(row.public_status,'Closed');
  assert.equal(row.public_update,'Matter concluded.');
  assert.equal(row.next_action,'No further action.');
  assert.equal(row.referral_agency,'Test Agency');
});
