// 敵: 面被り(Menkaburi) と 地蔵(Jizo)。DESIGN.md の enemies.js インターフェースに準拠。
import * as THREE from 'three';
import { moveWithCollision, segmentBlocked } from './collision.js';
import { makeBillboard } from './sprites.js';

const NIGHT_ACTIVE = 0.6;

// ---- 小さなユーティリティ ----
function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function approachAngle(cur, target, rate, dt) {
  const d = wrapAngle(target - cur);
  const k = 1 - Math.exp(-rate * dt);
  return wrapAngle(cur + d * k);
}
function damp(cur, target, rate, dt) {
  return cur + (target - cur) * (1 - Math.exp(-rate * dt));
}

// sprites(Map|null) から、存在するテクスチャだけ billboard にして group に追加する
function buildBillboards(group, sprites, names, height) {
  const out = new Map();
  if (!sprites || typeof sprites.get !== 'function') return out;
  for (const name of names) {
    const tex = sprites.get(name);
    if (!tex) continue;
    const bb = makeBillboard(tex, height);
    bb.visible = false;
    group.add(bb);
    out.set(name, bb);
  }
  return out;
}

// =====================================================================
// 面被り
// =====================================================================
const MK_SPRITES = ['menkaburi_stand', 'menkaburi_walk1', 'menkaburi_walk2', 'menkaburi_chase', 'menkaburi_catch'];
const MK_WANDER_SPEED = 2.2;
const MK_CHASE_SPEED = 5.2;
const MK_REPEL_SPEED = 6.0;
const MK_RADIUS = 0.45;
const MK_VIEW_DIST = 18;
const MK_VIEW_COS = Math.cos(THREE.MathUtils.degToRad(70)); // 前方 70°(半角として扱う)
const MK_LOSE_TIME = 4;
const MK_CATCH_DIST = 1.0;

export class Menkaburi {
  constructor(scene, world, sprites) {
    this.spawn = (world && world.enemySpawns && world.enemySpawns.menkaburi)
      ? world.enemySpawns.menkaburi.clone() : new THREE.Vector3(0, 0, -10);
    this.spawn.y = 0;
    this.waypoints = (world && world.waypoints) || [];

    this.object = new THREE.Group();
    this.object.name = 'menkaburi';
    this._buildProcedural();
    this.billboards = buildBillboards(this.object, sprites, MK_SPRITES, 1.8);
    if (scene) scene.add(this.object);

    this._tmpDir = new THREE.Vector3();
    this.reset();
  }

