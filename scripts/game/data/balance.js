/**
 * バランス数値。すべて初期値で、実プレイで調整する。
 */
export const BALANCE = {
  tickSeconds: 0.1,
  secondsPerDay: 60,
  waitingSlots: 4,
  jobMult: { favored: 3.0, neutral: 1.0, unfavored: 0.5 },
  costGrowth: 1.7,
  adjacency: { factoryDormMult: 1.3, canteenNoiseMult: 0.5, smithNeighborMult: 1.2 },
  morale: { start: 100, decayPerSec: 0.2, recoverPerSec: 0.5, cookBonus: 1.5, lowThreshold: 50, offlineFloor: 10 },
  lifespan: { meanDays: 12, sdDays: 4, minDays: 6, warnDays: 3, farewellCostPerPrestige: 50 },
  offline: { maxSeconds: 8 * 3600, efficiency: 0.5 },
  prestige: { baseThreshold: 10000, growth: 3, incomeBonusPerCount: 0.1, startMoneyBonus: 200 },
  spawn: { maxOnStreet: 4, walkSeconds: 12, intervalMin: 3, intervalRand: 4, fullCapacityIntervalMult: 2, placeableBoost: 1.5 },
  initialMoney: 60,
  removeRefund: 0.5,
};
