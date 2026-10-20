/**
 * 起動、ループ（100ms tick + rAF 描画）、セーブ／ロード、オフライン復帰、
 * イベント→ログ変換、操作の配線、チュートリアル進行。
 */
import { BALANCE } from './data/balance.js';
import { FACILITIES } from './data/facilities.js';
import { JOBS } from './data/jobs.js';
import { LINES, pickLine } from './data/lines.js';
import { SAVE_KEY, createInitialState, deserialize, serialize } from './state.js';
import { facilityAt } from './sim/adjacency.js';
import { assign, build, moveFacility, recruit, removeFacility, unassign } from './sim/economy.js';
import { applyOffline } from './sim/offline.js';
import { canPrestige, doPrestige } from './sim/prestige.js';
import { tick } from './sim/tick.js';
import { canReceive, renderGrid, spawnIncomeFloats } from './ui/grid.js';
import {
  facilitySheetBody, facilitySheetSignature, formatInt, pushToast, renderBuildPanel, renderHeader,
  renderLog, renderLordPanel, renderSettingsPanel, renderWaiting,
} from './ui/panels.js';
import { createStreet } from './ui/street.js';
import {
  bindSheetBackdrop, hideSheet, hideTutorial, isSheetOpen, showModal, showSheet, showTutorial, updateSheetBody,
} from './ui/modals.js';

const TICK_MS = 100;
const MAX_DT = 1;
const AUTOSAVE_MS = 30000;
const OFFLINE_NOTICE_SEC = 60;
const LOG_MAX = 30;

const REJECT = {
  full: '待機枠がいっぱいだ。先に誰かを配属しよう',
  capacity: 'そこはもう定員いっぱいだ',
  money: '金が足りない',
  locked: 'まだ建てられない',
  occupied: 'そこはもう埋まっている',
  oob: 'そこには置けない',
};

const $ = (id) => document.getElementById(id);
const dom = {
  grid: $('mg-grid'),
  waiting: $('mg-waiting'),
  log: $('mg-log'),
  street: $('mg-street'),
  tabs: $('mg-tabs'),
  buildList: $('mg-build-list'),
  lordPanel: $('mg-panel-lord'),
  settingsList: $('mg-settings-list'),
  sheetBody: $('mg-sheet-body'),
  panels: {
    town: $('mg-panel-town'),
    build: $('mg-panel-build'),
    lord: $('mg-panel-lord'),
    settings: $('mg-panel-settings'),
  },
};

/** UI だけの状態（セーブしない）。INTERFACES 7 の uiState + タブとシート。 */
const ui = {
  tab: 'town',
  mode: 'idle',
  selectedPersonId: null,
  buildType: null,
  movingFacilityId: null,
  sheetFacilityId: null,
};

let state = null;
let logLines = ['魔王の街づくりへようこそ。'];
let dirty = true;
let paused = false;        // オフライン復帰モーダル表示中
let hiddenAt = null;
let lastTickAt = 0;
let lastSaveAt = 0;
let lastFloatAt = 0;
let resetting = false;
let sheetSig = null;
let tutorialShown = null;
const street = createStreet(dom.street);

// ---------- セーブ ----------

function loadRaw() {
  try {
    return window.localStorage.getItem(SAVE_KEY);
  } catch (e) {
    return null;
  }
}

function saveNow() {
  if (resetting || !state) return;
  const now = Date.now();
  lastSaveAt = now;
  try {
    window.localStorage.setItem(SAVE_KEY, serialize(state, now));
  } catch (e) {
    // 保存できない環境（プライベートモード等）では黙って続ける
  }
}

function clearSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    // noop
  }
}

// ---------- ログとイベント ----------

function log(text) {
  if (!text) return;
  logLines.push(text);
  if (logLines.length > LOG_MAX) logLines = logLines.slice(-LOG_MAX);
  dirty = true;
}

function facilityLabel(type) {
  return FACILITIES[type] ? FACILITIES[type].label : '施設';
}