  _buildProcedural() {
    const rig = new THREE.Group(); // 前傾・揺れ用
    this.rig = rig;
    this.object.add(rig);

    const cloth = new THREE.MeshStandardMaterial({ color: 0x141118, roughness: 0.95, metalness: 0 });
    const clothDark = new THREE.MeshStandardMaterial({ color: 0x0a090c, roughness: 1, metalness: 0 });
    const skin = new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.9 });
    const maskMat = new THREE.MeshStandardMaterial({
      color: 0xf2efe6, roughness: 0.6, emissive: 0x2a2826, side: THREE.DoubleSide,
    });
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // 胴(裾が広い和装)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 1.42, 10, 1), cloth);
    body.position.y = 0.71;
    body.castShadow = true;
    rig.add(body);
    // 帯
    const obi = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.27, 0.12, 10, 1), clothDark);
    obi.position.y = 0.95;
    rig.add(obi);
    // 肩(細長い箱)
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.26), cloth);
    shoulders.position.y = 1.4;
    shoulders.castShadow = true;
    rig.add(shoulders);
    // 首と頭
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 6), skin);
    neck.position.y = 1.5;
    rig.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), clothDark); // 黒髪に覆われた頭
    head.position.y = 1.64;
    head.castShadow = true;
    rig.add(head);
    this.head = head;

    // 白い面(平面)+目の穴
    const mask = new THREE.Group();
    mask.position.set(0, 1.63, 0.155);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), maskMat);
    mask.add(plate);
    const holeGeo = new THREE.CircleGeometry(0.026, 12);
    for (const sx of [-1, 1]) {
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(sx * 0.055, 0.035, 0.002);
      hole.scale.y = 0.7;
      mask.add(hole);
    }
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.008), holeMat);
    mouth.position.set(0, -0.08, 0.002);
    mask.add(mouth);
    rig.add(mask);
    this.mask = mask;

    // 腕(肩を支点に回す)
    const armGeo = new THREE.BoxGeometry(0.09, 0.68, 0.1);
    armGeo.translate(0, -0.34, 0);
    this.arms = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * 0.3, 1.42, 0);
      const arm = new THREE.Mesh(armGeo, cloth);
      arm.castShadow = true;
      pivot.add(arm);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.07), skin);
      hand.position.y = -0.74;
      pivot.add(hand);
      rig.add(pivot);
      this.arms.push(pivot);
    }
  }

  reset() {
    this.object.position.copy(this.spawn);
    this.object.rotation.set(0, 0, 0); // 初期は +Z(道の手前)向き
    this.object.visible = false;
    this.state = 'idle';
    this.alert = 0;
    this.caught = false;
    this.firstSeen = false;

    this.yaw = 0;
    this.wpIndex = 0;
    this.lostTimer = 0;
    this.repelTimer = 0;
    this.lastKnown = new THREE.Vector3();
    this.stuckTimer = 0;
    this.stuckRef = new THREE.Vector3().copy(this.spawn);
    this.deflect = 0;
    this.deflectTimer = 0;
    this.walkPhase = 0;
    this.spriteTimer = 0;
    this.spriteFrame = 0;
    this.lean = 0;
    this.armRaise = 0;
    this.moving = false;

    this.rig.rotation.set(0, 0, 0);
    this.rig.position.set(0, 0, 0);
    for (const a of this.arms) a.rotation.set(0, 0, 0);
    this._applyVisual();
  }

  repel(seconds) {
    this.state = 'repelled';
    this.repelTimer = Math.max(0, seconds || 0);
    this.caught = false;
    this.lostTimer = 0;
  }

  // ---- 内部 ----
  _nearestWaypoint() {
    const p = this.object.position;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < this.waypoints.length; i++) {
      const w = this.waypoints[i];
      const d = (w.x - p.x) ** 2 + (w.z - p.z) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  _toWander() {
    this.state = 'wander';
    this.wpIndex = this._nearestWaypoint();
    this.lostTimer = 0;
    this.deflect = 0;
    this.deflectTimer = 0;
  }

  _hasLineOfSight(px, pz, colliders) {
    const p = this.object.position;
    return !segmentBlocked(p.x, p.z, px, pz, colliders || []);
  }

  _canSee(px, pz, colliders) {
    const p = this.object.position;
    const dx = px - p.x, dz = pz - p.z;
    const d = Math.hypot(dx, dz);
    if (d > MK_VIEW_DIST) return false;
    if (d > 1e-4) {
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      const cos = (fx * dx + fz * dz) / d;
      if (cos < MK_VIEW_COS) return false;
    }
    return this._hasLineOfSight(px, pz, colliders);
  }

  // dir 方向(正規化済み x,z)へ speed で移動。実移動量を返す。
  _move(dirX, dirZ, speed, dt, colliders) {
    const p = this.object.position;
    const ox = p.x, oz = p.z;
    moveWithCollision(p, dirX * speed * dt, dirZ * speed * dt, colliders || [], MK_RADIUS);
    p.y = 0;
    return Math.hypot(p.x - ox, p.z - oz);
  }

  update(dt, player, world, night) {
    const colliders = (world && world.colliders) || [];
    if (world && world.waypoints && world.waypoints.length) this.waypoints = world.waypoints;
    const p = this.object.position;
    const pp = player.position;

    // 夜になるまで待機(不可視)
    if (night < NIGHT_ACTIVE) {
      this.object.visible = false;
      this.state = 'idle';
      this.caught = false;
      this.alert = Math.max(0, this.alert - 0.25 * dt);
      return;
    }
    this.object.visible = true;
    if (this.state === 'idle') this._toWander();

    const dxP = pp.x - p.x, dzP = pp.z - p.z;
    const distP = Math.hypot(dxP, dzP);

    // 捕まえている間は動かない(main が repel するか caught 画面へ)
    if (this.caught) {
      this.moving = false;
      this.yaw = approachAngle(this.yaw, Math.atan2(dxP, dzP), 12, dt);
      this.alert = 1;
      this._animate(dt);
      return;
    }

    let faceYaw = this.yaw;
    this.moving = false;

    if (this.state === 'repelled') {
      this.repelTimer -= dt;
      let ax = -dxP, az = -dzP;
      const l = Math.hypot(ax, az);
      if (l > 1e-4) { ax /= l; az /= l; } else { ax = -Math.sin(this.yaw); az = -Math.cos(this.yaw); }
      this._move(ax, az, MK_REPEL_SPEED, dt, colliders);
      faceYaw = Math.atan2(ax, az);
      this.moving = true;
      if (this.repelTimer <= 0) this._toWander();
    } else if (this.state === 'wander') {
      if (this._canSee(pp.x, pp.z, colliders)) {
        this.state = 'chase';
        this.firstSeen = true;
        this.lostTimer = 0;
        this.lastKnown.set(pp.x, 0, pp.z);
        this.stuckTimer = 0;
        this.stuckRef.copy(p);
      } else if (this.waypoints.length) {
        let w = this.waypoints[this.wpIndex % this.waypoints.length];
        let wx = w.x - p.x, wz = w.z - p.z;
        let wd = Math.hypot(wx, wz);
        if (wd < 1.0) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          w = this.waypoints[this.wpIndex];
          wx = w.x - p.x; wz = w.z - p.z; wd = Math.hypot(wx, wz);
        }
        if (wd > 1e-4) {
          wx /= wd; wz /= wd;
          // 壁に詰まったら少し逸らす(wander でも同じ仕組み)
          this._updateStuck(dt, MK_WANDER_SPEED);
          const c = Math.cos(this.deflect), s = Math.sin(this.deflect);
          const mx = wx * c + wz * s, mz = -wx * s + wz * c;
          this._move(mx, mz, MK_WANDER_SPEED, dt, colliders);
          faceYaw = Math.atan2(mx, mz);
          this.moving = true;
        }
      }
    }

    if (this.state === 'chase') {
      const los = distP <= MK_VIEW_DIST && this._hasLineOfSight(pp.x, pp.z, colliders);
      if (los) {
        this.lostTimer = 0;
        this.lastKnown.set(pp.x, 0, pp.z);
      } else {
        this.lostTimer += dt;
      }
      if (this.lostTimer >= MK_LOSE_TIME) {
        this._toWander();
      } else {
        // 見えていれば主人公へ、見失っていれば最後に見た位置へ直進
        const tx = los ? pp.x : this.lastKnown.x;
        const tz = los ? pp.z : this.lastKnown.z;
        let cx = tx - p.x, cz = tz - p.z;
        const cd = Math.hypot(cx, cz);
        if (cd > 0.05) {
          cx /= cd; cz /= cd;
          this._updateStuck(dt, MK_CHASE_SPEED);
          const c = Math.cos(this.deflect), s = Math.sin(this.deflect);
          const mx = cx * c + cz * s, mz = -cx * s + cz * c;
          this._move(mx, mz, MK_CHASE_SPEED, dt, colliders);
          this.moving = true;
        }
        faceYaw = los ? Math.atan2(dxP, dzP) : (cd > 0.05 ? Math.atan2(cx, cz) : this.yaw);
      }
    }

    // 警戒度
    if (this.state === 'chase') this.alert = Math.min(1, this.alert + 3 * dt);
    else this.alert = Math.max(0, this.alert - 0.25 * dt);

    // 捕まえる判定
    if (this.state !== 'repelled') {
      const d = Math.hypot(pp.x - p.x, pp.z - p.z);
      if (d < MK_CATCH_DIST) {
        this.caught = true;
        this.moving = false;
      }
    }

    this.yaw = approachAngle(this.yaw, faceYaw, this.state === 'chase' ? 12 : 6, dt);
    this._animate(dt);
  }

  // 1 秒ごとに進み具合を見て、ほとんど進んでいなければランダムに逸らす
  _updateStuck(dt, speed) {
    const p = this.object.position;
    if (this.deflectTimer > 0) {
      this.deflectTimer -= dt;
      if (this.deflectTimer <= 0) this.deflect = 0;
    }
    this.stuckTimer += dt;
    if (this.stuckTimer >= 1.0) {
      const moved = Math.hypot(p.x - this.stuckRef.x, p.z - this.stuckRef.z);
      if (moved < speed * this.stuckTimer * 0.35) {
        const sign = Math.random() < 0.5 ? -1 : 1;
        this.deflect = sign * (0.7 + Math.random() * 0.7);
        this.deflectTimer = 0.8;
      }
      this.stuckTimer = 0;
      this.stuckRef.copy(p);
    }
  }

  _animate(dt) {
    this.object.rotation.y = this.yaw;
    const chasing = this.state === 'chase' || this.caught;
    const speed = this.state === 'chase' ? MK_CHASE_SPEED : this.state === 'repelled' ? MK_REPEL_SPEED : MK_WANDER_SPEED;
    if (this.moving) this.walkPhase += dt * speed * 2.4;

    // 前傾+腕
    this.lean = damp(this.lean, chasing ? 0.32 : 0, 6, dt);
    this.armRaise = damp(this.armRaise, chasing ? 1.35 : 0, 6, dt);
    const sw = Math.sin(this.walkPhase);
    const amt = this.moving ? 1 : 0;
    this.rig.rotation.x = this.lean;
    this.rig.rotation.z = sw * 0.05 * amt;
    this.rig.position.y = Math.abs(sw) * 0.03 * amt;
    const armSwing = chasing ? sw * 0.08 * amt : sw * 0.2 * amt;
    this.arms[0].rotation.x = -this.armRaise + armSwing;
    this.arms[1].rotation.x = -this.armRaise - armSwing;
    // 面がかすかに傾ぐ
    this.mask.rotation.z = Math.sin(this.walkPhase * 0.5) * 0.06 * amt;

    // スプライト歩き
    if (this.moving) {
      this.spriteTimer += dt;
      if (this.spriteTimer >= 0.3) { this.spriteTimer -= 0.3; this.spriteFrame ^= 1; }
    } else {
      this.spriteTimer = 0;
    }
    this._applyVisual();
  }

  _applyVisual() {
    if (!this.billboards || this.billboards.size === 0) { this.rig.visible = true; return; }
    let candidates;
    if (this.caught) candidates = ['menkaburi_catch', 'menkaburi_chase', 'menkaburi_stand'];
    else if (this.state === 'chase' && this.moving) candidates = ['menkaburi_chase', this.spriteFrame ? 'menkaburi_walk2' : 'menkaburi_walk1', 'menkaburi_walk1', 'menkaburi_stand'];
    else if (this.state === 'chase') candidates = ['menkaburi_chase', 'menkaburi_stand'];
    else if (this.moving) candidates = [this.spriteFrame ? 'menkaburi_walk2' : 'menkaburi_walk1', 'menkaburi_walk1', 'menkaburi_walk2', 'menkaburi_stand'];
    else candidates = ['menkaburi_stand', 'menkaburi_walk1'];
    let pick = null;
    for (const n of candidates) if (this.billboards.has(n)) { pick = n; break; }
    for (const [n, bb] of this.billboards) bb.visible = n === pick;
    this.rig.visible = pick === null;
  }
}

