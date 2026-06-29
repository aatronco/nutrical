// tests/db.test.js
// IndexedDB is not available in Node — test the pure helper that builds
// the object store config and validates session objects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSession, DB_NAME, DB_VERSION, STORES } from '../js/db.js';

test('DB_NAME and DB_VERSION are defined', () => {
  assert.equal(typeof DB_NAME, 'string');
  assert.ok(DB_VERSION >= 1);
});

test('STORES contains workout_sessions', () => {
  assert.ok(STORES.includes('workout_sessions'));
});

test('validateSession accepts valid session', () => {
  const s = {
    date: '2026-06-28', session: 'S1', week: 1,
    phase: 'volumen', completed: false, sets: []
  };
  assert.doesNotThrow(() => validateSession(s));
});

test('validateSession rejects invalid session name', () => {
  const s = {
    date: '2026-06-28', session: 'S9', week: 1,
    phase: 'volumen', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /session/);
});

test('validateSession rejects week out of range', () => {
  const s = {
    date: '2026-06-28', session: 'S1', week: 9,
    phase: 'volumen', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /week/);
});
