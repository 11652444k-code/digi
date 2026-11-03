# 禍津の形代 3D

和風ホラー横スクロール「禍津の形代」の世界観の 3D 一人称ホラー。Three.js 同梱、ビルド不要、画像なしで動く。

## 遊び方

**目的**: 散らばった形代 5 枚を集め、社の祭壇に納める(祭壇で `E`)。最初の形代を拾うと夕暮れから夜へ変わり、敵が動き出す。

| 操作 | キー |
|---|---|
| 移動 | WASD / 矢印 |
| 走る | Shift(スタミナを消費) |
| 見回す | マウス |
| 調べる / 拾う | E |
| ライト | F |
| 消音 | M |
| 一時停止 | Esc |

**スマホ**: 画面の左 40% がスティック、右 60% をドラッグで視点移動。画面右下の E / F ボタンで調べる・ライト。

**敵のルール**
- 面被り: 視野に入ると追跡してくる。
- 地蔵: 見ている間は動かない。目を離すと近づいてくる。
- 御札: 捕まったとき 1 回だけ助かる。

## 動かし方

ES modules なので `file://` では動かない。HTTP サーバ経由で開く。

```
cd games/magatsu-3d && python3 -m http.server 8765
```

http://localhost:8765/ を開く。

URL に `?debug` を付けると `window.__magatsu` のデバッグフック(forcePlay / setNight / teleport / takeAll / giveOfuda / debug)が使える。

## ファイル構成

| パス | 内容 |
|---|---|
| `index.html` | 入口(canvas と UI) |
| `src/main.js` | 起動・状態遷移・UI |
| `src/world.js` | 地形・小道具・光・昼夜・配置 |
| `src/collision.js` | 当たり判定ユーティリティ |
| `src/player.js` | 一人称操作・スタミナ・ライト |
| `src/enemies.js` | 敵(面被り・地蔵) |
| `src/audio.js` | WebAudio による手続き生成の音 |
| `src/sprites.js` | スプライト差し替え |
| `vendor/three.module.min.js` | 同梱の Three.js |
| `assets/sprites/` | 差し替え用画像(任意) |
| `DESIGN.md` | 設計書 |

## 絵の差し替え

`assets/sprites/<名前>.png` を置くと、画像なしの描画から差し替わる。

- 名前: `menkaburi_stand` / `menkaburi_walk1` / `menkaburi_walk2` / `menkaburi_chase` / `menkaburi_catch` / `jizo_sleep` / `jizo_slip` / `jizo_awake`
- 透過 PNG、足元が画像の下端、正面向き。
- `assets/sprites/manifest.json` に置いた名前の配列を書くと、その画像だけ読む(404 を出さないため)。manifest が無ければ全部試す。

```
["menkaburi_stand","jizo_sleep"]
```

2D 版の `demo/assets/sprites/` の png をそのまま流用できる想定。

## 未決・次の候補

- ステージ 2
- エンディング分岐
- スプライト導入
- 公開先: GitHub Pages(`games/magatsu-3d/`)、itch.io
