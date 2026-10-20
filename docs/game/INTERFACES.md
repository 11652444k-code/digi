# 実装用インターフェース契約（P1）

`SPEC.md` を実装に落とすための契約。実装者はこの契約に従い、変更が必要なら実装せずに報告する。

## 0. 共通ルール

- ES Modules、ES2020、外部ライブラリなし、ビルドなし。
- `scripts/game/sim/**`, `scripts/game/data/**`, `scripts/game/state.js` は **DOM・window・localStorage に一切触れない**。Node 20 の `node tests/game/xxx.test.js` で動くこと。
- 乱数は引数 `rng`（`() => number` in [0,1)）で受け取る。省略時 `Math.random`。
- 時刻は引数 `now`（epoch ms）で受け取る。sim 内で `Date.now()` を呼ばない。
- 経過時間 `dt` は秒（number）。
- sim 関数は `state` を **その場で変更**してよい（mutable）。副作用はそれだけ。戻り値はイベント配列か結果オブジェクト。
- イベント: `{ type: string, ...payload }`。UI がログ文言・演出に変換する。
- CSS クラスは接頭辞 `mg-`。既存の `styles/main.css` は読み込まない。

## 1. state の形（セーブされる全体）

```js
{
  version: 1,
  savedAt: 0,                    // epoch ms。serialize 時に更新
  prestige: { count: 0, totalEarnedAllTime: 0 },
  unlocked: [],                  // 'lifespan' | 'hero' | 'disaster'
  money: 60,
  totalEarnedThisRun: 0,
  capacityBase: 6,
  grid: { w: 5, h: 5, cells: Array(25).fill(null) },  // cells[y*w+x] = facilityId | null
  facilities: {},                // id -> { id, type, x, y, workers: [personId] }
  people: {},                    // id -> Person
  waiting: [],                   // personId[]（最大 4）
  street: [],                    // StreetPerson[]（通りを歩いている、未勧誘）
  tutorial: { step: 0, done: false },
  stats: { recruited: 0, escaped: 0, retired: 0, built: 0, prestiges: 0 },
  nextId: 1,                     // ID 採番用カウンタ
  gameDays: 0,                   // 今周回の経過日数（1 日 = 60 秒）
}
```

- `Person`: `{ id, job, name, morale, age, lifespan, assignedTo, recruitedAt }`
  - `age` は日数（float）。`lifespan` は日数。`lifespan` は 'lifespan' 未解禁でも値を持つ（判定だけしない）。
- `StreetPerson`: `{ id, job, name, x, spawnedAt }`。`x` は 0（右端出現）→ 1（左端消滅）の進行率。
- ID: `p_<n>` 人物、`f_<n>` 施設、`s_<n>` 通りの人物。`nextId` をインクリメントして採番。

## 2. data/

### `data/jobs.js`
```js
export const JOBS = {
  villager: { id:'villager', label:'村人', icon:'🧑‍🌾', weight:50, favored:null,      names:[...10 個以上] },
  cook:     { id:'cook',     label:'料理人', icon:'🧑‍🍳', weight:20, favored:'canteen', names:[...] },
  merchant: { id:'merchant', label:'商人', icon:'👨‍💼', weight:20, favored:'stall',   names:[...] },
  smith:    { id:'smith',    label:'鍛冶師', icon:'🧑‍🔧', weight:10, favored:'factory', names:[...] },
};
export const JOB_IDS = Object.keys(JOBS);
```

### `data/facilities.js`
```js
export const FACILITIES = {
  stall:   { id:'stall',   label:'露店', icon:'🏪', kind:'income',  baseCost:100, capacity:1, baseIncome:1, capacityBonus:0 },
  factory: { id:'factory', label:'工場', icon:'🏭', kind:'income',  baseCost:600, capacity:3, baseIncome:2, capacityBonus:0 },
  dorm:    { id:'dorm',    label:'寮',   icon:'🏠', kind:'support', baseCost:250, capacity:0, baseIncome:0, capacityBonus:6 },
  canteen: { id:'canteen', label:'飯屋', icon:'🍲', kind:'support', baseCost:400, capacity:1, baseIncome:0, capacityBonus:0 },
};
export const FACILITY_IDS = Object.keys(FACILITIES);
export const BUILD_ORDER = ['stall','dorm','factory','canteen'];  // 建設タブの表示順
```
解禁条件は `sim/economy.js` の `isUnlockedFacility(state, type)` で判定（stall/dorm: 常時、factory: stall が 2 軒以上、canteen: dorm が 1 軒以上）。

