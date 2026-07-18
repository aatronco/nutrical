// tests/athletes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Node has no built-in localStorage — provide a minimal in-memory shim
// before importing athletes.js, since module-level code in athletes.js
// touches localStorage as soon as its functions run.
class LocalStorageShim {
  #store = new Map();
  getItem(key) { return this.#store.has(key) ? this.#store.get(key) : null; }
  setItem(key, value) { this.#store.set(key, String(value)); }
  removeItem(key) { this.#store.delete(key); }
  clear() { this.#store.clear(); }
}
globalThis.localStorage = new LocalStorageShim();

const { getAthleteWeekOverride, setAthleteWeekOverride } = await import('../js/athletes.js');

test('getAthleteWeekOverride returns null when unset', () => {
  assert.equal(getAthleteWeekOverride('nobody'), null);
});

test('setAthleteWeekOverride then getAthleteWeekOverride round-trips', () => {
  setAthleteWeekOverride('alejandro', 3);
  assert.equal(getAthleteWeekOverride('alejandro'), 3);
});

test('setAthleteWeekOverride clamps above 12', () => {
  setAthleteWeekOverride('alejandro', 15);
  assert.equal(getAthleteWeekOverride('alejandro'), 12);
});

test('setAthleteWeekOverride clamps below 1', () => {
  setAthleteWeekOverride('alejandro', 0);
  assert.equal(getAthleteWeekOverride('alejandro'), 1);
});
