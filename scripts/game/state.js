import { BALANCE } from './data/balance.js';
import { FACILITIES } from './data/facilities.js';
import { JOBS } from './data/jobs.js';
import { placeFacility } from './sim/economy.js';
import { createStreetPerson } from './sim/spawn.js';
import { rollLifespan } from './sim/lifespan.js';

export const SAVE_KEY = 'digi.maou.save';
export const SAVE_VERSION = 1;

const INITIAL_STALL = { x: 2, y: 4 };
const INITIAL_STREET = [
  { job: 'villager', x: 0.15 },
  { job: 'merchant', x: 0.4 },
  { job: 'villager', x: 0.65 },
];
const UNLOCK_IDS = ['lifespan', 'hero', 'disaster'];

function emptyStats() {
  return { recruited: 0, escaped: 0, retired: 0, built: 0, prestiges: 0 };
}

/**
 * 新しい周回の初期状態を作る。
 * 露店 1 軒を (2,4) に建設済み（無料）、通りに村人 2・商人 1。
 * opts.prestige / opts.unlocked / opts.stats を引き継ぐ。初期金 = 60 + 200 × prestige.count。
 * 転生済み（count >= 1）の周回ではチュートリアルを完了扱いにする。
 * @param {number} now epoch ms
 * @param {{prestige?:object, unlocked?:string[], stats?:object, rng?:() => number}} [opts]
 * @returns {object} state
 */
export function createInitialState(now = 0, opts = {}) {
  const rng = opts.rng || Math.random;
  const prestige = {
    count: (opts.prestige && opts.prestige.count) || 0,
    totalEarnedAllTime: (opts.prestige && opts.prestige.totalEarnedAllTime) || 0,
  };
  const state = {
    version: SAVE_VERSION,
    savedAt: now,
    prestige,
    unlocked: Array.isArray(opts.unlocked) ? [...opts.unlocked] : [],
    money: BALANCE.initialMoney + BALANCE.prestige.startMoneyBonus * prestige.count,
    totalEarnedThisRun: 0,
    capacityBase: 6,
    grid: { w: 5, h: 5, cells: Array(25).fill(null) },
    facilities: {},
    people: {},
    waiting: [],
    street: [],
    tutorial: { step: 0, done: prestige.count > 0 },
    stats: { ...emptyStats(), ...(opts.stats || {}) },
    nextId: 1,
    gameDays: 0,
    spawnTimer: BALANCE.spawn.intervalMin,
    prestigeNotified: false,
  };
  placeFacility(state, 'stall', INITIAL_STALL.x, INITIAL_STALL.y);
  for (const s of INITIAL_STREET) state.street.push(createStreetPerson(state, s.job, s.x, rng, now));
  return state;
}

/**
 * savedAt を now に更新して JSON 文字列にする。
 * @param {object} state
 * @param {number} now epoch ms
 * @returns {string}
 */
export function serialize(state, now) {
  state.savedAt = now;
  return JSON.stringify(state);
}

/**
 * JSON からセーブを復元する。旧版・欠損は既定値で補って整合性を取り直す（migrate）。
 * パース不能、オブジェクトでない、facilities も money もない、未来の version は null。
 * @param {string} json
 * @param {number} now epoch ms（savedAt / recruitedAt 欠損時の補完に使う）
 * @returns {object|null}
 */