### `data/balance.js`
```js
export const BALANCE = {
  tickSeconds: 0.1,
  secondsPerDay: 60,
  waitingSlots: 4,
  jobMult: { favored: 3.0, neutral: 1.0, unfavored: 0.5 },
  costGrowth: 1.7,
  adjacency: { factoryDormMult: 1.3, canteenNoiseMult: 0.5 },
  morale: { start: 100, decayPerSec: 0.2, recoverPerSec: 0.5, cookBonus: 1.5, lowThreshold: 50, offlineFloor: 10 },
  lifespan: { meanDays: 12, sdDays: 4, minDays: 6, warnDays: 3, farewellCostPerPrestige: 50 },
  offline: { maxSeconds: 8*3600, efficiency: 0.5 },
  prestige: { baseThreshold: 10000, growth: 3, incomeBonusPerCount: 0.1, startMoneyBonus: 200 },
  spawn: { maxOnStreet: 4, walkSeconds: 12, intervalMin: 3, intervalRand: 4, fullCapacityIntervalMult: 2, placeableBoost: 1.5 },
  initialMoney: 60,
  removeRefund: 0.5,
};
```

### `data/lines.js`
```js
export const LINES = {
  recruit: [...], recruitFull: [...], assign: [...], assignMismatch: [...],
  moraleWarn: [...], escape: [...], retire: [...], build: [...], remove: [...],
  offlineReturn: [...], prestigeReady: [...], prestigeDone: [...], saveCorrupt: [...],
  tutorial: { 0: '...', 1: '...', 2: '...', 3: '...' },
};
export function pickLine(key, vars = {}, rng = Math.random) // `{name}` `{job}` `{facility}` `{amount}` `{days}` を置換
```
各配列 3 本以上。トーンは SPEC 5 章。

## 3. state.js

```js
export const SAVE_KEY = 'digi.maou.save';
export const SAVE_VERSION = 1;
export function createInitialState(now, opts = {})  // opts.prestige / opts.unlocked を引き継いで新周回を作る
export function serialize(state, now) -> string     // savedAt を now に更新して JSON 化
export function deserialize(json, now) -> state | null  // 不正・旧版なら migrate、復元不能なら null
```
初期配置: 露店 1 軒を (2,4) に建設済み（無料）。通りに村人 2・商人 1 を `x` をずらして配置。

## 4. sim/

### `sim/ids.js`
`export function nextId(state, prefix) -> string`

### `sim/adjacency.js`
```js
export function neighbors4(x, y, w, h) -> [{x,y}]
export function neighbors8(x, y, w, h) -> [{x,y}]
export function facilityAt(state, x, y) -> facility | null
export function adjacencyFor(state, facilityId) -> {
  incomeMult: number,        // A-01: factory で隣接 dorm があれば 1.3、それ以外 1.0
  noiseMult: number,         // A-03: canteen で隣接 factory があれば 0.5、それ以外 1.0
  badges: string[],          // UI 用 '×1.3' '騒音' など
}
export function canteenCoverage(state) -> Map<facilityId, recoverPerSec>
  // 稼働中（workers.length >= 1）の canteen ごとに 8 近傍の施設を対象。
  // 回復量 = recoverPerSec × (cook が配属なら cookBonus) × noiseMult。複数 canteen は合算。
```

### `sim/economy.js`
```js
export function jobMult(job, facilityType) -> number
export function moraleMult(morale) -> number              // >=50: 1.0, <50: 0.5 + morale/100
export function prestigeMult(state) -> number
export function facilityIncome(state, facilityId) -> { perSecond, workers: [{personId, contribution}], adjMult }
export function totalIncomePerSecond(state) -> number
export function capacity(state) -> { used, max }          // used = 配属中 + waiting
export function countFacilities(state, type) -> number
export function buildCost(state, type) -> number          // ceil(baseCost × 1.7^(n))、n = 既存同種数
export function isUnlockedFacility(state, type) -> boolean
export function canBuild(state, type, x, y) -> { ok, reason }   // reason: 'locked'|'occupied'|'money'|'oob'
export function build(state, type, x, y, now) -> { ok, reason, facilityId, events }
export function removeFacility(state, facilityId) -> { ok, events }   // 50% 返金、workers は waiting へ、溢れた分は escape イベント
export function moveFacility(state, facilityId, x, y) -> { ok, reason }
export function recruit(state, streetId, now) -> { ok, reason, personId, events }  // reason: 'full'|'notfound'
export function assign(state, personId, facilityId) -> { ok, reason, events }       // reason: 'capacity'|'support'|'notfound'
export function unassign(state, personId) -> { ok, reason }                          // waiting が満杯なら 'full'
export function addIncome(state, dt) -> number            // money, totalEarnedThisRun, prestige.totalEarnedAllTime に加算。戻り値は加算額
```
- canteen への配属は許可（capacity 1）。dorm は capacity 0 なので 'capacity' で拒否。

### `sim/morale.js`
```js
export function tickMorale(state, dt) -> events   // 配属中のみ。coverage 内は回復、外は減少。0 で escape: 人物削除、facility.workers から除去、stats.escaped++
// event: { type:'escape', personId, name, job, facilityId }
// event: { type:'moraleWarn', facilityId }  // その施設の誰かが 50 を下回った瞬間のみ 1 回
```

### `sim/lifespan.js`
```js
export function rollLifespan(rng) -> number           // 正規分布(20,5) を Box-Muller、下限 8
export function tickLifespan(state, dt) -> events     // 'lifespan' 未解禁なら age だけ進めて return []
// 到達: 人物削除、送別費 min(money, 50×prestige.count) 徴収、stats.retired++
// event: { type:'retire', personId, name, job, days, cost }
```

