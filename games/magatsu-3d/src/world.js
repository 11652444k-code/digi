// 世界: 地形・小道具・光・昼夜・当たり判定データ・配置
// 座標: +X 右、−Z 奥、Y 上。単位 m。DESIGN.md「世界の配置」に準拠。
import * as THREE from 'three';

export const WORLD_SIZE = 200;

// ---------------------------------------------------------------------------
// 疑似乱数・ノイズ(seed 固定で毎回同じ配置)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix, iz) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x, z) {
  return valueNoise(x, z) * 0.6 + valueNoise(x * 2.3 + 17, z * 2.3 - 9) * 0.3 + valueNoise(x * 5.1 - 3, z * 5.1 + 11) * 0.1;
}

function distToSegment(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const l2 = vx * vx + vz * vz;
  let t = l2 > 0 ? ((px - ax) * vx + (pz - az) * vz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + vx * t - px;
  const qz = az + vz * t - pz;
  return Math.sqrt(qx * qx + qz * qz);
}

function inRect(x, z, minX, minZ, maxX, maxZ) {
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
}

const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// CanvasTexture(画像ファイルは使わない)。document が無い環境では null。
// ---------------------------------------------------------------------------
function canvasTexture(w, h, draw) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) return null;
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const JP_FONT = '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif';

