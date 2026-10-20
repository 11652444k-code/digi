import assert from 'node:assert/strict';
import { createInitialState } from '../../scripts/game/state.js';
import { recruit, assign } from '../../scripts/game/sim/economy.js';
import { tick } from '../../scripts/game/sim/tick.js';

const NOW = 1_700_000_000_000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(7);
const s = createInitialState(NOW, { rng });
const merchant = s.street.find((p) => p.job === 'merchant');
const r = recruit(s, merchant.id, NOW, rng);
assert.equal(r.ok, true);
const stallId = Object.values(s.facilities).find((f) => f.type === 'stall').id;
assert.equal(assign(s, r.personId, stallId).ok, true);

const before = s.money;
let now = NOW;
const events = [];
for (let i = 0; i < 100; i++) {
  now += 100;
  events.push(...tick(s, 0.1, now, rng));
}
const gained = s.money - before;
assert.ok(Math.abs(gained - 30) < 0.01, `gained ${gained}`);
assert.ok(Math.abs(s.gameDays - 10 / 60) < 1e-9);
assert.ok(s.street.length >= 1 && s.street.length <= 4);
assert.ok(s.people[r.personId].morale < 100 && s.people[r.personId].morale > 97);
assert.deepEqual(events, []);

console.log('smoke.test.js: ok');