/** イベントを文言に変換する（LINES のキー = event.type）。 */
function lineFor(ev) {
  const vars = {};
  if (ev.name) vars.name = ev.name;
  if (ev.job && JOBS[ev.job]) vars.job = JOBS[ev.job].label;
  let ftype = ev.facilityType;
  if (!ftype && ev.facilityId && state.facilities[ev.facilityId]) ftype = state.facilities[ev.facilityId].type;
  if (ftype) vars.facility = facilityLabel(ftype);
  const amount = ev.cost !== undefined ? ev.cost : ev.refund;
  if (amount !== undefined) vars.amount = formatInt(amount);
  if (ev.days !== undefined) vars.days = ev.days;
  return pickLine(ev.type, vars);
}

function handleEvents(events) {
  for (const ev of events) {
    switch (ev.type) {
      case 'recruitFull':
        pushToast(lineFor(ev));
        break;
      case 'prestigeReady': {
        const text = lineFor(ev);
        pushToast(text);
        log(text);
        if (ui.tab !== 'lord') dom.tabs.querySelector('[data-tab="lord"]').classList.add('mg-tab--alert');
        break;
      }
      default:
        log(lineFor(ev));
    }
    advanceTutorial(ev);
  }
  if (events.length) dirty = true;
}

// ---------- チュートリアル（SPEC 4.7） ----------

function advanceTutorial(ev) {
  const t = state.tutorial;
  if (t.done) return;
  if (t.step === 0 && ev.type === 'recruit') t.step = 1;
  else if (t.step === 1 && (ev.type === 'assign' || ev.type === 'assignMismatch')) t.step = 2;
  else if (t.step === 2 && ev.type === 'build' && ev.facilityType === 'dorm') t.step = 3;
}

function finishTutorial() {
  state.tutorial.done = true;
  updateTutorial(); // 次のフレームを待たずに吹き出しとハイライトを消す
  saveNow();
}

function tutorialTargets(step) {
  const townOpen = ui.tab === 'town';
  const tabBtn = (name) => dom.tabs.querySelector(`[data-tab="${name}"]`);
  if (step === 0) return townOpen ? [dom.street] : [tabBtn('town')];
  if (step === 1) {
    if (!townOpen) return [tabBtn('town')];
    if (ui.mode === 'assign') {
      const stall = Object.values(state.facilities).find((f) => f.type === 'stall' && canReceive(state, f, ui.selectedPersonId));
      return stall ? [cellButton(stall.x, stall.y)] : [];
    }
    const slot = dom.waiting.querySelector('.mg-slot[data-person-id]');
    return slot ? [slot] : [dom.street];
  }
  if (step === 2) {
    if (ui.mode === 'build' && ui.buildType === 'dorm' && townOpen) {
      return [...dom.grid.querySelectorAll('.mg-cell--empty')];
    }
    if (ui.tab === 'build') return [dom.buildList.querySelector('li[data-type="dorm"]')].filter(Boolean);
    return [tabBtn('build')];
  }
  return [];
}

function updateTutorial() {
  const t = state.tutorial;
  const step = Math.max(0, Math.min(3, Math.floor(t.step) || 0));
  const want = new Set(t.done ? [] : tutorialTargets(step));
  for (const e of document.querySelectorAll('.mg-highlight')) if (!want.has(e)) e.classList.remove('mg-highlight');
  for (const e of want) e.classList.add('mg-highlight');
  const key = t.done ? 'done' : `step${step}`;
  if (key === tutorialShown) return;
  tutorialShown = key;
  if (t.done) hideTutorial();
  else showTutorial(step, LINES.tutorial[step], finishTutorial);
}

// ---------- UI 状態 ----------

function cellButton(x, y) {
  return dom.grid.querySelector(`.mg-cell[data-x="${x}"][data-y="${y}"]`);
}

function setIdle() {
  ui.mode = 'idle';
  ui.selectedPersonId = null;
  ui.buildType = null;
  ui.movingFacilityId = null;
  dirty = true;
}

function setTab(tab) {
  ui.tab = tab;
  for (const [name, panel] of Object.entries(dom.panels)) panel.hidden = name !== tab;
  for (const btn of dom.tabs.querySelectorAll('.mg-tab')) {
    const on = btn.dataset.tab === tab;
    btn.classList.toggle('mg-tab--active', on);
    btn.setAttribute('aria-selected', String(on));
  }
  if (tab === 'lord') dom.tabs.querySelector('[data-tab="lord"]').classList.remove('mg-tab--alert');
  dirty = true;
}

