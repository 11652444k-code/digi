import assert from 'node:assert/strict';
import { createInitialState } from '../../scripts/game/state.js';
import { applyOffline } from '../../scripts/game/sim/offline.js';
import { placeFacility } from '../../scripts/game/sim/economy.js';

const NOW = 1_700_000_000_000;
const HOUR = 3600 * 1000;

function setup() {
  const s = createInitialState(NOW, { rng: () => 0.5 });
  const stall = Object.values(s.facilities)[0].id;
  const id = 'p_100';
  s.people[id] = { id, job: 'merchant', name: 'ドルフ', morale: 100, age: 0, lifespan: 20, assignedTo: stall, recruitedAt: NOW };
  s.facilities[stall].workers.push(id);
  s.money = 0;
  return { s, stall, id };
}

// 8 時間上限、効率 0.5、士気 floor 10
{
  const { s, id } = setup();
  const r = applyOffline(s, NOW + 24 * HOUR);
  assert.equal(r.elapsedSec, 8 * 3600);
  assert.equal(r.earned, 3 * 8 * 3600 * 0.5);
  assert.equal(s.money, r.earned);
  assert.equal(s.totalEarnedThisRun, r.earned);
  assert.equal(s.people[id].morale, 10, 'morale floors at 10, no escape');
  assert.deepEqual(r.retired, []);
  assert.equal(s.savedAt, NOW + 24 * HOUR);
  assert.ok(s.people[id].age > 0, 'age advances even when lifespan is locked');
}

// 短時間: 範囲内の通常計算
{
  const { s, id } = setup();
  const r = applyOffline(s, NOW + 100 * 1000);
  assert.equal(r.elapsedSec, 100);
  assert.equal(r.earned, 150);
  assert.ok(Math.abs(s.people[id].morale - 80) < 1e-9);
}

// 未来の savedAt（時計の巻き戻り）は 0 秒扱い
{
  const { s } = setup();
  const r = applyOffline(s, NOW - HOUR);
  assert.equal(r.elapsedSec, 0);
  assert.equal(r.earned, 0);
}

// 既に floor より低い士気は据え置き、飯屋範囲内は回復
{
  const { s, id } = setup();
  s.people[id].morale = 5;
  applyOffline(s, NOW + HOUR);
  assert.equal(s.people[id].morale, 5);

  const t = setup();
  const c = placeFacility(t.s, 'canteen', 1, 3);
  t.s.people.p_200 = { id: 'p_200', job: 'cook', name: 'マルゴ', morale: 100, age: 0, lifespan: 20, assignedTo: c, recruitedAt: NOW };
  t.s.facilities[c].workers.push('p_200');
  t.s.people[t.id].morale = 40;
  applyOffline(t.s, NOW + HOUR);
  assert.equal(t.s.people[t.id].morale, 100);
}

// 寿命: 解禁済みなら到達者を retired に（送別費なし）
{
  const { s, stall, id } = setup();
  s.unlocked.push('lifespan');
  s.prestige.count = 1;
  s.people[id].age = 19;
  const r = applyOffline(s, NOW + 2 * HOUR);
  assert.deepEqual(r.retired, [{ name: 'ドルフ', job: 'merchant', days: 139 }]);
  assert.equal(s.people[id], undefined);
  assert.deepEqual(s.facilities[stall].workers, []);
  assert.equal(s.stats.retired, 1);
  assert.equal(s.money, r.earned, 'no farewell cost offline');
}

console.log('offline.test.js: ok');
