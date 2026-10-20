// Headless balance simulation: a greedy "bot player" that checks in every N seconds.
// Run: node tests/game/balance-sim.mjs
// Not a unit test (does not assert); it prints tables and reports invariant violations.
// Sim step is dt = 0.1 s (the real tick size); the whole script runs in a few seconds.
import { BALANCE } from '../../scripts/game/data/balance.js';
import { FACILITIES } from '../../scripts/game/data/facilities.js';
import { JOBS } from '../../scripts/game/data/jobs.js';
import { createInitialState } from '../../scripts/game/state.js';
import { tick } from '../../scripts/game/sim/tick.js';
import { canPrestige, doPrestige, prestigeThreshold } from '../../scripts/game/sim/prestige.js';
import {
  assign, unassign, build, recruit, capacity, countFacilities, buildCost, canBuild,
  jobMult, totalIncomePerSecond,
} from '../../scripts/game/sim/economy.js';
import { facilityAt, neighbors4, neighbors8, canteenCoverage } from '../../scripts/game/sim/adjacency.js';

const DT = 0.1;
const T0 = 1_700_000_000_000;
const MAX_MIN = 60;

// ---------- seeded rng ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- bot helpers ----------
const incomeFacilities = (S) => Object.values(S.facilities).filter((f) => FACILITIES[f.type].kind === 'income');
const hasNb4 = (S, f, type) =>
  neighbors4(f.x, f.y, S.grid.w, S.grid.h).some((c) => facilityAt(S, c.x, c.y)?.type === type);
const roomIn = (f) => FACILITIES[f.type].capacity - f.workers.length;

function slotScore(S, job, f) {
  const def = FACILITIES[f.type];
  const adj = f.type === 'factory' && hasNb4(S, f, 'dorm') ? BALANCE.adjacency.factoryDormMult : 1;
  return def.baseIncome * jobMult(job, f.type) * adj;
}

function assignAll(S, ctx) {
  // specialists first so villagers do not steal their favoured slots
  const prio = (pid) => (JOBS[S.people[pid].job].favored ? 0 : 1);
  for (let pass = 0; pass < 3; pass++) {
    const waiting = [...S.waiting].sort((a, b) => prio(a) - prio(b));
    let moved = false;
    // canteen needs one body to be active: cook first, else villager
    const canteens = Object.values(S.facilities).filter((f) => f.type === 'canteen' && f.workers.length === 0);
    for (const c of canteens) {
      const pick = waiting.find((id) => S.people[id].job === 'cook' && !S.people[id].assignedTo)
        || waiting.find((id) => S.people[id].job === 'villager' && !S.people[id].assignedTo);
      if (pick && assign(S, pick, c.id).ok) { moved = true; waiting.splice(waiting.indexOf(pick), 1); }
    }
    for (const pid of waiting) {
      const p = S.people[pid];
      if (!p || p.assignedTo) continue;
      let best = null; let bestScore = 0;
      for (const f of incomeFacilities(S)) {
        if (roomIn(f) <= 0) continue;
        const sc = slotScore(S, p.job, f);
        if (sc > bestScore) { best = f; bestScore = sc; }
      }
      if (best && assign(S, pid, best.id).ok) { moved = true; continue; }
      // swap: displace a clearly worse occupant
      for (const f of incomeFacilities(S)) {
        const mine = slotScore(S, p.job, f);
        const worst = f.workers.map((w) => ({ w, sc: slotScore(S, S.people[w].job, f) })).sort((a, b) => a.sc - b.sc)[0];
        if (worst && mine >= 2 * worst.sc && S.waiting.length < BALANCE.waitingSlots) {
          if (unassign(S, worst.w).ok && assign(S, pid, f.id).ok) { ctx.swaps++; moved = true; break; }
        }
      }
    }
    if (!moved) break;
  }
}

function recruitAll(S, now, rng, ctx) {
  const val = (s) => {
    const fav = JOBS[s.job].favored;
    if (fav && countFacilities(S, fav) > 0) return 3;
    if (!fav) return 1;
    return 0.5;
  };
  const street = [...S.street].sort((a, b) => val(b) - val(a) || b.x - a.x);
  for (const s of street) {
    const cap = capacity(S);
    if (cap.used >= cap.max || S.waiting.length >= BALANCE.waitingSlots) break;
    if (recruit(S, s.id, now, rng).ok) ctx.recruitedByBot++;
  }
}