// =====================================================================
// 地蔵
// =====================================================================
const JZ_SPRITES = ['jizo_sleep', 'jizo_slip', 'jizo_awake'];
const JZ_SPEED = 2.5;
const JZ_RADIUS = 0.5;
const JZ_CATCH_DIST = 0.9;
const JZ_SLIP_DIST = 12;
const JZ_AWAKE_DIST = 5;

// 4 体で共有するジオメトリ・マテリアル(遅延生成)
let jizoShared = null;
function getJizoShared() {
  if (jizoShared) return jizoShared;
  jizoShared = {
    bodyGeo: new THREE.CylinderGeometry(0.26, 0.33, 0.8, 14, 1),
    baseGeo: new THREE.CylinderGeometry(0.4, 0.42, 0.14, 12, 1),
    headGeo: new THREE.SphereGeometry(0.21, 16, 12),
    bibGeo: (() => {
      // 下が丸い前掛け(三角寄りの形)
      const s = new THREE.Shape();
      s.moveTo(-0.22, 0);
      s.lineTo(0.22, 0);
      s.quadraticCurveTo(0.2, -0.26, 0, -0.32);
      s.quadraticCurveTo(-0.2, -0.26, -0.22, 0);
      return new THREE.ShapeGeometry(s, 8);
    })(),
    clothGeo: new THREE.PlaneGeometry(0.4, 0.09),
    eyeGeo: new THREE.SphereGeometry(0.03, 8, 6),
    redMat: new THREE.MeshStandardMaterial({ color: 0x9e1b14, roughness: 0.85, side: THREE.DoubleSide }),
    eyeMat: new THREE.MeshBasicMaterial({ color: 0x000000 }),
  };
  return jizoShared;
}

