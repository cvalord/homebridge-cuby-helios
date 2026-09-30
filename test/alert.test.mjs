import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateAlert } from '../dist/alertState.js';
test('single alert, survives restart and oscillation; confirmed refill rearms', () => {
  let s = { triggered: false, refillReadings: 0 };
  assert.equal(updateAlert(s, 21, 20, true), undefined);
  assert.equal(updateAlert(s, 20, 20, true), 'alert');
  s = JSON.parse(JSON.stringify(s));
  for (const n of [18, 20, 19, 21, 17]) assert.equal(updateAlert(s, n, 20, true), undefined);
  assert.equal(updateAlert(s, 60, 20, true), undefined);
  assert.equal(updateAlert(s, 61, 20, true), 'refill');
  assert.equal(updateAlert(s, 19, 20, true), 'alert');
});
test('disabled, bounds and isolated spike', () => {
  const s = { triggered: false, refillReadings: 0 };
  assert.equal(updateAlert(s, 0, 20, false), undefined);
  assert.equal(updateAlert(s, 0, 0, true), 'alert');
  const upper = { triggered: false, refillReadings: 0 };
  assert.equal(updateAlert(upper, 100, 100, true), 'alert');
  updateAlert(s, 0, 100, true);
  updateAlert(s, 80, 100, true);
  updateAlert(s, 0, 100, true);
  assert.equal(s.refillReadings, 0);
  assert.equal(s.triggered, true);
});
