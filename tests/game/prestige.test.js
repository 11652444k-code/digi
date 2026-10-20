import assert from 'node:assert/strict';
import { createInitialState } from '../../scripts/game/state.js';
import { prestigeThreshold, canPrestige, doPrestige } from '../../scripts/game/sim/prestige.js';
import { tick } from '../../scripts/game/sim/tick.js';

const NOW = 1_700_000_000_000;
const rng = () => 0.5;

assert.equal(prestigeThreshold(0), 10000);
assert.equal(prestigeThreshold(1), 30000);
assert.equal(prestigeThreshold(2), 90000);

{
  const s = createInitialState(NOW, { rng });
  assert.equal(canPrestige(s), false);
  assert.equal(doPrestige(s, NOW, rng), s, 'no-op when not eligible');
  s.totalEarnedThisRun = 10000;
  assert.equal(canPrestige(s), true);

  s.prestige.totalEarnedAllTime = 12345;
  s.stats.recruited = 7;
  const n = doPrestige(s, NOW + 1, rng);
  assert.notEqual(n, s);
  assert.equal(n.prestige.count, 1);
  assert.equal(n.prestige.totalEarnedAllTime, 12345);
  assert.deepEqual(n.unlocked, ['lifespan']);
  assert.equal(n.money, 60 + 200);
  assert.equal(n.totalEarnedThisRun, 0);
  assert.equal(n.stats.recruited, 7);
  assert.equal(n.stats.prestiges, 1);
  assert.equal(Object.keys(n.people).length, 0);
  assert.equal(Object.keys(n.facilities).length, 1);
  assert.equal(n.savedAt, NOW + 1);
  assert.equal(canPrestige(n), false);

  n.totalEarnedThisRun = 30000;
  const n2 = doPrestige(n, NOW + 2, rng);
  assert.equal(n2.prestige.count, 2);
  assert.equal(n2.money, 60 + 400);
  assert.deepEqual(n2.unlocked, ['lifespan']);
  assert.equal(n2.stats.prestiges, 2);
}

// tick の prestigeReady は 1 回だけ
{
  const s = createInitialState(NOW, { rng });
  s.totalEarnedThisRun = 9999.99;
  assert.deepEqual(tick(s, 0.1, NOW, rng).filter((e) => e.type === 'prestigeReady'), []);
  s.totalEarnedThisRun = 10000;
  assert.equal(tick(s, 0.1, NOW, rng).filter((e) => e.type === 'prestigeReady').length, 1);
  assert.equal(tick(s, 0.1, NOW, rng).filter((e) => e.type === 'prestigeReady').length, 0);
}

console.log('prestige.test.js: ok');
