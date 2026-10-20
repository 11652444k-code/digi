import { BALANCE } from '../data/balance.js';
import { createInitialState } from '../state.js';

/**
 * 転生条件の累計収益。10000 × 3^count。
 * @param {number} count 転生回数
 * @returns {number}
 */
export function prestigeThreshold(count) {
  return BALANCE.prestige.baseThreshold * Math.pow(BALANCE.prestige.growth, count);
}

/**
 * 今周回の累計収益が条件に達しているか。
 * @returns {boolean}
 */
export function canPrestige(state) {
  return state.totalEarnedThisRun >= prestigeThreshold(state.prestige.count);
}

/**
 * 転生する。count+1、'lifespan' を解禁、stats.prestiges++ して新周回の state を返す。
 * 初期金は createInitialState が 60 + 200 × count で設定する。
 * 条件未達なら何もせず同じ state を返す。
 * @param {object} state
 * @param {number} now epoch ms
 * @param {() => number} [rng] 新周回の通りの人物の名前用
 * @returns {object} newState
 */
export function doPrestige(state, now, rng = Math.random) {
  if (!canPrestige(state)) return state;
  const prestige = {
    count: state.prestige.count + 1,
    totalEarnedAllTime: state.prestige.totalEarnedAllTime,
  };
  const unlocked = [...state.unlocked];
  if (prestige.count >= 1 && !unlocked.includes('lifespan')) unlocked.push('lifespan');
  const stats = { ...state.stats, prestiges: (state.stats.prestiges || 0) + 1 };
  return createInitialState(now, { prestige, unlocked, stats, rng });
}