// ---------- placement ----------
function emptyCells(S) {
  const out = [];
  for (let y = 0; y < S.grid.h; y++) for (let x = 0; x < S.grid.w; x++) if (!facilityAt(S, x, y)) out.push({ x, y });
  return out;
}
const distCenter = (c) => Math.abs(c.x - 2) + Math.abs(c.y - 2);

function pickCell(S, type) {
  const { w, h } = S.grid;
  let best = null; let bestScore = -Infinity;
  for (const c of emptyCells(S)) {
    const n4 = neighbors4(c.x, c.y, w, h);
    const nb4 = (t) => n4.filter((n) => facilityAt(S, n.x, n.y)?.type === t).length;
    const emptyN4 = n4.filter((n) => !facilityAt(S, n.x, n.y)).length;
    let sc = 0;
    if (type === 'dorm') {
      // adjacent to factories lacking a dorm; otherwise open neighbours for future factories
      const needy = n4.filter((n) => {
        const f = facilityAt(S, n.x, n.y);
        return f && f.type === 'factory' && !hasNb4(S, f, 'dorm');
      }).length;
      sc = 10 * needy + emptyN4 - 0.1 * distCenter(c);
    } else if (type === 'factory') {
      sc = 10 * (nb4('dorm') > 0 ? 1 : 0) - 3 * (nb4('canteen') > 0 ? 1 : 0) + 0.2 * emptyN4 - 0.1 * distCenter(c);
    } else if (type === 'stall') {
      sc = c.y - 5 * (nb4('dorm') > 0 ? 1 : 0) - 0.01 * c.x - 3 * (nb4('canteen') > 0 ? 1 : 0) * 0;
    } else if (type === 'canteen') {
      const cov = neighbors8(c.x, c.y, w, h).filter((n) => {
        const f = facilityAt(S, n.x, n.y);
        return f && FACILITIES[f.type].kind === 'income';
      }).length;
      sc = cov - (nb4('factory') > 0 ? 100 : 0) - 0.5 * (nb4('dorm') > 0 ? 1 : 0) - 0.01 * distCenter(c);
    }
    if (sc > bestScore) { bestScore = sc; best = c; }
  }
  return best;
}

function decideBuild(S) {
  const n = (t) => countFacilities(S, t);
  if (n('stall') < 2) return 'stall';
  if (n('dorm') < 1) return 'dorm';
  if (n('factory') < 1) return 'factory';
  if (n('canteen') < 1) return 'canteen';
  const cap = capacity(S);
  const freeCap = cap.max - cap.used;
  const peopleN = Object.keys(S.people).length;
  const freeWork = incomeFacilities(S).reduce((s, f) => s + roomIn(f), 0);
  // extra canteen when 3+ workers stand outside every active canteen's range (their morale only decays)
  const cov = canteenCoverage(S);
  const uncovered = incomeFacilities(S).filter((f) => !cov.has(f.id)).reduce((s, f) => s + f.workers.length, 0);
  if (uncovered >= 3 && countFacilities(S, 'canteen') < 4 && freeCap >= 0) return 'canteen';
  if (cap.max - peopleN <= 1) return 'dorm';
  if (freeWork <= 1) return 'factory';
  return null;
}

function buildAll(S, now, ctx) {
  let any = false;
  for (let i = 0; i < 10; i++) {
    let want = decideBuild(S);
    if (!want) break;
    let cell = pickCell(S, want);
    if (!cell && want !== 'dorm') { want = 'dorm'; cell = pickCell(S, want); }
    if (!cell) break;
    if (!canBuild(S, want, cell.x, cell.y).ok) break; // wait until affordable
    const before = S.money; const cost = buildCost(S, want);
    const r = build(S, want, cell.x, cell.y, now);
    if (!r.ok) break;
    ctx.spent += cost;
    if (Math.abs(before - S.money - cost) > 1e-6) ctx.viol('buildCostMismatch');
    ctx.builtByBot[want] = (ctx.builtByBot[want] || 0) + 1;
    any = true;
  }
  return any;
}

