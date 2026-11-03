import * as THREE from 'three';
import { moveWithCollision } from './collision.js';
import { WORLD_SIZE } from './world.js';

const EYE_HEIGHT = 1.6;
const WALK_SPEED = 4.0;
const SPRINT_SPEED = 6.5;
const RADIUS = 0.4;
const SENSITIVITY = 0.0022;
const PITCH_LIMIT = (85 * Math.PI) / 180;
const STAMINA_DRAIN = 1 / 4;   // full -> empty in 4 s
const STAMINA_REGEN = 1 / 6;   // empty -> full in 6 s
const EXHAUST_LOCKOUT = 1.5;
const BOUND = WORLD_SIZE / 2 - 2;

const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const LOCK_FALLBACK_MS = 700;  // pointerlockchange がこの時間内に来なければ仮想ロック
const TOUCH_MOVE_ZONE = 0.4;   // 画面左 40% = 移動スティック
const TOUCH_DEAD = 40;         // px
const TOUCH_FULL = 80;         // px(この距離で最大入力)
const TOUCH_LOOK_MUL = 2.5;
const TOUCH_SPRINT = 0.85;

export class Input {
  constructor(domElement) {
    this.domElement = domElement;
    this._down = new Set();
    this._pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this._mouseHeld = false;       // 仮想ロック時のドラッグ視点用
    this.touchMove = { x: 0, y: 0 }; // 左スティック(-1..1、x=右、y=画面下方向)
    this._touches = new Map();     // identifier → { look, sx, sy, lx, ly }
    this.isTouch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0);

    const isTyping = (e) => {
      const t = e.target;
      const tag = t && t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA';
    };
    window.addEventListener('keydown', (e) => {
      if (isTyping(e)) return;
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!this._down.has(e.code)) this._pressed.add(e.code);
      this._down.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      if (isTyping(e)) return;
      if (PREVENT.has(e.code)) e.preventDefault();
      this._down.delete(e.code);
    });
    window.addEventListener('blur', () => { this._down.clear(); this._mouseHeld = false; });
    document.addEventListener('mousedown', () => { this._mouseHeld = true; });
    window.addEventListener('mouseup', () => { this._mouseHeld = false; });
    window.addEventListener('mousemove', (e) => {
      if (!document.pointerLockElement && !this._mouseHeld) return;
      this.mouseDX += e.movementX || 0;
      this.mouseDY += e.movementY || 0;
    });

    // ---- タッチ: 左 40% = 移動スティック、右 60% = 視点ドラッグ ----
    window.addEventListener('touchstart', () => { this.isTouch = true; }, { passive: true, capture: true });
    const opts = { passive: false };
    domElement.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const look = t.clientX >= window.innerWidth * TOUCH_MOVE_ZONE;
        this._touches.set(t.identifier, { look, sx: t.clientX, sy: t.clientY, lx: t.clientX, ly: t.clientY });
      }
    }, opts);
    domElement.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const s = this._touches.get(t.identifier);
        if (!s) continue;
        if (s.look) {
          this.mouseDX += (t.clientX - s.lx) * TOUCH_LOOK_MUL;
          this.mouseDY += (t.clientY - s.ly) * TOUCH_LOOK_MUL;
        } else {
          const dx = t.clientX - s.sx, dy = t.clientY - s.sy;
          const mag = Math.hypot(dx, dy);
          const k = mag <= TOUCH_DEAD ? 0 : Math.min(1, (mag - TOUCH_DEAD) / (TOUCH_FULL - TOUCH_DEAD)) / mag;
          this.touchMove.x = dx * k;
          this.touchMove.y = dy * k;
        }
        s.lx = t.clientX; s.ly = t.clientY;
      }
    }, opts);
    const end = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const s = this._touches.get(t.identifier);
        if (s && !s.look) { this.touchMove.x = 0; this.touchMove.y = 0; }
        this._touches.delete(t.identifier);
      }
    };
    domElement.addEventListener('touchend', end, opts);
    domElement.addEventListener('touchcancel', end, opts);
  }

  // 画面ボタン用: 次のフレームだけ「押された」扱いにする
  inject(code) { this._pressed.add(code); }

  down(code) { return this._down.has(code); }
  pressed(code) { return this._pressed.has(code); }
  endFrame() { this._pressed.clear(); }

  consumeMouse() {
    const r = { dx: this.mouseDX, dy: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return r;
  }
}

