import { BALANCE } from '../data/balance.js';
import { addIncome } from './economy.js';
import { tickMorale } from './morale.js';
import { tickLifespan } from './lifespan.js';
import { tickStreet } from './spawn.js';
import { canPrestige } from './prestige.js';

/**
 * シミュレーションを dt 秒進める。
 * 順序: addIncome → tickMorale → tickLifespan → tickStreet → gameDays → 転生可否の通知。
 * 転生可否が false→true に変わった最初の tick に { type:'prestigeReady' } を 1 回だけ出す
 * （state.prestigeNotified）。
 * @param {object} state
 * @param {number} dt 秒
 * @param {number} [now] epoch ms
 * @param {() => number} [rng]
 * @returns {object[]} events
 */
export function tick(state, dt, now = 0, rng = Math.random) {
  addIncome(state, dt);
  const events = [
    ...tickMorale(state, dt),
    ...tickLifespan(state, dt),
  ];
  tickStreet(state, dt, rng, now);
  state.gameDays += dt / BALANCE.secondsPerDay;
  if (!state.prestigeNotified && canPrestige(state)) {
    state.prestigeNotified = true;
    events.push({ type: 'prestigeReady' });
  }
  return events;
}
