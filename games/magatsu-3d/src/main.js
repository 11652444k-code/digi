// 禍津の形代 3D — 起動・状態遷移・UI
import * as THREE from 'three';
import { buildWorld, WORLD_SIZE } from './world.js';
import { Input, Player } from './player.js';
import { Menkaburi, Jizo } from './enemies.js';
import { AudioSys } from './audio.js';
import { loadSprites } from './sprites.js';

const KATASHIRO_TOTAL = 5;
const PICKUP_RADIUS = 1.6;
const NIGHT_DURATION = 20;     // 秒
const ENEMY_NIGHT = 0.6;
const LIGHT_NIGHT = 0.3;
const CLEAR_DELAY = 2.5;       // 秒
const FLASH_TIME = 0.6;        // 秒
const JIZO_TENSION_RANGE = 10; // m

const $ = (id) => document.getElementById(id);

const ui = {
  title: $('title'),
  paused: $('paused'),
  caught: $('caught'),
  clear: $('clear'),
  nowebgl: $('nowebgl'),
  flash: $('flash'),
  vignette: $('vignette'),
  subtitle: $('subtitle'),
  hint: $('hint'),
  katashiro: $('hud-katashiro'),
  ofuda: $('hud-ofuda'),
  stamina: $('stamina-bar'),
};
const overlays = [ui.title, ui.paused, ui.caught, ui.clear];

function showOverlay(el) {
  for (const o of overlays) o.classList.toggle('show', o === el);
}

