/**
 * 汎用モーダル、施設詳細ボトムシート、チュートリアル吹き出し。
 */

const $ = (id) => document.getElementById(id);

function fillBody(el, body) {
  if (body === undefined || body === null) {
    el.replaceChildren();
  } else if (typeof body === 'string') {
    const p = document.createElement('p');
    p.style.margin = '0';
    p.textContent = body;
    el.replaceChildren(p);
  } else if (Array.isArray(body)) {
    el.replaceChildren(...body);
  } else {
    el.replaceChildren(body);
  }
}

function fillActions(el, actions, hide) {
  el.replaceChildren(...(actions || []).map((a) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mg-btn' + (a.primary ? ' mg-btn--primary' : '') + (a.danger ? ' mg-btn--danger' : '');
    btn.textContent = a.label;
    if (a.disabled) btn.disabled = true;
    btn.addEventListener('click', () => {
      if (a.keepOpen !== true) hide();
      if (a.onClick) a.onClick();
    });
    return btn;
  }));
}

/**
 * @param {{title:string, body?:string|Node|Node[], actions?:{label:string, onClick?:Function, primary?:boolean, danger?:boolean}[]}} opts
 * ボタンを押すとモーダルを閉じてから onClick を呼ぶ。
 */
export function showModal({ title, body, actions }) {
  $('mg-modal-title').textContent = title || '';
  fillBody($('mg-modal-body'), body);
  fillActions($('mg-modal-actions'), actions, hideModal);
  $('mg-modal').hidden = false;
  const first = $('mg-modal-actions').querySelector('.mg-btn--primary') || $('mg-modal-actions').querySelector('button');
  if (first) first.focus({ preventScroll: true });
}

export function hideModal() {
  $('mg-modal').hidden = true;
}

export function isModalOpen() {
  return !$('mg-modal').hidden;
}

let sheetOnClose = null;

/**
 * 施設詳細シート。背景タップで閉じる（onClose を呼ぶ）。
 * @param {{title:string|Node, body?:string|Node|Node[], actions?:object[], onClose?:Function}} opts
 */
export function showSheet({ title, body, actions, onClose }) {
  const t = $('mg-sheet-title');
  if (typeof title === 'string') t.textContent = title; else t.replaceChildren(title);
  fillBody($('mg-sheet-body'), body);
  fillActions($('mg-sheet-actions'), actions, hideSheet);
  sheetOnClose = onClose || null;
  $('mg-sheet').hidden = false;
}

/** シートの中身だけ差し替える（開いたまま再描画）。 */
export function updateSheetBody(body) {
  fillBody($('mg-sheet-body'), body);
}

export function hideSheet() {
  const el = $('mg-sheet');
  if (el.hidden) return;
  el.hidden = true;
  const cb = sheetOnClose;
  sheetOnClose = null;
  if (cb) cb();
}

export function isSheetOpen() {
  return !$('mg-sheet').hidden;
}

/** 背景タップでシートを閉じるリスナーを付ける（起動時に 1 回）。 */
export function bindSheetBackdrop() {
  const el = $('mg-sheet');
  el.addEventListener('click', (e) => {
    if (e.target === el) hideSheet();
  });
}

/**
 * チュートリアル吹き出しを表示する。最終ステップ（3）ではボタンを「閉じる」にする。
 * @param {number} step
 * @param {string} text
 * @param {Function} onSkip スキップ／閉じる
 */
export function showTutorial(step, text, onSkip) {
  $('mg-tutorial-text').textContent = text;
  const skip = $('mg-tutorial-skip');
  const last = step >= 3;
  skip.textContent = last ? '閉じる' : 'スキップ';
  skip.setAttribute('aria-label', last ? 'チュートリアルを閉じる' : 'チュートリアルをスキップ');
  skip.onclick = onSkip;
  $('mg-tutorial').hidden = false;
}

export function hideTutorial() {
  $('mg-tutorial').hidden = true;
  $('mg-tutorial-skip').onclick = null;
}
