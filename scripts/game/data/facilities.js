/**
 * 施設マスタ。解禁条件は sim/economy.js の isUnlockedFacility で判定する。
 */
export const FACILITIES = {
  stall:   { id: 'stall',   label: '露店', icon: '🏪', kind: 'income',  baseCost: 100, capacity: 1, baseIncome: 1, capacityBonus: 0 },
  factory: { id: 'factory', label: '工場', icon: '🏭', kind: 'income',  baseCost: 600, capacity: 3, baseIncome: 2, capacityBonus: 0 },
  dorm:    { id: 'dorm',    label: '寮',   icon: '🏠', kind: 'support', baseCost: 250, capacity: 0, baseIncome: 0, capacityBonus: 6 },
  canteen: { id: 'canteen', label: '飯屋', icon: '🍲', kind: 'support', baseCost: 400, capacity: 1, baseIncome: 0, capacityBonus: 0 },
};

export const FACILITY_IDS = Object.keys(FACILITIES);

/** 建設タブの表示順 */
export const BUILD_ORDER = ['stall', 'dorm', 'factory', 'canteen'];