export class Player {
  constructor(camera, world, domElement) {
    this.camera = camera;
    this.world = world;
    this.domElement = domElement;

    this.yaw = 0;
    this.pitch = 0;
    this.stamina = 1;
    this.isMoving = false;
    this.isSprinting = false;
    this.locked = false;
    this.virtual = false;     // pointer lock が使えないときの仮想ロック(ドラッグ視点)
    this._lockTimer = 0;
    this._lockPending = false;
    this.onLockChange = null;
    this.onStep = null;

    this._exhaust = 0;     // remaining sprint lockout (s)
    this._bobPhase = 0;
    this._bobAmp = 0;
    this._prevSin = 0;
    this._prevCos = 1;

    camera.rotation.order = 'YXZ';

    // Flashlight (phone light): child of the camera.
    const light = new THREE.SpotLight(0xfff2d0, 16, 35, 0.5, 0.6, 0.6);
    // r170 は物理単位(cd)。夜の霧(0.045)越しに道・電柱・敵が読めるよう 16 / decay 0.6(減衰を緩めて近距離の白飛びを防ぎつつ 10m 先の道も読める。ヘッドレス描画で確認)。
    light.position.set(0.15, -0.1, 0);
    light.castShadow = false;
    light.visible = false;
    light.target.position.set(0, 0, -1);
    camera.add(light);
    camera.add(light.target);
    this.flashlight = light;
    this.flashlightOn = false;

    document.addEventListener('pointerlockchange', () => {
      const real = document.pointerLockElement === this.domElement;
      if (real) {
        this._cancelLockTimer();
        this.virtual = false;
      } else if (this.virtual) {
        return; // 仮想ロック中はロック解除通知を無視(Esc は keydown で扱う)
      }
      this.locked = real;
      if (this.onLockChange) this.onLockChange(this.locked);
    });
    document.addEventListener('pointerlockerror', () => {
      if (this._lockPending) this._enterVirtual();
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.virtual) this.unlock();
    });

