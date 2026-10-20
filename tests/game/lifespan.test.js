import assert from 'node:assert/strict';
import { createInitialState } from '../../scripts/game/state.js';
import { rollLifespan, tickLifespan } from '../../scripts/game/sim/lifespan.js';
import { placeFacility } from '../../scripts/game/sim/economy.js';

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

// rollLifespan: 下限 6、平均およそ 12、標準偏差およそ 4
{
  const rng = mulberry32(42);
  const xs = Array.from({ length: 20000 }, () => rollLifespan(rng));
  assert.ok(xs.every((x) => x >= 6 && Number.isFinite(x)));
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  assert.ok(Math.abs(mean - 12) < 0.3, `mean ${mean}`);
  assert.ok(Math.abs(sd - 4) < 0.3, `sd ${sd}`);
  for (const v of [0, 0.25, 0.5, 0.999999]) {
    const x = rollLifespan(() => v);
    assert.ok(Number.isFinite(x) && x >= 6, `rng ${v} -> ${x}`);
  }
  assert.equal(rollLifespan(() => 0), 12, 'u1=1-0 gives z=0 (mean)');
  let i = 0;
  const seq = [0.999999, 0.5]; // u1 small, cos(pi) = -1 -> far below mean -> clamped
  assert.equal(rollLifespan(() => seq[i++]), 6);
}

function setup() {
  const s = createInitialState(NOW, { rng: () => 0.5 });
  const f = Object.values(s.facilities)[0].id;
  const id = 'p_100';
  s.people[id] = { id, job: 'merchant', name: 'ドルフ', morale: 100, age: 11.99, lifespan: 12, assignedTo: f, recruitedAt: NOW };
  s.facilities[f].workers.push(id);
  const w = 'p_101';
  s.people[w] = { id: w, job: 'villager', name: 'ハンス', morale: 100, age: 0, lifespan: 12, assignedTo: null, recruitedAt: NOW };
  s.waiting.push(w);
  return { s, f, id, w };
}

// 未解禁: age は進むが退職しない
{
  const { s, id } = setup();
  const ev = tickLifespan(s, 6);
  assert.deepEqual(ev, []);
  assert.ok(Math.abs(s.people[id].age - 12.09) < 1e-9);
  assert.ok(s.people[id]);
}

// 解禁時: 到達で退職、送別費徴収
{
  const { s, f, id, w } = setup();
  s.unlocked.push('lifespan');
  s.prestige.count = 2;
  s.money = 1000;
  const ev = tickLifespan(s, 6);
  assert.equal(ev.length, 1);
  assert.deepEqual(ev[0], { type: 'retire', personId: id, name: 'ドルフ', job: 'merchant', days: 12, cost: 100 });
  assert.equal(s.money, 900);
  assert.equal(s.people[id], undefined);
  assert.deepEqual(s.facilities[f].workers, []);
  assert.equal(s.stats.retired, 1);
  assert.ok(s.people[w], 'waiting person not yet due');
}

// 送別費は所持金まで
{
  const { s } = setup();
  s.unlocked.push('lifespan');
  s.prestige.count = 3;
  s.money = 30;
  const ev = tickLifespan(s, 6);
  assert.equal(ev[0].cost, 30);
  assert.equal(s.money, 0);
}

console.log('lifespan.test.js: ok');
