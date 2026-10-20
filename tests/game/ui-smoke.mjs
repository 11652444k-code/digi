/**
 * UI スモークテスト（Playwright、headless Chromium、390×844）。
 * 初回起動 → チュートリアル 4 ステップ → リロードで復元、を通しで確認する。
 *
 * 実行方法（リポジトリのルートで）:
 *   python3 -m http.server 8765 --bind 127.0.0.1 &      # リポジトリのルートを配信
 *   PW_MODULE=/path/to/node_modules/playwright \
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
 *   SHOT_DIR=/tmp/shots node tests/game/ui-smoke.mjs
 *
 * 環境変数（すべて省略可）:
 *   PW_MODULE     playwright パッケージの場所（省略時は通常の解決 'playwright'）
 *   CHROMIUM_PATH Chromium の実行ファイル（省略時は Playwright 既定）
 *   BASE_URL      既定 http://127.0.0.1:8765/game/
 *   SHOT_DIR      スクリーンショットの保存先（省略時は保存しない）
 * Google Fonts へのリクエストは空の CSS で応答する（オフライン環境でのコンソールエラー回避）。
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { LINES } from '../../scripts/game/data/lines.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || 'playwright');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8765/game/';
const SHOT_DIR = process.env.SHOT_DIR || '';
const RUN_MS = 10000;

let failures = 0;
function check(cond, msg) {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!cond) failures += 1;
}

async function shot(page, name) {
  if (!SHOT_DIR) return;
  await page.screenshot({ path: path.join(SHOT_DIR, `ui-${name}.png`) });
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
  route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(String(e)));

const S = (fn, arg) => page.evaluate(fn, arg);
/** 描画は rAF で遅れて反映されるので、セレクタが現れるまで少し待つ。 */
const seen = (sel) => page.waitForSelector(sel, { state: 'attached', timeout: 2000 }).then(() => true, () => false);

