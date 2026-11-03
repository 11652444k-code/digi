# 禍津の形代 3D — 設計書

和風ホラー横スクロール「禍津の形代」の世界観を使った、ブラウザで動く **3D 一人称ホラー**。
Three.js を CDN(importmap)から読むだけで、ビルド不要・画像なしでも動く。
画像(スプライト)があれば差し替わる(2D版と同じ「画像が無ければコード描画に落ちる」思想)。

## 置き場所

| 何 | どこ |
|---|---|
| 入口 | `games/magatsu-3d/index.html` (importmap で three を読む。ES modules なので http サーバ経由で開く) |
| 起動・状態遷移・UI | `src/main.js` |
| 世界(地形・小道具・光・昼夜・当たり判定データ・配置) | `src/world.js` |
| 当たり判定ユーティリティ | `src/collision.js` |
| 主人公(一人称操作・スタミナ・スマホライト) | `src/player.js` |
| 敵(面被り・地蔵) | `src/enemies.js` |
| 音(WebAudio で手続き生成、音声ファイルなし) | `src/audio.js` |
| スプライト差し替え | `src/sprites.js` + `assets/sprites/*.png` (任意) |
| 動作確認 | `cd games/magatsu-3d && python3 -m http.server 8765` → http://localhost:8765/ |

Three.js は `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js` を importmap の `three` に割り当てる。
`three/addons/` は使わない(PointerLock も自前)。

## 遊び方(仕様)

- タイトル → クリックでポインタロック → 夕暮れの田舎道からスタート。
- **目的**: 散らばった **形代 5 枚** を集め、社の祭壇で `E` を押して納めるとクリア。
- 最初の形代を拾うと夕暮れ→夜へ 20 秒かけて暗くなる(`night` 0→1)。`night >= 0.6` で敵が動き出す。
- `night >= 0.3` でスマホのライトが自動点灯(メッセージ「スマホのライトをつけた」)。`F` で手動トグル可。
- **面被り**(1 体): 経路点をうろつく。視野(前方 70°、距離 18)に主人公を捉えると追跡。捕まると終了。
  追跡速度 5.2 (主人公 歩き 4.0 / 走り 6.5)。走りはスタミナ消費(満タンから 4 秒で空、回復は 6 秒)。
- **地蔵**(4 体): カメラの視野に入っている間は動かない。視野外(画面外、または遮蔽物の後ろ)のときだけ主人公へ向かって歩く(速度 2.5)。
  距離で見た目が変わる: 遠い=眠り(sleep) / 12 未満=目隠しずれ(slip) / 5 未満=目覚め(awake)。触れると終了。
- **御札**(2 枚): 拾っておくと、捕まった瞬間に 1 枚消費して敵を 6 秒間遠ざける(光が走る)。
- 捕まると「捕まった」画面 → クリックでやり直し。クリアは「夜が明けた」画面。
- 操作: `WASD`/矢印 移動、`Shift` 走る、`E` 調べる/拾う、`F` ライト、`Esc` ポインタ解除。
- 字幕(主人公の独白)を節目で表示: 開始「……ここ、昼間と全然ちがう」/ 初形代「形代……誰が置いたの」/ 夜化「暗い。スマホ、まだ電池ある」/ 面被り初遭遇「っ……誰かいる」/ 地蔵初移動「今、動いた……?」/ 祭壇「形代を納める。全部、戻す」。

## 世界の配置(座標。+X 右、−Z 奥、Y 上。単位 m)

- 地面: 200×200 の平面(y=0)。土色。道は幅 4、x=0 に沿って z=+75 → −65 の帯(少し明るい色)。
- 主人公スポーン: `(0, 1.6, 70)`、向き −Z(奥)。
- 鳥居: `(0, 0, −30)`、朱色の柱 2 本+笠木。道をまたぐ。
- 社(本殿): `(0, 0, −55)` 幅 10 奥行 8 高 5 の木造ボックス+切妻屋根、前に階段。中に入れなくてよい。
  祭壇: `(0, 0, −49)` 半径 2.5 の円。石の台。納めるとき形代の紙を置く。
- 廃屋(屋内あり): 中心 `(26, 0, 20)`、外寸 12×8 高 3.2。南側(+Z)中央に幅 1.6 の戸口(開いている)。
  壁は厚さ 0.3 の箱で当たり判定。屋内は床 板色・天井あり。中に形代 1 枚と御札 1 枚。
