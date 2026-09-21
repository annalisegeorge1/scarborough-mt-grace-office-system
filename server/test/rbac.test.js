'use strict';const test=require('node:test');const assert=require('node:assert/strict');const {has}=require('../src/rbac');
test('manager has all permissions',()=>assert.equal(has({role:'Manager'},'anything'),true));
test('field officer can read assigned cases but not audit',()=>{assert.equal(has({role:'Field Officer'},'cases.read'),true);assert.equal(has({role:'Field Officer'},'audit.read'),false)});
