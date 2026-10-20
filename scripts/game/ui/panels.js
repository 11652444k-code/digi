/**
 * ヘッダー、待機枠、ログ、建設・魔王・設定パネル、施設詳細シートの中身、トースト。
 * いずれも「シグネチャが変わったときだけ DOM を作り直す」方式で、毎フレーム呼んでも軽い。
 */
import { BALANCE } from '../data/balance.js';
import { BUILD_ORDER, FACILITIES } from '../data/facilities.js';
import { JOBS } from '../data/jobs.js';
import { adjacencyFor } from '../sim/adjacency.js';
import {
  buildCost, capacity, facilityIncome, isUnlockedFacility, jobMult, prestigeMult, totalIncomePerSecond,
} from '../sim/economy.js';
import { canPrestige, prestigeThreshold } from '../sim/prestige.js';
import { formatRate } from './grid.js';

export const VERSION = 'v0.1';

const sigs = new WeakMap();
/** el のシグネチャが sig と同じなら false、違えば記録して true。 */
function changed(el, sig) {
  if (sigs.get(el) === sig) return false;
  sigs.set(el, sig);
  return true;
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function formatInt(n) {
  return Math.floor(n).toLocaleString('ja-JP');
}

/** 配属中の人物の士気の平均（誰もいなければ 100）。 */
export function averageMorale(state) {
  let sum = 0;
  let n = 0;
  for (const p of Object.values(state.people)) {
    if (!p.assignedTo) continue;
    sum += p.morale;
    n += 1;
  }
  return n ? sum / n : 100;
}

/** 寿命の残り日数。'lifespan' 未解禁なら null。 */
export function remainingDays(state, person) {
  if (!state.unlocked.includes('lifespan')) return null;
  return Math.max(0, person.lifespan - person.age);
}

function candle(state, person) {
  const r = remainingDays(state, person);
  return r !== null && r <= BALANCE.lifespan.warnDays ? '🕯' : '';
}

// ---------- ヘッダー ----------

/**
 * ヘッダー 4 項目。単位（G, G/s）は index.html の .mg-stat__unit が表示する。
 * @param {object} state
 */
export function renderHeader(state) {
  const cap = capacity(state);
  const morale = averageMorale(state);
  const money = document.getElementById('mg-money');
  const income = document.getElementById('mg-income');
  const capEl = document.getElementById('mg-capacity');
  const moraleEl = document.getElementById('mg-morale');
  setText(money, formatInt(state.money));
  setText(income, `+${totalIncomePerSecond(state).toFixed(1)}`);
  setText(capEl, `${cap.used} / ${cap.max}`);
  setText(moraleEl, `${Math.round(morale)}%`);
  const icon = moraleEl.previousElementSibling;
  if (icon) setText(icon, morale < BALANCE.morale.lowThreshold ? '😠' : '🙂');
}

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

// ---------- 待機枠 ----------

/**
 * @param {HTMLElement} root #mg-waiting
 */
export function renderWaiting(root, state, uiState) {
  const slots = root.querySelectorAll('.mg-slot');
  slots.forEach((slot, i) => {
    const pid = state.waiting[i];
    const p = pid ? state.people[pid] : null;
    const selected = !!p && uiState.mode === 'assign' && uiState.selectedPersonId === pid;
    const sig = p ? `${pid}|${selected}|${candle(state, p)}` : 'empty';
    if (!changed(slot, sig)) return;
    slot.classList.toggle('mg-slot--empty', !p);
    slot.classList.toggle('mg-slot--selected', selected);
    if (!p) {
      slot.replaceChildren();
      slot.removeAttribute('data-person-id');
      slot.removeAttribute('aria-pressed');
      slot.setAttribute('aria-label', `待機枠 ${i + 1}（空）`);
      return;
    }
    const job = JOBS[p.job];
    slot.dataset.personId = pid;
    slot.setAttribute('aria-pressed', String(selected));
    slot.setAttribute('aria-label', `待機枠 ${i + 1}: ${job.label} ${p.name}${selected ? '（選択中）' : ''}`);
    const icon = el('span', 'mg-slot__icon', job.icon);
    icon.setAttribute('aria-hidden', 'true');
    slot.replaceChildren(icon, el('span', 'mg-slot__name', candle(state, p) + p.name));
  });
}

// ---------- ログ ----------

/**
 * @param {HTMLElement} root #mg-log
 * @param {string[]} lines 古い順。最新 3 行を下に新しいものが来るように出す。
 */
export function renderLog(root, lines) {
  const last = lines.slice(-3);
  if (!changed(root, last.join('\n') + '|' + lines.length)) return;
  root.replaceChildren(...last.map((t) => el('li', 'mg-log__item', t)));
}

// ---------- トースト ----------

/** @param {string} text */
export function pushToast(text) {
  const host = document.getElementById('mg-toast');
  if (!host || !text) return;
  while (host.children.length >= 3) host.firstElementChild.remove();
  const item = el('div', 'mg-toast__item', text);
  host.appendChild(item);
  setTimeout(() => item.remove(), 2500);
}

// ---------- 建設パネル ----------

const BUILD_DESC = {
  stall: '店番は 1 人。商人なら稼ぎ 3 倍',
  dorm: '収容上限 +6。工場の隣なら工場 ×1.3',
  factory: '3 人まで働ける。鍛冶師が得意',
  canteen: '周囲 8 マスの士気を回復。工場の隣は騒音',
};

const UNLOCK_TEXT = {
  factory: '露店を 2 軒建てると解禁',
  canteen: '寮を 1 軒建てると解禁',
};

/**
 * @param {HTMLElement} root #mg-build-list
 */
export function renderBuildPanel(root, state, uiState) {
  const rows = BUILD_ORDER.map((type) => {
    const cost = buildCost(state, type);
    const unlocked = isUnlockedFacility(state, type);
    const afford = state.money >= cost;
    return { type, cost, unlocked, afford };
  });
  const sig = rows.map((r) => `${r.type}:${r.cost}:${r.unlocked}:${r.afford}`).join('|') + `|${uiState.buildType}`;
  if (!changed(root, sig)) return;
  root.replaceChildren(...rows.map((r) => {
    const def = FACILITIES[r.type];
    const li = el('li');
    li.dataset.type = r.type;
    const head = el('div');
    const title = el('strong', '', `${def.icon} ${def.label}`);
    head.append(title, document.createTextNode(`　${formatInt(r.cost)} G`));
    const desc = el('p', 'mg-panel__note', BUILD_DESC[r.type] || '');
    desc.style.margin = '2px 0 8px';
    const btn = el('button', 'mg-btn mg-btn--primary');
    btn.type = 'button';
    btn.dataset.type = r.type;
    btn.style.width = '100%';
    let reason = '';
    if (!r.unlocked) reason = `🔒 ${UNLOCK_TEXT[r.type] || '未解禁'}`;
    else if (!r.afford) reason = `💰 あと ${formatInt(Math.ceil(r.cost - state.money))} G 足りない`;
    btn.disabled = !!reason;
    btn.textContent = reason || `建てる（${formatInt(r.cost)} G）`;
    btn.setAttribute('aria-label', `${def.label}を建てる。${formatInt(r.cost)} G。${reason}`);
    li.append(head, desc, btn);
    return li;
  }));
}

// ---------- 魔王パネル ----------

/**
 * @param {HTMLElement} root #mg-panel-lord（#mg-lord-stats と #mg-lord-actions を含む）
 */
export function renderLordPanel(root, state) {
  const list = root.querySelector('#mg-lord-stats');
  const actions = root.querySelector('#mg-lord-actions');
  const count = state.prestige.count;
  const threshold = prestigeThreshold(count);
  const earned = state.totalEarnedThisRun;
  const ready = canPrestige(state);
  const s = state.stats;
  const sig = [count, Math.floor(earned), s.recruited, s.escaped, s.retired, Math.floor(state.gameDays * 10)].join('|');
  if (changed(list, sig)) {
    const progress = el('progress');
    progress.max = threshold;
    progress.value = Math.min(earned, threshold);
    progress.style.width = '100%';
    progress.setAttribute('aria-label', '転生までの進み具合');
    const pct = Math.min(100, Math.floor((earned / threshold) * 100));
    const items = [
      row('転生回数', `${count} 回（収益ボーナス ×${prestigeMult(state).toFixed(1)}）`),
      (() => {
        const li = row('今周回の累計収益', `${formatInt(earned)} / ${formatInt(threshold)} G（${pct}%）`);
        li.appendChild(progress);
        return li;
      })(),
      row('人事', `勧誘 ${s.recruited}・逃亡 ${s.escaped}・定年 ${s.retired}`),
      row('経過日数', `${Math.floor(state.gameDays)} 日`),
    ];
    list.replaceChildren(...items);
  }
  let btn = actions.querySelector('#mg-prestige');
  if (!btn) {
    btn = el('button', 'mg-btn mg-btn--primary', '街を売って転生する');
    btn.type = 'button';
    btn.id = 'mg-prestige';
    const note = el('p', 'mg-panel__note');
    note.id = 'mg-prestige-note';
    note.style.margin = '0';
    actions.replaceChildren(btn, note);
  }
  btn.disabled = !ready;
  const note = actions.querySelector('#mg-prestige-note');
  const noteText = ready
    ? '条件達成。所持金・施設・人物を手放して次の街へ'
    : `転生には今周回で ${formatInt(threshold)} G 稼ぐ必要がある`;
  setText(note, noteText);
}

function row(label, value) {
  const li = el('li');
  li.append(el('div', 'mg-panel__note', label), el('strong', '', value));
  li.firstChild.style.margin = '0';
  return li;
}

// ---------- 設定パネル ----------

/** @param {HTMLElement} root #mg-settings-list */
export function renderSettingsPanel(root) {
  if (!changed(root, VERSION)) return;
  root.replaceChildren(
    row('セーブ', '自動（30 秒ごと・操作のたび・画面を閉じたとき）'),
    row('バージョン', VERSION),
  );
}

// ---------- 施設詳細シート ----------

/** シートの再描画判定用シグネチャ。 */
export function facilitySheetSignature(state, facilityId) {
  const f = state.facilities[facilityId];
  if (!f) return 'gone';
  const inc = facilityIncome(state, facilityId);
  const people = f.workers.map((pid) => {
    const p = state.people[pid];
    return p ? `${pid}:${Math.floor(p.morale)}:${candle(state, p)}` : pid;
  });
  return [f.type, f.x, f.y, inc.perSecond.toFixed(2), adjacencyFor(state, facilityId).badges.join(','), people.join(',')].join('|');
}

/**
 * 施設詳細シートの本文。配属者のボタンは data-person-id を持つ（タップで待機枠へ）。
 * @returns {Node[]}
 */
export function facilitySheetBody(state, facilityId) {
  const f = state.facilities[facilityId];
  if (!f) return [el('p', 'mg-panel__note', 'この施設はもうない')];
  const def = FACILITIES[f.type];
  const adj = adjacencyFor(state, facilityId);
  const inc = facilityIncome(state, facilityId);
  const out = [];
  const p = (text, cls) => {
    const node = el('p', cls || '', text);
    node.style.margin = '0 0 6px';
    return node;
  };

  if (def.kind === 'income') {
    out.push(p(`収益 +${inc.perSecond.toFixed(1)} G/秒（基礎 ${def.baseIncome} G/人/秒）`));
    const mults = [];
    if (inc.adjMult !== 1) mults.push(`隣接 ×${inc.adjMult}`);
    const pm = prestigeMult(state);
    if (pm !== 1) mults.push(`転生 ×${pm.toFixed(1)}`);
    if (mults.length) out.push(p(mults.join('・'), 'mg-panel__note'));
  } else if (f.type === 'dorm') {
    out.push(p(`収容上限 +${def.capacityBonus} 人（今の上限 ${capacity(state).max} 人）`));
  } else if (f.type === 'canteen') {
    const m = BALANCE.morale;
    if (f.workers.length < 1) {
      out.push(p('無人のため休業中。誰かを配属すると周囲の士気が回復する'));
    } else {
      const cook = f.workers.some((pid) => state.people[pid] && state.people[pid].job === 'cook');
      const rate = m.recoverPerSec * (cook ? m.cookBonus : 1) * adj.noiseMult;
      out.push(p(`周囲 8 マスの施設の士気 +${rate.toFixed(2)}/秒${cook ? '（料理人ボーナス）' : ''}`));
    }
  }

  out.push(p(adj.badges.length ? `隣接効果: ${adj.badges.join('、')}` : '隣接効果: なし', 'mg-panel__note'));

  if (def.capacity > 0) {
    out.push(p(`配属 ${f.workers.length}/${def.capacity}${f.workers.length ? '（タップで待機枠へ戻す）' : ''}`));
    const contrib = new Map(inc.workers.map((w) => [w.personId, w.contribution]));
    for (const pid of f.workers) {
      const person = state.people[pid];
      if (!person) continue;
      const job = JOBS[person.job];
      const btn = el('button', 'mg-btn');
      btn.type = 'button';
      btn.dataset.personId = pid;
      btn.style.cssText = 'display:block;width:100%;margin:0 0 6px;text-align:left;font-weight:500';
      const parts = [`${job.icon} ${person.name}（${job.label}）`];
      if (def.kind === 'income') {
        parts.push(`相性 ×${jobMult(person.job, f.type)}`, `+${formatRate(contrib.get(pid) || 0)} G/秒`);
      }
      parts.push(`士気 ${Math.floor(person.morale)}%`);
      const r = remainingDays(state, person);
      if (r !== null) parts.push(`${candle(state, person)}残り ${Math.ceil(r)} 日`);
      btn.textContent = parts.join('　');
      btn.setAttribute('aria-label', `${person.name}を待機枠へ戻す。${parts.join('、')}`);
      out.push(btn);
    }
  }
  return out;
}
