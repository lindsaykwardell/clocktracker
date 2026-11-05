import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waitForDatabase, flyFailureReason } from './database.mjs';

const machine = (state, status, output) => [{state,checks:[{name:'role',status,output}]}];
test('restore readiness waits for a started primary with a passing role check', async () => {
  const responses = [machine('starting','passing','primary'), machine('started','critical','primary'), machine('started','passing','replica'), machine('started','passing','primary\n')];
  let pauses = 0;
  await waitForDatabase(async () => responses.shift(), {attempts:4,pause:async()=>{pauses++;}});
  assert.equal(pauses,3);
  assert.equal(responses.length,0);
});
test('empty and persistently unhealthy restores fail instead of reaching SQL', async () => {
  await assert.rejects(waitForDatabase(async()=>[]), /created no machine/);
  let checks=0;
  await assert.rejects(waitForDatabase(async()=>{checks++;return machine('started','critical','primary');}, {attempts:3,pause:async()=>{}}), /did not produce a ready primary/);
  assert.equal(checks,3);
});
test('error categories never expose raw provider credentials or SQL', () => {
  const secret='postgres://operator:secret@example.invalid/database';
  for (const [error, expected] of [
    ['no active leader found','no ready database primary'],
    ['create ssh certificate: denied','SSH certificate creation failed'],
    ['error connecting to SSH server','private-network SSH connection failed'],
    ['password authentication failed','database authentication failed'],
    ['permission denied','permission denied'],
    ['ERROR: column private_column does not exist','database schema does not match the preparation SQL'],
    ['unexpected output','provider command failed'],
  ]) {
    assert.equal(flyFailureReason(error+' '+secret),expected);
  }
  assert.equal(flyFailureReason(secret,true),'command deadline exceeded');
});