export function deserialize(json, now = 0) {
  let raw;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    return null;
  }
  if (!isObject(raw)) return null;
  if (typeof raw.version === 'number' && raw.version > SAVE_VERSION) return null;
  if (!isObject(raw.facilities) && typeof raw.money !== 'number') return null;
  try {
    return migrate(raw, now);
  } catch (e) {
    return null;
  }
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function num(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function idNumber(id) {
  const m = /_(\d+)$/.exec(String(id));
  return m ? Number(m[1]) : 0;
}

/**
 * 生データを現行版の state に整える。
 * @returns {object}
 */
function migrate(raw, now) {
  const base = createInitialState(now, { rng: () => 0 });
  const prestigeRaw = isObject(raw.prestige) ? raw.prestige : {};
  const tutorialRaw = isObject(raw.tutorial) ? raw.tutorial : {};
  const state = {
    ...base,
    version: SAVE_VERSION,
    savedAt: num(raw.savedAt, now),
    prestige: {
      count: Math.max(0, Math.floor(num(prestigeRaw.count, 0))),
      totalEarnedAllTime: num(prestigeRaw.totalEarnedAllTime, 0),
    },
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked.filter((u) => UNLOCK_IDS.includes(u)) : [],
    money: num(raw.money, base.money),
    totalEarnedThisRun: num(raw.totalEarnedThisRun, 0),
    capacityBase: num(raw.capacityBase, base.capacityBase),
    tutorial: { step: num(tutorialRaw.step, 0), done: tutorialRaw.done === true },
    stats: { ...emptyStats() },
    gameDays: num(raw.gameDays, 0),
    spawnTimer: num(raw.spawnTimer, base.spawnTimer),
    prestigeNotified: raw.prestigeNotified === true,
  };
  if (isObject(raw.stats)) {
    for (const k of Object.keys(state.stats)) state.stats[k] = num(raw.stats[k], 0);
  }

  const hadFacilities = isObject(raw.facilities);
  state.facilities = hadFacilities ? migrateFacilities(raw.facilities, state.grid) : base.facilities;
  state.grid = rebuildGrid(state.facilities, 5, 5);
  state.people = isObject(raw.people) ? migratePeople(raw.people, now) : {};
  reconcileAssignments(state, raw.waiting);
  state.street = Array.isArray(raw.street) ? migrateStreet(raw.street, now) : base.street;

  const maxId = Math.max(
    0,
    ...Object.keys(state.facilities).map(idNumber),
    ...Object.keys(state.people).map(idNumber),
    ...state.street.map((s) => idNumber(s.id)),
  );
  state.nextId = Math.max(num(raw.nextId, 1), maxId + 1);
  return state;
}

function migrateFacilities(rawFacilities, grid) {
  const out = {};
  const used = new Set();
  for (const [key, f] of Object.entries(rawFacilities)) {
    if (!isObject(f) || !FACILITIES[f.type]) continue;
    const x = f.x;
    const y = f.y;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= grid.w || y >= grid.h) continue;
    const cell = y * grid.w + x;
    if (used.has(cell)) continue;
    used.add(cell);
    const workers = Array.isArray(f.workers) ? f.workers.filter((w) => typeof w === 'string') : [];
    out[key] = { id: key, type: f.type, x, y, workers };
  }
  return out;
}

function rebuildGrid(facilities, w, h) {
  const cells = Array(w * h).fill(null);
  for (const f of Object.values(facilities)) cells[f.y * w + f.x] = f.id;
  return { w, h, cells };
}

function migratePeople(rawPeople, now) {
  const out = {};
  for (const [key, p] of Object.entries(rawPeople)) {
    if (!isObject(p) || !JOBS[p.job]) continue;
    out[key] = {
      id: key,
      job: p.job,
      name: typeof p.name === 'string' ? p.name : JOBS[p.job].names[0],
      morale: Math.min(100, Math.max(0, num(p.morale, BALANCE.morale.start))),
      age: Math.max(0, num(p.age, 0)),
      lifespan: num(p.lifespan, rollLifespan(() => 0.5)),
      assignedTo: typeof p.assignedTo === 'string' ? p.assignedTo : null,
      recruitedAt: num(p.recruitedAt, now),
    };
  }
  return out;
}

/**
 * facility.workers を正として assignedTo と waiting を揃える。
 * 定員超過・存在しない人物は外し、どこにも属さない人物は待機枠へ（溢れたら削除）。
 */
function reconcileAssignments(state, rawWaiting) {
  const placed = new Set();
  for (const f of Object.values(state.facilities)) {
    const cap = FACILITIES[f.type].capacity;
    f.workers = f.workers.filter((pid) => state.people[pid] && !placed.has(pid)).slice(0, cap);
    for (const pid of f.workers) {
      placed.add(pid);
      state.people[pid].assignedTo = f.id;
    }
  }
  const waitingIn = Array.isArray(rawWaiting) ? rawWaiting : [];
  const waiting = [];
  const consider = [...waitingIn, ...Object.keys(state.people)];
  for (const pid of consider) {
    const p = state.people[pid];
    if (!p || placed.has(pid)) continue;
    placed.add(pid);
    p.assignedTo = null;
    if (waiting.length < BALANCE.waitingSlots) waiting.push(pid);
    else delete state.people[pid];
  }
  state.waiting = waiting;
}

function migrateStreet(rawStreet, now) {
  return rawStreet
    .filter((s) => isObject(s) && JOBS[s.job] && typeof s.id === 'string')
    .map((s) => ({
      id: s.id,
      job: s.job,
      name: typeof s.name === 'string' ? s.name : JOBS[s.job].names[0],
      x: Math.min(1, Math.max(0, num(s.x, 0))),
      spawnedAt: num(s.spawnedAt, now),
    }))
    .slice(0, BALANCE.spawn.maxOnStreet);
}