function checkIn(S, now, rng, ctx) {
  assignAll(S, ctx);
  recruitAll(S, now, rng, ctx);
  assignAll(S, ctx);
  if (buildAll(S, now, ctx)) {
    recruitAll(S, now, rng, ctx);
    assignAll(S, ctx);
  }
}

// ---------- invariants (independent re-implementation of the income formula) ----------
function refIncome(S) {
  const pm = 1 + BALANCE.prestige.incomeBonusPerCount * S.prestige.count;
  let sum = 0;
  for (const f of Object.values(S.facilities)) {
    const def = FACILITIES[f.type];
    let adj = 1;
    if (f.type === 'factory') {
      if (hasNb4(S, f, 'dorm')) adj *= BALANCE.adjacency.factoryDormMult;
      const smithNb = neighbors4(f.x, f.y, S.grid.w, S.grid.h).some((c) => {
        const n = facilityAt(S, c.x, c.y);
        return n && n.type === 'factory' && n.workers.some((id) => S.people[id]?.job === 'smith');
      });
      if (smithNb) adj *= BALANCE.adjacency.smithNeighborMult;
    }
    for (const pid of f.workers) {
      const p = S.people[pid];
      const j = JOBS[p.job];
      const jm = j.favored === f.type ? BALANCE.jobMult.favored : (j.favored !== null && def.kind === 'income' ? BALANCE.jobMult.unfavored : BALANCE.jobMult.neutral);
      const mm = p.morale >= 50 ? 1 : 0.5 + p.morale / 100;
      sum += def.baseIncome * jm * mm * adj * pm;
    }
  }
  return sum;
}

function checkInvariants(S, ctx) {
  if (S.money < -1e-6) ctx.viol('negativeMoney');
  if (Math.abs(S.money - (ctx.money0 + S.totalEarnedThisRun - ctx.spent - ctx.farewell)) > 1e-3) ctx.viol('moneyLedger');
  if (S.waiting.length > BALANCE.waitingSlots) ctx.viol('waitingOverflow');
  if (S.street.length > BALANCE.spawn.maxOnStreet) ctx.viol('streetOverflow');
  const cap = capacity(S);
  if (cap.used > cap.max) ctx.viol('capacityExceeded');
  const seen = new Set();
  for (const f of Object.values(S.facilities)) {
    if (f.workers.length > FACILITIES[f.type].capacity) ctx.viol('workersOverFacilityCapacity');
    if (S.grid.cells[f.y * S.grid.w + f.x] !== f.id) ctx.viol('gridMismatch');
    for (const pid of f.workers) {
      const p = S.people[pid];
      if (!p) { ctx.viol('danglingWorker'); continue; }
      if (p.assignedTo !== f.id) ctx.viol('assignedToMismatch');
      if (seen.has(pid)) ctx.viol('doubleAssigned');
      seen.add(pid);
    }
  }
  for (const pid of S.waiting) {
    if (!S.people[pid]) ctx.viol('danglingWaiting');
    else if (S.people[pid].assignedTo) ctx.viol('waitingButAssigned');
  }
  for (const p of Object.values(S.people)) {
    if (!p.assignedTo && !S.waiting.includes(p.id)) ctx.viol('orphanPerson');
    if (p.morale < 0 || p.morale > 100) ctx.viol('moraleRange');
  }
  const a = totalIncomePerSecond(S); const b = refIncome(S);
  if (Math.abs(a - b) > 1e-9 * Math.max(1, b)) ctx.viol('incomeMismatch');
}