function drawVertical(g, text, x, y, size, color) {
  g.fillStyle = color;
  g.font = `bold ${size}px ${JP_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'top';
  for (let i = 0; i < text.length; i++) g.fillText(text[i], x, y + i * size * 1.05);
}

// 張り紙(色褪せた紙に「立入禁止」など)
function makeNoticeTexture(rand, text) {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = '#d6ccb4';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 10 + rand() * 40;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, 'rgba(110,80,40,0.25)');
      grd.addColorStop(1, 'rgba(110,80,40,0)');
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.strokeStyle = 'rgba(40,20,15,0.7)';
    g.lineWidth = 3;
    g.strokeRect(8, 8, w - 16, h - 16);
    drawVertical(g, text, w / 2, 22, 46, '#1a1210');
    // 赤い滲み
    g.fillStyle = 'rgba(150,20,15,0.55)';
    g.beginPath();
    g.arc(w * 0.72, h * 0.86, 12, 0, Math.PI * 2);
    g.fill();
  });
}

// 御札(白い縦長に赤い印と墨の字)
function makeOfudaTexture() {
  return canvasTexture(64, 192, (g, w, h) => {
    g.fillStyle = '#f3efe4';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b3261e';
    g.lineWidth = 3;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#b3261e';
    g.beginPath();
    g.arc(w / 2, 26, 13, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f3efe4';
    g.fillRect(w / 2 - 2, 16, 4, 20);
    g.fillRect(w / 2 - 9, 24, 18, 4);
    drawVertical(g, '急急如律令', w / 2, 48, 25, '#141010');
    g.fillStyle = '#b3261e';
    g.fillRect(w / 2 - 14, h - 20, 28, 6);
  });
}

// 床板
function makePlankTexture(rand) {
  return canvasTexture(256, 256, (g, w, h) => {
    const n = 8;
    const ph = h / n;
    for (let i = 0; i < n; i++) {
      const v = 70 + Math.floor(rand() * 25);
      g.fillStyle = `rgb(${v},${Math.floor(v * 0.72)},${Math.floor(v * 0.5)})`;
      g.fillRect(0, i * ph, w, ph);
      g.strokeStyle = 'rgba(30,20,12,0.35)';
      g.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        const y = i * ph + 3 + rand() * (ph - 6);
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + rand() * 4 - 2, w * 0.7, y + rand() * 4 - 2, w, y);
        g.stroke();
      }
      g.fillStyle = 'rgba(10,6,4,0.9)';
      g.fillRect(0, i * ph, w, 2);
      const jx = rand() * w;
      g.fillRect(jx, i * ph, 2, ph);
    }
  });
}

// アイテムの淡い光輪
function makeGlowTexture() {
  return canvasTexture(64, 64, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,250,235,0.9)');
    grd.addColorStop(0.35, 'rgba(255,240,210,0.3)');
    grd.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
}

// 形代(紙の人形)のシルエット。足元 y=0、高さ約 0.47。
function makeKatashiroShape() {
  const s = new THREE.Shape();
  s.moveTo(0.03, 0.32);
  s.lineTo(0.17, 0.3);
  s.lineTo(0.17, 0.25);
  s.lineTo(0.05, 0.24);
  s.lineTo(0.07, 0.08);
  s.lineTo(0.07, 0.0);
  s.lineTo(0.015, 0.0);
  s.lineTo(0.0, 0.06);
  s.lineTo(-0.015, 0.0);
  s.lineTo(-0.07, 0.0);
  s.lineTo(-0.07, 0.08);
  s.lineTo(-0.05, 0.24);
  s.lineTo(-0.17, 0.25);
  s.lineTo(-0.17, 0.3);
  s.lineTo(-0.03, 0.32);
  const hy = 0.39;
  const a0 = Math.atan2(0.32 - hy, -0.03);
  const a1 = Math.atan2(0.32 - hy, 0.03);
  s.absarc(0, hy, 0.076, a0, a1, true); // 頭(上を通って右へ)
  return s;
}

// ---------------------------------------------------------------------------
// InstancedMesh ヘルパ
// ---------------------------------------------------------------------------
const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();

function setInst(mesh, i, x, y, z, rx, ry, rz, sx, sy, sz) {
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(sx, sy, sz);
  _m4.compose(_p, _q, _s);
  mesh.setMatrixAt(i, _m4);
}

function finishInst(mesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

// 切妻屋根(棟は X 方向)。破風の三角は押し出しで埋める。
function makeGableRoof({ cx, cz, width, depth, eaveY, ridgeY, overhang, mat, fillMat }) {
  const g = new THREE.Group();
  const rise = ridgeY - eaveY;
  const half = depth / 2;
  const slope = rise / half;
  const halfO = half + overhang;
  const len = Math.sqrt(halfO * halfO + (slope * halfO) * (slope * halfO));
  const ang = Math.atan(slope);
  const th = 0.22;
  const panelGeo = new THREE.BoxGeometry(width + overhang * 2, th, len);
  for (const sgn of [1, -1]) {
    const p = new THREE.Mesh(panelGeo, mat);
    p.position.set(cx, ridgeY - (slope * halfO) / 2 + th / 2, cz + (sgn * halfO) / 2);
    p.rotation.x = sgn * ang;
    p.castShadow = true;
    p.receiveShadow = true;
    g.add(p);
  }
  // 破風(三角柱)
  const tri = new THREE.Shape();
  tri.moveTo(-half, 0);
  tri.lineTo(half, 0);
  tri.lineTo(0, rise);
  tri.lineTo(-half, 0);
  const triGeo = new THREE.ExtrudeGeometry(tri, { depth: width, bevelEnabled: false });
  triGeo.translate(0, 0, -width / 2);
  triGeo.rotateY(Math.PI / 2);
  const fill = new THREE.Mesh(triGeo, fillMat || mat);
  fill.position.set(cx, eaveY, cz);
  fill.castShadow = true;
  fill.receiveShadow = true;
  g.add(fill);
  // 棟木
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(width + overhang * 2 + 0.2, 0.25, 0.4), mat);
  ridge.position.set(cx, ridgeY + th + 0.05, cz);
  ridge.castShadow = true;
  g.add(ridge);
  return g;
}

// ---------------------------------------------------------------------------
// 昼夜の値(DESIGN.md「昼夜」)
// ---------------------------------------------------------------------------
const DUSK = {
  skyTop: new THREE.Color(0x6b3a4a),
  skyHorizon: new THREE.Color(0xd97a4a),
  fog: new THREE.Color(0x8a5a5a),
  fogDensity: 0.012,
  ambColor: new THREE.Color(0xffc8a8),
  ambIntensity: 0.55,
  sunColor: new THREE.Color(0xff9a50), // 橙
  sunIntensity: 0.8,
};
const NIGHT = {
  skyTop: new THREE.Color(0x05060c),
  skyHorizon: new THREE.Color(0x0c0f1c),
  fog: new THREE.Color(0x070810),
  fogDensity: 0.045,
  ambColor: new THREE.Color(0x7080b0),
  ambIntensity: 0.08,
  sunColor: new THREE.Color(0xa8bcff), // 青白い月光
  sunIntensity: 0.12,
};

// ---------------------------------------------------------------------------
// buildWorld
// ---------------------------------------------------------------------------
export function buildWorld(scene, renderer) {
  const rand = mulberry32(0x6d61_6761); // 'maga'
  const texRand = mulberry32(1234567);
  const colliders = [];
  const addBox = (minX, minZ, maxX, maxZ) => colliders.push({ type: 'box', minX, minZ, maxX, maxZ });
  const addCircle = (x, z, r) => colliders.push({ type: 'circle', x, z, r });

  const root = new THREE.Group();
  root.name = 'world';
  scene.add(root);

  const maxAniso = renderer && renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 1;

  // 簡易メッシュ追加
  function add(geo, mat, x, y, z, { cast = true, receive = true, parent = root, ry = 0 } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  }

  // ----- 共有マテリアル -----
  const M = {
    wood: new THREE.MeshLambertMaterial({ color: 0x4a3828 }),
    woodDark: new THREE.MeshLambertMaterial({ color: 0x2b2119 }),
    houseWall: new THREE.MeshLambertMaterial({ color: 0x3f3226 }),
    vermilion: new THREE.MeshLambertMaterial({ color: 0xa8321f }),
    black: new THREE.MeshLambertMaterial({ color: 0x161312 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x77736b }),
    stoneDark: new THREE.MeshLambertMaterial({ color: 0x55524c }),
    roof: new THREE.MeshLambertMaterial({ color: 0x2a2826 }),
    roofHouse: new THREE.MeshLambertMaterial({ color: 0x33302b }),
    pole: new THREE.MeshLambertMaterial({ color: 0x5e5850 }),
    ridge: new THREE.MeshLambertMaterial({ color: 0x4b4130 }),
    inst: new THREE.MeshLambertMaterial({ color: 0xffffff }), // instanceColor で色付け
    paper: new THREE.MeshStandardMaterial({
      color: 0xf4f1e8, emissive: 0x2a2824, roughness: 0.9, metalness: 0, side: THREE.DoubleSide,
    }),
    water: new THREE.MeshStandardMaterial({ color: 0x1b2228, roughness: 0.12, metalness: 0.35 }),
    wire: new THREE.LineBasicMaterial({ color: 0x0c0b0b }),
  };

  // ----- 空(内側から見る球、頂点色グラデ) -----
  const SKY_R = 300; // camera.far=400 内に収まる
  const skyGeo = new THREE.SphereGeometry(SKY_R, 32, 16);
  const skyPos = skyGeo.attributes.position;
  const skyH = new Float32Array(skyPos.count);
  for (let i = 0; i < skyPos.count; i++) skyH[i] = skyPos.getY(i) / SKY_R;
  skyGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(skyPos.count * 3), 3));
  const sky = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  root.add(sky);

  // 太陽(夕)と月(夜)の円盤
  const sunDir = new THREE.Vector3(-0.75, 0.36, -0.5).normalize();
  const moonDir = new THREE.Vector3(0.45, 0.55, -0.7).normalize();
  const discMat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, fog: false, depthWrite: false });
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(9, 24), discMat(0xffb36a));
  sunDisc.position.copy(sunDir).multiplyScalar(270);
  sunDisc.lookAt(0, 0, 0);
  root.add(sunDisc);
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(5, 24), discMat(0xdfe6ff));
  moonDisc.position.copy(moonDir).multiplyScalar(270);
  moonDisc.lookAt(0, 0, 0);
  root.add(moonDisc);

  // ----- 光 -----
  scene.fog = new THREE.FogExp2(DUSK.fog.getHex(), DUSK.fogDensity);
  scene.background = DUSK.skyHorizon.clone();

  const ambient = new THREE.AmbientLight(DUSK.ambColor.getHex(), DUSK.ambIntensity);
  root.add(ambient);

  const sun = new THREE.DirectionalLight(DUSK.sunColor.getHex(), DUSK.sunIntensity);
  sun.target.position.set(0, 0, 5);
  sun.position.copy(sun.target.position).addScaledVector(sunDir, 150);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  // 光源ビュー空間で ±95m。地面上では概ね x −70..70, z −70..80 を覆う。
  const sc = sun.shadow.camera;
  sc.left = -95;
  sc.right = 95;
  sc.top = 95;
  sc.bottom = -95;
  sc.near = 10;
  sc.far = 320;
  sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  root.add(sun);
  root.add(sun.target);

  // ----- 地面 -----
  const PADDY = { minX: -60, maxX: -12, minZ: 0, maxZ: 60 };
  const BAMBOO = { minX: 15, maxX: 50, minZ: -45, maxZ: -8 };
  const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 100, 100);
  groundGeo.rotateX(-Math.PI / 2); // (x, y, 0) → (x, 0, -y)
  {
    const pos = groundGeo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const dirtA = new THREE.Color(0x3a3024);
    const dirtB = new THREE.Color(0x4d4231);
    const grass = new THREE.Color(0x353d24);
    const mud = new THREE.Color(0x231f1a);
    const leaf = new THREE.Color(0x3b3a22);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // 田んぼは一段低い(水面 y=−0.05 が見えるように)
      if (x > PADDY.minX && x < PADDY.maxX && z > PADDY.minZ && z < PADDY.maxZ) pos.setY(i, -0.3);
      const n = fbm(x * 0.08, z * 0.08);
      _c.copy(dirtA).lerp(dirtB, n);
      const gN = valueNoise(x * 0.05 + 40, z * 0.05 - 20);
      if (gN > 0.5) _c.lerp(grass, Math.min(1, (gN - 0.5) * 2.2));
      if (inRect(x, z, PADDY.minX, PADDY.minZ, PADDY.maxX, PADDY.maxZ)) _c.copy(mud);
      if (inRect(x, z, BAMBOO.minX - 2, BAMBOO.minZ - 2, BAMBOO.maxX + 2, BAMBOO.maxZ + 2)) _c.lerp(leaf, 0.6);
      _c.multiplyScalar(0.85 + hash2(i, 7) * 0.3);
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    groundGeo.computeVertexNormals();
  }
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = true;
  ground.name = 'ground';
  root.add(ground);

  // ----- 道(幅 4、x=0、z +75 → −65)と廃屋への脇道 -----
  const pathMat = new THREE.MeshLambertMaterial({
    vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  function makeStrip(minX, maxX, minZ, maxZ, segX, segZ) {
    const geo = new THREE.PlaneGeometry(maxX - minX, maxZ - minZ, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    geo.translate((minX + maxX) / 2, 0.02, (minZ + maxZ) / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const a = new THREE.Color(0x6e604a);
    const b = new THREE.Color(0x857459);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      _c.copy(a).lerp(b, fbm(x * 0.4, z * 0.4));
      const ex = Math.min(x - minX, maxX - x, z - minZ, maxZ - z);
      if (ex < 0.3) _c.multiplyScalar(0.8); // 縁はやや暗く
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, pathMat);
    m.receiveShadow = true;
    root.add(m);
    return m;
  }
  makeStrip(-2, 2, -65, 75, 4, 140);
  makeStrip(2, 25, 26, 28, 23, 2); // 廃屋への脇道
  makeStrip(25, 27, 24, 28, 2, 4);

  // ---------------------------------------------------------------------
  // 配置データ
  // ---------------------------------------------------------------------
  const waypoints = [
    [0, -10], [-8, 5], [0, 25], [8, 45], [30, 25], [20, -5], [0, -25],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const jizoSpawns = [
    [4, 50], [-4, 10], [5, -20], [-20, 45],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const menkaburiSpawn = new THREE.Vector3(0, 0, -10);
  const KATASHIRO_POS = [[3, 40], [-36, 30], [26, 19], [40, -30], [0, -62]];
  const OFUDA_POS = [[29, 21], [-4, -28]];
  const POLE_Z = [60, 45, 30, 15, 0, -15];
  const POLE_X = 6;

  function nearWaypointPath(x, z, d) {
    for (let i = 0; i < waypoints.length; i++) {
      const a = waypoints[i];
      const b = waypoints[(i + 1) % waypoints.length];
      if (distToSegment(x, z, a.x, a.z, b.x, b.z) < d) return true;
    }
    return false;
  }
  const keyPoints = [
    ...KATASHIRO_POS, ...OFUDA_POS,
    ...jizoSpawns.map((v) => [v.x, v.z]),
    ...waypoints.map((v) => [v.x, v.z]),
    [0, 70],
  ];
  function nearKeyPoint(x, z, d) {
    return keyPoints.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < d * d);
  }

  // ---------------------------------------------------------------------
  // 田んぼ(4 区画)・畦道・稲・祠
  // ---------------------------------------------------------------------
  {
    const w = PADDY.maxX - PADDY.minX;
    const d = PADDY.maxZ - PADDY.minZ;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.water);
    water.rotation.x = -Math.PI / 2;
    water.position.set((PADDY.minX + PADDY.maxX) / 2, -0.05, (PADDY.minZ + PADDY.maxZ) / 2);
    water.receiveShadow = true;
    root.add(water);

    // 畦道(高さ 0.2。底 −0.3 から立ち上げる)
    const RW = 0.8;
    const ridgeH = 0.5;
    const ridgeY = 0.2 - ridgeH / 2;
    const midX = -36;
    const midZ = 30;
    const zs = [PADDY.minZ, midZ, PADDY.maxZ];
    const xs = [PADDY.minX, midX, PADDY.maxX];
    for (const z of zs) add(new THREE.BoxGeometry(w + RW, ridgeH, RW), M.ridge, (PADDY.minX + PADDY.maxX) / 2, ridgeY, z, { cast: false });
    for (const x of xs) add(new THREE.BoxGeometry(RW, ridgeH, d + RW), M.ridge, x, ridgeY, (PADDY.minZ + PADDY.maxZ) / 2, { cast: false });

    // 稲株(InstancedMesh、影なし)
    const tufts = [];
    for (let x = PADDY.minX + 1.2; x < PADDY.maxX - 0.8; x += 1.5) {
      for (let z = PADDY.minZ + 1.2; z < PADDY.maxZ - 0.8; z += 1.5) {
        if (Math.abs(x - midX) < 1.0 || Math.abs(z - midZ) < 1.0) continue;
        tufts.push([x + (rand() - 0.5) * 0.3, z + (rand() - 0.5) * 0.3]);
      }
    }
    const tuftGeo = new THREE.ConeGeometry(0.12, 0.5, 4).translate(0, 0.25, 0);
    const rice = new THREE.InstancedMesh(tuftGeo, M.inst, tufts.length);
    tufts.forEach(([x, z], i) => {
      const s = 0.7 + rand() * 0.6;
      setInst(rice, i, x, -0.08, z, (rand() - 0.5) * 0.3, rand() * 6, (rand() - 0.5) * 0.3, s, s, s);
      rice.setColorAt(i, _c.setHSL(0.2 + rand() * 0.05, 0.35, 0.16 + rand() * 0.06));
    });
    finishInst(rice);
    root.add(rice);
  }

  // 祠 (−36, 30)
  {
    const hx = -36;
    const hz = 30;
    const g = new THREE.Group();
    root.add(g);
    add(new THREE.BoxGeometry(1.4, 0.3, 1.2), M.stone, hx, 0.15, hz, { parent: g });
    add(new THREE.BoxGeometry(0.9, 0.8, 0.8), M.stoneDark, hx, 0.7, hz, { parent: g });
    // 正面の暗い開口
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.5), M.black);
    hole.position.set(hx, 0.68, hz + 0.405);
    g.add(hole);
    const roofGeo = new THREE.ConeGeometry(0.95, 0.45, 4);
    add(roofGeo, M.stone, hx, 1.32, hz, { parent: g, ry: Math.PI / 4 });
    add(new THREE.SphereGeometry(0.1, 8, 6), M.stone, hx, 1.58, hz, { parent: g });
    addBox(hx - 0.7, hz - 0.6, hx + 0.7, hz + 0.6);
  }

  // ---------------------------------------------------------------------
  // 鳥居 (0, 0, −30)
  // ---------------------------------------------------------------------
  const TORII_Z = -30;
  const TORII_X = 2.6;
  const toriiGroup = new THREE.Group();
  root.add(toriiGroup);
  {
    const pillarGeo = new THREE.CylinderGeometry(0.26, 0.3, 5.2, 12);
    const baseGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.5, 12);
    for (const sx of [-1, 1]) {
      add(pillarGeo, M.vermilion, sx * TORII_X, 2.6, TORII_Z, { parent: toriiGroup });
      add(baseGeo, M.black, sx * TORII_X, 0.25, TORII_Z, { parent: toriiGroup });
      addCircle(sx * TORII_X, TORII_Z, 0.4);
    }
    add(new THREE.BoxGeometry(6.8, 0.36, 0.26), M.vermilion, 0, 4.15, TORII_Z, { parent: toriiGroup }); // 貫
    add(new THREE.BoxGeometry(7.8, 0.32, 0.45), M.vermilion, 0, 4.92, TORII_Z, { parent: toriiGroup }); // 島木
    add(new THREE.BoxGeometry(8.6, 0.3, 0.6), M.black, 0, 5.23, TORII_Z, { parent: toriiGroup }); // 笠木
    // 笠木の反り(両端を少し持ち上げる)
    for (const sx of [-1, 1]) {
      const tip = add(new THREE.BoxGeometry(0.9, 0.3, 0.6), M.black, sx * 4.45, 5.3, TORII_Z, { parent: toriiGroup });
      tip.rotation.z = sx * 0.18;
    }
    add(new THREE.BoxGeometry(0.28, 0.62, 0.22), M.vermilion, 0, 4.6, TORII_Z, { parent: toriiGroup }); // 額束
    add(new THREE.BoxGeometry(0.7, 0.9, 0.08), M.black, 0, 4.55, TORII_Z + 0.16, { parent: toriiGroup }); // 額
  }

  // ---------------------------------------------------------------------
  // 社(本殿)(0, 0, −55) 幅 10 × 奥行 8 + 切妻屋根 + 階段
  // ---------------------------------------------------------------------
  const SHRINE_Z = -55;
  {
    const g = new THREE.Group();
    root.add(g);
    add(new THREE.BoxGeometry(11, 0.6, 9), M.stone, 0, 0.3, SHRINE_Z, { parent: g }); // 基壇
    add(new THREE.BoxGeometry(10, 3.0, 8), M.wood, 0, 2.1, SHRINE_Z, { parent: g }); // 本体
    // 柱
    const colGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.0, 8);
    for (const x of [-5, -1.6, 1.6, 5]) {
      for (const z of [-4, 4]) add(colGeo, M.woodDark, x, 2.1, SHRINE_Z + z, { parent: g });
    }
    // 正面の格子戸
    add(new THREE.BoxGeometry(3.0, 2.4, 0.1), M.woodDark, 0, 1.85, SHRINE_Z + 4.03, { parent: g });
    const latticeGeo = new THREE.BoxGeometry(0.05, 2.3, 0.06);
    for (let i = -6; i <= 6; i++) add(latticeGeo, M.wood, i * 0.22, 1.85, SHRINE_Z + 4.1, { parent: g, cast: false });
    // 賽銭箱
    add(new THREE.BoxGeometry(1.2, 0.6, 0.6), M.woodDark, 0, 0.9, SHRINE_Z + 4.5, { parent: g });
    // 階段(3 段、+Z 側へ)
    for (let i = 0; i < 3; i++) {
      const h = 0.45 - i * 0.15;
      add(new THREE.BoxGeometry(3.2, h, 0.25), M.stone, 0, h / 2, SHRINE_Z + 4.5 + 0.125 + i * 0.25, { parent: g });
    }
    g.add(makeGableRoof({
      cx: 0, cz: SHRINE_Z, width: 10, depth: 8, eaveY: 3.6, ridgeY: 5.2, overhang: 0.9, mat: M.roof, fillMat: M.wood,
    }));
    // 鰹木
    const katsuoGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 8).rotateX(Math.PI / 2);
    for (let i = -2; i <= 2; i++) add(katsuoGeo, M.woodDark, i * 1.6, 5.62, SHRINE_Z, { parent: g });
    // 本体+基壇+階段をまとめて 1 箱
    addBox(-5.5, SHRINE_Z - 4.5, 5.5, SHRINE_Z + 5.25);
  }

  // 祭壇 (0, 0, −49) 石の台。上面 y=0.9
  const altarPos = new THREE.Vector3(0, 0, -49);
  const altarDolls = [];
  {
    add(new THREE.BoxGeometry(1.6, 0.3, 1.2), M.stoneDark, altarPos.x, 0.15, altarPos.z);
    add(new THREE.BoxGeometry(1.2, 0.6, 0.9), M.stone, altarPos.x, 0.6, altarPos.z);
    addBox(altarPos.x - 0.8, altarPos.z - 0.6, altarPos.x + 0.8, altarPos.z + 0.6);
    // 納めた形代(寝かせた小さな紙人形 5 枚)
    const smallGeo = new THREE.ShapeGeometry(makeKatashiroShape());
    smallGeo.rotateX(-Math.PI / 2); // 寝かせる。頭は −Z(社側)
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(smallGeo, M.paper);
      m.scale.setScalar(0.5);
      m.position.set(altarPos.x - 0.4 + i * 0.2, 0.905, altarPos.z + 0.12);
      m.rotation.y = (hash2(i, 3) - 0.5) * 0.3;
      m.visible = false;
      root.add(m);
      altarDolls.push(m);
    }
  }

  // ---------------------------------------------------------------------
  // 廃屋 中心 (26, 0, 20) 外寸 12×8 高 3.2、南(+Z)中央に幅 1.6 の戸口
  // ---------------------------------------------------------------------
  {
    const cx = 26;
    const cz = 20;
    const W = 12;
    const D = 8;
    const H = 3.2;
    const T = 0.3;
    const x0 = cx - W / 2; // 20
    const x1 = cx + W / 2; // 32
    const z0 = cz - D / 2; // 16
    const z1 = cz + D / 2; // 24
    const door0 = cx - 0.8; // 25.2
    const door1 = cx + 0.8; // 26.8
    const g = new THREE.Group();
    root.add(g);
    const wall = (minX, minZ, maxX, maxZ, collide = true) => {
      add(new THREE.BoxGeometry(maxX - minX, H, maxZ - minZ), M.houseWall, (minX + maxX) / 2, H / 2, (minZ + maxZ) / 2, { parent: g });
      if (collide) addBox(minX, minZ, maxX, maxZ);
    };
    wall(x0, z0, x1, z0 + T); // 北
    wall(x0, z1 - T, door0, z1); // 南(左)
    wall(door1, z1 - T, x1, z1); // 南(右)
    wall(x0, z0 + T, x0 + T, z1 - T); // 西
    wall(x1 - T, z0 + T, x1, z1 - T); // 東
    // 戸口の上の鴨居(当たり判定なし)
    add(new THREE.BoxGeometry(door1 - door0, H - 2.1, T), M.houseWall, cx, 2.1 + (H - 2.1) / 2, z1 - T / 2, { parent: g });
    // 外れかけた戸(戸口の脇に立てかける)
    const door = add(new THREE.BoxGeometry(0.9, 1.9, 0.05), M.woodDark, door1 + 0.7, 0.95, z1 + 0.25, { parent: g });
    door.rotation.x = -0.12;
    door.rotation.y = 0.08;

    // 床(板)
    const plankTex = makePlankTexture(texRand);
    if (plankTex) {
      plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping;
      plankTex.repeat.set((W - 2 * T) / 2.5, (D - 2 * T) / 2.5);
      plankTex.anisotropy = Math.min(8, maxAniso);
    }
    const floorMat = new THREE.MeshLambertMaterial({ color: plankTex ? 0xffffff : 0x5a4330, map: plankTex });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, D - 2 * T), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0.03, cz);
    floor.receiveShadow = true;
    g.add(floor);
    // 天井(下向き)
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, D - 2 * T), M.woodDark);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, H - 0.05, cz);
    ceil.receiveShadow = true;
    g.add(ceil);
    // 梁
    const beamGeo = new THREE.BoxGeometry(0.2, 0.22, D - 2 * T);
    for (const bx of [22.5, 26, 29.5]) add(beamGeo, M.woodDark, bx, H - 0.16, cz, { parent: g, cast: false });
    // 屋根
    g.add(makeGableRoof({
      cx, cz, width: W, depth: D, eaveY: H, ridgeY: 4.5, overhang: 0.5, mat: M.roofHouse, fillMat: M.houseWall,
    }));
    // 板で打ち付けた窓(外側の飾り)
    const plankGeo = new THREE.BoxGeometry(1.5, 0.14, 0.05);
    const winGeo = new THREE.PlaneGeometry(1.2, 0.9);
    const windows = [
      [x0 - 0.01, 1.6, 19, -Math.PI / 2], [x0 - 0.01, 1.6, 22, -Math.PI / 2],
      [x1 + 0.01, 1.6, 18.5, Math.PI / 2], [x1 + 0.01, 1.6, 21.5, Math.PI / 2],
      [23, 1.6, z1 + 0.01, 0], [29.5, 1.6, z1 + 0.01, 0],
    ];
    for (const [wx, wy, wz, ry] of windows) {
      const wm = new THREE.Mesh(winGeo, M.black);
      wm.position.set(wx, wy, wz);
      wm.rotation.y = ry;
      g.add(wm);
      for (const k of [-1, 1]) {
        const p = new THREE.Mesh(plankGeo, M.wood);
        p.position.set(wx, wy, wz);
        p.rotation.set(0, ry, k * 0.45);
        p.translateZ(0.03);
        p.castShadow = true;
        g.add(p);
      }
    }
    // 屋内の家具: ちゃぶ台・箪笥
    add(new THREE.BoxGeometry(1.4, 0.35, 0.9), M.wood, 23.2, 0.175, 17.6, { parent: g });
    addBox(22.5, 17.15, 23.9, 18.05);
    add(new THREE.BoxGeometry(0.6, 1.6, 2.0), M.woodDark, 20.6, 0.8, 22.0, { parent: g });
    addBox(20.3, 21.0, 20.9, 23.0);
  }

  // ---------------------------------------------------------------------
  // 電柱 x=6、z=60,45,30,15,0,−15。高 9。隣同士を 2 本の電線で結ぶ
  // ---------------------------------------------------------------------
  {
    const POLE_H = 9;
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.17, POLE_H, 8).translate(0, POLE_H / 2, 0);
    const poles = new THREE.InstancedMesh(poleGeo, M.pole, POLE_Z.length);
    const armGeo = new THREE.BoxGeometry(1.6, 0.12, 0.12);
    const arms = new THREE.InstancedMesh(armGeo, M.woodDark, POLE_Z.length);
    POLE_Z.forEach((z, i) => {
      const lean = (hash2(i, 11) - 0.5) * 0.04;
      setInst(poles, i, POLE_X, 0, z, lean, 0, (hash2(i, 12) - 0.5) * 0.04, 1, 1, 1);
      setInst(arms, i, POLE_X, 8.3, z, 0, 0, (hash2(i, 13) - 0.5) * 0.08, 1, 1, 1);
      addCircle(POLE_X, z, 0.25);
    });
    poles.castShadow = arms.castShadow = true;
    poles.receiveShadow = true;
    finishInst(poles);
    finishInst(arms);
    root.add(poles, arms);

    // 電線(放物線でたるませる)
    const pts = [];
    const SEG = 12;
    const wireY = 8.42;
    for (let i = 0; i < POLE_Z.length - 1; i++) {
      for (const ox of [-0.65, 0.65]) {
        const za = POLE_Z[i];
        const zb = POLE_Z[i + 1];
        for (let k = 0; k < SEG; k++) {
          const t0 = k / SEG;
          const t1 = (k + 1) / SEG;
          const sag = 0.7;
          pts.push(POLE_X + ox, wireY - sag * 4 * t0 * (1 - t0), lerp(za, zb, t0));
          pts.push(POLE_X + ox, wireY - sag * 4 * t1 * (1 - t1), lerp(za, zb, t1));
        }
      }
    }
    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    root.add(new THREE.LineSegments(wireGeo, M.wire));
  }

  // ---------------------------------------------------------------------
  // 張り紙・御札(見た目のみ)
  // ---------------------------------------------------------------------
  {
    const texts = ['立入禁止', '夜歩クナ', '尋ネ人'];
    const noticeGeo = new THREE.PlaneGeometry(0.45, 0.9);
    const noticeMats = texts.map((t) => {
      const tex = makeNoticeTexture(texRand, t);
      return new THREE.MeshLambertMaterial({ color: tex ? 0xffffff : 0xd6ccb4, map: tex, side: THREE.DoubleSide });
    });
    // 電柱(道側 −X を向ける)
    [[45, 0], [15, 1], [-15, 2]].forEach(([z, k]) => {
      const m = new THREE.Mesh(noticeGeo, noticeMats[k]);
      m.position.set(POLE_X - 0.19, 1.7, z);
      m.rotation.set(0, -Math.PI / 2, (hash2(z, 5) - 0.5) * 0.12);
      root.add(m);
    });
    // 廃屋の中(北壁の内側)
    const inner = new THREE.Mesh(noticeGeo, noticeMats[2]);
    inner.position.set(27.5, 1.7, 16.31);
    inner.rotation.z = 0.05;
    root.add(inner);

    // 鳥居の柱に御札
    const ofudaTex = makeOfudaTexture();
    const ofudaDecoMat = new THREE.MeshLambertMaterial({ color: ofudaTex ? 0xffffff : 0xf3efe4, map: ofudaTex, side: THREE.DoubleSide });
    const decoGeo = new THREE.PlaneGeometry(0.16, 0.48);
    for (const [x, y, rz] of [[-TORII_X, 1.6, 0.04], [TORII_X, 1.5, -0.06], [TORII_X, 2.1, 0.03]]) {
      const m = new THREE.Mesh(decoGeo, ofudaDecoMat);
      m.position.set(x, y, TORII_Z + 0.305);
      m.rotation.z = rz;
      root.add(m);
    }
    // 電柱にも御札
    const m = new THREE.Mesh(decoGeo, ofudaDecoMat);
    m.position.set(POLE_X - 0.19, 2.6, 30);
    m.rotation.y = -Math.PI / 2;
    root.add(m);
  }

  // ---------------------------------------------------------------------
  // 竹林 x 15..50、z −45..−8 に 120 本(InstancedMesh、影なし)
  // ---------------------------------------------------------------------
  {
    const N = 120;
    const list = [];
    let tries = 0;
    while (list.length < N && tries < 20000) {
      tries++;
      const x = lerp(BAMBOO.minX, BAMBOO.maxX, rand());
      const z = lerp(BAMBOO.minZ, BAMBOO.maxZ, rand());
      if ((x - 40) ** 2 + (z + 30) ** 2 < 2.2 * 2.2) continue; // 形代のまわりは空ける
      if (nearWaypointPath(x, z, 1.6)) continue;
      if (list.some((b) => (b.x - x) ** 2 + (b.z - z) ** 2 < 0.9 * 0.9)) continue;
      list.push({ x, z });
    }
    const stalkGeo = new THREE.CylinderGeometry(0.065, 0.08, 1, 6).translate(0, 0.5, 0);
    const leafGeo = new THREE.IcosahedronGeometry(1, 0);
    const stalks = new THREE.InstancedMesh(stalkGeo, M.inst, list.length);
    const leaves = new THREE.InstancedMesh(leafGeo, M.inst, list.length * 2);
    const up = new THREE.Vector3();
    list.forEach((b, i) => {
      const h = 8 + rand() * 3;
      const rx = (rand() - 0.5) * 0.08;
      const rz = (rand() - 0.5) * 0.08;
      setInst(stalks, i, b.x, 0, b.z, rx, rand() * 6, rz, 1, h, 1);
      stalks.setColorAt(i, _c.setHSL(0.22 + rand() * 0.04, 0.38, 0.26 + rand() * 0.08));
      // 傾きに沿って葉の位置を求める
      _e.set(rx, 0, rz);
      for (let k = 0; k < 2; k++) {
        const hh = h - 0.4 - k * 1.5;
        up.set(0, hh, 0).applyEuler(_e);
        const s = 0.9 + rand() * 0.5 - k * 0.15;
        setInst(leaves, i * 2 + k, b.x + up.x + (rand() - 0.5) * 0.5, up.y, b.z + up.z + (rand() - 0.5) * 0.5,
          rand(), rand() * 6, rand(), s * 1.1, s * 0.5, s * 1.1);
        leaves.setColorAt(i * 2 + k, _c.setHSL(0.25 + rand() * 0.05, 0.4, 0.14 + rand() * 0.06));
      }
      addCircle(b.x, b.z, 0.12);
    });
    finishInst(stalks);
    finishInst(leaves);
    root.add(stalks, leaves);
  }

  // ---------------------------------------------------------------------
  // 木 40 本(道の外周。杉=円錐 2 段 / 広葉樹=球)
  // ---------------------------------------------------------------------
  {
    function treeOK(x, z) {
      if (Math.abs(x) < 5) return false; // 道
      if (x > 0 && x < 28 && z > 22 && z < 30) return false; // 脇道
      if (inRect(x, z, PADDY.minX - 2, PADDY.minZ - 2, PADDY.maxX + 2, PADDY.maxZ + 2)) return false;
      if (inRect(x, z, 16, 12, 36, 29)) return false; // 廃屋
      if (inRect(x, z, BAMBOO.minX - 2, BAMBOO.minZ - 2, BAMBOO.maxX + 2, BAMBOO.maxZ + 2)) return false;
      if (inRect(x, z, -9, -68, 9, -42)) return false; // 社
      if (inRect(x, z, 3.5, -18, 8.5, 63)) return false; // 電柱・電線の下
      if (nearKeyPoint(x, z, 3)) return false;
      if (nearWaypointPath(x, z, 2.5)) return false;
      return true;
    }
    const trees = [];
    let tries = 0;
    while (trees.length < 40 && tries < 20000) {
      tries++;
      const side = rand() < 0.5 ? -1 : 1;
      const x = side * (5 + Math.pow(rand(), 1.3) * 45);
      const z = -75 + rand() * 155;
      if (!treeOK(x, z)) continue;
      if (trees.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < 16)) continue;
      trees.push({ x, z, cedar: rand() < 0.55, s: 0.8 + rand() * 0.5, h: 0, ry: rand() * 6 });
    }
    const cedars = trees.filter((t) => t.cedar);
    const broads = trees.filter((t) => !t.cedar);
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1, 7).translate(0, 0.5, 0);
    const coneGeo = new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0);
    const blobGeo = new THREE.IcosahedronGeometry(1, 1);
    const trunks = new THREE.InstancedMesh(trunkGeo, M.inst, trees.length);
    const cones = new THREE.InstancedMesh(coneGeo, M.inst, cedars.length * 2);
    const blobs = new THREE.InstancedMesh(blobGeo, M.inst, broads.length * 2);
    trees.forEach((t, i) => {
      t.h = t.cedar ? 3 + rand() * 1.5 : 2 + rand() * 1;
      setInst(trunks, i, t.x, 0, t.z, 0, t.ry, 0, t.s, t.h, t.s);
      trunks.setColorAt(i, _c.setHSL(0.07, 0.3, 0.12 + rand() * 0.05));
      addCircle(t.x, t.z, 0.35 * t.s);
    });
    cedars.forEach((t, i) => {
      const s = t.s;
      setInst(cones, i * 2, t.x, t.h - 0.5, t.z, 0, t.ry, 0, 2.0 * s, 5.0 * s, 2.0 * s);
      setInst(cones, i * 2 + 1, t.x, t.h + 2.6 * s, t.z, 0, t.ry, 0, 1.4 * s, 4.2 * s, 1.4 * s);
      for (let k = 0; k < 2; k++) cones.setColorAt(i * 2 + k, _c.setHSL(0.3 + rand() * 0.06, 0.3, 0.09 + rand() * 0.04));
    });
    broads.forEach((t, i) => {
      const s = t.s;
      setInst(blobs, i * 2, t.x, t.h + 1.5 * s, t.z, rand(), rand(), 0, 2.4 * s, 2.0 * s, 2.4 * s);
      setInst(blobs, i * 2 + 1, t.x + (rand() - 0.5) * 1.6 * s, t.h + 2.6 * s, t.z + (rand() - 0.5) * 1.6 * s,
        rand(), rand(), 0, 1.6 * s, 1.4 * s, 1.6 * s);
      for (let k = 0; k < 2; k++) blobs.setColorAt(i * 2 + k, _c.setHSL(0.24 + rand() * 0.08, 0.3, 0.1 + rand() * 0.05));
    });
    for (const im of [trunks, cones, blobs]) {
      im.castShadow = true;
      im.receiveShadow = true;
      finishInst(im);
      root.add(im);
    }
  }

  // 道端の草(影なし、当たり判定なし)
  {
    const pts = [];
    let tries = 0;
    while (pts.length < 600 && tries < 6000) {
      tries++;
      const side = rand() < 0.5 ? -1 : 1;
      const x = side * (2.3 + Math.pow(rand(), 1.6) * 28);
      const z = -48 + rand() * 128;
      if (inRect(x, z, PADDY.minX - 1, PADDY.minZ - 1, PADDY.maxX + 1, PADDY.maxZ + 1)) continue;
      if (inRect(x, z, 19.5, 15.5, 32.5, 24.5)) continue;
      if (inRect(x, z, BAMBOO.minX, BAMBOO.minZ, BAMBOO.maxX, BAMBOO.maxZ)) continue;
      if (x > 1.8 && x < 27.5 && z > 23.5 && z < 28.2) continue;
      pts.push([x, z]);
    }
    const grassGeo = new THREE.ConeGeometry(0.1, 0.4, 3).translate(0, 0.2, 0);
    const grass = new THREE.InstancedMesh(grassGeo, M.inst, pts.length);
    pts.forEach(([x, z], i) => {
      const s = 0.6 + rand() * 0.9;
      setInst(grass, i, x, 0, z, (rand() - 0.5) * 0.4, rand() * 6, (rand() - 0.5) * 0.4, s, s * (0.8 + rand() * 0.6), s);
      grass.setColorAt(i, _c.setHSL(0.17 + rand() * 0.08, 0.3, 0.14 + rand() * 0.06));
    });
    finishInst(grass);
    root.add(grass);
  }

  // 遠景の山(霧で空に溶けるシルエット。地面の端を隠す)
  {
    const N = 28;
    const mGeo = new THREE.ConeGeometry(1, 1, 6).translate(0, 0.5, 0);
    const mtn = new THREE.InstancedMesh(mGeo, M.inst, N);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (rand() - 0.5) * 0.15;
      const r = 135 + rand() * 30;
      const br = 28 + rand() * 20;
      setInst(mtn, i, Math.cos(a) * r, -1, Math.sin(a) * r, 0, rand() * 6, 0, br, 18 + rand() * 24, br);
      mtn.setColorAt(i, _c.setHex(0x221c22));
    }
    finishInst(mtn);
    root.add(mtn);
  }

  // ---------------------------------------------------------------------
  // 提灯(鳥居の両脇・社の前)。暖色の PointLight が揺らぐ
  // three r170 は物理単位: intensity はカンデラ相当。decay 2 で 3m 先 ≈ 18/9 = 2、
  // 夕暮れの方向光 0.8 より明るく、夜(×3=54)は方向光 0.12 を大きく上回る。
  // ---------------------------------------------------------------------
  const lanterns = [];
  {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 2.0, 6).translate(0, 1.0, 0);
    const bodyGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.44, 12);
    const capGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 10);
    const spots = [
      [-3.8, TORII_Z - 1.5], [3.8, TORII_Z - 1.5],
      [-3.2, -47], [3.2, -47],
    ];
    spots.forEach(([x, z], i) => {
      add(postGeo, M.woodDark, x, 0, z);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xc8401c, emissive: 0xff6a24, emissiveIntensity: 0.8, roughness: 0.8,
      });
      add(bodyGeo, mat, x, 2.25, z, { cast: false });
      add(capGeo, M.black, x, 2.5, z, { cast: false });
      add(capGeo, M.black, x, 2.0, z, { cast: false });
      const light = new THREE.PointLight(0xff9a50, 18, 14, 2);
      light.position.set(x, 2.25, z);
      light.castShadow = false;
      root.add(light);
      addCircle(x, z, 0.2);
      lanterns.push({ light, mat, base: 18, phase: i * 1.7 + 0.3 });
    });
  }

  // ---------------------------------------------------------------------
  // アイテム(形代 5・御札 2)
  // ---------------------------------------------------------------------
  const items = [];
  {
    const glowTex = makeGlowTexture();
    const glowMat = glowTex
      ? new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 })
      : null;
    const kataGeo = new THREE.ShapeGeometry(makeKatashiroShape()).translate(0, -0.24, 0);
    const ofudaTex = makeOfudaTexture();
    const ofudaFace = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: ofudaTex, emissive: ofudaTex ? 0x3a3a3a : 0x222222, emissiveMap: ofudaTex, roughness: 0.9,
    });
    const ofudaSide = new THREE.MeshStandardMaterial({ color: 0xf3efe4, emissive: 0x222222, roughness: 0.9 });
    const ofudaGeo = new THREE.BoxGeometry(0.15, 0.45, 0.012);
    const ofudaMats = [ofudaSide, ofudaSide, ofudaSide, ofudaSide, ofudaFace, ofudaFace];

    const addItem = (id, kind, x, z, baseY) => {
      const g = new THREE.Group();
      g.position.set(x, baseY, z);
      if (kind === 'katashiro') {
        // 平面 2 枚を十字に
        for (const ry of [0, Math.PI / 2]) {
          const m = new THREE.Mesh(kataGeo, M.paper);
          m.rotation.y = ry;
          m.castShadow = false;
          g.add(m);
        }
      } else {
        g.add(new THREE.Mesh(ofudaGeo, ofudaMats));
      }
      if (glowMat) {
        const halo = new THREE.Sprite(glowMat);
        halo.scale.setScalar(0.9);
        g.add(halo);
      }
      g.userData.baseY = baseY;
      g.userData.phase = hash2(items.length, 21) * Math.PI * 2;
      g.name = id;
      root.add(g);
      items.push({ id, kind, position: new THREE.Vector3(x, 0, z), object: g, taken: false });
    };
    KATASHIRO_POS.forEach(([x, z], i) => {
      const onHokora = x === -36 && z === 30;
      addItem(`katashiro_${i + 1}`, 'katashiro', x, z, onHokora ? 1.95 : 0.9);
    });
    OFUDA_POS.forEach(([x, z], i) => addItem(`ofuda_${i + 1}`, 'ofuda', x, z, 0.95));
  }

  // ---------------------------------------------------------------------
  // 昼夜
  // ---------------------------------------------------------------------
  const skyColAttr = skyGeo.attributes.color;
  const cTop = new THREE.Color();
  const cHor = new THREE.Color();
  const cFog = new THREE.Color();
  let night = 0;

  function setNight(t) {
    t = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
    night = t;
    cTop.lerpColors(DUSK.skyTop, NIGHT.skyTop, t);
    cHor.lerpColors(DUSK.skyHorizon, NIGHT.skyHorizon, t);
    cFog.lerpColors(DUSK.fog, NIGHT.fog, t);
    // 空のグラデ: 地平(h=0)→天頂(h≥0.45)、地平線より下は霧色
    for (let i = 0; i < skyH.length; i++) {
      const h = skyH[i];
      if (h >= 0) _c.copy(cHor).lerp(cTop, smooth(Math.min(1, h / 0.45)));
      else _c.copy(cHor).lerp(cFog, smooth(Math.min(1, -h / 0.08)));
      skyColAttr.setXYZ(i, _c.r, _c.g, _c.b);
    }
    skyColAttr.needsUpdate = true;
    if (scene.background && scene.background.isColor) scene.background.lerpColors(DUSK.skyTop, NIGHT.skyTop, t);
    else scene.background = cTop.clone();
    if (scene.fog) {
      scene.fog.color.copy(cFog);
      scene.fog.density = lerp(DUSK.fogDensity, NIGHT.fogDensity, t);
    }
    ambient.color.lerpColors(DUSK.ambColor, NIGHT.ambColor, t);
    ambient.intensity = lerp(DUSK.ambIntensity, NIGHT.ambIntensity, t);
    sun.color.lerpColors(DUSK.sunColor, NIGHT.sunColor, t);
    sun.intensity = lerp(DUSK.sunIntensity, NIGHT.sunIntensity, t);
    sunDisc.material.opacity = 1 - t;
    sunDisc.visible = t < 0.999;
    moonDisc.material.opacity = t;
    moonDisc.visible = t > 0.001;
  }
  setNight(0);

  // 提灯の揺らぎ・アイテムの浮遊回転
  function update(dt, time) {
    const nf = 1 + 2 * night; // 夜ほど提灯を強く
    for (const L of lanterns) {
      const p = L.phase;
      const f = 0.84
        + 0.08 * Math.sin(time * 11.3 + p)
        + 0.05 * Math.sin(time * 6.7 + p * 2.1)
        + 0.03 * Math.sin(time * 23.1 + p * 0.7);
      L.light.intensity = L.base * nf * f;
      L.mat.emissiveIntensity = (0.6 + 1.4 * night) * f;
    }
    for (const it of items) {
      const o = it.object;
      o.visible = !it.taken;
      if (!o.visible) continue;
      o.rotation.y += dt * 1.2;
      o.position.y = o.userData.baseY + Math.sin(time * 2.0 + o.userData.phase) * 0.07;
    }
  }

  const altar = {
    position: altarPos,
    radius: 2.5,
    // 台の上に紙を count 枚並べる(0 で全て消す)
    placeKatashiro(count) {
      const n = Math.max(0, Math.min(altarDolls.length, Math.floor(count) || 0));
      altarDolls.forEach((m, i) => { m.visible = i < n; });
    },
  };

  return {
    colliders,
    items,
    altar,
    playerSpawn: { position: new THREE.Vector3(0, 1.6, 70), yaw: 0 }, // yaw 0 = −Z を向く
    enemySpawns: { menkaburi: menkaburiSpawn, jizo: jizoSpawns },
    waypoints,
    setNight,
    update,
  };
}
