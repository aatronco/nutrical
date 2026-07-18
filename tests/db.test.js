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
    date: '2026-07-20', session: 'S1', week: 1,
    phase: 'bloque1', completed: false, sets: []
  };
  assert.doesNotThrow(() => validateSession(s));
});

test('validateSession accepts new leg days S2 and S4', () => {
  for (const key of ['S2', 'S4']) {
    const s = {
      date: '2026-07-20', session: key, week: 3,
      phase: 'bloque1', completed: true, sets: []
    };
    assert.doesNotThrow(() => validateSession(s));
  }
});

test('validateSession accepts week 12 in peaking phase', () => {
  const s = {
    date: '2026-10-05', session: 'S5', week: 12,
    phase: 'peaking', completed: true, sets: []
  };
  assert.doesNotThrow(() => validateSession(s));
});

test('validateSession rejects invalid session name', () => {
  const s = {
    date: '2026-07-20', session: 'S9', week: 1,
    phase: 'bloque1', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /session/);
});

test('validateSession rejects retired kine session key', () => {
  const s = {
    date: '2026-07-20', session: 'kine', week: 1,
    phase: 'bloque1', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /session/);
});

test('validateSession rejects week out of range', () => {
  const s = {
    date: '2026-07-20', session: 'S1', week: 13,
    phase: 'bloque1', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /week/);
});

test('validateSession rejects retired GZCLP phase names', () => {
  const s = {
    date: '2026-07-20', session: 'S1', week: 1,
    phase: 'volumen', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /phase/);
});