// ---------- one scenario ----------
function simulate({ seed, N, state, maxMin, stopOnPrestige, phase }) {
  const rng = mulberry32(seed);
  let now = T0;
  const S = state || createInitialState(now, { rng });
  const ctx = {
    money0: S.money, spent: 0, farewell: 0, swaps: 0, recruitedByBot: 0, builtByBot: {},
    violations: {},
    viol(k) { this.violations[k] = (this.violations[k] || 0) + 1; },
  };
  const startStats = { ...S.stats };
  const totalTicks = Math.round((maxMin * 60) / DT);
  const checkEvery = Math.round(N / DT);
  const perMinute = [];       // totalEarnedThisRun at each minute mark
  const retireBins = [];      // retirements per 5 min
  const headSum = [];         // headcount accumulators per 5 min [sum, n]
  const incomeBins = [];
  let incMax = 0; let minRatio = Infinity; let minRatioAt = 0; let dropped = false;
  let reachedAt = null; let peakPeople = 0; let minPeople = Infinity;
  let escapeEvents = 0;

  for (let i = 0; i <= totalTicks; i++) {
    if (i % checkEvery === 0) checkIn(S, now, rng, ctx);
    if (i === totalTicks) break;
    const events = tick(S, DT, now, rng);
    now += DT * 1000;
    const t = (i + 1) * DT;
    for (const e of events) {
      if (e.type === 'retire') {
        ctx.farewell += e.cost;
        const bin = Math.floor((t - 1e-9) / 300);
        retireBins[bin] = (retireBins[bin] || 0) + 1;
      } else if (e.type === 'escape') escapeEvents++;
    }
    if ((i + 1) % 10 === 0) {
      checkInvariants(S, ctx);
      const inc = totalIncomePerSecond(S);
      const heads = Object.values(S.people).filter((p) => p.assignedTo).length;
      const bin = Math.floor((t - 1e-9) / 300);
      headSum[bin] = headSum[bin] || [0, 0]; headSum[bin][0] += heads; headSum[bin][1]++;
      if (inc > incMax) incMax = inc;
      if (incMax > 0) {
        const r = inc / incMax;
        if (r < minRatio) { minRatio = r; minRatioAt = t; }
        if (r < 0.5) dropped = true;
      }
      const np = Object.keys(S.people).length;
      peakPeople = Math.max(peakPeople, heads); minPeople = Math.min(minPeople, np);
      if (Math.round(t) % 300 === 0) incomeBins[Math.round(t / 300) - 1] = inc;
      if (Math.round(t) % 60 === 0) perMinute[Math.round(t / 60) - 1] = S.totalEarnedThisRun;
    }
    if (stopOnPrestige && canPrestige(S)) { reachedAt = t; break; }
  }
  checkInvariants(S, ctx);
  return {
    phase, N, seed, state: S, ctx, reachedAt, perMinute, retireBins, headSum, incomeBins, dropped, minRatio,
    minRatioAt, incMax, finalIncome: totalIncomePerSecond(S), peakPeople, minPeople, escapeEvents,
    recruited: S.stats.recruited - startStats.recruited, escaped: S.stats.escaped - startStats.escaped,
    retired: S.stats.retired - startStats.retired, elapsed: (S.gameDays * 60),
  };
}

// ---------- output ----------
const SPARK = '▁▂▃▄▅▆▇█';
const spark = (vals, max) => vals.map((v) => SPARK[Math.max(0, Math.min(7, Math.floor((v / max) * 8)))]).join('');
const fmt = (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0));
const pad = (s, n) => String(s).padEnd(n);
const wall0 = Date.now();

console.log(`Balance sim | dt=${DT}s per tick (real tick size), check-ins at t=0,N,2N..., max ${MAX_MIN} sim-min, prestige target ${prestigeThreshold(0)} G\n`);

const INTERVALS = [5, 20, 60];
const SEEDS = [1, 2, 3, 4, 5];
const main = {};
for (const N of INTERVALS) main[N] = simulate({ seed: 1, N, maxMin: MAX_MIN, stopOnPrestige: true, phase: 'run0' });