### `sim/spawn.js`
```js
export function makeStreetPerson(state, rng, now) -> StreetPerson   // 職業重み + placeableBoost
export function tickStreet(state, dt, rng, now) -> void              // x を進め、1 を超えたら削除、間隔で出現
```
出現タイマーは `state.street` とは別に `state.spawnTimer`（number, 秒）を state に持つ（セーブ対象で可）。

### `sim/prestige.js`
```js
export function prestigeThreshold(count) -> number     // 10000 × 3^count
export function canPrestige(state) -> boolean           // totalEarnedThisRun >= threshold
export function doPrestige(state, now) -> newState      // count+1、unlocked に 'lifespan' を追加（count>=1）、createInitialState(now, {prestige, unlocked, stats}) を返す。初期金 + 200×count
```

### `sim/offline.js`
```js
export function applyOffline(state, now) -> { elapsedSec, earned, retired: [{name, job, days}] }
```
- `elapsedSec = clamp(now - savedAt, 0, maxSeconds)`
- earned = totalIncomePerSecond(閉じた時点) × elapsedSec × efficiency
- 士気: 減少分を計算して floor 10 で止める。逃亡なし。
- 寿命: 解禁済みなら age を進め、到達者を削除して retired に入れる（送別費は徴収しない）。

### `sim/tick.js`
```js
export function tick(state, dt, now, rng) -> events
```
順序: `addIncome` → `tickMorale` → `tickLifespan` → `tickStreet` → `gameDays += dt/60` → 転生可否が false→true に変わった瞬間 `{type:'prestigeReady'}` を 1 回（`state.prestigeNotified` フラグ）。

## 5. tests/game/

`node tests/game/economy.test.js` のように単体で実行でき、失敗時に非 0 で終了する。`node:assert/strict` のみ使用。
最低限カバー: jobMult 3 通り、moraleMult 境界（50, 49, 0）、buildCost の成長、A-01/A-03 の有無、canteenCoverage の cook ボーナスと騒音、escape 発生、retire 発生（解禁時のみ）、offline 上限 8h と floor 10、prestigeThreshold、serialize→deserialize の往復、壊れた JSON で null。

## 6. UI 側の DOM 契約（`game/index.html` の id）

| id | 役割 |
|---|---|
| `mg-app` | ルート。最大幅 480px 中央 |
| `mg-money`, `mg-income`, `mg-capacity`, `mg-morale` | ヘッダー数値 |
| `mg-street` | `<canvas>`。幅いっぱい、高さ 120 |
| `mg-grid` | 5×5 の `button.mg-cell` を 25 個。`data-x` `data-y` |
| `mg-waiting` | 4 個の `button.mg-slot` |
| `mg-log` | 最新 3 行の `<ul>` |
| `mg-tabs` | 4 つの `button.mg-tab` `data-tab="town|build|lord|settings"` |
| `mg-panel-build`, `mg-panel-lord`, `mg-panel-settings` | 各タブのパネル（`hidden` 属性で切替） |
| `mg-modal` | 汎用モーダル。`mg-modal-title`, `mg-modal-body`, `mg-modal-actions` |
| `mg-sheet` | 施設詳細のボトムシート。`mg-sheet-title`, `mg-sheet-body`, `mg-sheet-actions` |
| `mg-toast` | トースト表示領域 |
| `mg-tutorial` | チュートリアルの吹き出しオーバーレイ。`mg-tutorial-text`, `mg-tutorial-skip` |

セル状態のクラス: `mg-cell--empty`, `mg-cell--facility`, `mg-cell--target`（配属・建設・移設の候補）, `mg-cell--selected`。
セル内: `.mg-cell__icon`（施設絵文字）, `.mg-cell__workers`（人数 "2/3"）, `.mg-cell__badge`（'×1.3' 等、複数可）。
待機スロット: `mg-slot--empty`, `mg-slot--selected`、中身 `.mg-slot__icon`（職業絵文字）, `.mg-slot__name`。

## 7. UI モジュール（`scripts/game/ui/`、P1-b 以降で実装）

```js
// ui/grid.js
export function renderGrid(root, state, uiState)       // uiState: { mode: 'idle'|'assign'|'build'|'move', selectedPersonId, buildType, movingFacilityId }
// ui/panels.js
export function renderHeader(state), renderWaiting(root, state, uiState), renderLog(root, lines), renderBuildPanel(root, state, uiState), renderLordPanel(root, state), pushToast(text)
// ui/street.js
export function createStreet(canvas) -> { render(state, now), hitTest(clientX, clientY, state) -> streetId | null }
// ui/modals.js
export function showModal({ title, body, actions:[{label, onClick, primary}] }), hideModal(), showSheet({...}), hideSheet(), showTutorial(step, text, onSkip), hideTutorial()
// main.js: 起動、ループ（rAF 描画 + 100ms tick）、visibilitychange でセーブ、復帰時 applyOffline、全イベント→ログ変換、チュートリアル進行
```
