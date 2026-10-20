import { BALANCE } from '../data/balance.js';

const DIRS4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const DIRS8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

function neighborsBy(dirs, x, y, w, h) {
  const out = [];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push({ x: nx, y: ny });
  }
  return out;
}

/**
 * 上下左右 4 近傍（盤外は除く）。
 * @returns {{x:number,y:number}[]}
 */
export function neighbors4(x, y, w, h) {
  return neighborsBy(DIRS4, x, y, w, h);
}

/**
 * 斜めを含む 8 近傍（盤外は除く）。
 * @returns {{x:number,y:number}[]}
 */
export function neighbors8(x, y, w, h) {
  return neighborsBy(DIRS8, x, y, w, h);
}

/**
 * マス (x,y) にある施設。なければ null。
 * @returns {object|null}
 */
export function facilityAt(state, x, y) {
  const { w, h, cells } = state.grid;
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const id = cells[y * w + x];
  return id ? state.facilities[id] || null : null;
}

function hasNeighbor4OfType(state, f, type) {
  const { w, h } = state.grid;
  return neighbors4(f.x, f.y, w, h).some((c) => {
    const n = facilityAt(state, c.x, c.y);
    return n !== null && n.type === type;
  });
}

function hasSmith(state, f) {
  return f.workers.some((pid) => state.people[pid] && state.people[pid].job === 'smith');
}

function hasSmithFactoryNeighbor4(state, f) {
  const { w, h } = state.grid;
  return neighbors4(f.x, f.y, w, h).some((c) => {
    const n = facilityAt(state, c.x, c.y);
    return n !== null && n.type === 'factory' && hasSmith(state, n);
  });
}

/**
 * 施設の隣接効果。
 * A-01: factory の 4 近傍に dorm → incomeMult ×1.3（バッジ '×1.3'）
 * 鍛冶: factory の 4 近傍に鍛冶師が配属された factory → incomeMult ×1.2（バッジ '鍛冶+'）。A-01 と乗算
 * A-03: canteen の 4 近傍に factory → noiseMult 0.5（バッジ '騒音'）
 * @returns {{incomeMult:number, noiseMult:number, badges:string[]}}
 */
export function adjacencyFor(state, facilityId) {
  const result = { incomeMult: 1, noiseMult: 1, badges: [] };
  const f = state.facilities[facilityId];
  if (!f) return result;
  if (f.type === 'factory' && hasNeighbor4OfType(state, f, 'dorm')) {
    result.incomeMult *= BALANCE.adjacency.factoryDormMult;
    result.badges.push(`×${BALANCE.adjacency.factoryDormMult}`);
  }
  if (f.type === 'factory' && hasSmithFactoryNeighbor4(state, f)) {
    result.incomeMult *= BALANCE.adjacency.smithNeighborMult;
    result.badges.push('鍛冶+');
  }
  if (f.type === 'canteen' && hasNeighbor4OfType(state, f, 'factory')) {
    result.noiseMult = BALANCE.adjacency.canteenNoiseMult;
    result.badges.push('騒音');
  }
  return result;
}

function hasCook(state, f) {
  return f.workers.some((pid) => state.people[pid] && state.people[pid].job === 'cook');
}

/**
 * 稼働中の飯屋（workers >= 1）ごとに、自マス + 8 近傍の施設へ士気回復量を配る（A-02）。
 * 飯屋自身の配属者（料理人など）も回復対象になる。
 * 回復量 = recoverPerSec × (cook 配属なら cookBonus) × noiseMult。複数飯屋は合算。
 * @returns {Map<string, number>} facilityId -> 回復量/秒
 */
export function canteenCoverage(state) {
  const map = new Map();
  const { w, h } = state.grid;
  const m = BALANCE.morale;
  for (const f of Object.values(state.facilities)) {
    if (f.type !== 'canteen' || f.workers.length < 1) continue;
    const amount = m.recoverPerSec * (hasCook(state, f) ? m.cookBonus : 1) * adjacencyFor(state, f.id).noiseMult;
    const cells = [{ x: f.x, y: f.y }, ...neighbors8(f.x, f.y, w, h)];
    for (const c of cells) {
      const n = facilityAt(state, c.x, c.y);
      if (n) map.set(n.id, (map.get(n.id) || 0) + amount);
    }
  }
  return map;
}
