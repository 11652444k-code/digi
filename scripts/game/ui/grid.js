/**
 * 街グリッド（5×5）の DOM 描画。
 * index.html にある 25 個の button.mg-cell を使い回し、セルごとのシグネチャが
 * 変わったときだけ中身を作り直す（タップ中のボタンを捨てないため）。
 */
import { FACILITIES } from '../data/facilities.js';
import { adjacencyFor } from '../sim/adjacency.js';
import { facilityIncome } from '../sim/economy.js';

const sigs = new WeakMap();

/** 毎秒収益の短い表記（10 未満は小数 1 桁、末尾 .0 は省略）。 */
export function formatRate(n) {
  if (n >= 10) return String(Math.round(n));
  return n.toFixed(1).replace(/\.0$/, '');
}

/** 配属モードで、この施設に配属できるか（定員に空きがある）。 */
export function canReceive(state, facility, personId) {
  const cap = FACILITIES[facility.type].capacity;
  return cap > 0 && facility.workers.length < cap && !facility.workers.includes(personId);
}

function cellButtons(root) {
  if (!root._mgCells) {
    const map = [];
    for (const btn of root.querySelectorAll('.mg-cell')) {
      map[Number(btn.dataset.y) * 5 + Number(btn.dataset.x)] = btn;
    }
    root._mgCells = map;
  }
  return root._mgCells;
}

/**
 * @param {HTMLElement} root #mg-grid
 * @param {object} state
 * @param {{mode:string, selectedPersonId:string|null, buildType:string|null, movingFacilityId:string|null, sheetFacilityId?:string|null}} uiState
 */
export function renderGrid(root, state, uiState) {
  const { w, h, cells } = state.grid;
  const buttons = cellButtons(root);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const btn = buttons[y * w + x];
      if (!btn) continue;
      const fid = cells[y * w + x];
      const f = fid ? state.facilities[fid] : null;
      const view = f ? facilityView(state, f) : null;

      let target = false;
      let selected = false;
      if (uiState.mode === 'assign' && f) target = canReceive(state, f, uiState.selectedPersonId);
      if ((uiState.mode === 'build' || uiState.mode === 'move') && !f) target = true;
      if (uiState.mode === 'move' && f && f.id === uiState.movingFacilityId) selected = true;
      if (uiState.mode === 'idle' && f && f.id === uiState.sheetFacilityId) selected = true;

      const sig = view
        ? `${f.id}|${view.icon}|${view.workers}|${view.badges.join(',')}|${target}|${selected}`
        : `empty|${target}`;
      if (sigs.get(btn) === sig) continue;
      sigs.set(btn, sig);

      btn.classList.toggle('mg-cell--empty', !f);
      btn.classList.toggle('mg-cell--facility', !!f);
      btn.classList.toggle('mg-cell--target', target);
      btn.classList.toggle('mg-cell--selected', selected);
      const pos = `${x + 1}列${y + 1}行`;
      if (!f) {
        btn.replaceChildren();
        btn.removeAttribute('data-facility-id');
        btn.setAttribute('aria-label', `空きマス（${pos}）`);
        continue;
      }
      btn.dataset.facilityId = f.id;
      const children = [];
      const icon = document.createElement('span');
      icon.className = 'mg-cell__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = view.icon;
      children.push(icon);
      // バッジは <b>（CSS の :nth-of-type で縦に積むため、span と要素型を分ける）
      for (const text of view.badges) {
        const b = document.createElement('b');
        b.className = 'mg-cell__badge';
        b.textContent = text;
        children.push(b);
      }
      if (view.workers) {
        const wk = document.createElement('span');
        wk.className = 'mg-cell__workers';
        wk.textContent = view.workers;
        children.push(wk);
      }
      btn.replaceChildren(...children);
      const extra = [view.workers ? `配属 ${view.workers}` : '', ...view.badges].filter(Boolean).join('、');
      btn.setAttribute('aria-label', `${view.label}（${pos}）${extra ? ' ' + extra : ''}`);
    }
  }
}

function facilityView(state, f) {
  const def = FACILITIES[f.type];
  const badges = [...adjacencyFor(state, f.id).badges];
  const inc = facilityIncome(state, f.id).perSecond;
  if (inc > 0) badges.push(`+${formatRate(inc)}/s`);
  return {
    icon: def.icon,
    label: def.label,
    workers: def.capacity > 0 ? `${f.workers.length}/${def.capacity}` : '',
    badges,
  };
}

/**
 * 収益施設のセルに「+N G」のフロートテキストを 1 つ出す（1 秒で消える）。
 * @param {HTMLElement} root #mg-grid
 * @param {object} state
 */
export function spawnIncomeFloats(root, state) {
  const buttons = cellButtons(root);
  for (const f of Object.values(state.facilities)) {
    const inc = facilityIncome(state, f.id).perSecond;
    if (!(inc > 0)) continue;
    const btn = buttons[f.y * state.grid.w + f.x];
    if (!btn) continue;
    const em = document.createElement('em');
    em.className = 'mg-float';
    em.setAttribute('aria-hidden', 'true');
    em.textContent = `+${formatRate(inc)}G`;
    btn.appendChild(em);
    setTimeout(() => em.remove(), 1000);
  }
}