/** 操作の後始末: 再描画とセーブ。 */
function afterAction() {
  dirty = true;
  saveNow();
}

// ---------- 操作 ----------

function onStreetTap(e) {
  if (paused) return;
  const id = street.hitTest(e.clientX, e.clientY, state);
  if (!id) return;
  const person = state.street.find((s) => s.id === id);
  const now = Date.now();
  const r = recruit(state, id, now, Math.random);
  if (r.ok && person) street.fadeOut(person, now);
  handleEvents(r.events);
  afterAction();
}

function onCellTap(x, y) {
  if (paused) return;
  const f = facilityAt(state, x, y);
  const now = Date.now();
  switch (ui.mode) {
    case 'assign': {
      if (!f) { setIdle(); return; }
      const r = assign(state, ui.selectedPersonId, f.id);
      if (r.ok) {
        handleEvents(r.events);
        setIdle();
        afterAction();
      } else if (r.reason === 'capacity' && FACILITIES[f.type].capacity === 0) {
        pushToast(`${facilityLabel(f.type)}には人を配属できない`);
      } else if (r.reason === 'notfound') {
        setIdle();
      } else {
        pushToast(REJECT[r.reason] || '配属できない');
      }
      return;
    }
    case 'build': {
      if (f) { pushToast(REJECT.occupied); setIdle(); return; }
      const r = build(state, ui.buildType, x, y, now);
      if (r.ok) {
        handleEvents(r.events);
        setIdle();
        afterAction();
      } else {
        pushToast(REJECT[r.reason] || '建てられない');
        if (r.reason !== 'occupied') setIdle();
      }
      return;
    }
    case 'move': {
      const movingId = ui.movingFacilityId;
      if (f && f.id === movingId) { setIdle(); return; }
      if (f) { pushToast(REJECT.occupied); setIdle(); return; }
      const moving = state.facilities[movingId];
      const r = moveFacility(state, movingId, x, y);
      if (r.ok && moving) pushToast(`${facilityLabel(moving.type)}を移した`);
      else pushToast(REJECT[r.reason] || '移せない');
      setIdle();
      afterAction();
      return;
    }
    default:
      if (f) openSheet(f.id);
  }
}

function onSlotTap(slot) {
  if (paused) return;
  const pid = slot.dataset.personId;
  if (!pid || !state.people[pid]) { if (ui.mode !== 'idle') setIdle(); return; }
  if (ui.mode === 'assign' && ui.selectedPersonId === pid) { setIdle(); return; }
  hideSheet();
  setIdle();
  ui.mode = 'assign';
  ui.selectedPersonId = pid;
  if (ui.tab !== 'town') setTab('town');
}

function onBuildChoose(type) {
  setIdle();
  ui.mode = 'build';
  ui.buildType = type;
  setTab('town');
  pushToast(`空きマスをタップして${facilityLabel(type)}を建てる`);
}

function openSheet(facilityId) {
  const f = state.facilities[facilityId];
  if (!f) return;
  const def = FACILITIES[f.type];
  ui.sheetFacilityId = facilityId;
  sheetSig = facilitySheetSignature(state, facilityId);
  showSheet({
    title: `${def.icon} ${def.label}`,
    body: facilitySheetBody(state, facilityId),
    actions: [
      { label: '移動', onClick: () => startMove(facilityId) },
      { label: '撤去', danger: true, onClick: () => confirmRemove(facilityId) },
      { label: '閉じる', primary: true },
    ],
    onClose: () => {
      ui.sheetFacilityId = null;
      sheetSig = null;
      dirty = true;
    },
  });
  dirty = true;
}

function startMove(facilityId) {
  if (!state.facilities[facilityId]) return;
  setIdle();
  ui.mode = 'move';
  ui.movingFacilityId = facilityId;
  pushToast('移す先の空きマスをタップ（同じ施設で取り消し）');
}