- 田んぼ: x −60..−12、z 0..60 を 4 区画。水面は暗い反射色の平面(y=−0.05)。畦道(高さ 0.2)で区切る。
  祠: `(−36, 0, 30)` 小さな石の祠(形代 1 枚)。
- 竹林: x 15..50、z −45..−8 に竹(細い緑の円柱 高 8〜11、上に小さな葉の塊)を 120 本ランダム配置。奥に形代 1 枚 `(40, 0, −30)`。
- 木: 道の外周に 40 本ほど(幹+暗い樹冠、円錐 or 球)。
- 電柱: x=6、z=60,45,30,15,0,−15 の 6 本。高 9。隣同士を 2 本の電線(細い線)で結ぶ。
- 提灯: 鳥居の両脇と社の前 2 つ。暖色の点光源(揺らぐ)。
- 張り紙・御札(見た目のみ)を電柱・鳥居に数枚貼る。
- 形代の配置(5): 道端 `(3, 0, 40)` / 祠 `(−36, 0, 30)` / 廃屋内 `(26, 0, 19)` / 竹林 `(40, 0, −30)` / 社の裏 `(0, 0, −62)`。
- 御札の配置(2): 廃屋内 `(29, 0, 21)` / 鳥居の脇 `(−4, 0, −28)`。
- 地蔵の初期位置(4): `(4, 0, 50)` / `(−4, 0, 10)` / `(5, 0, −20)` / `(−20, 0, 45)`。地蔵は当たり判定の対象外(自分で避ける)。
- 面被りスポーン: `(0, 0, −10)`。経路点: `(0,−10) → (−8,5) → (0,25) → (8,45) → (30,25) → (20,−5) → (0,−25)` (x,z)。

## 昼夜(`world.setNight(t)`)

- t=0 夕暮れ: 空 `0x6b3a4a`〜地平 `0xd97a4a` のグラデ(大きな球の内側 or 背景色+霧)、霧 `0x8a5a5a` 密度 0.012、環境光 0.55、方向光(橙) 0.8。
- t=1 夜: 空 `0x05060c`、霧 `0x070810` 密度 0.045、環境光 0.08、方向光(青白) 0.12。提灯の光が相対的に強く見える。
- 中間は線形補間。

## 当たり判定(`src/collision.js`)

```js
// すべて XZ 平面。半径 r の円(主人公/敵)と、箱・円の静的コライダー。
export function moveWithCollision(pos /*THREE.Vector3, 変更される*/, dx, dz, colliders, r)
// 軸ごとに分けて動かし、めり込んだら押し戻す(スライド)。戻り値なし。
export function circleHitsAny(x, z, r, colliders) // boolean
export function segmentBlocked(x0, z0, x1, z1, colliders) // 線分が箱コライダーに当たるか(地蔵の遮蔽判定に使う)
// collider 形: { type:'box', minX, minZ, maxX, maxZ } | { type:'circle', x, z, r }
```

## インターフェース(ここに書いた通りに実装する。勝手に変えない)

### `src/world.js`
```js
export const WORLD_SIZE = 200;
export function buildWorld(scene /*THREE.Scene*/, renderer /*THREE.WebGLRenderer*/) // 同期。返り値:
{
  colliders,                 // 上記 collider の配列(木・竹・電柱・建物の壁・鳥居の柱・祠・祭壇台)
  items: [ { id, kind:'katashiro'|'ofuda', position: THREE.Vector3, object: THREE.Object3D, taken:false } ],
  altar: { position: THREE.Vector3, radius: 2.5, placeKatashiro(count) }, // placeKatashiro: 台の上に紙を count 枚並べる
  playerSpawn: { position: THREE.Vector3, yaw: number },
  enemySpawns: { menkaburi: THREE.Vector3, jizo: THREE.Vector3[] },
  waypoints: THREE.Vector3[],     // 面被りの巡回経路(y=0)
  setNight(t),                    // 0..1
  update(dt, time),               // 提灯の揺らぎなど
}
```
- 形代の見た目: 白い紙の人形(平面 2 枚を十字に、少し浮いて回転・上下にゆらゆら)。御札: 縦長の白い札に赤い模様。
- 地面や建物は `MeshStandardMaterial`/`MeshLambertMaterial`。影は方向光 1 つだけ(`renderer.shadowMap.enabled = true`、影を落とすのは建物・木・鳥居・電柱、受けるのは地面)。竹は影なし(数が多い)。
- 頂点色やノイズ(簡単な疑似乱数、`seed` 固定で毎回同じ配置)で質感を出す。テクスチャ画像は使わない(CanvasTexture で生成するのは可)。

