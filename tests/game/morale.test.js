import assert from 'node:assert/strict';
import { createInitialState } from '../../scripts/game/state.js';
import { tickMorale } from '../../scripts/game/sim/morale.js';
import { placeFacility } from '../../scripts/game/sim/economy.js';

const NOW = 1_700_000_000_000;
const rng = () => 0.5;

function setup() {
  const s = createInitialState(NOW, { rng });
  s.facilities = {};
  s.grid.cells.fill(null);
  return s;
}

function addPerson(s, job, facilityId, morale = 100) {
  const id = `p_${s.nextId++}`;
  s.people[id] = { id, job, name: 'テスト', morale, age: 0, lifespan: 20, assignedTo: facilityId, recruitedAt: NOW };
  if (facilityId) s.facilities[facilityId].workers.push(id);
  else s.waiting.push(id);
  return id;
}

// 減少と待機枠は不変
{
  const s = setup();
  const f = placeFacility(s, 'factory', 0, 0);
  const p = addPerson(s, 'villager', f);
  const w = addPerson(s, 'villager', null, 70);
  tickMorale(s, 10);
  assert.ok(Math.abs(s.people[p].morale - 98) < 1e-9);
  assert.equal(s.people[w].morale, 70);
}

// 飯屋の範囲内は回復（上限 100）
{
  const s = setup();
  const f = placeFacility(s, 'factory', 0, 0);
  const c = placeFacility(s, 'canteen', 2, 2);
  addPerson(s, 'cook', c);
  const p = addPerson(s, 'villager', f, 60);
  placeFacility(s, 'stall', 1, 1);
  const st = Object.values(s.facilities).find((x) => x.type === 'stall').id;
  const q = addPerson(s, 'merchant', st, 60);
  tickMorale(s, 10);
  assert.ok(Math.abs(s.people[p].morale - 58) < 1e-9, 'factory at (0,0) is not in range');
  assert.ok(Math.abs(s.people[q].morale - 67.5) < 1e-9, 'cook canteen recovers 0.75/s');
  tickMorale(s, 1000);
  assert.equal(s.people[q].morale, 100);
}

// moraleWarn は 50 を下回った瞬間に施設ごと 1 回
{
  const s = setup();
  const f = placeFacility(s, 'factory', 0, 0);
  addPerson(s, 'villager', f, 50.01);
  addPerson(s, 'villager', f, 50.01);
  let ev = tickMorale(s, 0.1);
  assert.deepEqual(ev, [{ type: 'moraleWarn', facilityId: f }]);
  ev = tickMorale(s, 0.1);
  assert.deepEqual(ev, []);
}

// 士気 0 で逃亡
{
  const s = setup();
  const f = placeFacility(s, 'factory', 0, 0);
  const p = addPerson(s, 'smith', f, 0.01);
  const ev = tickMorale(s, 0.1);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].type, 'escape');
  assert.equal(ev[0].personId, p);
  assert.equal(ev[0].job, 'smith');
  assert.equal(ev[0].facilityId, f);
  assert.equal(s.people[p], undefined);
  assert.deepEqual(s.facilities[f].workers, []);
  assert.equal(s.stats.escaped, 1);
}

// 長時間放置で全員逃亡（100 → 0 は 500 秒）
{
  const s = setup();
  const f = placeFacility(s, 'factory', 0, 0);
  addPerson(s, 'villager', f);
  let escapes = 0;
  for (let i = 0; i < 5100; i++) escapes += tickMorale(s, 0.1).filter((e) => e.type === 'escape').length;
  assert.equal(escapes, 1);
}

console.log('morale.test.js: ok');
