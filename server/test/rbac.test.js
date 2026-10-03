'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {has,ROLE_PERMISSIONS}=require('../src/rbac');

test('manager has wildcard authority',()=>{
  assert.deepEqual(ROLE_PERMISSIONS.Manager,['*']);
  assert.equal(has({role:'Manager'},'anything'),true);
});

test('administrative role has operational and publishing authority but not access administration wildcard',()=>{
  const u={role:'Administrative'};
  assert.equal(has(u,'cases.write'),true);
  assert.equal(has(u,'records.write'),true);
  assert.equal(has(u,'audit.read'),true);
  assert.equal(has(u,'content.publish'),true);
  assert.equal(has(u,'accessAdmin'),false);
});

test('senior officer can work cases and field operations but cannot read restricted records or reports',()=>{
  const u={role:'Senior Officer'};
  assert.equal(has(u,'cases.read'),true);
  assert.equal(has(u,'cases.write'),true);
  assert.equal(has(u,'field.write'),true);
  assert.equal(has(u,'community.write'),true);
  assert.equal(has(u,'records.read'),false);
  assert.equal(has(u,'reports.read'),false);
  assert.equal(has(u,'audit.read'),false);
});

test('field officer assigned-case permissions satisfy case read/write checks but do not broaden administration',()=>{
  const u={role:'Field Officer'};
  assert.equal(has(u,'cases.read'),true);
  assert.equal(has(u,'cases.write'),true);
  assert.equal(has(u,'field.write'),true);
  assert.equal(has(u,'applications.read'),true);
  assert.equal(has(u,'records.read'),false);
  assert.equal(has(u,'reports.read'),false);
  assert.equal(has(u,'audit.read'),false);
  assert.equal(has(u,'content.publish'),false);
});

test('senior staff is read/report oriented and cannot modify cases',()=>{
  const u={role:'Senior Staff'};
  assert.equal(has(u,'cases.read'),true);
  assert.equal(has(u,'records.read'),true);
  assert.equal(has(u,'reports.read'),true);
  assert.equal(has(u,'cases.write'),false);
  assert.equal(has(u,'records.write'),false);
});

test('unknown role receives no permission',()=>{
  assert.equal(has({role:'Unknown'},'cases.read'),false);
  assert.equal(has(null,'cases.read'),false);
});