function confirmRemove(facilityId) {
  const f = state.facilities[facilityId];
  if (!f) return;
  // 返金額と溢れる人数は、複製した state で撤去を試して求める（sim と同じ計算）
  const trial = removeFacility(structuredClone(state), facilityId);
  const removeEv = trial.events.find((e) => e.type === 'remove');
  const refund = removeEv ? removeEv.refund : 0;
  const lost = trial.events.filter((e) => e.type === 'escape').length;
  const label = facilityLabel(f.type);
  const lines = [`返金 ${formatInt(refund)} G。配属中の ${f.workers.length} 人は待機枠へ戻る。`];
  if (lost) lines.push(`待機枠に入りきらない ${lost} 人は去っていく。`);
  showModal({
    title: `${label}を撤去する？`,
    body: paragraphs(lines),
    actions: [
      { label: 'やめる' },
      {
        label: '撤去する',
        danger: true,
        onClick: () => {
          const r = removeFacility(state, facilityId);
          if (r.ok) handleEvents(r.events);
          setIdle();
          afterAction();
        },
      },
    ],
  });
}

function onSheetPersonTap(pid) {
  const p = state.people[pid];
  if (!p) return;
  const r = unassign(state, pid);
  if (r.ok) pushToast(`${p.name}を待機枠に戻した`);
  else if (r.reason === 'full') pushToast(REJECT.full);
  afterAction();
}

function confirmPrestige() {
  if (!canPrestige(state)) return;
  const next = state.prestige.count + 1;
  let sale = Math.floor(state.money);
  for (const f of Object.values(state.facilities)) sale += FACILITIES[f.type].baseCost;
  const p = BALANCE.prestige;
  showModal({
    title: '街を売り払って夜逃げする',
    body: paragraphs([
      pickLine('prestigeReady'),
      `街の売却額: ${formatInt(sale)} G（次の街には持ち越さない）`,
      `転生後: 全収益 ×${(1 + p.incomeBonusPerCount * next).toFixed(1)}、初期資金 ${formatInt(BALANCE.initialMoney + p.startMoneyBonus * next)} G`,
    ]),
    actions: [
      { label: 'まだやめておく' },
      { label: '夜逃げする', primary: true, onClick: runPrestige },
    ],
  });
}

function runPrestige() {
  if (!canPrestige(state)) return;
  state = doPrestige(state, Date.now(), Math.random);
  hideSheet();
  setIdle();
  ui.sheetFacilityId = null;
  dom.tabs.querySelector('[data-tab="lord"]').classList.remove('mg-tab--alert');
  log(pickLine('prestigeDone'));
  setTab('town');
  tutorialShown = null;
  afterAction();
}

function confirmReset() {
  showModal({
    title: '最初からやり直す？',
    body: paragraphs(['セーブを消して、転生回数も統計もすべて失う。元には戻せない。']),
    actions: [
      { label: 'やめる' },
      {
        label: '消してやり直す',
        danger: true,
        onClick: () => {
          resetting = true;
          clearSave();
          window.location.reload();
        },
      },
    ],
  });
}

function paragraphs(lines) {
  return lines.map((t) => {
    const p = document.createElement('p');
    p.style.margin = '0 0 8px';
    p.textContent = t;
    return p;
  });
}

// ---------- オフライン ----------