### `src/player.js`
```js
export class Input {
  constructor(domElement)   // keydown/keyup/mousedown を登録
  down(code)      // 押しっぱなし判定(例 'KeyW')
  pressed(code)   // このフレームに押された(エッジ)。endFrame() でクリア
  endFrame()
  mouseDX, mouseDY  // ポインタロック中の移動量(フレーム毎に読み取り後 0 に戻す: consumeMouse())
  consumeMouse() → {dx, dy}
}
export class Player {
  constructor(camera /*PerspectiveCamera*/, world, domElement)
  // camera.position を主人公の目の位置(高さ 1.6)として使う。yaw/pitch を自前で持つ(Euler YXZ)。
  update(dt, input)   // 移動(WASD/矢印)、走り(Shift)、当たり判定(半径 0.4)、ヘッドボブ、スタミナ、F でライトトグル
  position            // getter → camera.position
  yaw, pitch
  stamina             // 0..1
  isMoving, isSprinting
  flashlight          // THREE.SpotLight (camera の子。angle 0.5、distance 30、intensity 夜用)。
  flashlightOn        // boolean
  setFlashlight(on)
  getForward(out)     // XZ の前方向(正規化)
  lock() / unlock()   // pointer lock
  locked              // boolean
  onLockChange        // コールバック(main が ESC での一時停止に使う)
  reset()             // スポーンに戻す
}
```
- 走り: `input.down('ShiftLeft')||down('ShiftRight')` かつ移動中かつスタミナ>0。スタミナ 0 になったら 1.5 秒は走れない。
- マウス感度 0.0022 rad/px。pitch は ±85° にクランプ。

### `src/enemies.js`
```js
export class Menkaburi {
  constructor(scene, world, sprites /*Map|null*/)
  object            // THREE.Object3D(root。y=0 が足元)
  state             // 'idle'|'wander'|'chase'|'repelled'
  alert             // 0..1(追跡で 1、見失うと減衰。心音の強さに使う)
  caught            // 捕まえたら true(main が読む)
  firstSeen         // 一度でも追跡に入ったら true(字幕用)
  update(dt, player, world, night)   // night < 0.6 なら不可視(object.visible=false)で待機
  repel(seconds)    // 御札。主人公から離れる方向へ逃げ、その間追跡しない
  reset()
}
export class Jizo {
  constructor(scene, world, position, index, sprites)
  object
  state             // 'sleep'|'slip'|'awake'
  caught
  hasMoved          // 一度でも動いたら true(字幕用)
  update(dt, player, camera, world, night)
  // 視野判定: カメラの Frustum(THREE.Frustum.setFromProjectionMatrix)に object のバウンディング球が入っていて、
  //   かつ collision.segmentBlocked(camera→地蔵) が false なら「見られている」。見られている間は動かない。
  //   見られていない間、主人公へ直進(moveWithCollision、半径 0.5)。night < 0.6 では動かない。
  //   地蔵同士の重なりは気にしなくてよい。
  reset()
}
```
- 面被りの見た目(画像なし時): 身長 1.8 の黒い和装(細長い箱・円錐)に白い面(平面、黒い目の穴)。追跡中は前傾+腕を前に。歩きは左右にわずかに揺れる。
- 地蔵の見た目: 灰色の石(円柱の胴+球の頭+赤い前掛け=赤い平面)。slip で前掛け(目隠し)が少しずれた赤布を目元に、awake で目(黒い小球 2 つ)が出る。
- 画像あり時: `sprites.get('menkaburi_stand')` 等があれば `sprites.js` の `makeBillboard` で平面スプライトに差し替え(状態ごとに切替)。
- 捕まる判定: 距離 < 1.0(面被り)、< 0.9(地蔵)。
- 面被りの視野判定: 前方ベクトルとの角度 70° 以内 かつ 距離 18 以内 かつ `segmentBlocked` でない。見失って 4 秒で wander に戻る。
- 面被りの移動は `moveWithCollision`(半径 0.45)。wander は waypoints を順番に回る(到達半径 1.0)。追跡は主人公へ直進(詰まったら 1 秒ごとに少しランダムに逸らす)。

