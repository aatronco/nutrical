// tests/load-calculator.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getT1Sets, getCurrentWeek } from '../js/load-calculator.js';

test('getT1Sets S1 week 1 returns correct kg', () => {
  const sets = getT1Sets('S1', 1);
  const workSets = sets.filter(s => s.type === 'work');
  assert.equal(workSets[0].kg, 88);
  assert.equal(workSets[0].reps, 10);
  assert.equal(workSets[1].kg, 88);
  assert.equal(workSets[2].kg, 94);
});

test('getT1Sets S1 week 6 returns PR attempts', () => {
  const sets = getT1Sets('S1', 6);
  const prSets = sets.filter(s => s.type === 'pr');
  assert.equal(prSets.length, 3);
  assert.equal(prSets[0].kg, 119);
  assert.equal(prSets[1].kg, 123);
});

test('getT1Sets S5 week 1 returns 140 kg top set', () => {
  const sets = getT1Sets('S5', 1);
  const work = sets.find(s => s.type === 'work');
  assert.equal(work.kg, 140);
});

test('getT1Sets S5 week 6 returns PR sequence', () => {
  const sets = getT1Sets('S5', 6);
  assert.ok(sets.some(s => s.kg === 170 && s.type === 'pr'));
  assert.ok(sets.some(s => s.kg === 175 && s.type === 'pr'));
});

test('getCurrentWeek returns 1 for day 0', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today), 1);
});

test('getCurrentWeek returns 2 for day 8', () => {
  const d = new Date();
  d.setDate(d.getDate() - 8);
  assert.equal(getCurrentWeek(d.toISOString().slice(0, 10)), 2);
});

test('getCurrentWeek clamps to 6 maximum', () => {
  const d = new Date();
  d.setDate(d.getDate() - 60);
  assert.equal(getCurrentWeek(d.toISOString().slice(0, 10)), 6);
});

test('getCurrentWeek returns override when provided', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today, 4), 4);
});

test('getCurrentWeek clamps override above 6', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today, 9), 6);
});

test('getCurrentWeek clamps override below 1', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today, 0), 1);
});

test('getCurrentWeek falls back to date calculation when override is null', () => {
  const d = new Date();
  d.setDate(d.getDate() - 8);
  assert.equal(getCurrentWeek(d.toISOString().slice(0, 10), null), 2);
});