console.log('=== Run 0 (seed 1) ===');
console.log(pad('check-in', 9) + pad('min->prestige', 15) + pad('income/s', 10) + pad('built stall/dorm/factory/canteen', 34) + pad('recruited/escaped', 19) + 'swaps  violations');
for (const N of INTERVALS) {
  const r = main[N]; const S = r.state;
  const built = ['stall', 'dorm', 'factory', 'canteen'].map((t) => countFacilities(S, t)).join('/');
  const viol = Object.keys(r.ctx.violations).length ? JSON.stringify(r.ctx.violations) : 'none';
  console.log(
    pad(`N=${N}s`, 9) + pad(r.reachedAt ? (r.reachedAt / 60).toFixed(1) : 'not reached', 15) + pad(r.finalIncome.toFixed(1), 10) +
    pad(built, 34) + pad(`${r.recruited}/${r.escaped}`, 19) + pad(r.ctx.swaps, 7) + viol,
  );
}
console.log('\ntotalEarnedThisRun at each minute mark (spark scaled to 10000):');
for (const N of INTERVALS) {
  const r = main[N];
  console.log(`N=${N}s  ${spark(r.perMinute, 10000)}`);
  console.log('   ' + r.perMinute.map((v, i) => `${i + 1}:${fmt(v)}`).join(' '));
}

console.log('\nRobustness: minutes to prestige over seeds ' + SEEDS.join(',') + ' (new rng each):');
const vio = {};
for (const N of INTERVALS) {
  const mins = SEEDS.map((seed) => {
    const r = simulate({ seed, N, maxMin: MAX_MIN, stopOnPrestige: true, phase: 'run0' });
    for (const [k, v] of Object.entries(r.ctx.violations)) vio[k] = (vio[k] || 0) + v;
    return r.reachedAt ? +(r.reachedAt / 60).toFixed(1) : null;
  });
  const ok = mins.filter((m) => m !== null).sort((a, b) => a - b);
  const med = ok.length ? ok[Math.floor(ok.length / 2)] : 'n/a';
  console.log(`N=${pad(N, 3)} ${mins.map((m) => (m === null ? 'NR' : m)).join(' ')}   median=${med}`);
}
console.log('invariant violations across seed sweep: ' + (Object.keys(vio).length ? JSON.stringify(vio) : 'none'));

// ---------- run 1 ----------
console.log('\n=== Run 1 (lifespan unlocked), N=20s, 30 sim-min ===');
const r0 = main[20];
let s0 = r0.state;
let forced = false;
if (!canPrestige(s0)) { s0.totalEarnedThisRun = prestigeThreshold(0); forced = true; }
const s1 = doPrestige(s0, T0 + 3600e3, mulberry32(99));
if (forced) console.log('NOTE: run 0 (N=20) never reached the threshold; prestige was forced.');
console.log(`start: prestige.count=${s1.prestige.count} money=${s1.money} unlocked=${s1.unlocked} facilities=${Object.keys(s1.facilities).length} people=${Object.keys(s1.people).length}`);
const r1 = simulate({ seed: 7, N: 20, state: s1, maxMin: 30, stopOnPrestige: false, phase: 'run1' });
console.log(pad('window(min)', 13) + pad('retirements', 13) + pad('avg assigned', 14) + 'income/s at window end');
for (let b = 0; b < 6; b++) {
  const hs = r1.headSum[b] || [0, 1];
  console.log(pad(`${b * 5}-${b * 5 + 5}`, 13) + pad(r1.retireBins[b] || 0, 13) + pad((hs[0] / hs[1]).toFixed(2), 14) + (r1.incomeBins[b] ?? 0).toFixed(1));
}
const S1 = r1.state;
console.log(`totals: retired=${r1.retired} recruited=${r1.recruited} escaped=${r1.escaped} farewell paid=${r1.ctx.farewell} G  facilities=${['stall', 'dorm', 'factory', 'canteen'].map((t) => `${t}:${countFacilities(S1, t)}`).join(' ')}`);
console.log(`income max=${r1.incMax.toFixed(1)}/s final=${r1.finalIncome.toFixed(1)}/s min(income/runningMax)=${r1.minRatio.toFixed(2)} at ${(r1.minRatioAt / 60).toFixed(1)}min  dropped below 50% of running max: ${r1.dropped ? 'YES' : 'no'}`);
console.log(`peak assigned=${r1.peakPeople} min people=${r1.minPeople} totalEarned this run=${Math.round(S1.totalEarnedThisRun)} (threshold ${prestigeThreshold(1)})`);
console.log('violations: ' + (Object.keys(r1.ctx.violations).length ? JSON.stringify(r1.ctx.violations) : 'none'));
console.log(`\nwall time ${((Date.now() - wall0) / 1000).toFixed(1)} s`);
