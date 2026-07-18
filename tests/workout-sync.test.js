// tests/workout-sync.test.js
// Pure helpers de la capa de respaldo — la parte de red (sheets.js) se importa
// dinámicamente dentro del módulo, así que aquí solo se prueba mapeo y cola.
import { test } from 'node:test';
import assert from 'node:assert/strict';

class LocalStorageShim {
  #store = new Map();
  getItem(key) { return this.#store.has(key) ? this.#store.get(key) : null; }
  setItem(key, value) { this.#store.set(key, String(value)); }
  removeItem(key) { this.#store.delete(key); }
  clear() { this.#store.clear(); }
}
globalThis.localStorage = new LocalStorageShim();

const { sessionToRow, rowToSession, prsToRow, sessionKeyOf, enqueue, pendingCount } =
  await import('../js/workout-sync.js');

test('sessionToRow → rowToSession round-trips the record', () => {
  const rec = { date: '2026-07-20', session: 'S2', week: 3, phase: 'bloque1' };
  const row = sessionToRow(rec, 'alejandro');
  assert.equal(row[0], '2026-07-20');
  assert.equal(row[1], 'S2');
  assert.equal(row[2], '3');
  assert.equal(row[3], 'bloque1');
  assert.equal(row[4], 'alejandro');

  const back = rowToSession(row);
  assert.equal(back.date, rec.date);
  assert.equal(back.session, rec.session);
  assert.equal(back.week, 3); // vuelve como número
  assert.equal(back.phase, rec.phase);
  assert.equal(back.completed, true);
});

test('rowToSession tolerates empty/short rows', () => {
  const r = rowToSession([]);
  assert.equal(r.date, undefined);
  assert.ok(Number.isNaN(r.week));
});

test('prsToRow serializes PRs with blanks for missing lifts', () => {
  const row = prsToRow({ banca: 117, pullups: 5 }, 'alejandro');
  assert.equal(row[1], 'alejandro');
  assert.equal(row[2], 117);
  assert.equal(row[3], '');  // deadlift ausente
  assert.equal(row[4], '');  // sentadilla ausente
  assert.equal(row[5], 5);
});

test('sessionKeyOf dedupes by date+session+week', () => {
  const a = { date: '2026-07-20', session: 'S1', week: 2 };
  const b = rowToSession(['2026-07-20', 'S1', '2', 'bloque1', 'alejandro']);
  assert.equal(sessionKeyOf(a), sessionKeyOf(b));
});

test('enqueue persists across module state and pendingCount reflects it', () => {
  localStorage.removeItem('workout_sync_queue');
  assert.equal(pendingCount(), 0);
  enqueue('Entrenamientos', ['2026-07-20', 'S1', '1', 'bloque1', 'alejandro', 'ts']);
  enqueue('PRs', ['2026-07-20', 'alejandro', 117, 190, '', 5]);
  assert.equal(pendingCount(), 2);
  const raw = JSON.parse(localStorage.getItem('workout_sync_queue'));
  assert.equal(raw[0].sheet, 'Entrenamientos');
  assert.equal(raw[1].sheet, 'PRs');
});

test('queue survives corrupt JSON by resetting to empty', () => {
  localStorage.setItem('workout_sync_queue', '{not json');
  assert.equal(pendingCount(), 0);
});
