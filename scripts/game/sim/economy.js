import { BALANCE } from '../data/balance.js';
import { FACILITIES } from '../data/facilities.js';
import { JOBS } from '../data/jobs.js';
import { adjacencyFor, facilityAt } from './adjacency.js';
import { nextId } from './ids.js';
import { rollLifespan } from './lifespan.js';

// ---------- 倍率 ----------

/**
 * 職業 × 施設の相性倍率。得意 3.0 / 通常 1.0 / 不得意 0.5。
 * 不得意 = 専門職（favored を持つ職業）が得意施設以外の収益施設に入った場合。
 * 支援施設（寮・飯屋）は得意でなければ通常扱い。
 * @param {string} job
 * @param {string} facilityType
 * @returns {number}
 */
export function jobMult(job, facilityType) {
  const j = JOBS[job];
  const f = FACILITIES[facilityType];
  const m = BALANCE.jobMult;
  if (!j || !f) return m.neutral;
  if (j.favored === facilityType) return m.favored;
  if (j.favored !== null && f.kind === 'income') return m.unfavored;
  return m.neutral;
}

/**
 * 士気倍率。50 以上で 1.0、50 未満で 0.5 + morale/100。
 * @param {number} morale
 * @returns {number}
 */
export function moraleMult(morale) {
  if (morale >= BALANCE.morale.lowThreshold) return 1;
  return 0.5 + Math.max(0, morale) / 100;
}

/**
 * 転生ボーナス倍率。1 + 0.1 × 転生回数。
 * @returns {number}
 */
export function prestigeMult(state) {
  return 1 + BALANCE.prestige.incomeBonusPerCount * state.prestige.count;
}

// ---------- 収益 ----------

/**
 * 施設 1 軒の毎秒収益と内訳。
 * @returns {{perSecond:number, workers:{personId:string, contribution:number}[], adjMult:number}}
 */
export function facilityIncome(state, facilityId) {
  const f = state.facilities[facilityId];
  if (!f) return { perSecond: 0, workers: [], adjMult: 1 };
  const def = FACILITIES[f.type];
  const adjMult = adjacencyFor(state, facilityId).incomeMult;
  const pm = prestigeMult(state);
  const workers = [];
  let perSecond = 0;
  for (const pid of f.workers) {
    const p = state.people[pid];
    if (!p) continue;
    const contribution = def.baseIncome * jobMult(p.job, f.type) * moraleMult(p.morale) * adjMult * pm;
    workers.push({ personId: pid, contribution });
    perSecond += contribution;
  }
  return { perSecond, workers, adjMult };
}

/**
 * 全施設の毎秒収益の合計。
 * @returns {number}
 */
export function totalIncomePerSecond(state) {
  let sum = 0;
  for (const id of Object.keys(state.facilities)) sum += facilityIncome(state, id).perSecond;
  return sum;
}

/**
 * dt 秒ぶんの収益を money / totalEarnedThisRun / prestige.totalEarnedAllTime に加算する。
 * @param {object} state
 * @param {number} dt 秒
 * @returns {number} 加算額
 */
export function addIncome(state, dt) {
  const amount = totalIncomePerSecond(state) * dt;
  earn(state, amount);
  return amount;
}

/** 稼いだ額を所持金と累計に加算する（返金などの収益以外には使わない）。 */
export function earn(state, amount) {
  if (!(amount > 0)) return;
  state.money += amount;
  state.totalEarnedThisRun += amount;
  state.prestige.totalEarnedAllTime += amount;
}

// ---------- 収容 ----------

/**
 * 収容状況。used = 配属中 + 待機枠、max = capacityBase + 寮の capacityBonus 合計。
 * @returns {{used:number, max:number}}
 */
export function capacity(state) {
  let max = state.capacityBase;
  for (const f of Object.values(state.facilities)) max += FACILITIES[f.type].capacityBonus;
  let assigned = 0;
  for (const p of Object.values(state.people)) if (p.assignedTo) assigned += 1;
  return { used: assigned + state.waiting.length, max };
}

// ---------- 建設 ----------

/**
 * 同種施設の数。
 * @returns {number}
 */
