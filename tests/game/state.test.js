import assert from 'node:assert/strict';
import {
  createInitialState, serialize, deserialize, SAVE_KEY, SAVE_VERSION,
} from '../../scripts/game/state.js';
import { recruit, assign } from '../../scripts/game/sim/economy.js';
import { JOBS } from '../../scripts/game/data/jobs.js';
import { LINES, pickLine } from '../../scripts/game/data/lines.js';

const NOW = 1_700_000_000_000;
const rng = () => 0.5;

assert.equal(SAVE_KEY, 'digi.maou.save');
assert.equal(SAVE_VERSION, 1);

// 初期配置
{
  const s = createInitialState(NOW, { rng });
  assert.equal(s.version, 1);
  assert.equal(s.money, 60);
  assert.equal(s.savedAt, NOW);
  assert.equal(s.grid.cells.length, 25);
  const facs = Object.values(s.facilities);
  assert.equal(facs.length, 1);
  assert.equal(facs[0].type, 'stall');
  assert.deepEqual([facs[0].x, facs[0].y], [2, 4]);
  assert.equal(s.grid.cells[4 * 5 + 2], facs[0].id);
  assert.match(facs[0].id, /^f_\d+$/);
  assert.equal(s.street.length, 3);
  assert.equal(s.street.filter((p) => p.job === 'villager').length, 2);
  assert.equal(s.street.filter((p) => p.job === 'merchant').length, 1);
  assert.equal(new Set(s.street.map((p) => p.x)).size, 3, 'staggered x');
  s.street.forEach((p) => assert.match(p.id, /^s_\d+$/));
  assert.deepEqual(s.tutorial, { step: 0, done: false });
  assert.deepEqual(s.stats, { recruited: 0, escaped: 0, retired: 0, built: 0, prestiges: 0 });
}

// serialize → deserialize の往復
{
  const s = createInitialState(NOW, { rng });
  const r = recruit(s, s.street.find((p) => p.job === 'merchant').id, NOW, rng);
  assign(s, r.personId, Object.keys(s.facilities)[0]);
  recruit(s, s.street[0].id, NOW, rng);
  s.money = 123.5;
  const json = serialize(s, NOW + 5000);
  assert.equal(s.savedAt, NOW + 5000);
  const back = deserialize(json, NOW + 9999);
  assert.deepEqual(back, s);
}

// 壊れた JSON / 復元不能
assert.equal(deserialize('{not json', NOW), null);
assert.equal(deserialize('', NOW), null);
assert.equal(deserialize('null', NOW), null);
assert.equal(deserialize('[1,2]', NOW), null);
assert.equal(deserialize('"hello"', NOW), null);
assert.equal(deserialize('{}', NOW), null);
assert.equal(deserialize(JSON.stringify({ version: 99, money: 1 }), NOW), null);

// SPEC 6.1 形式の旧データを migrate
{
  const legacy = {
    version: 1,
    savedAt: NOW - 1000,
    prestige: { count: 1, totalEarnedAllTime: 32000 },
    unlocked: ['lifespan'],
    money: 1240,
    totalEarnedThisRun: 4200,
    capacityBase: 6,
    grid: { w: 5, h: 5, cells: [null, 'fac_01'] },
    facilities: { fac_01: { type: 'stall', x: 2, y: 4, workers: ['p_01', 'ghost'] } },
    people: {
      p_01: { job: 'merchant', name: 'ドルフ', morale: 82, age: 3.2, lifespan: 18, assignedTo: 'fac_01', recruitedAt: NOW - 5000 },
      p_02: { job: 'cook', name: 'マルゴ', morale: 90, age: 1, lifespan: 22, assignedTo: null, recruitedAt: NOW - 3000 },
    },
    waiting: ['p_02'],
    tutorial: { step: 4, done: true },
    stats: { recruited: 14, escaped: 2, retired: 3 },
  };
  const s = deserialize(JSON.stringify(legacy), NOW);
  assert.ok(s);
  assert.equal(s.savedAt, NOW - 1000);
  assert.equal(s.facilities.fac_01.id, 'fac_01');
  assert.deepEqual(s.facilities.fac_01.workers, ['p_01']);
  assert.equal(s.grid.cells[4 * 5 + 2], 'fac_01');
  assert.equal(s.grid.cells[1], null);
  assert.equal(s.people.p_01.id, 'p_01');
  assert.deepEqual(s.waiting, ['p_02']);
  assert.deepEqual(s.stats, { recruited: 14, escaped: 2, retired: 3, built: 0, prestiges: 0 });
  assert.equal(s.gameDays, 0);
  assert.ok(s.nextId >= 2);
  assert.ok(Array.isArray(s.street));
  assert.equal(s.prestigeNotified, false);
}

// 版なしデータも migrate、存在しない人物を指す waiting は除去
{
  const s = deserialize(JSON.stringify({ money: 5, waiting: ['nobody'] }), NOW);
  assert.ok(s);
  assert.equal(s.money, 5);
  assert.equal(s.version, 1);
  assert.deepEqual(s.waiting, []);
}

// データ: 名前テーブル 10 個以上、文言 3 本以上、禁止語なし
for (const j of Object.values(JOBS)) assert.ok(j.names.length >= 10, j.id);
for (const [k, v] of Object.entries(LINES)) {
  if (Array.isArray(v)) assert.ok(v.length >= 3, k);
}
assert.equal(Object.keys(LINES.tutorial).length, 4);
assert.ok(!/奴隷|搾取/.test(JSON.stringify(LINES)));
assert.equal(pickLine('assign', { job: '商人', facility: '露店' }, () => 0), '商人を露店に配属した。本人は乗り気だ');
assert.equal(pickLine('nope'), '');

console.log('state.test.js: ok');
