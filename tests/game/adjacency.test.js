import assert from 'node:assert/strict';
import { createInitialState } from '../../scripts/game/state.js';
import {
  neighbors4, neighbors8, facilityAt, adjacencyFor, canteenCoverage,
} from '../../scripts/game/sim/adjacency.js';
import { placeFacility, facilityIncome } from '../../scripts/game/sim/economy.js';

const NOW = 1_700_000_000_000;
const rng = () => 0.5;

function emptyState() {
  const s = createInitialState(NOW, { rng });
  s.facilities = {};
  s.grid.cells.fill(null);
  return s;
}

function addWorker(s, facilityId, job) {
  const id = `p_${s.nextId++}`;
  s.people[id] = { id, job, name: 'テスト', morale: 100, age: 0, lifespan: 20, assignedTo: facilityId, recruitedAt: NOW };
  s.facilities[facilityId].workers.push(id);
  return id;
}

// 近傍
assert.equal(neighbors4(0, 0, 5, 5).length, 2);
assert.equal(neighbors4(2, 2, 5, 5).length, 4);
assert.equal(neighbors8(0, 0, 5, 5).length, 3);
assert.equal(neighbors8(2, 2, 5, 5).length, 8);
assert.equal(neighbors8(4, 2, 5, 5).length, 5);

// facilityAt
{
  const s = createInitialState(NOW, { rng });
  assert.equal(facilityAt(s, 2, 4).type, 'stall');
  assert.equal(facilityAt(s, 0, 0), null);
  assert.equal(facilityAt(s, -1, 0), null);
}

// A-01: 工場の 4 近傍に寮 → ×1.3
{
  const s = emptyState();
  const f = placeFacility(s, 'factory', 2, 2);
  assert.equal(adjacencyFor(s, f).incomeMult, 1.0);
  assert.deepEqual(adjacencyFor(s, f).badges, []);
  placeFacility(s, 'dorm', 3, 3); // 斜めは対象外
  assert.equal(adjacencyFor(s, f).incomeMult, 1.0);
  placeFacility(s, 'dorm', 2, 1);
  assert.equal(adjacencyFor(s, f).incomeMult, 1.3);
  assert.deepEqual(adjacencyFor(s, f).badges, ['×1.3']);
  addWorker(s, f, 'villager');
  const inc = facilityIncome(s, f);
  assert.equal(inc.adjMult, 1.3);
  assert.ok(Math.abs(inc.perSecond - 2.6) < 1e-9);
}

// A-03: 飯屋の 4 近傍に工場 → noiseMult 0.5
{
  const s = emptyState();
  const c = placeFacility(s, 'canteen', 2, 2);
  assert.equal(adjacencyFor(s, c).noiseMult, 1.0);
  placeFacility(s, 'factory', 1, 1); // 斜めは対象外
  assert.equal(adjacencyFor(s, c).noiseMult, 1.0);
  placeFacility(s, 'factory', 1, 2);
  assert.equal(adjacencyFor(s, c).noiseMult, 0.5);
  assert.ok(adjacencyFor(s, c).badges.includes('騒音'));
}

// canteenCoverage: 無人は無効、cook ボーナス、騒音、合算
{
  const s = emptyState();
  const c = placeFacility(s, 'canteen', 2, 2);
  const stall = placeFacility(s, 'stall', 3, 3); // 斜め
  const far = placeFacility(s, 'stall', 0, 0);
  assert.equal(canteenCoverage(s).size, 0, 'inactive canteen covers nothing');

  addWorker(s, c, 'villager');
  let cov = canteenCoverage(s);
  assert.equal(cov.get(stall), 0.5);
  assert.equal(cov.has(far), false);
  assert.equal(cov.has(c), false, 'canteen does not cover itself');

  s.facilities[c].workers = [];
  addWorker(s, c, 'cook');
  cov = canteenCoverage(s);
  assert.equal(cov.get(stall), 0.75);

  placeFacility(s, 'factory', 2, 1);
  cov = canteenCoverage(s);
  assert.equal(cov.get(stall), 0.375);

  const c2 = placeFacility(s, 'canteen', 4, 4);
  addWorker(s, c2, 'villager');
  cov = canteenCoverage(s);
  assert.equal(cov.get(stall), 0.375 + 0.5);
}

console.log('adjacency.test.js: ok');