### `src/audio.js`
```js
export class AudioSys {
  constructor()
  resume()                 // ユーザー操作後に呼ぶ(AudioContext.resume)
  setNight(t)              // 環境音(夕暮れ=虫の声風ノイズ、夜=低いドローン)の混ぜ具合
  setTension(level)        // 0..1。心音の速さ・音量(0 で無音)
  footstep(sprint)         // 短いノイズ音
  pickup()                 // 形代・御札
  sting()                  // 捕まった(不協和音の短いスティング)
  clearJingle()            // クリア(鈴の音 3 連)
  jizoMove()               // 地蔵が動いた(石が擦れる低いノイズ、短い)
  repelFlash()             // 御札発動
  update(dt)
}
```
すべて OscillatorNode/ノイズバッファ/GainNode で合成。外部ファイルなし。`muted` フラグで `M` キーのミュートに対応(main が呼ぶ `toggleMute()`)。

### `src/sprites.js`
```js
export const SPRITE_NAMES = ['menkaburi_stand','menkaburi_walk1','menkaburi_walk2','menkaburi_chase','menkaburi_catch','jizo_sleep','jizo_slip','jizo_awake'];
export async function loadSprites(basePath='assets/sprites/') // → Map<name, THREE.Texture>。無い画像はスキップ(reject しない)。
export function makeBillboard(texture, heightMeters) // → THREE.Sprite(足元が原点になるよう center を (0.5, 0) に)
```

### `src/main.js`(index.html から `type="module"` で読む)
- 状態: `'title'|'playing'|'paused'|'caught'|'clear'`。
- 初期化: renderer(antialias, shadowMap, `setPixelRatio(min(devicePixelRatio,2))`)、scene、camera(fov 70、near 0.1、far 400)、`buildWorld`、`Player`、`Menkaburi`、`Jizo`×4、`AudioSys`、`loadSprites()`(await)。
- ループ: `requestAnimationFrame`、dt を 0.05 にクランプ。playing のときだけ update。
- 拾う: 主人公から 1.6 以内の未取得アイテムがあれば HUD に「E: 形代を拾う」と出し、`E` で取得。形代なら count++。初回なら夜化開始。
- 祭壇: 形代 5 枚持って祭壇の半径内で「E: 形代を納める」→ clear。
- 捕まる: `menkaburi.caught || jizo.caught` → 御札があれば消費して `repel(6)`(地蔵は 8m 後退させる)+ 画面白フラッシュ、なければ `'caught'`。
- 夜化: `nightTarget=1` を 20 秒で補間。`world.setNight`, `audio.setNight`, 霧・背景更新。
- 心音: `audio.setTension(max(menkaburi.alert, 近い地蔵による 0..1))`。
- HUD(DOM): 形代 `n/5`、御札枚数、スタミナバー、中央の小さな十字、字幕(下)、ヒント(中央下)。
- 画面: title(タイトル・操作説明・「クリックで始める」)、caught(「捕まった」+「クリックでやり直す」)、clear(「夜が明けた」+「もう一度」)。
- `Esc` でポインタロックが外れたら `'paused'` 表示(「クリックで再開」)。
- リサイズ対応。`M` でミュート。
- やり直し: アイテム・敵・夜・主人公をすべて reset(ページリロードではなく状態リセット)。

### `index.html`
- `<meta charset="utf-8">`、viewport、タイトル「禍津の形代 3D」。
- importmap: `{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js" } }`。
- `<canvas id="game">` 全画面、UI は `#ui` 内の div(HUD / 字幕 / ヒント / overlay 各画面)。フォント: Noto Serif JP(Google Fonts)+ゴシックのフォールバック。
- 背景黒、UI は白の細い文字、赤 `#b3261e` をアクセント。
- WebGL が無い場合のメッセージ。
- ポートフォリオ(`/digi/`)へ戻るリンクを title 画面の隅に。

## 受け入れ条件

1. `python3 -m http.server` で開いてコンソールにエラーが出ない(起動、プレイ、捕まる、やり直し、クリア)。
2. 画像なしで全部表示される。`assets/sprites/*.png` を置くと面被り・地蔵が差し替わる。
3. 60fps 前後(ドローコール: 竹・木は `InstancedMesh` を使う)。
4. ファイルは `games/magatsu-3d/` 以下のみ。既存ポートフォリオのファイルは触らない。