    this.reset();
  }

  get position() { return this.camera.position; }

  setFlashlight(on) {
    this.flashlightOn = !!on;
    this.flashlight.visible = this.flashlightOn;
  }

  getForward(out) {
    out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    return out.normalize();
  }

  lock() {
    if (this.locked) return;
    this._cancelLockTimer();
    this._lockPending = true;
    let failed = typeof this.domElement.requestPointerLock !== 'function';
    if (!failed) {
      try {
        const p = this.domElement.requestPointerLock();
        if (p && typeof p.then === 'function') {
          p.catch(() => { if (this._lockPending) this._enterVirtual(); });
        }
      } catch (e) {
        failed = true;
      }
    }
    if (failed) this._enterVirtual();
    else this._lockTimer = setTimeout(() => this._enterVirtual(), LOCK_FALLBACK_MS);
  }

  unlock() {
    this._cancelLockTimer();
    if (this.virtual) {
      this.virtual = false;
      this.locked = false;
      this.onLockChange?.(false);
    } else if (document.pointerLockElement && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  _cancelLockTimer() {
    clearTimeout(this._lockTimer);
    this._lockTimer = 0;
    this._lockPending = false;
  }

  _enterVirtual() {
    this._cancelLockTimer();
    if (document.pointerLockElement === this.domElement || this.locked) return;
    this.virtual = true;
    this.locked = true;
    this.onLockChange?.(true);
  }

  reset() {
    const s = this.world.playerSpawn;
    this.camera.position.set(s.position.x, EYE_HEIGHT, s.position.z);
    this.yaw = s.yaw;
    this.pitch = 0;
    this.stamina = 1;
    this._exhaust = 0;
    this._bobPhase = 0;
    this._bobAmp = 0;
    this._prevSin = 0;
    this.isMoving = false;
    this.isSprinting = false;
    this._applyRotation();
  }

  _applyRotation() {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  update(dt, input) {
    // Look
    const m = input.consumeMouse();
    this.yaw -= m.dx * SENSITIVITY;
    this.pitch -= m.dy * SENSITIVITY;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
    this._applyRotation();

    if (input.pressed('KeyF')) this.setFlashlight(!this.flashlightOn);

    // Move input (forward = -Z at yaw 0)
    let f = 0, r = 0;
    if (input.down('KeyW') || input.down('ArrowUp')) f += 1;
    if (input.down('KeyS') || input.down('ArrowDown')) f -= 1;
    if (input.down('KeyD') || input.down('ArrowRight')) r += 1;
    if (input.down('KeyA') || input.down('ArrowLeft')) r -= 1;
    const tm = input.touchMove;
    const touchMag = tm ? Math.hypot(tm.x, tm.y) : 0;
    if (touchMag > 0) { f -= tm.y; r += tm.x; }

    const moving = f !== 0 || r !== 0;
    this.isMoving = moving;

    const wantSprint = input.down('ShiftLeft') || input.down('ShiftRight') || touchMag > TOUCH_SPRINT;
    if (this._exhaust > 0) this._exhaust = Math.max(0, this._exhaust - dt);
    this.isSprinting = moving && wantSprint && this.stamina > 0 && this._exhaust <= 0;

    if (this.isSprinting) {
      this.stamina -= STAMINA_DRAIN * dt;
      if (this.stamina <= 0) {
        this.stamina = 0;
        this.isSprinting = false;
        this._exhaust = EXHAUST_LOCKOUT;
      }
    } else {
      this.stamina = Math.min(1, this.stamina + STAMINA_REGEN * dt);
    }

    const speed = this.isSprinting ? SPRINT_SPEED : WALK_SPEED;
    if (moving) {
      const len = Math.hypot(f, r);
      if (len > 1) { f /= len; r /= len; } // キーは常に長さ 1 以上。スティックはアナログ
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      // forward = (-sy, -cy), right = (cy, -sy)
      const dx = (-sy * f + cy * r) * speed * dt;
      const dz = (-cy * f - sy * r) * speed * dt;
      const pos = this.camera.position;
      moveWithCollision(pos, dx, dz, this.world.colliders, RADIUS);
      pos.x = Math.max(-BOUND, Math.min(BOUND, pos.x));
      pos.z = Math.max(-BOUND, Math.min(BOUND, pos.z));
    }

    // Head bob
    const targetAmp = moving ? (this.isSprinting ? 0.05 : 0.03) : 0;
    this._bobAmp += (targetAmp - this._bobAmp) * Math.min(1, dt * 10);
    if (moving) {
      this._bobPhase += dt * speed * 1.7; // ~ 6.8 rad/s walking, ~11 sprinting
      const s = Math.sin(this._bobPhase);
      // low point: sine crosses from rising-through-trough; fire when phase passes 3pi/2 mod 2pi
      const c = Math.cos(this._bobPhase);
      if (this._prevSin < 0 && s < 0 && this._prevCos < 0 && c >= 0 && this.onStep) {
        this.onStep(this.isSprinting);
      }
      this._prevSin = s;
      this._prevCos = c;
    } else {
      this._prevSin = 0;
      this._prevCos = 1;
    }
    this.camera.position.y = EYE_HEIGHT + Math.sin(this._bobPhase) * this._bobAmp;
  }
}
