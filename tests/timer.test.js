import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer } from '../js/timer.js';

test('createTimer calls onComplete when seconds elapse', async () => {
  let completed = false;
  const timer = createTimer(0, () => {}, () => { completed = true; });
  timer.start();
  await new Promise(r => setTimeout(r, 50));
  assert.ok(completed);
});

test('createTimer skip calls onComplete immediately', () => {
  let completed = false;
  const timer = createTimer(300, () => {}, () => { completed = true; });
  timer.start();
  timer.skip();
  assert.ok(completed);
});

test('createTimer stop prevents onComplete', async () => {
  let completed = false;
  const timer = createTimer(0, () => {}, () => { completed = true; });
  timer.start();
  timer.stop();
  await new Promise(r => setTimeout(r, 50));
  assert.equal(completed, false);
});
