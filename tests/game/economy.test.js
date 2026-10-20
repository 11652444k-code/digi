import assert from 'node:assert/strict';
import { createInitialState } from '../../scripts/game/state.js';
import {
  jobMult, moraleMult, prestigeMult, buildCost, build, canBuild, isUnlockedFacility,
  facilityIncome, totalIncomePerSecond, capacity, recruit, assign, unassign,
  removeFacility, moveFacility, addIncome, placeFacility,
} from '../../scripts/game/sim/economy.js';

const NOW = 1_700_000_000_000;
const rng = () => 0.5;

function addPerson(state, job, morale = 100) {
  const id = `p_${state.nextId++}`;
  state.people[id] = { id, job, name: 'テスト', morale, age: 0, lifespan: 20, assignedTo: null, recruitedAt: NOW };
  state.waiting.push(id);
  return id;
}

// jobMult 3 通り
assert.equal(jobMult('merchant', 'stall'), 3.0);
assert.equal(jobMult('villager', 'factory'), 1.0);
assert.equal(jobMult('cook', 'factory'), 0.5);
assert.equal(jobMult('smith', 'stall'), 0.5);
assert.equal(jobMult('merchant', 'canteen'), 1.0, 'support facility is neutral');

// moraleMult 境界
assert.equal(moraleMult(50), 1.0);
assert.ok(Math.abs(moraleMult(49) - 0.99) < 1e-9);
assert.equal(moraleMult(0), 0.5);
assert.equal(moraleMult(100), 1.0);

// buildCost の成長
{
  const s = createInitialState(NOW, { rng });
  assert.equal(buildCost(s, 'stall'), 170, 'initial stall exists so n=1');
  assert.equal(buildCost(s, 'dorm'), 250);
  placeFacility(s, 'dorm', 0, 0);
  assert.equal(buildCost(s, 'dorm'), 425);
  placeFacility(s, 'dorm', 1, 0);
  assert.equal(buildCost(s, 'dorm'), 723);
  placeFacility(s, 'dorm', 2, 0);
  assert.equal(buildCost(s, 'dorm'), Math.ceil(250 * 1.7 ** 3));
}

// 解禁と canBuild
{
  const s = createInitialState(NOW, { rng });
  assert.equal(isUnlockedFacility(s, 'stall'), true);
  assert.equal(isUnlockedFacility(s, 'factory'), false);
  assert.equal(isUnlockedFacility(s, 'canteen'), false);
  assert.equal(canBuild(s, 'factory', 0, 0).reason, 'locked');
  assert.equal(canBuild(s, 'stall', 2, 4).reason, 'occupied');
  assert.equal(canBuild(s, 'stall', 5, 0).reason, 'oob');
  s.money = 10;
  assert.equal(canBuild(s, 'stall', 0, 0).reason, 'money');
  s.money = 1000;
  const r = build(s, 'stall', 0, 0, NOW);
  assert.equal(r.ok, true);
  assert.equal(s.money, 1000 - 170);
  assert.equal(r.events[0].type, 'build');
  assert.equal(s.grid.cells[0], r.facilityId);
  assert.equal(s.stats.built, 1);
  assert.equal(isUnlockedFacility(s, 'factory'), true);
  build(s, 'dorm', 1, 0, NOW);
  assert.equal(isUnlockedFacility(s, 'canteen'), true);
}