export function countFacilities(state, type) {
  let n = 0;
  for (const f of Object.values(state.facilities)) if (f.type === type) n += 1;
  return n;
}

/**
 * 建設費。ceil(baseCost × 1.5^n)、n = 既存の同種数。
 * @returns {number}
 */
export function buildCost(state, type) {
  const def = FACILITIES[type];
  return Math.ceil(def.baseCost * Math.pow(BALANCE.costGrowth, countFacilities(state, type)));
}

/**
 * 解禁判定。stall/dorm: 常時、factory: stall 2 軒以上、canteen: dorm 1 軒以上。
 * @returns {boolean}
 */
export function isUnlockedFacility(state, type) {
  switch (type) {
    case 'stall':
    case 'dorm':
      return true;
    case 'factory':
      return countFacilities(state, 'stall') >= 2;
    case 'canteen':
      return countFacilities(state, 'dorm') >= 1;
    default:
      return false;
  }
}

function inBounds(state, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < state.grid.w && y < state.grid.h;
}

/**
 * 建設できるか。reason: 'locked' | 'oob' | 'occupied' | 'money'（この順で判定）。
 * @returns {{ok:boolean, reason:string|null}}
 */
export function canBuild(state, type, x, y) {
  if (!FACILITIES[type] || !isUnlockedFacility(state, type)) return { ok: false, reason: 'locked' };
  if (!inBounds(state, x, y)) return { ok: false, reason: 'oob' };
  if (facilityAt(state, x, y)) return { ok: false, reason: 'occupied' };
  if (state.money < buildCost(state, type)) return { ok: false, reason: 'money' };
  return { ok: true, reason: null };
}

/**
 * 施設を置く（費用の支払いなし）。state.js の初期配置からも使う。
 * @returns {string} facilityId
 */
export function placeFacility(state, type, x, y) {
  const id = nextId(state, 'f');
  state.facilities[id] = { id, type, x, y, workers: [] };
  state.grid.cells[y * state.grid.w + x] = id;
  return id;
}

/**
 * 建設する。成功時 event: { type:'build', facilityId, facilityType, x, y, cost }。
 * @param {number} [now] epoch ms（現状は未使用）
 * @returns {{ok:boolean, reason:string|null, facilityId:string|null, events:object[]}}
 */
export function build(state, type, x, y, now) {
  const check = canBuild(state, type, x, y);
  if (!check.ok) return { ok: false, reason: check.reason, facilityId: null, events: [] };
  const cost = buildCost(state, type);
  state.money -= cost;
  const facilityId = placeFacility(state, type, x, y);
  state.stats.built += 1;
  return {
    ok: true, reason: null, facilityId,
    events: [{ type: 'build', facilityId, facilityType: type, x, y, cost }],
  };
}

/**
 * 撤去する。返金 = floor(その施設の建設費 × 0.5)（建設費は撤去後の同種数で再計算）。
 * 配属者は待機枠へ戻し、溢れた分は逃亡（escape イベント、stats.escaped++）。
 * events: { type:'remove', facilityId, facilityType, refund } と escape。
 * @returns {{ok:boolean, events:object[]}}
 */
export function removeFacility(state, facilityId) {
  const f = state.facilities[facilityId];
  if (!f) return { ok: false, events: [] };
  const { w } = state.grid;
  state.grid.cells[f.y * w + f.x] = null;
  delete state.facilities[facilityId];
  const refund = Math.floor(buildCost(state, f.type) * BALANCE.removeRefund);
  state.money += refund;

  const events = [{ type: 'remove', facilityId, facilityType: f.type, refund }];
  for (const pid of f.workers) {
    const p = state.people[pid];
    if (!p) continue;
    p.assignedTo = null;
    if (state.waiting.length < BALANCE.waitingSlots) {
      state.waiting.push(pid);
    } else {
      delete state.people[pid];
      state.stats.escaped += 1;
      events.push({ type: 'escape', personId: pid, name: p.name, job: p.job, facilityId });
    }
  }
  return { ok: true, events };
}

/**
 * 施設を空きマスへ移設する（無料、配属者ごと）。reason: 'notfound' | 'oob' | 'occupied'。
 * @returns {{ok:boolean, reason:string|null}}
 */
