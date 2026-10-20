import { BALANCE } from '../data/balance.js';

/**
 * 寿命（日数）を正規分布(meanDays, sdDays) から Box-Muller で決める。下限 minDays。
 * @param {() => number} [rng] 乱数 [0,1)
 * @returns {number}
 */
export function rollLifespan(rng = Math.random) {
  const { meanDays, sdDays, minDays } = BALANCE.lifespan;
  const u1 = 1 - rng(); // (0,1] にして log(0) を避ける
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(minDays, meanDays + sdDays * z);
}

/**
 * 人物をその場から取り除く（施設の workers・waiting・people から）。
 * @param {object} state
 * @param {string} personId
 */
export function removePerson(state, personId) {
  const p = state.people[personId];
  if (!p) return;
  const f = p.assignedTo ? state.facilities[p.assignedTo] : null;
  if (f) f.workers = f.workers.filter((id) => id !== personId);
  state.waiting = state.waiting.filter((id) => id !== personId);
  delete state.people[personId];
}

/** 寿命（lifespan）に到達した人物の一覧。 */
export function dueRetirees(state) {
  return Object.values(state.people).filter((p) => p.age >= p.lifespan);
}

/**
 * 全人物の age を dt 秒ぶん進める。'lifespan' 解禁時のみ寿命到達者を退職させる。
 * 送別費 min(money, 50 × prestige.count) を徴収し、stats.retired++。
 * @param {object} state
 * @param {number} dt 秒
 * @returns {{type:'retire', personId:string, name:string, job:string, days:number, cost:number}[]}
 */
export function tickLifespan(state, dt) {
  const days = dt / BALANCE.secondsPerDay;
  for (const p of Object.values(state.people)) p.age += days;
  if (!state.unlocked.includes('lifespan')) return [];

  const events = [];
  for (const p of dueRetirees(state)) {
    const fee = BALANCE.lifespan.farewellCostPerPrestige * state.prestige.count;
    const cost = Math.max(0, Math.min(state.money, fee));
    state.money -= cost;
    removePerson(state, p.id);
    state.stats.retired += 1;
    events.push({ type: 'retire', personId: p.id, name: p.name, job: p.job, days: Math.floor(p.age), cost });
  }
  return events;
}