function showError(message) {
  for (const o of overlays) o.classList.remove('show');
  ui.nowebgl.classList.add('show');
  const p = ui.nowebgl.querySelector('p') || ui.nowebgl;
  p.textContent = message;
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// ---- 字幕・ヒント ----------------------------------------------------------
let subtitleTimer = 0;
function showLine(text, ms = 3500) {
  ui.subtitle.textContent = text;
  ui.subtitle.classList.add('show');
  clearTimeout(subtitleTimer);
  subtitleTimer = setTimeout(() => ui.subtitle.classList.remove('show'), ms);
}
function clearLine() {
  clearTimeout(subtitleTimer);
  ui.subtitle.classList.remove('show');
}

let currentHint = null;
function setHint(text) {
  text = text || '';
  if (text === currentHint) return;
  currentHint = text;
  if (text) {
    ui.hint.textContent = text;
    ui.hint.classList.add('show');
  } else {
    ui.hint.classList.remove('show');
  }
}

// 一時的なヒント(「スマホのライトをつけた」など)。アイテムのヒントより優先して数秒表示。
let tempHintText = '';
let tempHintTime = 0;
function flashHint(text, seconds = 2.5) {
  tempHintText = text;
  tempHintTime = seconds;
}

// ---- 初期化 ----------------------------------------------------------------
async function init() {
  const canvas = $('game');
  if (!hasWebGL()) {
    showError('この端末・ブラウザでは WebGL が使えないため、ゲームを表示できません。');
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);
  scene.add(camera); // 懐中電灯(camera の子)を描画するため

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', onResize);

  const sprites = await loadSprites();
  const world = buildWorld(scene, renderer);
  const input = new Input(canvas);
  const player = new Player(camera, world, canvas);
  const menkaburi = new Menkaburi(scene, world, sprites);
  const jizos = world.enemySpawns.jizo.map((p, i) => new Jizo(scene, world, p, i, sprites));
  const audio = new AudioSys();
  void WORLD_SIZE;

  // ---- ゲーム状態 ----
  let state = 'title';
  let katashiroCount = 0;
  let ofudaCount = 0;
  let night = 0;
  let nightStarted = false;
  let flags = {};
  let jizoPrevStates = [];
  let clearTimer = -1;     // >= 0 で祭壇に納めた後のカウントダウン中
  let flashLevel = 0;
  let pendingStartLine = true;

  function resetFlags() {
    flags = { autoLight: false, firstSeen: false, jizoMoved: false };
    jizoPrevStates = jizos.map((j) => j.state);
  }
  resetFlags();

  function fullReset() {
    katashiroCount = 0;
    ofudaCount = 0;
    night = 0;
    nightStarted = false;
    resetFlags();
    clearTimer = -1;
    flashLevel = 0;
    pendingStartLine = true;
    for (const item of world.items) {
      item.taken = false;
      item.object.visible = true;
    }
    world.altar.placeKatashiro(0);
    world.setNight(0);
    player.reset();
    player.setFlashlight(false);
    menkaburi.reset();
    jizos.forEach((j) => j.reset());
    jizoPrevStates = jizos.map((j) => j.state);
    audio.setTension(0);
    audio.setNight(0);
    setHint('');
    tempHintText = '';
    tempHintTime = 0;
    clearLine();
    ui.vignette.style.opacity = '0';
    ui.flash.style.opacity = '0';
  }

  player.onStep = (sprint) => audio.footstep(sprint);
  player.onLockChange = (locked) => {
    if (locked) {
      if (state !== 'playing') {
        state = 'playing';
        showOverlay(null);
        if (pendingStartLine) {
          pendingStartLine = false;
          showLine('……ここ、昼間と全然ちがう');
        }
      }
    } else if (state === 'playing') {
      state = 'paused';
      showOverlay(ui.paused);
      setHint('');
    }
  };

  function onOverlayClick(e) {
    if (e.target.closest && e.target.closest('a')) return; // ポートフォリオへのリンク
    if (state === 'playing') return;
    audio.resume();
    if (state === 'caught' || state === 'clear') {
      fullReset();
      state = 'title'; // ロックされたら playing へ
    }
    player.lock();
  }
  for (const o of overlays) o.addEventListener('click', onOverlayClick);
  canvas.addEventListener('click', (e) => {
    if (state !== 'playing') onOverlayClick(e);
    else if (!player.locked) player.lock();
  });

  // 初期状態
  player.reset();
  player.setFlashlight(false);
  world.setNight(0);
  showOverlay(ui.title);

  // ---- HUD(値が変わったときだけ DOM を書く) ----
  const hudCache = { k: -1, o: -1, s: -1, low: null, vig: -1 };
  function updateHUD() {
    if (hudCache.k !== katashiroCount) {
      hudCache.k = katashiroCount;
      ui.katashiro.textContent = `${katashiroCount}/${KATASHIRO_TOTAL}`;
    }
    if (hudCache.o !== ofudaCount) {
      hudCache.o = ofudaCount;
      ui.ofuda.textContent = String(ofudaCount);
    }
    const s = Math.round(THREE.MathUtils.clamp(player.stamina ?? 1, 0, 1) * 100);
    if (hudCache.s !== s) {
      hudCache.s = s;
      ui.stamina.style.transform = `scaleX(${s / 100})`;
    }
    const low = s < 25;
    if (hudCache.low !== low) {
      hudCache.low = low;
      ui.stamina.classList.toggle('low', low);
    }
  }
  function setVignette(t) {
    const v = Math.round(t * 0.6 * 100) / 100;
    if (hudCache.vig !== v) {
      hudCache.vig = v;
      ui.vignette.style.opacity = String(v);
    }
  }

  // ---- 御札・捕獲 ----
  function useOfuda() {
    ofudaCount--;
    audio.repelFlash();
    flashLevel = 1;
    menkaburi.repel(6);
    menkaburi.caught = false;
    const pp = player.position;
    for (const j of jizos) {
      const jp = j.object.position;
      let dx = jp.x - pp.x, dz = jp.z - pp.z;
      const d = Math.hypot(dx, dz);
      if (d < 3) {
        if (d < 1e-4) {
          // 真上に重なっていたら主人公の後ろ方向へ
          const f = player.getForward(new THREE.Vector3());
          dx = -f.x; dz = -f.z;
        } else {
          dx /= d; dz /= d;
        }
        jp.x += dx * 8;
        jp.z += dz * 8;
      }
      j.caught = false;
    }
  }

  function gotCaught() {
    audio.sting();
    state = 'caught';
    setHint('');
    showOverlay(ui.caught);
    player.unlock();
  }

  // ---- 更新 ----
  function updatePlaying(dt, time) {
    player.update(dt, input);

    // 夜化
    if (nightStarted && night < 1) night = Math.min(1, night + dt / NIGHT_DURATION);
    world.setNight(night);
    audio.setNight(night);
    if (!flags.autoLight && night >= LIGHT_NIGHT) {
      flags.autoLight = true;
      if (!player.flashlightOn) player.setFlashlight(true);
      showLine('暗い。スマホ、まだ電池ある');
      flashHint('スマホのライトをつけた');
    }

    world.update(dt, time);
    menkaburi.update(dt, player, world, night);
    jizos.forEach((j, i) => {
      j.update(dt, player, camera, world, night);
      if (j.state === 'awake' && jizoPrevStates[i] !== 'awake') audio.jizoMove();
      jizoPrevStates[i] = j.state;
    });

    // 字幕トリガ
    if (!flags.firstSeen && menkaburi.firstSeen) {
      flags.firstSeen = true;
      showLine('っ……誰かいる');
    }
    if (!flags.jizoMoved && jizos.some((j) => j.hasMoved)) {
      flags.jizoMoved = true;
      showLine('今、動いた……?');
      audio.jizoMove();
    }

    // アイテム・祭壇
    const pp = player.position;
    let hint = '';
    if (clearTimer < 0) {
      let nearest = null, best = PICKUP_RADIUS;
      for (const item of world.items) {
        if (item.taken) continue;
        const d = Math.hypot(item.position.x - pp.x, item.position.z - pp.z);
        if (d <= best) { best = d; nearest = item; }
      }
      const ap = world.altar.position;
      const atAltar = katashiroCount >= KATASHIRO_TOTAL &&
        Math.hypot(ap.x - pp.x, ap.z - pp.z) <= world.altar.radius;

      if (atAltar) {
        hint = 'E: 形代を納める';
        if (input.pressed('KeyE')) {
          world.altar.placeKatashiro(KATASHIRO_TOTAL);
          showLine('形代を納める。全部、戻す');
          audio.clearJingle();
          clearTimer = CLEAR_DELAY;
          hint = '';
        }
      } else if (nearest) {
        hint = nearest.kind === 'katashiro' ? 'E: 形代を拾う' : 'E: 御札を拾う';
        if (input.pressed('KeyE')) {
          nearest.taken = true;
          nearest.object.visible = false;
          audio.pickup();
          if (nearest.kind === 'katashiro') {
            katashiroCount++;
            if (!nightStarted) {
              nightStarted = true;
              showLine('形代……誰が置いたの');
            }
          } else {
            ofudaCount++;
          }
          hint = '';
        }
      }
    }
    if (tempHintTime > 0) {
      tempHintTime -= dt;
      if (!hint) hint = tempHintText;
    }
    setHint(hint);

    // 捕獲
    if (clearTimer < 0 && (menkaburi.caught || jizos.some((j) => j.caught))) {
      if (ofudaCount > 0) useOfuda();
      else { gotCaught(); return; }
    }

    // 心音・赤い縁
    let t = menkaburi.alert || 0;
    if (night >= ENEMY_NIGHT) {
      for (const j of jizos) {
        const jp = j.object.position;
        const d = Math.hypot(jp.x - pp.x, jp.z - pp.z);
        t = Math.max(t, THREE.MathUtils.clamp(1 - d / JIZO_TENSION_RANGE, 0, 1));
      }
    }
    audio.setTension(t);
    setVignette(t);

    // クリア待ち
    if (clearTimer >= 0) {
      clearTimer -= dt;
      if (clearTimer <= 0) {
        clearTimer = -1;
        state = 'clear';
        setHint('');
        audio.setTension(0);
        setVignette(0);
        showOverlay(ui.clear);
        player.unlock();
      }
    }
  }

  let last = performance.now();
  let time = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    if (input.pressed('KeyM')) audio.toggleMute();

    if (state === 'playing') {
      time += dt;
      updatePlaying(dt, time);
      updateHUD();
    } else if (typeof input.consumeMouse === 'function') {
      input.consumeMouse(); // 停止中のマウス移動を捨てる
    }

    if (flashLevel > 0) {
      flashLevel = Math.max(0, flashLevel - dt / FLASH_TIME);
      ui.flash.style.opacity = String(flashLevel);
    }

    audio.update(dt);
    renderer.render(scene, camera);
    input.endFrame();
  }
  updateHUD();
  requestAnimationFrame((now) => { last = now; frame(now); });
}

init().catch((err) => {
  console.error(err);
  showError('起動に失敗しました。\n' + (err && (err.stack || err.message) || String(err)));
});
