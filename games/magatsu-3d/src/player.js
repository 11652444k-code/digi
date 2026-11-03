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

export class Input {
  constructor(domElement) {
    this.domElement = domElement;
    this._down = new Set();
    this._pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;

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
    window.addEventListener('blur', () => this._down.clear());
    window.addEventListener('mousemove', (e) => {
      if (!document.pointerLockElement) return;
      this.mouseDX += e.movementX || 0;
      this.mouseDY += e.movementY || 0;
    });
  }

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
    this.onLockChange = null;
    this.onStep = null;

    this._exhaust = 0;     // remaining sprint lockout (s)
    this._bobPhase = 0;
    this._bobAmp = 0;
    this._prevSin = 0;
    this._prevCos = 1;

    camera.rotation.order = 'YXZ';

    // Flashlight (phone light): child of the camera.
    const light = new THREE.SpotLight(0xfff2d0, 40, 30, 0.5, 0.6, 1.5);
    // intensity 40: r170 uses physical units (candela); ~40 reads well at decay 1.5 over 30 m.
    light.position.set(0.15, -0.1, 0);
    light.castShadow = false;
    light.visible = false;
    light.target.position.set(0, 0, -1);
    camera.add(light);
    camera.add(light.target);
    this.flashlight = light;
    this.flashlightOn = false;

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.domElement;
      if (this.onLockChange) this.onLockChange(this.locked);
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

  lock() { this.domElement.requestPointerLock(); }
  unlock() { document.exitPointerLock(); }

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

    const moving = f !== 0 || r !== 0;
    this.isMoving = moving;

    const wantSprint = input.down('ShiftLeft') || input.down('ShiftRight');
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
      f /= len; r /= len;
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
