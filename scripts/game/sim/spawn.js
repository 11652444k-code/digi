import { BALANCE } from '../data/balance.js';
import { JOBS, JOB_IDS } from '../data/jobs.js';
import { capacity, countFacilities } from './economy.js';
import { nextId } from './ids.js';

/**
 * 職業ごとの出現重み。得意施設が街に存在する職業は placeableBoost 倍。
 * @returns {{job:string, weight:number}[]}
 */
export function spawnWeights(state) {
  return JOB_IDS.map((job) => {
    const fav = JOBS[job].favored;
    const boost = fav && countFacilities(state, fav) > 0 ? BALANCE.spawn.placeableBoost : 1;
    return { job, weight: JOBS[job].weight * boost };
  });
}

function pickWeighted(entries, rng) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r < 0) return e.job;
  }
  return entries[entries.length - 1].job;
}

/**
 * 職業の名前テーブルからランダムに名前を選ぶ。
 * @returns {string}
 */
export function pickName(job, rng = Math.random) {
  const names = JOBS[job].names;
  return names[Math.min(names.length - 1, Math.floor(rng() * names.length))];
}

/**
 * 指定職業の通りの人物を作る（state.street には追加しない）。
 * @returns {{id:string, job:string, name:string, x:number, spawnedAt:number}}
 */
export function createStreetPerson(state, job, x, rng = Math.random, now = 0) {
  return { id: nextId(state, 's'), job, name: pickName(job, rng), x, spawnedAt: now };
}

/**
 * 職業重み + placeableBoost で職業を決め、右端（x=0）に出現する通りの人物を作る。
 * state.street には追加しない。
 * @param {object} state
 * @param {() => number} [rng]
 * @param {number} [now] epoch ms
 * @returns {{id:string, job:string, name:string, x:number, spawnedAt:number}}
 */
export function makeStreetPerson(state, rng = Math.random, now = 0) {
  const job = pickWeighted(spawnWeights(state), rng);
  return createStreetPerson(state, job, 0, rng, now);
}

/**
 * 次の出現までの秒数。intervalMin + rng()×intervalRand、収容満杯なら ×2。
 * @returns {number}
 */
export function nextSpawnInterval(state, rng = Math.random) {
  const s = BALANCE.spawn;
  const cap = capacity(state);
  const mult = cap.used >= cap.max ? s.fullCapacityIntervalMult : 1;
  return (s.intervalMin + rng() * s.intervalRand) * mult;
}

/**
 * 通りを dt 秒進める。x を walkSeconds で 0→1 に進め、1 を超えたら削除。
 * state.spawnTimer が 0 以下、または通りが空になったら（上限 maxOnStreet 未満なら）1 人出現。
 * @param {object} state
 * @param {number} dt 秒
 * @param {() => number} [rng]
 * @param {number} [now] epoch ms
 */
export function tickStreet(state, dt, rng = Math.random, now = 0) {
  const s = BALANCE.spawn;
  for (const p of state.street) p.x += dt / s.walkSeconds;
  state.street = state.street.filter((p) => p.x <= 1);

  if (!Number.isFinite(state.spawnTimer)) state.spawnTimer = 0;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 || state.street.length === 0) {
    if (state.street.length < s.maxOnStreet) state.street.push(makeStreetPerson(state, rng, now));
    state.spawnTimer = nextSpawnInterval(state, rng);
  }
}