function formatDuration(sec) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} 時間 ${m} 分`;
  if (m > 0) return `${m} 分 ${s % 60} 秒`;
  return `${s} 秒`;
}

function showOfflineModal(res) {
  const amount = formatInt(res.earned);
  const line = pickLine('offlineReturn', { amount });
  log(line);
  const lines = [line, `留守にしていた時間: ${formatDuration(res.elapsedSec)}`, `獲得額: +${amount} G`];
  if (res.retired.length) {
    lines.push('留守中に定年退職した部下:');
    for (const r of res.retired) {
      lines.push(`・${JOBS[r.job] ? JOBS[r.job].label : ''} ${r.name}（勤続 ${r.days} 日）`);
    }
  } else {
    lines.push('留守中の退職者: なし');
  }
  paused = true;
  showModal({
    title: 'おかえり、魔王様',
    body: paragraphs(lines),
    actions: [{
      label: '受け取る',
      primary: true,
      onClick: () => {
        paused = false;
        lastTickAt = Date.now();
        afterAction();
      },
    }],
  });
}

function runOffline(now) {
  const res = applyOffline(state, now);
  dirty = true;
  if (res.elapsedSec >= OFFLINE_NOTICE_SEC) showOfflineModal(res);
  saveNow();
}

// ---------- ループ ----------

function onInterval() {
  const now = Date.now();
  if (paused || document.hidden) {
    lastTickAt = now;
    return;
  }
  const dt = Math.min(MAX_DT, Math.max(0, (now - lastTickAt) / 1000));
  lastTickAt = now;
  if (dt > 0) {
    handleEvents(tick(state, dt, now, Math.random));
    dirty = true;
  }
  if (now - lastSaveAt >= AUTOSAVE_MS) saveNow();
  if (now - lastFloatAt >= 1000) {
    lastFloatAt = now;
    if (ui.tab === 'town') spawnIncomeFloats(dom.grid, state);
  }
}

function render() {
  renderHeader(state);
  renderLog(dom.log, logLines);
  if (ui.tab === 'town') {
    renderGrid(dom.grid, state, ui);
    renderWaiting(dom.waiting, state, ui);
  } else if (ui.tab === 'build') {
    renderBuildPanel(dom.buildList, state, ui);
  } else if (ui.tab === 'lord') {
    renderLordPanel(dom.lordPanel, state);
  } else if (ui.tab === 'settings') {
    renderSettingsPanel(dom.settingsList);
  }
  if (ui.sheetFacilityId && isSheetOpen()) {
    if (!state.facilities[ui.sheetFacilityId]) {
      hideSheet();
    } else {
      const sig = facilitySheetSignature(state, ui.sheetFacilityId);
      if (sig !== sheetSig) {
        sheetSig = sig;
        updateSheetBody(facilitySheetBody(state, ui.sheetFacilityId));
      }
    }
  }
  updateTutorial();
}

function frame() {
  if (ui.tab === 'town') street.render(state, Date.now());
  if (dirty) {
    dirty = false;
    render();
  }
  window.requestAnimationFrame(frame);
}

// ---------- 起動 ----------

function bindEvents() {
  dom.street.addEventListener('pointerdown', onStreetTap);
  dom.grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.mg-cell');
    if (cell) onCellTap(Number(cell.dataset.x), Number(cell.dataset.y));
  });
  dom.waiting.addEventListener('click', (e) => {
    const slot = e.target.closest('.mg-slot');
    if (slot) onSlotTap(slot);
  });
  dom.tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.mg-tab');
    if (!btn) return;
    setIdle();
    setTab(btn.dataset.tab);
  });
  dom.buildList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-type]');
    if (btn && !btn.disabled) onBuildChoose(btn.dataset.type);
  });
  $('mg-lord-actions').addEventListener('click', (e) => {
    if (e.target.closest('#mg-prestige')) confirmPrestige();
  });
  $('mg-reset').addEventListener('click', confirmReset);
  dom.sheetBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-person-id]');
    if (btn) onSheetPersonTap(btn.dataset.personId);
  });
  bindSheetBackdrop();

  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.hidden) {
      hiddenAt = now;
      saveNow();
      return;
    }
    const away = hiddenAt === null ? 0 : now - hiddenAt;
    hiddenAt = null;
    lastTickAt = now;
    if (away >= OFFLINE_NOTICE_SEC * 1000) runOffline(now);
    dirty = true;
  });
  window.addEventListener('pagehide', saveNow);
}

function boot() {
  const now = Date.now();
  const raw = loadRaw();
  const loaded = raw ? deserialize(raw, now) : null;
  if (loaded) {
    state = loaded;
  } else {
    state = createInitialState(now);
    if (raw) log(pickLine('saveCorrupt'));
  }
  bindEvents();
  setTab('town');
  if (loaded && state.savedAt < now) runOffline(now);
  else saveNow();

  lastTickAt = Date.now();
  lastFloatAt = lastTickAt;
  window.setInterval(onInterval, TICK_MS);
  window.requestAnimationFrame(frame);

  // デバッグ用ハンドル（Playwright のスモークテストでも使う）
  window.__mg = {
    getState: () => state,
    getUi: () => ui,
    streetPoint: (id) => {
      const p = state.street.find((s) => s.id === id);
      return p ? street.screenPoint(p) : null;
    },
  };
}

boot();
