import { BALANCE } from '../data/balance.js';
import { canteenCoverage } from './adjacency.js';
import { removePerson } from './lifespan.js';

/**
 * 配属中の人物の士気を dt 秒ぶん進める。待機枠の人物は変動しない。
 * 飯屋の範囲内（canteenCoverage）は回復、範囲外は decayPerSec で減少。上限 100。
 * 士気 0 で逃亡: 人物削除、facility.workers から除去、stats.escaped++。
 * events:
 *   { type:'escape', personId, name, job, facilityId }
 *   { type:'moraleWarn', facilityId }  // 施設の誰かが 50 を下回った tick に施設ごと 1 回
 * @param {object} state
 * @param {number} dt 秒
 * @returns {object[]}
 */
export function tickMorale(state, dt) {
  const m = BALANCE.morale;
  const coverage = canteenCoverage(state);
  const events = [];
  const warned = new Set();
  const escaped = [];

  for (const p of Object.values(state.people)) {
    if (!p.assignedTo || !state.facilities[p.assignedTo]) continue;
    const before = p.morale;
    const recover = coverage.get(p.assignedTo);
    const delta = recover !== undefined ? recover * dt : -m.decayPerSec * dt;
    p.morale = Math.min(100, Math.max(0, before + delta));

    if (before >= m.lowThreshold && p.morale < m.lowThreshold && !warned.has(p.assignedTo)) {
      warned.add(p.assignedTo);
      events.push({ type: 'moraleWarn', facilityId: p.assignedTo });
    }
    if (p.morale <= 0) escaped.push(p);
  }

  for (const p of escaped) {
    const facilityId = p.assignedTo;
    removePerson(state, p.id);
    state.stats.escaped += 1;
    events.push({ type: 'escape', personId: p.id, name: p.name, job: p.job, facilityId });
  }
  return events;
}