try {
  // 新規セーブで開始
  await page.goto(BASE_URL);
  await S(() => localStorage.clear());
  await page.reload();
  const startedAt = Date.now();
  await page.waitForFunction(() => window.__mg && window.__mg.getState());

  check(await page.isVisible('#mg-tutorial'), 'tutorial overlay is shown on first boot');
  check(await seen('#mg-street.mg-highlight'), 'step 0 highlights the street canvas');
  await shot(page, 'initial');

  // ステップ 0: 通りの人物をタップして勧誘
  let recruited = false;
  for (let attempt = 0; attempt < 10 && !recruited; attempt++) {
    await page.waitForFunction(() => window.__mg.getState().street.some((s) => s.x > 0.1 && s.x < 0.85));
    const pt = await S(() => {
      const s = window.__mg.getState().street.find((p) => p.x > 0.1 && p.x < 0.85);
      return window.__mg.streetPoint(s.id);
    });
    await page.mouse.click(pt.x, pt.y);
    recruited = await S(() => window.__mg.getState().waiting.length === 1);
  }
  check(recruited, 'tapping a street person recruits them into waiting (1 person)');
  check(await S(() => window.__mg.getState().tutorial.step) === 1, 'tutorial advanced to step 1');
  const slotShown = await page.waitForSelector('.mg-slot[data-person-id] .mg-slot__name', { timeout: 2000 }).then(() => true, () => false);
  check(slotShown, 'waiting slot shows the name');

  // ステップ 1: 待機枠 → 露店
  await page.click('.mg-slot[data-person-id]');
  check(await S(() => window.__mg.getUi().mode) === 'assign', 'slot tap enters assign mode');
  const targeted = await page.waitForSelector('.mg-cell[data-x="2"][data-y="4"].mg-cell--target', { timeout: 2000 }).then(() => true, () => false);
  check(targeted, 'stall cell is highlighted as target');
  await page.click('.mg-cell[data-x="2"][data-y="4"]');
  await page.waitForTimeout(300);
  const stallWorkers = await page.textContent('.mg-cell[data-x="2"][data-y="4"] .mg-cell__workers');
  check(stallWorkers === '1/1', `stall shows 1/1 (got ${stallWorkers})`);
  const income = await S(() => Number(document.getElementById('mg-income').textContent));
  check(income > 0, `header income > 0 (got +${income})`);
  check(await S(() => window.__mg.getState().tutorial.step) === 2, 'tutorial advanced to step 2');
  const floated = await page.waitForSelector('.mg-cell[data-x="2"][data-y="4"] .mg-float', { timeout: 2500 }).then(() => true, () => false);
  check(floated, 'floating +N G text appears over the stall');
  await shot(page, 'assigned');

  // ステップ 2: 寮を建てる
  const capBefore = await page.textContent('#mg-capacity');
  await S(() => { window.__mg.getState().money = 200; });
  check(await seen('.mg-tab[data-tab="build"].mg-highlight'), 'step 2 highlights the build tab');
  await page.click('.mg-tab[data-tab="build"]');
  await page.waitForSelector('#mg-build-list button[data-type="dorm"]:not([disabled])');
  check(await page.locator('#mg-build-list li[data-type="dorm"].mg-highlight').count() === 1, 'dorm row is highlighted');
  check(await page.locator('#mg-build-list li').count() === 4, 'build panel lists 4 facility types');
  await shot(page, 'build');
  await page.click('#mg-build-list button[data-type="dorm"]');
  check(await page.isVisible('#mg-panel-town'), 'choosing a type switches back to the town tab');
  check(await S(() => window.__mg.getUi().mode) === 'build', 'build mode active');
  await page.click('.mg-cell[data-x="0"][data-y="0"]');
  await page.waitForTimeout(300);
  check((await page.textContent('.mg-cell[data-x="0"][data-y="0"] .mg-cell__icon')) === '🏠', 'cell (0,0) shows the dorm');
  const capAfter = await page.textContent('#mg-capacity');
  const maxOf = (t) => Number(t.split('/')[1]);
  check(maxOf(capAfter) === maxOf(capBefore) + 6, `capacity max rose by 6 (${capBefore} -> ${capAfter})`);
  check(await S(() => window.__mg.getState().tutorial.step) === 3, 'tutorial advanced to step 3');
  check((await page.textContent('#mg-tutorial-skip')) === '閉じる', 'step 3 shows a 閉じる button');
  await page.click('#mg-tutorial-skip');
  check(await S(() => window.__mg.getState().tutorial.done) === true, 'tutorial reached done');
  const tutHidden = await page.waitForSelector('#mg-tutorial', { state: 'hidden', timeout: 2000 }).then(() => true, () => false);
  check(tutHidden, 'tutorial overlay hidden');

  // 施設詳細シート
  await page.click('.mg-cell[data-x="2"][data-y="4"]');
  await page.waitForSelector('#mg-sheet:not([hidden])');
  await page.waitForTimeout(300);
  const sheetText = await page.textContent('#mg-sheet-body');
  check(/収益 \+/.test(sheetText) && /相性 ×/.test(sheetText), 'sheet shows income and job multiplier');
  await shot(page, 'sheet');
  await page.click('#mg-sheet-actions button:has-text("閉じる")');
  check(!(await page.isVisible('#mg-sheet')), 'sheet closes');

  // 魔王パネル
  await page.click('.mg-tab[data-tab="lord"]');
  await page.waitForSelector('#mg-prestige');
  check(await page.locator('#mg-prestige[disabled]').count() === 1, 'prestige button disabled before threshold');
  check((await page.locator('#mg-lord-stats li').count()) >= 4, 'lord stats rendered');
  await shot(page, 'lord');
  await page.click('.mg-tab[data-tab="town"]');

  // 合計 10 秒以上動かす
  const left = RUN_MS - (Date.now() - startedAt);
  if (left > 0) await page.waitForTimeout(left);
  check(await S(() => window.__mg.getState().money > 100), 'money keeps accruing while running');

  // リロードで復元
  const before = await S(() => {
    const s = window.__mg.getState();
    return {
      money: s.money,
      facilities: Object.values(s.facilities).map((f) => `${f.type}@${f.x},${f.y}:${f.workers.length}`).sort().join(' '),
    };
  });
  await page.reload();
  await page.waitForFunction(() => window.__mg && window.__mg.getState());
  const after = await S(() => {
    const s = window.__mg.getState();
    return {
      money: s.money,
      done: s.tutorial.done,
      facilities: Object.values(s.facilities).map((f) => `${f.type}@${f.x},${f.y}:${f.workers.length}`).sort().join(' '),
    };
  });
  check(Math.abs(after.money - before.money) < 5, `money restored (${before.money.toFixed(1)} -> ${after.money.toFixed(1)})`);
  check(after.facilities === before.facilities, `facilities restored (${after.facilities})`);
  check(after.done === true, 'tutorial stays done after reload');
  check(!(await page.isVisible('#mg-tutorial')), 'no tutorial after reload');

  // 移動 → 撤去
  await page.click('.mg-cell[data-x="0"][data-y="0"]');
  await page.waitForSelector('#mg-sheet:not([hidden])');
  check(/収容上限 \+6/.test(await page.textContent('#mg-sheet-body')), 'dorm sheet shows the capacity bonus');
  await page.click('#mg-sheet-actions button:has-text("移動")');
  check(await S(() => window.__mg.getUi().mode) === 'move', 'move mode active');
  await page.click('.mg-cell[data-x="1"][data-y="0"]');
  await page.waitForTimeout(200);
  check((await page.textContent('.mg-cell[data-x="1"][data-y="0"] .mg-cell__icon')) === '🏠', 'dorm moved to (1,0)');
  await page.click('.mg-cell[data-x="1"][data-y="0"]');
  await page.click('#mg-sheet-actions button:has-text("撤去")');
  await page.waitForSelector('#mg-modal:not([hidden])');
  check(/返金 50 G/.test(await page.textContent('#mg-modal-body')), 'remove confirm shows the refund');
  const moneyBeforeRemove = await S(() => window.__mg.getState().money);
  await page.click('#mg-modal-actions button:has-text("撤去する")');
  await page.waitForTimeout(200);
  const moneyAfterRemove = await S(() => window.__mg.getState().money);
  check(moneyAfterRemove - moneyBeforeRemove >= 50, 'refund added to money');
  check(await S(() => Object.values(window.__mg.getState().facilities).length) === 1, 'dorm removed');

  // オフライン復帰: savedAt を 2 時間前にしてリロード
  // ゲームは pagehide と visibilitychange でセーブするので、その後に savedAt を書き換える
  await page.evaluate(() => {
    const rewind = () => {
      const raw = JSON.parse(localStorage.getItem('digi.maou.save'));
      raw.savedAt = Date.now() - 2 * 3600 * 1000;
      localStorage.setItem('digi.maou.save', JSON.stringify(raw));
    };
    window.addEventListener('pagehide', rewind);
    document.addEventListener('visibilitychange', rewind);
  });
  await page.reload();
  await page.waitForSelector('#mg-modal:not([hidden])');
  const offlineText = await page.textContent('#mg-modal-body');
  check(/2 時間/.test(offlineText) && /獲得額: \+/.test(offlineText), `offline modal shows time and earnings`);
  const m1 = await S(() => window.__mg.getState().money);
  await page.waitForTimeout(600);
  const m2 = await S(() => window.__mg.getState().money);
  check(m1 === m2, 'sim paused while the offline modal is open');
  await shot(page, 'offline');
  await page.click('#mg-modal-actions button');
  await page.waitForTimeout(600);
  check(await S(() => window.__mg.getState().money) > m2, 'sim resumes after closing the modal');

  // 壊れたセーブ
  await page.evaluate(() => {
    const corrupt = () => localStorage.setItem('digi.maou.save', '{broken');
    window.addEventListener('pagehide', corrupt);
    document.addEventListener('visibilitychange', corrupt);
  });
  await page.reload();
  await page.waitForFunction(() => window.__mg && window.__mg.getState());
  check(await S(() => window.__mg.getState().money) === 60, 'corrupt save falls back to a new game');
  const logText = await page.textContent('#mg-log');
  check(LINES.saveCorrupt.some((l) => logText.includes(l)), 'corrupt save logs a saveCorrupt line');
  check(await page.isVisible('#mg-tutorial'), 'new game after corrupt save shows tutorial');
} catch (e) {
  failures += 1;
  console.log('FAIL exception:', e && e.stack ? e.stack : e);
} finally {
  check(consoleErrors.length === 0, `no console errors (${consoleErrors.length}) ${consoleErrors.join(' | ')}`);
  check(pageErrors.length === 0, `no page errors (${pageErrors.length}) ${pageErrors.join(' | ')}`);
  await browser.close();
}

console.log(failures ? `${failures} check(s) failed` : 'ui smoke passed');
process.exit(failures ? 1 : 0);