export function moveFacility(state, facilityId, x, y) {
  const f = state.facilities[facilityId];
  if (!f) return { ok: false, reason: 'notfound' };
  if (!inBounds(state, x, y)) return { ok: false, reason: 'oob' };
  const there = facilityAt(state, x, y);
  if (there && there.id === facilityId) return { ok: true, reason: null };
  if (there) return { ok: false, reason: 'occupied' };
  const { w } = state.grid;
  state.grid.cells[f.y * w + f.x] = null;
  state.grid.cells[y * w + x] = facilityId;
  f.x = x;
  f.y = y;
  return { ok: true, reason: null };
}

// ---------- 人事 ----------

/**
 * 通りの人物を勧誘して待機枠へ入れる。reason: 'notfound' | 'full'。
 * 成功 event: { type:'recruit', personId, name, job }、満員 event: { type:'recruitFull', streetId }。
 * @param {object} state
 * @param {string} streetId
 * @param {number} now epoch ms（recruitedAt）
 * @param {() => number} [rng] 寿命決定用の乱数
 * @returns {{ok:boolean, reason:string|null, personId:string|null, events:object[]}}
 */
export function recruit(state, streetId, now, rng = Math.random) {
  const idx = state.street.findIndex((s) => s.id === streetId);
  if (idx < 0) return { ok: false, reason: 'notfound', personId: null, events: [] };
  const cap = capacity(state);
  if (cap.used >= cap.max || state.waiting.length >= BALANCE.waitingSlots) {
    return { ok: false, reason: 'full', personId: null, events: [{ type: 'recruitFull', streetId }] };
  }
  const s = state.street[idx];
  state.street.splice(idx, 1);
  const personId = nextId(state, 'p');
  state.people[personId] = {
    id: personId,
    job: s.job,
    name: s.name,
    morale: BALANCE.morale.start,
    age: 0,
    lifespan: rollLifespan(rng),
    assignedTo: null,
    recruitedAt: now,
  };
  state.waiting.push(personId);
  state.stats.recruited += 1;
  return {
    ok: true, reason: null, personId,
    events: [{ type: 'recruit', personId, name: s.name, job: s.job }],
  };
}

/**
 * 人物を施設に配属する（待機枠からでも、他施設からの異動でも可）。
 * reason: 'notfound' | 'capacity'（寮は定員 0 なので常に 'capacity'）。
 * event: { type:'assign' | 'assignMismatch', personId, name, job, facilityId, facilityType }
 * （相性倍率が不得意 0.5 のとき 'assignMismatch'）
 * @returns {{ok:boolean, reason:string|null, events:object[]}}
 */
export function assign(state, personId, facilityId) {
  const p = state.people[personId];
  const f = state.facilities[facilityId];
  if (!p || !f) return { ok: false, reason: 'notfound', events: [] };
  if (p.assignedTo === facilityId) return { ok: true, reason: null, events: [] };
  if (f.workers.length >= FACILITIES[f.type].capacity) return { ok: false, reason: 'capacity', events: [] };

  detach(state, p);
  f.workers.push(personId);
  p.assignedTo = facilityId;
  const mismatch = jobMult(p.job, f.type) === BALANCE.jobMult.unfavored;
  return {
    ok: true, reason: null,
    events: [{ type: mismatch ? 'assignMismatch' : 'assign', personId, name: p.name, job: p.job, facilityId, facilityType: f.type }],
  };
}

function detach(state, p) {
  state.waiting = state.waiting.filter((id) => id !== p.id);
  const old = p.assignedTo ? state.facilities[p.assignedTo] : null;
  if (old) old.workers = old.workers.filter((id) => id !== p.id);
  p.assignedTo = null;
}

/**
 * 配属を解いて待機枠へ戻す。reason: 'notfound'（未配属含む）| 'full'（待機枠が満杯）。
 * @returns {{ok:boolean, reason:string|null}}
 */
export function unassign(state, personId) {
  const p = state.people[personId];
  if (!p || !p.assignedTo) return { ok: false, reason: 'notfound' };
  if (state.waiting.length >= BALANCE.waitingSlots) return { ok: false, reason: 'full' };
  detach(state, p);
  state.waiting.push(personId);
  return { ok: true, reason: null };
}