export class Jizo {
  constructor(scene, world, position, index, sprites) {
    this.index = index | 0;
    this.spawn = position ? position.clone() : new THREE.Vector3();
    this.spawn.y = 0;

    this.object = new THREE.Group();
    this.object.name = 'jizo_' + this.index;
    this._buildProcedural();
    this.billboards = buildBillboards(this.object, sprites, JZ_SPRITES, 1.3);
    if (scene) scene.add(this.object);

    // 視野判定用キャッシュ(毎フレーム new しない)
    this._frustum = new THREE.Frustum();
    this._projScreen = new THREE.Matrix4();
    this._sphere = new THREE.Sphere(new THREE.Vector3(), 0.9);

    this.reset();
  }

  _buildProcedural() {
    const sh = getJizoShared();
    // 個体ごとに石色を少し変える
    const shade = [0x77746e, 0x6c6a66, 0x807b72, 0x726f6a][this.index % 4];
    const stone = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.95, metalness: 0, flatShading: true });
    this._stoneMat = stone;

    const rig = new THREE.Group();
    this.rig = rig;
    this.object.add(rig);

    const base = new THREE.Mesh(sh.baseGeo, stone);
    base.position.y = 0.07;
    base.castShadow = true;
    base.receiveShadow = true;
    rig.add(base);

    const body = new THREE.Mesh(sh.bodyGeo, stone);
    body.position.y = 0.54;
    body.castShadow = true;
    rig.add(body);

    const head = new THREE.Mesh(sh.headGeo, stone);
    head.position.y = 1.1;
    head.castShadow = true;
    rig.add(head);

    const bib = new THREE.Mesh(sh.bibGeo, sh.redMat);
    bib.position.set(0, 0.88, 0.3);
    bib.rotation.x = -0.12;
    rig.add(bib);

    // slip: ずれた赤布の目隠し
    const cloth = new THREE.Mesh(sh.clothGeo, sh.redMat);
    cloth.position.set(0.05, 1.08, 0.215);
    cloth.rotation.z = 0.28;
    cloth.visible = false;
    rig.add(cloth);
    this.blindfold = cloth;

    // awake: 黒い目
    const eyes = new THREE.Group();
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(sh.eyeGeo, sh.eyeMat);
      e.position.set(sx * 0.07, 1.13, 0.19);
      eyes.add(e);
    }
    eyes.visible = false;
    rig.add(eyes);
    this.eyes = eyes;
  }

  reset() {
    this.object.position.copy(this.spawn);
    this.object.rotation.set(0, 0, 0);
    this.object.visible = true;
    this.state = 'sleep';
    this.caught = false;
    this.hasMoved = false;
    this.seen = false;
    this._applyVisual();
  }

  _isSeen(camera, colliders) {
    if (!camera) return false;
    camera.updateMatrixWorld();
    this._projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._projScreen);
    const p = this.object.position;
    this._sphere.center.set(p.x, p.y + 0.8, p.z);
    if (!this._frustum.intersectsSphere(this._sphere)) return false;
    const c = camera.position; // camera はシーン直下(ワールド座標)前提
    return !segmentBlocked(c.x, c.z, p.x, p.z, colliders);
  }

  update(dt, player, camera, world, night) {
    const colliders = (world && world.colliders) || [];
    const p = this.object.position;
    const pp = player.position;

    this.seen = this._isSeen(camera, colliders);

    let dx = pp.x - p.x, dz = pp.z - p.z;
    let dist = Math.hypot(dx, dz);

    if (!this.seen && night >= NIGHT_ACTIVE && dist > 1e-3) {
      const step = Math.min(JZ_SPEED * dt, dist);
      const ox = p.x, oz = p.z;
      moveWithCollision(p, (dx / dist) * step, (dz / dist) * step, colliders, JZ_RADIUS);
      p.y = 0;
      if (Math.hypot(p.x - ox, p.z - oz) > 1e-4) this.hasMoved = true;
      dx = pp.x - p.x; dz = pp.z - p.z;
      dist = Math.hypot(dx, dz);
    }

    // 常に主人公の方を向く(yaw のみ)
    if (dist > 1e-3) this.object.rotation.y = Math.atan2(dx, dz);

    const st = dist < JZ_AWAKE_DIST ? 'awake' : dist < JZ_SLIP_DIST ? 'slip' : 'sleep';
    if (st !== this.state) {
      this.state = st;
      this._applyVisual();
    }

    this.caught = night >= NIGHT_ACTIVE && dist < JZ_CATCH_DIST;
  }

  _applyVisual() {
    const name = 'jizo_' + this.state;
    const bb = this.billboards && this.billboards.get(name);
    if (this.billboards) for (const [n, b] of this.billboards) b.visible = n === name && !!bb;
    this.rig.visible = !bb;
    this.blindfold.visible = this.state === 'slip';
    this.eyes.visible = this.state === 'awake';
  }
}