// 収容・勧誘・配属
{
  const s = createInitialState(NOW, { rng });
  assert.deepEqual(capacity(s), { used: 0, max: 6 });
  const merchant = s.street.find((p) => p.job === 'merchant');
  const r = recruit(s, merchant.id, NOW, rng);
  assert.equal(r.ok, true);
  assert.equal(r.events[0].type, 'recruit');
  assert.equal(s.people[r.personId].morale, 100);
  assert.ok(s.people[r.personId].lifespan >= 6);
  assert.equal(s.street.some((p) => p.id === merchant.id), false);
  assert.equal(recruit(s, 'nope', NOW, rng).reason, 'notfound');

  const stall = Object.values(s.facilities)[0];
  const a = assign(s, r.personId, stall.id);
  assert.equal(a.ok, true);
  assert.equal(a.events[0].type, 'assign');
  assert.deepEqual(s.waiting, []);
  assert.equal(s.people[r.personId].assignedTo, stall.id);
  assert.equal(totalIncomePerSecond(s), 3);
  assert.equal(facilityIncome(s, stall.id).workers[0].contribution, 3);

  // 定員超過
  const v = addPerson(s, 'villager');
  assert.equal(assign(s, v, stall.id).reason, 'capacity');
  // 寮は定員 0
  const dormId = placeFacility(s, 'dorm', 0, 0);
  assert.equal(assign(s, v, dormId).reason, 'capacity');
  // 不得意配属
  const factoryId = placeFacility(s, 'factory', 4, 0);
  const cook = addPerson(s, 'cook');
  assert.equal(assign(s, cook, factoryId).events[0].type, 'assignMismatch');
  // 飯屋への配属は可
  const canteenId = placeFacility(s, 'canteen', 0, 2);
  assert.equal(assign(s, v, canteenId).ok, true);

  // unassign
  assert.equal(unassign(s, cook).ok, true);
  assert.ok(s.waiting.includes(cook));
  assert.equal(unassign(s, cook).reason, 'notfound');
  s.waiting.push('x1', 'x2', 'x3');
  assert.equal(unassign(s, v).reason, 'full');
}

// 満員で勧誘失敗
{
  const s = createInitialState(NOW, { rng });
  for (let i = 0; i < 4; i++) addPerson(s, 'villager');
  const r = recruit(s, s.street[0].id, NOW, rng);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'full');
  assert.equal(r.events[0].type, 'recruitFull');

  const s2 = createInitialState(NOW, { rng });
  s2.capacityBase = 1;
  addPerson(s2, 'villager');
  assert.equal(recruit(s2, s2.street[0].id, NOW, rng).reason, 'full');
}

// 撤去: 50% 返金、workers は waiting へ、溢れたら escape
{
  const s = createInitialState(NOW, { rng });
  s.money = 0;
  const factoryId = placeFacility(s, 'factory', 0, 0);
  const ids = [addPerson(s, 'villager'), addPerson(s, 'villager'), addPerson(s, 'smith')];
  for (const id of ids) assign(s, id, factoryId);
  addPerson(s, 'villager');
  addPerson(s, 'villager');
  assert.equal(s.waiting.length, 2);
  const r = removeFacility(s, factoryId);
  assert.equal(r.ok, true);
  assert.equal(s.money, 300);
  assert.equal(s.waiting.length, 4);
  assert.equal(r.events.filter((e) => e.type === 'escape').length, 1);
  assert.equal(s.stats.escaped, 1);
  assert.equal(s.grid.cells[0], null);
  assert.equal(s.facilities[factoryId], undefined);
  assert.equal(removeFacility(s, factoryId).ok, false);
}

// 移設
{
  const s = createInitialState(NOW, { rng });
  const stall = Object.values(s.facilities)[0];
  assert.equal(moveFacility(s, stall.id, 9, 9).reason, 'oob');
  placeFacility(s, 'dorm', 0, 0);
  assert.equal(moveFacility(s, stall.id, 0, 0).reason, 'occupied');
  assert.equal(moveFacility(s, stall.id, 1, 1).ok, true);
  assert.equal(s.grid.cells[1 * 5 + 1], stall.id);
  assert.equal(s.grid.cells[4 * 5 + 2], null);
  assert.equal(stall.x, 1);
}

// prestigeMult と addIncome
{
  const s = createInitialState(NOW, { rng });
  s.prestige.count = 2;
  assert.ok(Math.abs(prestigeMult(s) - 1.2) < 1e-9);
  const stall = Object.values(s.facilities)[0];
  const v = addPerson(s, 'villager');
  assign(s, v, stall.id);
  const before = s.money;
  const added = addIncome(s, 10);
  assert.ok(Math.abs(added - 12) < 1e-9);
  assert.ok(Math.abs(s.money - before - 12) < 1e-9);
  assert.ok(Math.abs(s.totalEarnedThisRun - 12) < 1e-9);
  assert.ok(Math.abs(s.prestige.totalEarnedAllTime - 12) < 1e-9);
}

console.log('economy.test.js: ok');
