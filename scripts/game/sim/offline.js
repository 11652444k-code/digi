import { BALANCE } from '../data/balance.js';
import { canteenCoverage } from './adjacency.js';
import { earn, totalIncomePerSecond } from './economy.js';
import { dueRetirees, removePerson } from './lifespan.js';

/**
 * 留守中の経過を一括で反映する。
 * - elapsedSec = clamp((now - savedAt)/1000, 0, maxSeconds)
 * - earned = 閉じた時点の総収益/秒 × elapsedSec × efficiency（money と累計に加算）
 * - 士気: 配属者のみ。飯屋範囲外は減少するが offlineFloor（10）で止める（元から下なら据え置き）。
 *   範囲内は回復（上限 100）。逃亡は起きない。
 * - 寿命: age は常に進む。'lifespan' 解禁時は到達者を削除し retired に入れる（送別費なし、stats.retired++）。
 * - gameDays を進め、savedAt を now に更新する（二重適用防止）。
 * @param {object} state
 * @param {number} now epoch ms
 * @returns {{elapsedSec:number, earned:number, retired:{name:string, job:string, days:number}[]}}
 */
export function applyOffline(state, now) {
  const elapsedSec = Math.min(BALANCE.offline.maxSeconds, Math.max(0, (now - state.savedAt) / 1000));
  const earned = totalIncomePerSecond(state) * elapsedSec * BALANCE.offline.efficiency;
  earn(state, earned);

  applyOfflineMorale(state, elapsedSec);
  const retired = applyOfflineLifespan(state, elapsedSec);

  state.gameDays += elapsedSec / BALANCE.secondsPerDay;
  state.savedAt = now;
  return { elapsedSec, earned, retired };
}

function applyOfflineMorale(state, elapsedSec) {
  const m = BALANCE.morale;
  const coverage = canteenCoverage(state);
  for (const p of Object.values(state.people)) {
    if (!p.assignedTo) continue;
    const recover = coverage.get(p.assignedTo);
    if (recover !== undefined) {
      p.morale = Math.min(100, p.morale + recover * elapsedSec);
    } else if (p.morale > m.offlineFloor) {
      p.morale = Math.max(m.offlineFloor, p.morale - m.decayPerSec * elapsedSec);
    }
  }
}

function applyOfflineLifespan(state, elapsedSec) {
  const days = elapsedSec / BALANCE.secondsPerDay;
  for (const p of Object.values(state.people)) p.age += days;
  if (!state.unlocked.includes('lifespan')) return [];
  const retired = [];
  for (const p of dueRetirees(state)) {
    removePerson(state, p.id);
    state.stats.retired += 1;
    retired.push({ name: p.name, job: p.job, days: Math.floor(p.age) });
  }
  return retired;
}
