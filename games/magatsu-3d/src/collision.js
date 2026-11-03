// 当たり判定ユーティリティ(すべて XZ 平面)
// collider: { type:'box', minX, minZ, maxX, maxZ } | { type:'circle', x, z, r }

const EPS = 1e-9;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// 円(x,z,r)が collider にめり込んでいたら pos を押し戻す。押し戻したら true。
function pushOut(pos, c, r) {
  if (c.type === 'circle') {
    const ox = pos.x - c.x;
    const oz = pos.z - c.z;
    const rr = r + c.r;
    const d2 = ox * ox + oz * oz;
    if (d2 >= rr * rr) return false;
    const d = Math.sqrt(d2);
    if (d > EPS) {
      const k = (rr - d) / d;
      pos.x += ox * k;
      pos.z += oz * k;
    } else {
      pos.x = c.x + rr; // 中心が完全に一致したら +X へ
    }
    return true;
  }
  // box
  const cx = clamp(pos.x, c.minX, c.maxX);
  const cz = clamp(pos.z, c.minZ, c.maxZ);
  const ox = pos.x - cx;
  const oz = pos.z - cz;
  const d2 = ox * ox + oz * oz;
  if (d2 >= r * r) return false;
  if (d2 > EPS * EPS) {
    // 箱の外(角・辺の近く): 最近点から法線方向へ押し出す
    const d = Math.sqrt(d2);
    const k = (r - d) / d;
    pos.x += ox * k;
    pos.z += oz * k;
    return true;
  }
  // 中心が箱の内側: 最も浅い面から押し出す
  const pl = pos.x - c.minX;
  const pr = c.maxX - pos.x;
  const pn = pos.z - c.minZ;
  const pf = c.maxZ - pos.z;
  const m = Math.min(pl, pr, pn, pf);
  if (m === pl) pos.x = c.minX - r;
  else if (m === pr) pos.x = c.maxX + r;
  else if (m === pn) pos.z = c.minZ - r;
  else pos.z = c.maxZ + r;
  return true;
}

function resolve(pos, colliders, r) {
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (let i = 0; i < colliders.length; i++) {
      if (pushOut(pos, colliders[i], r)) moved = true;
    }
    if (!moved) break;
  }
}

// 軸ごとに動かし、めり込んだら押し戻す(壁に沿ってスライド)。pos を直接変更。戻り値なし。
// 1 ステップを r/2 以下に分割してトンネリングを防ぐ。
export function moveWithCollision(pos, dx, dz, colliders, r) {
  if (!Number.isFinite(dx)) dx = 0;
  if (!Number.isFinite(dz)) dz = 0;
  if (!Number.isFinite(r) || r <= 0) r = 0.01;
  const list = colliders || [];
  const sx0 = pos.x;
  const sz0 = pos.z;
  const maxStep = Math.max(0.02, r * 0.5);
  const n = Math.min(64, Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / maxStep)));
  const sx = dx / n;
  const sz = dz / n;
  for (let i = 0; i < n; i++) {
    if (sx !== 0) {
      pos.x += sx;
      resolve(pos, list, r);
    }
    if (sz !== 0) {
      pos.z += sz;
      resolve(pos, list, r);
    }
  }
  if (dx === 0 && dz === 0) resolve(pos, list, r); // 静止中でもめり込みは解消
  if (!Number.isFinite(pos.x) || !Number.isFinite(pos.z)) {
    pos.x = sx0;
    pos.z = sz0;
  }
}

// 半径 r の円がどれかのコライダーに当たっているか
export function circleHitsAny(x, z, r, colliders) {
  if (!colliders) return false;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (c.type === 'circle') {
      const ox = x - c.x;
      const oz = z - c.z;
      const rr = r + c.r;
      if (ox * ox + oz * oz < rr * rr) return true;
    } else {
      const ox = x - clamp(x, c.minX, c.maxX);
      const oz = z - clamp(z, c.minZ, c.maxZ);
      if (ox * ox + oz * oz < r * r) return true;
    }
  }
  return false;
}

// 線分 (x0,z0)-(x1,z1) が箱コライダーに当たるか(遮蔽判定用。円コライダーは無視)
export function segmentBlocked(x0, z0, x1, z1, colliders) {
  if (!colliders) return false;
  const dx = x1 - x0;
  const dz = z1 - z0;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (c.type !== 'box') continue;
    let tmin = 0;
    let tmax = 1;
    // X スラブ
    if (Math.abs(dx) < EPS) {
      if (x0 < c.minX || x0 > c.maxX) continue;
    } else {
      let t1 = (c.minX - x0) / dx;
      let t2 = (c.maxX - x0) / dx;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    // Z スラブ
    if (Math.abs(dz) < EPS) {
      if (z0 < c.minZ || z0 > c.maxZ) continue;
    } else {
      let t1 = (c.minZ - z0) / dz;
      let t2 = (c.maxZ - z0) / dz;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    return true;
  }
  return false;
}
