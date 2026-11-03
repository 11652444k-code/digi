# Vampire Survivors / サバイバーライクのコアメカニクス設計リファレンス

> **調査環境に関する重要な注記（レポート作成者向け）**
> - 本セッションのネットワーク制限により、Vampire Survivors Wiki（vampire-survivors.fandom.com / vampire.survivors.wiki）、Steam、Wikipedia、各ゲームメディアへの直接アクセス（WebFetch / curl）はすべて拒否された。Wiki由来の記述は **Web検索エンジンの結果要約（スニペット）経由** であり、ページ本文は未閲覧。該当箇所は「（検索要約）」と明記した。
> - 代わりに、GitHub上で公開されている **ゲーム本体のデータファイル抽出リポジトリ（v1.16.111、2026-10-16 抽出）** をクローンし、`PowerUp.json` / `Weapon.json` / `Stage.json` / `Enemy.json` / `Character.json` / `Item.json` / `Arcana.json` / `LimitBreak.json` / `HitVfx.json` / `Achievement.json` / ローカライズ文字列を直接解析した。これらは一次ソース（ゲームの実データ）であり、本ノートの数値の大半はここから取っている。
> - Web検索はセッション全体の予算上限に達したため、途中（開発者インタビュー本文・Survivor.io / Brotato / 20 Minutes Till Dawn の比較調査）で実行不能になった。これらは Gaps に明記した。
>
> **主要一次ソース**
> - ゲームデータ抽出リポジトリ: [SurvivatonsAndMore/VampireSurvivorsFiles](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles)（`Game Version.txt`: Vampire Survivors 1.16.111、2026-10-16 抽出。以下「VSデータ」）
>   - [Data/README.md（フィールド定義）](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/README.md)
>   - [PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json) / [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json) / [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json) / [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json) / [Character.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Character.json) / [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json) / [Arcana.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Arcana.json) / [LimitBreak.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/LimitBreak.json) / [HitVfx.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/HitVfx.json) / [Achievement.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Achievement.json) / [Translations/Generated/I2Languages.json（ゲーム内テキスト）](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
> - PowerUp価格計算機（価格式のリバースエンジニアリング）: [benediktwerner/vampire-survivors-power-up-calculator](https://github.com/benediktwerner/vampire-survivors-power-up-calculator)（2022-08、v0.11.107まで対応）, [jbchouinard/vspowerups](https://github.com/jbchouinard/vspowerups)（2022-02）
>
> **データ単位の読み方**（[Data/README.md](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/README.md) より）: 武器の `power` は「ダメージ = 値 × 10」、`interval`（クールダウン）/`duration`/`hitBoxDelay`/`repeatInterval` はミリ秒、`area`/`speed`/`cooldown`/`luck`/`growth`/`greed`/`curse`/`duration(キャラ側)` は百分率（1 = 100%）、`amount`/`penetrating`/`armor`/`revivals`/`rerolls`/`skips`/`banish` は整数、`regen` はHP/秒の実数、キャラの `maxHp` は実数（デフォルト100）。

---

## KQ1. コアループ：1ランの分単位の進行（30分タイマー、ウェーブ、Death、XPジェム、レベルアップ、チェスト、ピックアップ、マップイベント）、ペーシング曲線と「パワーファンタジー」の供給方法

### Takeaway
VSの1ランは「1分=1ウェーブ」のデータテーブルで完全に記述されており、各分は『維持すべき最低敵数（minimum）』『スポーン間隔（frequency, ms）』『敵種リスト』『ボス』『イベント（群れ）』『ボス撃破時の宝箱設定』を持つ。Mad Forestでは最低敵数が 15 → 30 → 50 → … → 300 と波打ちながら増え、5分ごとに中ボス、11分/21分にアルカナ箱、30:00 に実質無敵の Reaper（HP 655,350・速度は雑魚の約8.5倍）が出現して「ランの強制終了」を担う。パワーファンタジーは「レベルアップ（3択、Luckで4択）」「進化（宝箱で解放）」「Amount（弾数）の積み上げ」によって10〜15分頃に爆発的に立ち上がる設計になっている。

### Cited Findings

**時間制限とステージ基本パラメータ（VSデータ Stage.json）**
- 制限時間 `mods.TimeLimit`（秒）: Mad Forest / Inlaid Library / Dairy Plant / Gallo Tower / Cappella Magna = **1800（30分）**、Il Molise / Moongolow / Boss Rash = **900（15分）**、Whiteout / Lycaeum / The Coop / Space 54 / Laborratory / Westwoods / Bat Country / Astral Stair / Mazerella / Tiny Bridge = **1200（20分）**、Eudaimonia M. = 5940、Holy Forbidden = 120 — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- Mad Forest の `mods`: `PlayerPxSpeed 1.1, EnemySpeed 1.1, ProjectileSpeed 1, GoldMultiplier 1, EnemyHealthMultiplier 1, LuckBonus 0, XPBonus 1`、`startingSpawns 10`、0分目の `minimum 15, frequency 1000`、初期敵 `BAT3`。Inlaid Library は `PlayerPxSpeed/EnemySpeed 1.25`, `startingSpawns 50`, `spawnType HORIZONTAL`、Cappella Magna は 1.4、Gallo Tower は `VERTICAL`、Il Molise は `TILED` — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- Mad Forest のウェーブは Standard スポーンタイプで敵は四方向から来る（検索要約） — [Mad Forest – vampire.survivors.wiki](https://vampire.survivors.wiki/w/Mad_Forest)
- 敵は通常「1分ごとに1ウェーブ」で到来する（検索要約） — [Debuff resistance – Fandom wiki](https://vampire-survivors.fandom.com/wiki/Debuff_resistance)
- 各ウェーブは最低敵数とスポーン間隔を設定し、最低数に満たない間は敵をスポーンし続ける（検索要約） — [Enemies – Fandom wiki](https://vampire-survivors.fandom.com/wiki/Enemies)

**Mad Forest の分単位ウェーブテーブル（VSデータ Stage.json `FOREST`、全31エントリ。`treasure.chances` と `prizeTypes` は KQ4 参照）** — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)

| 分 | minimum | frequency(ms) | enemies | bosses | events / treasure |
|---|---|---|---|---|---|
| 0 | 15 | 1000 | BAT3 | – | startingSpawns 10 |
| 1 | 30 | 1000 | ZOMBIE, BAT1 | BAT4 (Pipistrello) | treasure chances [0,0,30], prizeTypes [EVOLUTION, EXISTING_ANY×4], fixedPrizes [AMOUNT] |
| 2 | 50 | 500 | BAT1, BAT2, BAT3 | – | BAT_SWARM delay 5000 repeat 2 |
| 3 | 40 | 250 | SKELETON | BAT4 | BAT_SWARM (chance 10); treasure [0,5,40] |
| 4 | 30 | 500 | SKELETON, GHOST | – | BAT_SWARM (chance 10) |
| 5 | 10 | 1000 | MUDMAN2 | XLMANTIS | FLOWER_WALL (chance 0, duration 30000); treasure [1,5,100] |
| 6 | 20 | 500 | ZOMBIE, MUDMAN2 | – | BAT_SWARM (chance 10) |
| 7 | 80 | 500 | BAT2, BAT3, MUDMAN1 | BAT4 | BAT_SWARM delay 5000 chance 80 repeat 5; treasure [3,10,50] level 2 |
| 8 | 100 | 1500 | ZOMBIE | XLBAT | BAT_SWARM delay 15000 chance 80 repeat 2 |
| 9 | 30 | 500 | XLBAT, ZOMBIE | BAT5 | BAT_SWARM; treasure [3,10,50] |
| 10 | 10 | 500 | MUDMAN1, MUDMAN2 | BOSS_XLMANTIS | FLOWER_WALL; treasure [3,10,100], prizeTypes [EVOLUTION, …] |
| 11 | **300** | **100** | SKELETON | – | arcanaHolder BAT4, arcanaTreasure [0,0,100] prizeTypes [EVO_ARCANA,…] |
| 12 | 20 | 250 | WEREWOLF, GHOST, SKELETON | BAT4 | treasure [1,5,50] |
| 13 | 150 | 500 | WEREWOLF, GHOST, GHOST | – | GHOST_SWARM ×2（delay 1200/2300, chance 70, repeat 20） |
| 14 | 20 | 100 | XLBAT, WEREWOLF | BAT5 | treasure [3,10,100] |
| 15 | 100 | 100 | WEREWOLF, XLBAT, MUDMAN2 | BOSS_WEREWOLF | FLOWER_WALL (chance 80); treasure [3,10,100] |
| 16 | 100 | 100 | XLMANTIS, MUDMAN1, MUDMAN2 | BAT4 | treasure [1,5,50] |
| 17 | 20 | 1000 | XLMUMMY | – | – |
| 18 | 60 | 500 | XLMUMMY, MUDMAN1 | BAT5 | treasure [3,10,100] |
| 19 | 100 | 500 | XLMUMMY, MUDMAN1 | – | – |
| 20 | 100 | 100 | XLMUMMY, MUDMAN2, XLBAT | BOSS_XLMUMMY | BAT_SWARM ×2 (repeat 20); treasure [3,10,100] |
| 21 | 300 | 100 | FLOWER | XLFLOWER | arcanaHolder BAT4, arcanaTreasure [0,0,100] |
| 22 | 200 | 100 | FLOWER, XLMUMMY | BAT4 | treasure [3,10,100] |
| 23 | 300 | 100 | FLOWER, XLMUMMY | BAT5 | treasure [3,10,100] |
| 24 | 300 | 100 | FLOWER, XLMUMMY | XLFLOWER | – |
| 25 | 100 | 100 | XLFLOWER | BOSS_XLFLOWER | FLOWER_WALL delay 10000 repeat 5 duration 10000; treasure [3,10,100] |
| 26 | 150 | 100 | XLFLOWER, FLOWER | – | – |
| 27 | 300 | 100 | XLMUMMY, MUDMAN1, MUDMAN2 | BAT4 | GHOST_SWARM ×2 (repeat 19); treasure [3,10,100] |
| 28 | 300 | 100 | XLBAT, BAT4 | – | – |
| 29 | 300 | 100 | BAT4, BAT5 | BAT4 | BAT_SWARM ×2 (repeat 19); treasure [3,10,100] |
| 30 | 1 | 10000 | （なし） | **BOSS_XLDEATH** | event **CYCLE_COMPLETE** |

**30:00 の Death（The Reaper）**（VSデータ Enemy.json `BOSS_XLDEATH`）: `level 100, maxHp 65535, speed 1200, power 65535, skills [HP_x_Level], res_Defang 1, res_Freeze 1, res_Rosary 1, res_Knockback 1, res_Debuffs 1, knockback -0.5, maxKnockback 0, xp 0, scale 1.5`、図鑑テキスト「Run from him. Defy him. Maybe even kill him, should you prove so arrogant. No matter the outcome, Lord Death always wins in the end.」。比較: 雑魚のBAT1は `maxHp 0.1, speed 140, power 5, xp 1` — [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json)
- Endless モードは「全てのReaperを無効化して無限に戦う」ことを恒久的に可能にするレリック Seventh Trumpet で解放される（Item.json `RELIC_TRUMPET`: "Permanently allows to disable all reapers and fight endlessly."） — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)

**XPジェムとレベルアップ**
- Experience Gem（Item.json `GEM`）: "Increases experience."、`value 50`（ジェム1個のデフォルト値ではなく内部値。意味は要検証） — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)
- 青ジェムは最大2XP、緑ジェムは最大9XP、赤ジェムはそれ以上（検索要約） — [Experience Gem – Fandom wiki](https://vampire-survivors.fandom.com/wiki/Experience_Gem)
- 敵ごとの `xp` 値（Enemy.json）: BAT1/2/3 = 1, ZOMBIE = 1, GHOST = 1.5, SKELETON = 2, MUDMAN1/2 = 2.5, XLBAT = 2.5, WEREWOLF = 2, XLMANTIS/XLMUMMY/XLFLOWER = 3, ボスBAT4/BAT5 = 30, BOSS_XLMANTIS = 50, BOSS_WEREWOLF = 30, BOSS_XLMUMMY = 25, BOSS_XLFLOWER = 50 — [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json)
- レベルアップ画面のフッター文言（ゲーム内テキスト `lang/levelup_footer`）: **"Increase your Luck for a chance to get 4 choices."**（通常3択、Luckで4択の可能性） — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- レベルアップ説明テンプレート（同）: "Base Damage up by %0."、"Base Area up by %0%."、"Fires %0 more projectile(s)."、"Passes through %0 more enemy/enemies."、"Cooldown reduced by %0 seconds."、"Effect lasts %0 seconds longer."、"Gains %0 additional charge(s)."、"Shield invulnerability increased by %0 seconds." — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- Skip の定義（PowerUp.json `SKIP`）: "Twice per rank, allows you to skip level up choices and get Experience instead." — [PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json)

**ピックアップ（床アイテム）一覧**（VSデータ Item.json。`rarity` はドロップ重み、`unlocksAt` は出現条件値（推定: 経過分）、"Drop rate affected by Luck" はゲーム内tips原文） — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)

| ID | 名称 | 効果（原文） | rarity | unlocksAt | Luck影響 |
|---|---|---|---|---|---|
| COIN | Gold Coin | +1 gold, feverMS 500 | 50 | 0 | – |
| COINBAG1 | Coin Bag | +10 gold, feverMS 5000 | 10 | 0 | – |
| COINBAGMAX | Rich Coin Bag | +100 gold | 1 | 5 | あり |
| ROAST | Floor Chicken | "Restores 30 Health points." | 12 | 0 | あり |
| OROLOGION | Orologion | "Freezes all enemies in time for 10 seconds." | 2 | 4 | あり |
| VACUUM | Vacuum | "Gathers all Experience gems left on the ground." | 2 | 12 | あり |
| ROSARY | Rosary | "Destroys all enemies in sight." | 1 | 8 | あり |
| NFT | Nduja Fritta | "Temporarily emits cones of flames. Affected by player stats." | 1 | 0 | あり |
| CLOVER | Little Clover | "Pick up to get 10% luckier." (value 0.1) | 0.5 | 0 | – |
| GILDED | Gilded Clover | "Gathers all Gold left on the ground and starts a Gold Fever." | 1 | 30 | – |
| GOLDFINGER | Gold Finger | 一時無敵+Charm+最小Cooldown、撃破数で賞品 | 0.02 | 30 | – |
| PICKUP_REROLL_DICE | Rerollo | "+1 Reroll" | 1 | 0 | – |
| TREASURE | Treasure Chest | "Awards coins and Power ups. Dropped by strong enemies." tips "Quality affected by Luck." | – | – | あり |

**光源（ブレイザー等の破壊可能オブジェクト）**: Mad Forest は `destructibleType BRAZIER, destructibleFreq 1000, destructibleChance 10, destructibleChanceMax 50, maxDestructibles 10`、Inlaid Library は `CANDELABRA, chance 7.5` — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)。Props.json では BRAZIER/CANDELABRA/LAMPOST/CANDLE/LANTERN は `maxHp 1`、CART は 4、WINDOW は 5 — [Props.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Props.json)

**宝箱の出現タイミング**: Mad Forest では `treasure` 定義のある分（1,3,5,7,9,10,12,14,15,16,18,20,22,23,25,27,29）はすべて `bosses` が設定された分と一致し、`prizeTypes` の先頭は10分以降「EVOLUTION」になる（5〜9分は EXISTING_WEAPON）。11分・21分は `arcanaHolder BAT4` + `prizeTypes [EVO_ARCANA, …]` のアルカナ宝箱 — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)

### Inferences
- **ペーシング曲線**は「密度（minimum）」と「流速（frequency）」の2軸で設計されている。minimum は 15→30→50 と上がった後 5分目で 10 に落ち（中ボス戦の間の静けさ）、7〜8分で 80〜100、11分で 300（スケルトンの壁）、以後は 20〜300 を交互に振る「緩急」のパターン。frequency は 1000ms → 500 → 250 → 100ms と後半ほど高速になる。つまり「静かな1分 → 群れの1分」の交互配置で、プレイヤーが『強くなった実感』を得る瞬間（弱い敵の大群を掃討）と『危機』の瞬間（高HP敵の壁）を意図的に交互に作っている。
- 5分刻みの中ボス（5: Mantichana、10: BOSS Mantichana、15: Werewolf、20: Big Mummy、25: Venus、30: Death）と、それ以外の分の「Pipistrello（BAT4/BAT5）型ボス」= 宝箱運搬役という2層構造。宝箱の `prizeTypes` が10分で EVOLUTION に切り替わる＝「進化が狙えるのは10分以降」というパワーファンタジーの解放タイミングをデータで固定している。
- `startingSpawns 10` と `minimum 15`（0分）から、開始直後は「敵が少なく、必ず勝てる」安全圏を保証している。
- 30:00 の Reaper は `power 65535`（ダメージ換算 655,350）・`speed 1200`・全デバフ耐性で「倒す対象ではなく、ランのタイマー」として機能している。Endless モード（Seventh Trumpet）が「Reaper無効化」として定義されていることから、設計上 Reaper＝終了装置である。

### Gaps
- `treasure.chances [a,b,c]` の厳密な意味（KQ4 で推定を述べる）、`level: 2` の意味、1分目の `fixedPrizes: ["AMOUNT"]` の挙動は未検証。
- XPジェムの合流（gem merging/cap）の具体的仕様、ジェムの最大数、Vacuum の挙動の詳細は Wiki 本文を閲覧できず未確認。
- 「マップイベント」（BAT_SWARM / GHOST_SWARM / FLOWER_WALL / MEDUSA_WALL / SHADE_BOMB_RED / SKULL_SWARM）の具体的な動き（どの方向から何体・どの速度で横切るか）はコード側で定義されておりデータには無い。

---

## KQ2. 武器システム：基本武器・パッシブとそのステータス、レベルアップ表、進化レシピ、Union、Arcana、スロット数、プール/Banish/Reroll/Skip

### Takeaway
武器は最大8レベル（進化は1レベル、Unionは8レベル）で、各レベルの上昇値はデータテーブルで固定されている（例: Whip は L2 で +1 Amount、以後 +0.5 power（=+5ダメージ）ずつ）。進化は「武器を最大レベル（L8）にし、対応パッシブを所持した状態で宝箱を開ける」で、進化後は L1 の固定ステータス（例: Bloody Tear = power 4, amount 2, area 1.3, crit 10%×2）になる。レベルアップ候補の抽選は武器ごとの `rarity` 重み（100/80/70/60/50/40/30/20/1）で行われ、Reroll/Skip/Banish（各2回/ランク）とRecycle（10%/ランクで消費を免除）で選択の「運」を制御できる。

### Cited Findings

**フィールドの意味**（[Data/README.md](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/README.md)）: `power`（ダメージ=値×10）, `interval`（クールダウンms）, `area`（%）, `speed`（%）, `amount`（弾数）, `duration`（ms）, `penetrating`（貫通数）, `knockback`, `hitBoxDelay`（ms）, `repeatInterval`（連続弾の間隔ms）, `chance`（%）, `critChance`/`critMul`, `charges`, `bounces`, `hitsWalls`。`evoSynergy`=進化に必要な相方、`evoInto`=進化先、`requires`/`requiresMax`=進化武器側の要求、`rarity`=出現重み、`price`=商人価格、`isSpecialOnly`=レベルアップに出ない（ステージ固定アイテム）。

**基本武器 L1 ステータスとレベルアップ表**（VSデータ Weapon.json。`ignores/best with` はゲーム内 tips 原文） — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)

| 武器 | L1 (power/interval/area/speed/amount/duration/pierce/他) | L2〜L8 の上昇 | rarity | 進化（相方） | tips |
|---|---|---|---|---|---|
| Whip | 1 / 1350 / 1 / 1 / 1 / – / – / crit 20%×2 | L2 +1 amount; L3 +0.5 pow; L4 +0.5 pow +0.1 area; L5 +0.5; L6 +0.5 +0.1 area; L7 +0.5; L8 +0.5 | 100 | Bloody Tear（Hollow Heart） | Ignores: Speed, Duration |
| Magic Wand | 1 / 1200 / 1 / 1 / 1 / – / 1 | L2 +1 amt; L3 −200ms; L4 +1 amt; L5 +1 pow; L6 +1 amt; L7 +1 pierce; L8 +1 pow | 100 | Holy Wand（Empty Tome） | Ignores: Duration |
| Knife | 0.65 / 1000 / 1 / 1 / 1 / – / 1 / kb 0.5, crit 30%×3 | L2 +1 amt; L3 +1 amt +0.5 pow; L4 +1 amt −20 repeat; L5 +1 pierce; L6 +1 amt −20; L7 +1 amt +0.5 pow; L8 +1 pierce −20 | 100 | Thousand Edge（Bracer） | Ignores: Duration |
| Axe | 2 / 4000 / 1 / 1 / 1 / 2000 / 3 / crit 30%×2 | L2 +1 amt; L3 +2 pow; L4 +2 pierce; L5 +1 amt; L6 +2 pow; L7 +2 pierce; L8 +2 pow | 100 | Death Spiral（Candelabrador） | "High damage, high Area scaling." |
| Santa Water | 1 / 4500 / 1 / 1 / 1 / 2000 / – / hitBoxDelay 500 | L2 +1 amt +0.2 area; L3 +1 pow +500 dur; L4 +1 amt +0.2 area; L5 +1 pow +250; L6 +1 amt +0.2; L7 +0.5 pow +250; L8 +0.5 pow +0.2 area | 100 | La Borra（Attractorb） | Ignores: Speed |
| Cross | 0.5 / 2000 / 1 / 1 / 1 / – / – | L2 +1 pow; L3 +0.25 spd +0.1 area; L4 +1 amt; L5 +1 pow; L6 +0.25 spd +0.1 area; L7 +1 amt; L8 +1 pow | 80 | Heaven Sword（Clover） | boomerang |
| King Bible | 1 / 3000 / 1 / 1 / 1 / 3000 / – / hitBoxDelay 1700 | L2 +1 amt; L3 +0.3 spd +0.25 area; L4 +500 dur +1 pow; L5 +1 amt; L6 +0.3 +0.25; L7 +500 +1 pow; L8 +1 amt | 80 | Unholy Vespers（Spellbinder） | Best with: Speed, Duration, Area |
| Fire Wand | 2 / 3000 / 1 / 0.75 / 3 / 100 / – | L2 +1 pow; L3 +1 pow +0.2 spd; L4 +1; L5 +1 +0.2; L6 +1; L7 +1 +0.2; L8 +1 | 80 | Hellfire（Spinach） | Ignores: Duration |
| Runetracer | 1 / 3000 / 1 / 1 / 1 / 2250 / – | L2 +0.5 pow +0.2 spd; L3 +0.5 pow +250 dur; L4 +1 amt; L5 +0.5 +0.2; L6 +0.5 +250; L7 +1 amt; L8 +500 dur | 80 | NO FUTURE（Armor） | Best with: Speed, Duration |
| Lightning Ring | 1.5 / 4500 / 1 / 1 / 2 / – / – | L2 +1 amt; L3 +1 area +1 pow; L4 +1 amt; L5 +1 area +2 pow; L6 +1 amt; L7 +1 area +2 pow; L8 +1 amt | 80 | Thunder Loop（Duplicator） | Ignores: Speed, Duration |
| Garlic | 0.5 / 1300 / 1 / 1 / 1 / 1300 / – / kb 0 | L2 +0.4 area +0.2 pow; L3 −100ms +0.1; L4 +0.2 area +0.1; L5 −100 +0.2; L6 +0.2 +0.1; L7 −100 +0.1; L8 +0.2 +0.2 | 70 | Soul Eater（Pummarola） | Ignores: Amount, Duration, Speed |
| Clock Lancet | 0 / 2000 / 1 / 1 / 1 / 2000 / – | L2 +1000 dur; L3 −500ms; L4 +1000; L5 +1000; L6 −500; L7 +1000（7レベル） | 70 | Infinite Corridor（Silver Ring + Gold Ring） | Ignores: Might, Speed, Amount, Area |
| Pentagram | 0 / 90000 / 1 / 1 / 1 / 1000 / – / chance 0.1 | L2 −10000; L3 chance +0.15; L4 −10000; L5 +0.2; L6 −5000; L7 +0.2; L8 −5000 | 60 | Gorgeous Moon（Crown） | Best with: Cooldown and Luck only |
| Laurel | 1 / 10000 / – / – / 1 / 5000 / charges 1 | L2,3,5,6 −500ms +200 shieldInvulTime; L4, L7 +1 charge（7レベル） | 60 | Crimson Shroud（Metaglio Left + Right） | Best with: Cooldown only |
| Song of Mana | 1 / 2000 / 1 / 1 / 1 / 500 / – / hitBoxDelay 1000 | L2 +1 area; L3 +750 interval +500 dur; L4 +1 pow +0.25 area; L5, L7 同 L3; L6, L8 同 L4 | 50 | Mannajja（Skull O'Maniac） | Ignores: Amount, Speed |
| Peachone / Ebony Wings | 1 / 1000 / 1 / 0.8 / 4 / 4000 / – / kb 2 | L2 +1 amt +0.4 area; L3 +1 amt +1 pow; L4 +1 amt −250ms; L5〜L8 繰り返し | 50 | Vandalier（Union: 両方L8） | Best with: Cooldown, Duration |
| Phiera Der Tuphello / Eight The Sparrow | 0.5 / 1400 / 1 / 1 / 1 / – / 1 / crit 10%×2 | L2 +1 amt; L3 +2 pierce; L4 +1 amt; L5 +0.5 pow; L6 +2 pierce; L7 +0.5 spd +0.5 pow; L8 +2 pierce | 50 | Phieraggi（Union + Tiragisú） | 四方向固定射撃 |
| Gatti Amari | 1 / 5000 / 1 / 0.4 / 1 / 5000 / – / chance 0.1 | L2 +0.2 spd; L3 +1500 dur; L4 +0.2; L5 +1 amt; L6 +1500; L7 +0.2; L8 +1 amt | 50 | Vicious Hunger（Stone Mask） | Best with: Luck, Floor Chicken |
| Shadow Pinion | 1 / 6000 / 1 / 1 / 1 / 1000 / – / hitBoxDelay 2000 | L2 +1 amt; L3 +0.5 pow; L4 +250 dur; … | 50 | Valkyrie Turner（Wings） | Best with: Move Speed |
| Vento Sacro | 0.2 / 2000 / 1.4 / 1 / 4 / 400 / – / crit 5%×2 | L2 +0.1 pow; L3 +0.2 area +1 amt; 以後交互 | 50 | Fuwalafuwaloo（Union: Bloody Tear） | Best with: Luck, Move Speed |
| Bracelet | 1 / 1400 / 0.9 / 1.5 / 3 / 400 / 1 | L2 +1 pow; L3 +1 pierce; L4 +1 amt +0.1 area; L5 +1 pierce; L6 +1 pow（6レベル） | 40 | Bi-Bracelet → Tri-Bracelet | – |
| Bone / Cherry Bomb / La Robba / Celestial Dusting / Carréllo | （キャラ専用、rarity 1） | – | 1 | – | – |

**進化武器のステータス（L1固定）**（VSデータ Weapon.json） — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)

| 進化武器 | 元 | 必要パッシブ（`requires`） | L1ステータス | 説明原文 |
|---|---|---|---|---|
| Bloody Tear | Whip | MAXHEALTH (Hollow Heart) | power 4, interval 1350, area 1.3, amount 2, crit 10%×2 | "Can deal critical damage and absorb HP." |
| Holy Wand | Magic Wand | COOLDOWN (Empty Tome) | power 3, interval 500, speed 2, amount 4, pierce 2 | "Fires with no delay." |
| Thousand Edge | Knife | SPEED (Bracer) | power 1.65, interval 350, speed 1.5, amount 6, pierce 3, crit 30%×3 | "Fires with no delay." |
| Death Spiral | Axe | AREA (Candelabrador) | power 6, interval 4000, area 1.2, speed 0.8, amount 9, pierce 1000 | "Passes through enemies." |
| Heaven Sword | Cross | LUCK (Clover) | power 7.7, interval 3300, area 1.2, speed 2, knockback 6, crit 10%×2.5 | "Can deal critical damage." |
| Unholy Vespers | King Bible | DURATION (Spellbinder) | power 3, area 1.75, speed 1.5, amount 4, knockback 4 | "Never ends." |
| Hellfire | Fire Wand | POWER (Spinach) | power 10, interval 3000, amount 2 | "Passes through enemies." |
| Soul Eater | Garlic | REGEN (Pummarola) | power 2, interval 1000, area 3 | "Steals hearts. Power increases when recovering HP." |
| La Borra | Santa Water | MAGNET (Attractorb) | power 4, interval 4000, area 2, amount 4, duration 4000 | "Damaging zones follow you and grow when they move." |
| NO FUTURE | Runetracer | ARMOR | power 3, interval 1000, speed 2.8, duration 3000 | "Explodes when bouncing and in retaliation." |
| Thunder Loop | Lightning Ring | AMOUNT (Duplicator) | power 6.5, interval 4500, area 4, amount 6 | "Projectiles strike twice." |
| Gorgeous Moon | Pentagram | GROWTH (Crown) | interval 60000, chance 1 | "Generates extra gems and gathers all of them." |
| Mannajja | Song of Mana | CURSE (Skull O'Maniac) | power 4, interval 4500, area 6, duration 2000 | "Might slow enemies down." |
| Vicious Hunger | Gatti Amari | GREED (Stone Mask) | power 3, interval 8000, amount 2, duration 7000 | "Might turn anything into gold." |
| Valkyrie Turner | Shadow Pinion | MOVESPEED (Wings) | power 3.5, interval 6000, area 1.4, speed 3.5, duration 2000 | "Bigger, longer, faster, stronger." |
| Vandalier（Union） | Peachone + Ebony Wings | `requiresMax [SILF]`（Ebony Wings L8 の `addEvolvedWeapon`） | power 2.8, interval 1000, area 2.2, amount 20, duration 4000、以後 L2〜L8 で +0.2 area / −250ms 交互 | "Union of Ebony Wings and Peachone." |
| Phieraggi（Union） | Phiera + Eight | `requires [REVIVAL]`, `requiresMax [GUNS]` | power 1.5, interval 1400, amount 4, pierce 7, crit 10%×2 | "Scales with Revivals." |
| Fuwalafuwaloo（Union） | Vento Sacro + Bloody Tear | `requires/requiresMax [VAMPIRICA]` | power 2, area 2, amount 8, crit 5%×2 | "Critical hits might generate explosions." |
| Infinite Corridor | Clock Lancet | `requires/requiresMax [SILVER, GOLD]` | interval 1000, duration 6000 | "Halves enemies' health." |
| Crimson Shroud | Laurel | `requires/requiresMax [LEFT, RIGHT]`（Metaglio） | interval 8000, area 2, knockback 20, charges 3 | "Caps incoming Damage at 10. Retaliates when losing charges." |

**パッシブアイテム（ラン内）のレベルごとの効果**（VSデータ Weapon.json、`isPowerUp: true`） — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)

| パッシブ | 効果/レベル | 最大Lv | rarity | 進化相方 |
|---|---|---|---|---|
| Spinach | +10% power | 5 | 100 | Fire Wand |
| Armor | +1 armor（"Increases retaliatory Damage by 10%"） | 5 | 100 | Runetracer |
| Hollow Heart | +20% maxHp | 5 | 90 | Whip |
| Pummarola | +0.2 HP/s regen | 5 | 90 | Garlic |
| Empty Tome | −8% cooldown | 5 | 50 | Magic Wand |
| Candelabrador | +10% area | 5 | 100 | Axe |
| Bracer | +10% projectile speed | 5 | 100 | Knife |
| Spellbinder | +10% duration | 5 | 100 | King Bible |
| Duplicator | +1 amount | **2** | 50 | Lightning Ring |
| Wings | +10% move speed | 5 | 50 | Shadow Pinion |
| Attractorb | magnet +33% / +25% / +20% / +33%（乗算、README） | 5 | 100 | Santa Water |
| Clover | +10% luck | 5 | 100 | Cross |
| Crown | +8% growth | 5 | 70 | Pentagram |
| Stone Mask | +10% greed | 5 | 70 | Gatti Amari |
| Skull O'Maniac | +10% curse | 5 | 40 | Song of Mana |
| Tiragisú | +1 revival | **2** | 40 | Phiera/Eight |
| Torrona's Box | 9レベル（"Cursed item, but increases Might, Projectile Speed, Duration, and Area by %0%"） | 9 | 40 | Victory Sword / Flames of Misspell |
| Silver Ring / Gold Ring（ステージ固定, `isSpecialOnly`） | +5% duration +5% area / +5% curse ×8 | 9 | 10 | Clock Lancet |
| Metaglio Left / Right（同） | +0.1 regen +5% maxHp / +5% curse ×8 | 9 | 10 | Laurel |

**レベルアップ候補プールの重み（`rarity`）**: 武器 100 = Whip, Magic Wand, Knife, Axe, Santa Water; 80 = Cross, King Bible, Fire Wand, Runetracer, Lightning Ring; 70 = Garlic, Clock Lancet; 60 = Pentagram, Laurel; 50 = Peachone, Ebony Wings, Phiera, Eight, Gatti Amari, Song of Mana, Shadow Pinion, Vento Sacro; 40 = Bracelet; 30 = Victory Sword, Flames of Misspell; 20 = Greatest Jubilee; 2 = Candybox（"Occurrence in level up options affected by Luck"）; 1 = Bone, Cherry Bomb, La Robba, Celestial Dusting, Carréllo。パッシブ 100 = Spinach, Armor, Candelabrador, Bracer, Spellbinder, Attractorb, Clover; 90 = Hollow Heart, Pummarola; 70 = Crown, Stone Mask; 50 = Empty Tome, Duplicator, Wings; 40 = Skull O'Maniac, Tiragisú, Torrona's Box — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)
- Candybox: "Allows you to choose any unlocked base weapon."（`interval` が極大の擬似武器として実装） — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)

**Reroll / Skip / Banish / Recycle / Seal の定義**（VSデータ PowerUp.json 原文） — [PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json)
- Reroll: "Twice per rank, allows you to get different choices when leveling up."（price 500, `rerolls 2`）
- Skip: "Twice per rank, allows you to skip level up choices and get Experience instead."（price 100, `skips 2`）
- Banish: "Twice per rank, allows you to remove an item from level up choices, for the rest of the run."（price 100, `banish 2`）
- Recycle: "Reroll, Skip and Banish actions have a 10% chance to be preserved per rank (max 50%)."（price 500, 5ランク）
- Seal I〜IV: "Allows to Banish an item from level up choices, or a pickup from light sources. Use in COLLECTION menu."（2000/4000/6000/8000, 各10ランク）
- Arcana XX "Silent Old Sanctuary": "Gives +3 Reroll, Skip, and Banish. Gives +20% Might and -8% Cooldown for each active weapon slot left empty." — [Arcana.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Arcana.json)
- レリック Mindbender: "Permanently allows to change character appearance (where applicable) and maximum weapon loadout." — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)
- 武器のクールダウン系レベルアップは1段階あたり 0.25 秒減少、説明文は小数1桁に丸められる。Vandalier の Area レベルは基本 +20%（検索要約） — [Vandalier – Fandom wiki](https://vampire-survivors.fandom.com/wiki/Vandalier)

**Arcana（22枚 + Darkana）**（VSデータ Arcana.json。原文抜粋） — [Arcana.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Arcana.json)
- 0 Game Killer: "Halts XP gain. Experience Gems turn into exploding projectiles. All Treasure Chests contain at least 3 items."
- I Gemini: "Listed weapons come with a counterpart." / II Twilight Requiem: 弾消滅時に爆発（Curse依存） / III Tragic Princess: 移動中にクールダウン短縮 / IV Awake: "+3 Revivals…" / V Chaos in the Dark Night: 弾速が10秒周期で −50%〜+50% / VI Sarabande of Healing: 回復2倍、回復量分のダメージ / VII Iron Blue Will: 3バウンド+貫通 / VIII Mad Groove: 2分ごとに全ステージアイテムを引き寄せ / IX Divine Bloodline: Armorが武器ダメージに影響 / X Beginning: "+1 Amount（主武器は+3）" / XI Waltz of Pearls: 3バウンド / XII Out of Bounds: 凍結で爆発 / XIII Wicked Season: Growth/Luck/Greed/Curse が周期的に2倍 / XIV Jail of Crystal: 凍結確率 / XV Disco of Gold: Gold Fever + 金額分回復 / XVI Slash: クリティカル有効化、クリダメ2倍 / XVII Lost & Found Painting: Duration周期変動 / XVIII Boogaloo of Illusions: Area周期変動 / XIX Heart of Fire: 着弾爆発 / XX Silent Old Sanctuary（上記） / XXI Blood Astronomia: Magnet範囲内の敵に Amount 依存ダメージ
- Darkana例: "Stake to your Heart: Halts XP gain. Enemies drop Gold Coins. Damage is dealt to Gold Coins instead of HP."、"X - Hail from the Future: Receive an item when levelling up."、"VI - Moonlight Bolero: An extra treasure boss spawns every minute."
- Randomazzo（レリック）: "Enables the unlocking and activation of Arcanas." — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)

**Limit Break**（VSデータ LimitBreak.json。武器ごとに「超過レベルで抽選されるボーナス」と重み・上限）: 例 Whip = {+5% power（rarity 10, 上限なし）, +2.5% area（rarity 10, max 10）, +1 amount（rarity 1, max 20）}; Magic Wand = 上記 + {+5% speed（max 3）, +1 pierce（rarity 5, max 10）}; Heaven Sword = +10% power, +2.5% crit（max 1）等 — [LimitBreak.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/LimitBreak.json)。解放レリック Great Gospel: "Permanently allows to level up weapons beyond their limit. Can be enabled in Stage Selection." — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)

### Inferences
- **L8到達時の典型値（データから算出）**: Whip L8 = power 4（40ダメージ）/ amount 2 / area 1.2 → Bloody Tear（power 4, amount 2, area 1.3, crit+吸血）は「進化＝横ばいの数値＋新効果」。Magic Wand L8 = amount 4, interval 1000, power 3, pierce 2 → Holy Wand は interval 500（2倍の発射頻度）＋speed 2。Axe L8 = power 8 / amount 3 / pierce 7 → Death Spiral = power 6 / amount 9 / 貫通1000。進化の価値は「数値の跳ね上がり」ではなく「クールダウン半減」「無限貫通」「永続」といった**挙動の質的転換**で作られている。
- 「進化 = 武器L8 + パッシブ所持（レベル不問、`requires` のみ）+ 宝箱」であり、Union（Vandalier/Phieraggi/Fuwalafuwaloo/Infinite Corridor/Crimson Shroud）だけが `requiresMax` で相方の最大レベルを要求する。
- Duplicator と Tiragisú だけ最大2レベル（`amount` と `revival` は1単位が強力すぎるため）。Amount が最強スタットであることは PowerUp 側の価格（Amount 5000 gold で1ランクのみ）からも裏付けられる。
- `rarity` の重み付けは「序盤に必ず出会わせたい素直な武器（Whip/Wand/Knife/Axe/Santa Water = 100）」と「癖の強い武器（Pentagram 60, Laurel 60, Song of Mana 50）」を分けており、新規プレイヤーの体験を暗黙に誘導している。

### Gaps
- **武器6枠・パッシブ6枠**という上限値を直接記述する一次ソースは、データファイル内に見つからなかった（Mindbender の説明に「maximum weapon loadout を変更できる」とあるのみ）。Wiki本文も未閲覧。既知の通説ではあるが本セッションでは出典を確保できなかった。
- レベルアップ候補の抽選アルゴリズム（既所持アイテムが優先されるか、武器/パッシブの混合比、空き枠が無いときの挙動、`rarity` の具体的な正規化方法）はコード側にあり未確認。
- 4択になる確率の Luck 依存式は未確認（ゲーム内文言「Increase your Luck for a chance to get 4 choices.」のみ）。

---

## KQ3. キャラクターステータスの式：各スタットの数値効果、PowerUp ショップの価格と返金、XPカーブ、Luck

### Takeaway
キャラの基礎値は maxHp 100 / armor 0 / regen 0 / 各倍率 1.0 / amount 0 / magnet 0 が標準（Antonio は maxHp 120, armor 1）。メタショップ PowerUp は Might +5%×5 (200g)、Armor +1×3 (600g)、Max Health +10%×3 (200g)、Recovery +0.1×5 (200g)、Cooldown −2.5%×2 (900g)、Area +5%×2 (300g)、Speed +10%×2 (300g)、Duration +15%×2 (300g)、Amount +1 (5000g)、Move Speed +5%×2 (300g)、Magnet +25%×2 (300g)、Luck +10%×3 (600g)、Growth +3%×5 (900g)、Greed +10%×5 (200g)、Curse +10%×5 (1666g)、Revival ×1 (10000g) で、価格は「購入済みランク総数」に応じて上昇する（2022年時点の解析では旧式: +10%/ランク、新式: `floor(20×1.1^N)` の加算）。レベル20と40では Growth が +100% になる（データ上は該当レベルのみ）。XPカーブの厳密式はこのセッションでは出典を得られなかった。

### Cited Findings

**キャラクター基礎値**（VSデータ Character.json、70エントリ） — [Character.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Character.json)
- 標準テンプレート（Imelda 等）: `maxHp 100, cooldown 1, armor 0, regen 0, moveSpeed 1, power 1, area 1, speed 1, duration 1, amount 0, luck 1, growth 1, greed 1, curse 1, magnet 0, revivals 0, rerolls 0, skips 0, banish 0`
- Antonio: `maxHp 120, armor 1`, "Gains 10% more Damage every 10 levels (max +50%)."（level 10/20/30/40/50 で `power +0.1`）、price 0、初期武器 Whip
- Imelda: "Gains 10% more Experience every 5 levels (max +30%)."（price 10, Magic Wand）/ Pasqualina: speed 1.1, +10% speed every 5 levels (price 100, Runetracer) / Gennaro: maxHp 120, `amount 1` 恒久 (price 500, Knife) / Porta: `area 1.3`, `cooldown 0.1` から L2〜4 で +0.3 ずつ戻る（"Starts with temporary cooldown bonus"）/ Lama: maxHp 110, moveSpeed/power/curse 1.1, +5%ずつ every 10 levels / Dommario: speed 1.4, duration 1.4, moveSpeed 0.6 / Pugnala: moveSpeed 1.2, `onEveryLevelUp {power: 0.01}` / Giovanna: `onEveryLevelUp {speed: 0.01}` / Poppea: `{duration: 0.01}` / Concetta: `{area: 0.01}`, curse 1.1 / Mortaccio・Yatta Cavallo: +1 amount every 20 levels (max +3) / Exdash: maxHp 77, luck 2, 他0.9、price 777 / Smith IV: maxHp 7, price 7777, 毎レベル微増 / Peppino: moveSpeed 0, armor 2, area 0.4 から段階回復 / Avatar Infernas: power 1.5, luck 1.5, revivals 1, rerolls 10
- **全キャラ共通で `{"level": 20, "growth": 1}, {"level": 40, "growth": 1}, {"level": 21, "growth": -1}, {"level": 41, "growth": -1}`** が定義されている（レベル20と40の間だけ Growth +100%）
- Wiki（検索要約）: ゲームはレベルごとの必要経験値の増分を上げることでレベルアップを難しくし、その相殺としてレベル20と40で +100% Growth を与える — [Growth – vampire.survivors.wiki](https://vampire.survivors.wiki/w/Growth)
- Wiki（検索要約）: 連続するレベルアップは前より多くの経験値を要求する — [Experience Gem – Fandom wiki](https://vampire-survivors.fandom.com/wiki/Experience_Gem)
- itch.io 上のコメント（二次・未検証）: XPカーブは二次関数で「必要XP = 8n²（n=レベル）」と主張 — [itch.io post](https://itch.io/post/10422513)

**PowerUp ショップ（メタ）一覧**（VSデータ PowerUp.json v1.16.111。価格は基礎価格、ランク数は `unlockedRank`） — [PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json)

| PowerUp | 効果（原文） | 基礎価格 | ランク | 1ランクの内部値 |
|---|---|---|---|---|
| Might | "Raises inflicted Damage by 5% per rank (max +25%)." | 200 | 5 | power 0.05 |
| Armor | "Reduces incoming Damage by 1 per rank (max -3)." | 600 | 3 | armor 1 |
| Max Health | "Augments Max Health by 10% per rank (max +30%)." | 200 | 3 | maxHp 0.1（乗算） |
| Recovery | "Recovers 0.1 HP per rank (max 0.5) per second." | 200 | 5 | regen 0.1 |
| Cooldown | "Uses weapons 2.5% faster per rank (max 5%)." | 900 | 2 | cooldown −0.025 |
| Area | "Augments area of attacks by 5% per rank (max +10%)." | 300 | 2 | area 0.05 |
| Speed | "Projectiles move 10% faster per rank (max 20%)." | 300 | 2 | speed 0.1 |
| Duration | "Effects from weapons last 15% longer per rank (max +30%)." | 300 | 2 | duration 0.15 |
| Amount | "Fires 1 more projectile (all weapons)." | 5000 | 1 | amount 1 |
| Move Speed | "Character moves 5% faster per rank (max 10%)." | 300 | 2 | moveSpeed 0.05 |
| Magnet | "Items Pickup range +25% per rank (max +50%)." | 300 | 2 | magnet 0.25 |
| Luck | "Chance to get lucky goes up by 10% per rank (max +30%)." | 600 | 3 | luck 0.1 |
| Growth | "Gains 3% more experience per rank (max 15%)." | 900 | 5 | growth 0.03 |
| Greed | "Gains 10% more Gold per rank (max +50%)." | 200 | 5 | greed 0.1 |
| Curse | "Increases enemy speed, health, quantity, and frequency by 10% per rank (max +50%)." | 1666 | 5 | curse 0.1 |
| Revival | "Revives once with 50% health." | 10000 | 1 | revivals 1 |
| Omni (PANDORA) | "Increases Might, Projectile Speed, Duration, and Area by 2% per rank (max +10%)." | 1000 | 5 | 各 0.02 |
| Charm | "Increases enemies spawn quantity by 20 per rank (max +100)."（要レリック Apoplexy） | 10000 | 5 | charm 20 |
| Defang | "Enemies spawn unable to deal damage 3% of the times per rank (max 15%)."（要レリック Antidote） | 10 | 5 | defang 0.03 |
| Reroll / Skip / Banish | 上記 KQ2（各2回/ランク） | 500 / 100 / 100 | （unlockedRank 0: 実績で拡張） | – |
| Recycle | "…10% chance to be preserved per rank (max 50%)."（要レリック Wax Fetish） | 500 | 5 | recycle 0.1 |
| Seal I〜IV | Collection で候補からBanish | 2000/4000/6000/8000 | 各10 | – |
- ゲーム内UIに「Refund PowerUps」（`lang/powerup_refund`）が存在する — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- Might +5%/ランク（max +25%）, Armor 600g ×3 — [PowerUp – Fandom wiki (oldid 2256)](https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=2256)（検索要約）

**価格上昇式（計算機リポジトリのリバースエンジニアリング、2022年時点）** — [benediktwerner/vampire-survivors-power-up-calculator script.js](https://github.com/benediktwerner/vampire-survivors-power-up-calculator/blob/master/script.js)
- 旧式（v0.4.2〜v0.6.103）: "Cost increases by 10% for every upgrade level bought"。コード: `total += i * cost * multiplier` で `multiplier` は 10 から開始し購入ランクごとに +1、最後に /10 → **ランク i の価格 = i × 基礎価格 × (10 + N) / 10**（N = それまでに購入した全PowerUpのランク総数）。同じ式は [jbchouinard/vspowerups vsoptimizer.py](https://github.com/jbchouinard/vspowerups/blob/master/vsoptimizer.py) にもある（`n = 10 + n_upgrades`、tier1 = n×cost, tier2 = (3n+2)×cost, tier3 = (6n+8)×cost, tier4 = (10n+20)×cost, tier5 = (15n+40)×cost、cost = 基礎価格/10）。
- 新式（v0.7.230 以降、計算機の最終対応 v0.11.107）: "Starting with the second upgrade, 20 * 1.1^(number of total upgrades bought) is added to the cost"。コード: `total += i * cost; if (count > 0) total += Math.floor(20 * Math.pow(1.1, count)); count++` → **ランク i の価格 = i × 基礎価格 + floor(20 × 1.1^N)**（N ≥ 1）。
- 旧式では「高価なものから先に買う」のが最適で、全PowerUp購入の最小合計は **97,140 gold**（vspowerups README, v0.2.8.2 当時のラインナップ） — [jbchouinard/vspowerups README](https://github.com/jbchouinard/vspowerups)
- 他の攻略サイト（時期不明/非最適順）: 全解放に 202,000 コイン、または 220,834 gold（検索要約） — [gamerjournalist](https://gamerjournalist.com/vampire-survivors-powerups/), [gamepretty](https://gamepretty.com/vampire-survivors-lowest-cost-for-meta-upgrades/)；「1つ買うごとに他のPowerUpの価格が10%上がる」（検索要約） — [steamah](https://steamah.com/vampire-survivors-optimal-powerup-selection-order-guide/)
- 旧版 Wiki のスニペット: Revival 10,000、Reroll 5,500（初期レベル）、2レベル目で累計 27,500（検索要約） — [PowerUp – Fandom wiki (oldid 5168)](https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=5168)

**Luck が影響するもの（一次データの原文）**
- 床アイテム: Rosary / Nduja Fritta / Orologion / Vacuum / Floor Chicken / Rich Coin Bag はすべて tips "Drop rate affected by Luck."、Treasure Chest は "Quality affected by Luck."、Candybox は "Occurrence in level up options affected by Luck." — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json), [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)
- レベルアップ: "Increase your Luck for a chance to get 4 choices." — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- 武器: Pentagram "Best with: Cooldown and Luck only"（`chance` = アイテムを消さない確率 10%→65%）、Cherry Bomb "Best with: Luck"（`chance` 0.4→0.6 爆発）、Gatti Amari "Best with: Luck, Floor Chicken"、Vento Sacro/Greatest Jubilee "Best with: Luck"、武器フラグ `dropRateAffectedByLuck` — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)
- ステージ: Hyper で `LuckBonus 0.1`（Library 以降）、Inverse で `LuckBonus 0.2` — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- Wiki（検索要約）: Luck は宝箱の品質に影響する — [Clover – vampire.survivors.wiki](https://vampire.survivors.wiki/w/Clover)；宝箱から複数ドロップする確率を上げる — [Nerds and Scoundrels Luck guide](https://www.nerdsandscoundrels.com/vampire-survivors-luck/)；宝箱の緑コイン袋が Luck ベースの低確率で Candybox に置き換わる — [Chest – vampire.survivors.wiki](https://vampire.survivors.wiki/w/Chest)

**その他のスタット定義（ゲーム内テキスト原文）**: Curse "Increases enemy speed, health, quantity, and frequency by %0%."、Charm "Increases enemies quantity by %0."、Antipiretic(fever) "Increases duration of Gold Fever and Gold Finger by %0%."、Armor "Reduces incoming Damage by %0."、Magnet "Pickup range increases by %0%."、Greed "Gold Coins value increases by %0%."、Growth "XP gain increases by %0%." — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)

### Inferences
- 内部表現から、**ダメージ = 武器power × 10 × (キャラpower + PowerUp Might + Spinach…)**、**クールダウン = 武器interval × (1 + Σcooldown修正)**（修正は負値: Empty Tome −0.08/lv, PowerUp −0.025/rank）、**Area / Speed / Duration = 武器基礎 × (1 + Σ修正)** という「基礎値 × 加算倍率」構造だと読める（README が「percent, default 1 = 100%」と定義し、修正値が ±0.0x の加算で記述されているため）。ただし乗算順序や Cooldown 下限は未確認。
- Armor は固定値減算（"Reduces incoming Damage by 1"）で、ラン内 Armor L5 + PowerUp 3 = 6 減。雑魚の `power` が 5〜14 であることから（単位が同じなら）Armor 積みで序盤の雑魚接触ダメージをほぼ無効化できる設計。
- PowerUp の価格設計は「効果/価格」でランク付けされており、Amount(5000)・Revival(10000)・Charm(10000) が最上位、Curse(1666) は「難易度を上げて報酬を増やす」自己選択ハンデとして高価に設定されている。

### Gaps
- **XPカーブの厳密な式**（レベルごとの必要経験値、レベル20/40での跳ね上がり量）は、Wiki 本文にアクセスできず確定できなかった。筆者の記憶では Wiki に「〜Lv19 は +10/レベル、Lv20 で大きな加算、Lv21〜39 は +13/レベル、Lv40 で再加算、Lv41〜 は +16/レベル」といった区分線形の記述があるが、**本セッションでは未検証**のため採用していない。要確認: Fandom wiki "Experience" / "Level" ページ。
- 現行 v1.x の PowerUp 価格式が 2022 年の「新式」のままか（Omni/Charm/Seal 追加後の変更有無）は未確認。
- Cooldown の下限（最大短縮率）、Magnet の基礎半径（px）、Move Speed の基礎値（px/s）、Revival の無敵時間、Luck の上限は未確認。

---

## KQ4. 敵デザイン：スポーンスケジュール、敵ステータスとスケーリング、群れ/ボス、画面外スポーン、Curse、敵数上限、宝箱の 1/3/5 ロール

### Takeaway
敵は `maxHp / speed / power(接触ダメージ) / knockback(受けやすさ) / maxKnockback / deathKB / xp` の7値でほぼ定義され、Mad Forest の雑魚は HP 0.1〜50（内部値）・speed 100〜200、ボスは `HP_x_Level`（プレイヤーレベル比例HP）スキルを持つ。生存敵数が300以上になると定期スポーンが止まり、ボスとイベント敵のみ出現する（Wiki）。Curse は「速度・HP・数・頻度」を +10%/ランクで一括増加、Charm は +20体/ランク、Inverse は HP×2 かつ毎分 +5% HP / +0.5% 速度の時間スケーリングを持つ。宝箱は分ごとの `chances [a, b, c]`（例 [3,10,100]）で定義され、Luck で品質（複数アイテム）が上がる。

### Cited Findings

**敵データのフィールド**（VSデータ Enemy.json、579エントリ。出現頻度の高いキー: maxHp, speed, power, knockback, maxKnockback, deathKB, level, xp, skills, passThroughWalls, scale, res_Freeze(118), res_Defang(114), res_Debuffs(108), res_Rosary(77), res_Knockback(65), res_Corridor(10), alpha, colliderOverride, tint, maxSpeed, lives, weak_Fire, minimumHpScalingLevel） — [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json)
- `skills` の種類: `HP_x_Level`（220体）, `Fixed_Direction`（74）, `Medusa`（17）, `Self_Destruct`（11） — 同上
- Wiki（検索要約）: Flower Wall の体力はレベルに応じてスケールする — [Enemies – Fandom wiki](https://vampire-survivors.fandom.com/wiki/Enemies)（データ上 FLOWER は `skills [HP_x_Level]`）

**Mad Forest の敵ステータス**（VSデータ Enemy.json 原値。HP/powerの単位は要検証、KQ4 Inferences 参照） — [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json)

| ID | 図鑑名 | level | maxHp | speed | power | knockback / maxKB / deathKB | xp | skills・耐性 |
|---|---|---|---|---|---|---|---|---|
| BAT1 | Pipeestrello | 1 | 0.1 | 140 | 5 | 1 / 3 / 2 | 1 | – |
| BAT2 / BAT3 | – | 1 | 0.5 | 140 | 5 | 1 / 3 / 2 | 1 | – |
| ZOMBIE | Zombie | 1 | 1 | 100 | 10 | 0.8 / 3 / 4 | 1 | – |
| SKELETON | Skeleton | 1 | 1.5 | 100 | 10 | 1 / 3 / 5 | 2 | – |
| GHOST | Ghost | 1 | 1 | 200 | 5 | 0 / 3 / 0 | 1.5 | alpha 0.5 |
| MUDMAN1 / MUDMAN2 | Mudman | 1 | 7 / 15 | 100 | 10 | 0.3 / 3 / 2 | 2.5 | – |
| WEREWOLF | Werewolf | 1 | 18 | 130 | 14 | 0.8 / 3 / 7 | 2 | – |
| XLBAT | Giant Bat | 10 | 27 | 140 | 10 | 0.1 / 3 / 2 | 2.5 | – |
| XLMANTIS | Mantichana | 10 | 50 | 80 | 20 | 0 / 3 / 0 | 3 | – |
| XLMUMMY | Big Mummy | 10 | 50 | 80 | 20 | 0 / 3 / 0 | 3 | – |
| FLOWER | Flower Wall | 1 | 3 | 20 | 1 | 1 / 3 / 2 | 2 | HP_x_Level |
| XLFLOWER | Venus | 10 | 50 | 80 | 20 | 0 / 3 / 0 | 3 | – |
| BAT4 / BAT5（宝箱ボス） | – | 1 | 5 | 140 | 10 | 1 / 3 / 2 | 30 | HP_x_Level |
| BOSS_XLMANTIS | – | 15 | 15 | 160 | 20 | 0 / 1 / 5 | 50 | HP_x_Level, res_Freeze 1.1, scale 1.5 |
| BOSS_WEREWOLF | – | 1 | 20 | 130 | 20 | 0.1 / 1 / 7 | 30 | HP_x_Level, scale 1.5 |
| BOSS_XLMUMMY | – | 15 | 25 | 80 | 20 | 0 / 1 / 5 | 25 | HP_x_Level, res_Freeze 1.1 |
| BOSS_XLFLOWER | – | 30 | 15 | 160 | 30 | 0 / 1 / 1 | 50 | HP_x_Level, res_Freeze 1.1 |
| BOSS_XLDEATH | The Reaper | 100 | 65535 | 1200 | 65535 | −0.5 / 0 / 0 | 0 | HP_x_Level, 全耐性 1 |
- 図鑑テキスト例: Pipeestrello "They're bats, and nothing more."、Skeleton "They are highly disciplined, incredibly vengeful, and very unionized!"、Flower Wall "appear when they are least needed, which is to say they appear all the time."、Mudman "a society where it's acceptable to cover one's self in mud and beat passing heroes to death." — [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json)
- Wiki（検索要約）: 2種のボス変種（Silver Bat 等）は後半のウェーブで通常敵として再出現する — [Silver Bat – vampire.survivors.wiki](https://vampire.survivors.wiki/w/Silver_Bat)（データ上も 28〜29分に `enemies: [BAT4, BAT5]`）

**スポーン制御**
- Wiki（検索要約）: **生存敵が300体以上になると定期スポーンは停止し、ボスとマップイベントの敵のみ出現する** — [Enemies – Fandom wiki](https://vampire-survivors.fandom.com/wiki/Enemies)
- データ上の `minimum` の最大値も 300（Mad Forest 11, 21, 23, 24, 27, 28, 29分）、最小 `frequency` は 100ms — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- `spawnType`: 未指定/STANDARD（四方向）、HORIZONTAL（Library, Coop, Carlo Cart, Tiny Bridge）、VERTICAL（Gallo Tower, Holy Forbidden）、TILED（Il Molise）、MAPPED（Lycaeum, Astral Stair, Mazerella） — 同上
- イベント種（Stage.json の `eventType`）: BAT_SWARM, GHOST_SWARM, FLOWER_WALL, MEDUSA_WALL, MEDUSA_SWARM, SHADE_BOMB_RED, SKULL_SWARM（Library 20分で moreX 1→2→4→8→16→32 と倍増）, CYCLE_COMPLETE。各イベントは `delay`（ms）, `repeat`, `chance`（%）, `duration`, `moreX/moreY` を持つ — 同上
- Curse（PowerUp）: "Increases enemy speed, health, quantity, and frequency by 10% per rank (max +50%)."、Charm: "Increases enemies spawn quantity by 20 per rank (max +100)."、Defang: "Enemies spawn unable to deal damage 3% of the times per rank (max 15%)." — [PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json)
- 時間スケーリング `TimeMods {start, hpPerMinute, speedPerMinute}`: 通常の Mad Forest / Library には**無し**（`mods` に TimeMods キーが無い）。Inverse は全ステージ共通で `GoldMultiplier 2, EnemyHealthMultiplier 2, LuckBonus 0.2, TimeMods {hpPerMinute 0.05, speedPerMinute 0.005}`。The Bone Zone は通常時から `hpPerMinute 0.15, speedPerMinute 0.025`、Bat Country は `0.1 / 0.0125`（XPBonus 0.25）、The Coop は `hpPerMinute 0.25`（XPBonus 0.35）、Green Acres / Boss Rash は `EnemyHealthMultiplier 1.5` — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- Hyper: Mad Forest `hyper {PlayerPxSpeed 0.9, EnemySpeed 0.9, ProjectileSpeed 0.25, GoldMultiplier 0.5, StartingSpawns 15}`、`hyperTips "50% Gold bonus"`；Library 以降は `LuckBonus 0.1`、`hyperTips "50% Gold bonus / 10% Luck bonus"` — 同上
- Orologion: "Freezes all enemies in time for 10 seconds."、Rosary: "Destroys all enemies in sight."、Infinite Corridor: "Halves enemies' health."、Garlic: "Reduces resistance to knockback and freeze." — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json), [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)

**宝箱（Treasure Chest）**
- 分ごとの定義（Stage.json）: `"treasure": {"chances": [3, 10, 100], "level": 1, "prizeTypes": ["EVOLUTION", "EXISTING_ANY", "EXISTING_ANY", "EXISTING_ANY", "EXISTING_ANY"]}`。Mad Forest で見られる `chances` のパターン: [0,0,30]（1分）, [0,5,40]（3分）, [1,5,100]（5分）, [3,10,50]（7, 9分）, [3,10,100]（10分以降の多く）, [1,5,50]（12, 16分）。`prizeTypes` の値: EVOLUTION, EXISTING_WEAPON, EXISTING_ANY, EVO_ARCANA。7分は `level 2` — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- Item.json `TREASURE`: "Awards coins and Power ups. Dropped by strong enemies." / "Quality affected by Luck."；Arcana 0 Game Killer: "All Treasure Chests contain at least 3 items."；Darkana Moonlight Bolero: "An extra treasure boss spawns every minute." — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json), [Arcana.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Arcana.json)
- UI: "Treasure Found!" / "PRESS CANCEL TO SKIP"（宝箱演出はスキップ可能）、オプション "Sequential Chest Mode" — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- 隠しアイテム `STATS_TREASURE_1〜5 / _EVOS / _WEAPONS`（統計用に1〜5個入り宝箱・進化・武器を別カウント） — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)

### Inferences
- **HP の単位**: Reaper の `maxHp 65535` を ×10 すると 655,350 となり、筆者の記憶する「Death の HP 655,350」と一致するため、敵HPも武器power同様「×10」が実ダメージ単位と推定される（例: Zombie 10 HP、Mudman 70/150 HP、Giant Bat 270、Mantichana 500）。Whip L1（10ダメージ）で Zombie 1撃、Mudman2 15撃という序盤の手触りに整合する。**要検証**。
- `treasure.chances [a,b,c]` は「5個入りの確率 a%、3個入りの確率 b%、（それ以外で）1個入りの確率 c%」と読むのが自然（後半は [3,10,100] で必ず1個以上、序盤は [0,0,30]）。Luck がこれらの確率に乗算される、という Wiki の「Luck は宝箱の品質に影響」「複数ドロップの確率を上げる」記述と整合する。**要検証**。
- `prizeTypes` は宝箱の各スロットの抽選ルール（1番目に EVOLUTION が指定されていれば、進化可能な武器があるとき最優先で進化する）。これが「進化は10分以降の宝箱で確実に起こる」体験を生んでいる。
- 敵の「群れイベント」は通常スポーン上限（300）とは別枠で出現するため、画面の圧を上限に関係なく一時的に高められる＝「壁」演出（Flower Wall、Medusa Wall、Skull Swarm の倍々増加）の実装手段。
- `knockback`（0〜1、Ghost 0）と `maxKnockback` は「ノックバックの受けやすさと上限」、`deathKB` は死亡時の吹き飛び量と推定される。重い敵（Mudman 0.3, Giant Bat 0.1, 大型 0）ほどノックバックしにくく、群衆の「押し返せる/押し返せない」感触を敵タイプで作っている。

### Gaps
- `power`（接触ダメージ）の実ダメージ換算（×10 か否か）、接触ダメージの発生間隔（ティック）は未確認。
- 画面外スポーンの具体的距離（画面端からの px）、デスポーン規則（画面外に離れた敵のリサイクル/テレポート）、300上限時の処理（最古の敵の削除か）はコード側で未確認。
- Curse の「frequency +10%」が `frequency`（ms）を 1/1.1 にするのか `minimum` を 1.1 倍にするのか、`HP_x_Level` の具体式（level × 何倍か、`minimumHpScalingLevel` との関係）は未確認。
- 宝箱の金貨量、進化が無い場合のスロット充填規則は未確認。

---

## KQ5. メタ進行：gold、PowerUps、実績アンロック（キャラ/武器/ステージ）、秘密、Limit Break、Inverse、Hurry、Endless、ステージ固定アイテム、レリック、コレクション、Golden Egg

### Takeaway
VS のメタ進行は「213件の実績（うち51が武器、30がキャラ、22がステージ、21がHyper、20がPowerUp、29がレリック、34がArcanaの解放）」と「レリック（恒久機能解放: Hurry/Inverse/Endless/Limit Break/Arcana/商人/マップ等）」と「Golden Egg（gold を永久ステータスに変換する無限シンク）」の3層で構成される。実績の条件は「Lv到達」「X分生存」「武器をL4/L7に」「特定キャラでプレイ」「特定ステージでプレイ」の組み合わせで、初回プレイから数十時間分の「次の目標」が常に提示される。

### Cited Findings

**gold の入手と使途**
- Gold Coin +1（rarity 50, feverMS 500）、Coin Bag +10（rarity 10）、Big Coin Bag +25（隠し）、Rich Coin Bag +100（rarity 1, Luck影響）、Gold Pile +1000（固定）、Gilded Clover（床の全goldを回収し Gold Fever 開始）、Gold Finger — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)
- Greed +10%/ランク（PowerUp）/ Stone Mask +10%/lv、ステージ `GoldMultiplier`: Dairy Plant 1.2、Gallo Tower 1.3、Cappella Magna 1.4、Bone Zone 1.5、Hyper で +0.5（"50% Gold bonus"）、Inverse で ×2 — [PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json), [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- リザルト画面: "Gold earned:" / "Level reached:" / "Enemies defeated:" / "- Hyper - Gold x %0" — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- 使途: PowerUp（KQ3）、キャラ購入（price 0 / 10 / 100 / 500 / 1000、秘密キャラ 666 / 777 / 7777）、商人（武器の `price` 60〜5580、進化武器は 2160〜5580）、Golden Egg（`RELIC_GOLDENEGG value 10000`、下記） — [Character.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Character.json), [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json), [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)

**実績によるアンロック**（VSデータ Achievement.json、213エントリ。報酬種別の件数: weaponToUnlock 51, characterToUnlock 30, stageToUnlock 22, hyperToUnlock 21, powerUpToUnlock 20, relicToUnlock 29, arcanaToUnlock 34, skinsToUnlock 3、`goldPrize 500` が24件。条件タイプ: ReachedXLevel, PlayInStage, SurviveXSeconds, PlayXCharacter, HaveLeveledWeaponToSpecificLevelOrEvolved 等） — [Achievement.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Achievement.json)
- 序盤の実績ラダー例: "Reach Level 5." → Wings / "Reach Level 10." → Crown / "Reach Level 20 in the Mad Forest." → Inlaid Library / "Reach Level 40 in the Inlaid Library." → Dairy Plant / "Reach Level 60 in the Dairy Plant." → Gallo Tower / "Reach Level 80 in the Gallo Tower." → Cappella Magna / "Reach Level 80 in Inverse Mad Forest." → Bat Country（+Hyper）
- 生存系: "Survive 1 minute with any character." → Hollow Heart / "Survive 5 minutes with Pasqualina." → Runetracer / "Survive 5 minutes with Gennaro." → Pummarola / "Survive 10 minutes with any character." → Peachone / "Survive 10/15 minutes with Pugnala." → Phiera / Eight / "Survive 15 minutes with Giovanna/Poppea/Concetta/Zi'Assunta" → Gatti Amari / Song of Mana / Shadow Pinion / Vento Sacro / "Survive 20 minutes with any character." → Pentagram / "Survive 20 minutes with Krochi." → Tiragisú / "Survive 20 minutes with at least +10% Curse." → Lama / "Survive 30 minutes with Lama." → Skull O'Maniac
- 武器レベル系: "Get King Bible to Level 4." → Bracer / "Get Santa Water to Level 4." → Candelabrador / "Get Fire Wand to Level 4." → Ciro / "Get Lightning Ring to Level 4." → Porta / "Get Magic Wand to Level 7." → Duplicator / "Get Peachone to Level 7." → Ebony Wings / "Get Runetracer to Level 7." → Spellbinder / "Get Garlic to Level 7." → Camillo / "Get Pentagram to Level 7." → Cristina
- Hyper 関連: "Unlock Hyper mode for 2/3/4/all 5 normal stages." — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)

**レリック（恒久機能の解放）**（VSデータ Item.json `isRelic` 原文） — [Item.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Item.json)
- Grim Grimoire: "Permanently allows to peek at discovered weapon evolutions and unions from the pause menu."（Inlaid Library 配置 `relics ["RELIC_GRIMOIRE"]`）
- Ars Gouda: 図鑑 / Milky Way Map: ポーズ画面マップ / Magic Banger: 音楽選択 / Yellow Sign: "Permanently allows the detection of hidden items in all stages."
- **Sorceress' Tears（Hurry mode）**: "Permanently allows speeding up time in Stage Selection."
- **Gracia's Mirror（Inverse mode）**: "Permanently allows to access a harder version of any stage."
- **Seventh Trumpet（Endless mode）**: "Permanently allows to disable all reapers and fight endlessly."
- **Great Gospel（Limit Break）**: "Permanently allows to level up weapons beyond their limit. Can be enabled in Stage Selection."
- **Golden Egg**: "Permanently improves a random stat for the current character, by a tiny amount."；Flames of Moonspell: "Permanently remove up to 100 random Golden Egg bonuses."；Lantern of Foscari: "Permanently removes all Golden Egg bonuses on Move Speed."；隠しUI項目 "MAX EGGS: Spend as much gold as possible to buy Golden Eggs."
- Glass Vizard: "Summons the merchant in all stages."（value 10000）/ Mindbender / Forbidden Scrolls of Morbane（呪文と秘密リスト）/ Randomazzo（Arcana）/ Darkasso（Darkana）/ Atlas Gate（Adventures）/ Chaos Malachite 等（Lv80で変身）/ Trisection（ランダムイベント）/ Brave Story（ランダムレベルアップ）/ Masquerade（Party Mode）/ Apoplexy・Antidote・Wax Fetish（Charm・Defang・Recycle PowerUp を購入可能に）/ "Roast chicken with a clock in the middle"（ゲーム速度変更）/ Green Eyes Vizard（Bat Dragons）
- ステージ固定パッシブ（`isSpecialOnly`）: Silver Ring / Gold Ring / Metaglio Left / Right（KQ2） — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)

**秘密（Secrets）**（Secret.json / secretLang 原文抜粋）: "Follow the trail after pillaging Pummarola and Skull O'Maniac from the Mad Forest."（NEO）、"Investigate the bottom of Gallo Tower."（VERANDA）、"Run away from Moongolow with all 16 accessories mastered."（PANTALONE）、"Survive the Boss Rash with just one weapon."（DRAGOGION）、"Settle the score with the Reaper."（NOSTRO）、"1) Cast the spell x-x1viiq."（EXDASH）、"2) Uppercut a non-red reaper."（PANINI）、"3) Sometimes you just need to ask for help."（SMITH）、"Everything: All weapons unlocked for Level Up options."、"Everywhere: All main stages and Hyper mode unlocked." — [Secret.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Secret.json)

**ステージ構成**: 基本5ステージ（Mad Forest "Stage 1"〜Cappella Magna）+ ボーナス（Il Molise, Moongolow, Green Acres, The Bone Zone, Boss Rash, Eudaimonia M., Holy Forbidden, Whiteout, Lycaeum, The Coop, Space 54, Carlo Cart, Laborratory, Westwoods, Bat Country, Astral Stair, Mazerella, Tiny Bridge）+ DLC — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)；Adventures（`AdventureStageSet.json` に Poe/Imelda 等のステージセット） — [AdventureStageSet.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/AdventureStageSet.json)

### Inferences
- 実績の多くが「特定キャラで X 分生存」「特定武器を L4/L7 に」という形なので、プレイヤーは自然に**全キャラ・全武器を試す**よう誘導される（＝ビルド多様性の強制探索）。1ランで複数の実績が同時に進む（レベル、生存時間、武器レベル）ため「無駄なランがない」感覚が生まれる。
- Golden Egg は gold を「永久の微小ステータス」に変換するため、PowerUp を買い切った後も gold に価値が残り、Greed / Hyper / Inverse（×2）で gold を稼ぐ動機が持続する。Purify（Egg除去）アイテムの存在は、Egg が「ゲームを壊すほど強くなる」ことを開発側が前提にしている証拠。
- Hyper（速度・gold+50%）→ Inverse（HP×2, gold×2, 毎分スケール）→ Endless → Limit Break の順に「同じステージを再利用した難易度/報酬の段階」が設計されており、コンテンツ量を増やさずにプレイ時間を伸ばしている。

### Gaps
- Golden Egg の価格上昇式、1個あたりの上昇量（「tiny amount」の具体値）、Hurry mode の倍率、Endless モードのループ時のスケーリング（Reaper 無効化後の難易度曲線）はデータに無く未確認。
- 実績ごとの達成率（Steam実績統計）や「50〜100時間継続の実証データ」は取得できなかった。

---

## KQ6. 開発者（Luca Galante / poncle）が語るデザイン原則：移動のみ、判断密度、ランダム性（スロットマシン）、短いラン、「数字が増える」、画面の混沌と視認性、放置の許容

### Takeaway
開発者インタビュー本文はネットワーク制限で読めず、検索結果の要約レベルでしか確認できなかった。確認できた範囲では、Galante はモバイルギャンブル企業で働きながら余暇に本作を作り、ギャンブル業界の経験を設計に応用したこと、弾幕/自動攻撃の着想は Magic Survival、ビジュアルは Lapis x Labyrinth、初日から Castlevania の影響があったこと、「なぜ売れたか分からない」「続編より既存ゲームへの機能追加」という姿勢が報じられている。

### Cited Findings
- Galante は以前のギャンブル業界での経験を Vampire Survivors に応用した（The Conversation の記事見出し: "how developers used gambling psychology to create a BAFTA-winning game"）（検索要約） — [The Conversation](https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613)
- Galante はモバイル向けギャンブル会社で働きながら余暇に本作の開発を始めた（検索要約） — [Multiplayer.it](https://multiplayer.it/notizie/vampire-survivors-ha-salvato-il-suo-autore-dal-lavorare-ai-giochi-dazzardo-per-sistemi-mobile.html)
- 弾幕的メカニクスはモバイルゲーム Magic Survival から、ビジュアルは Lapis x Labyrinth から影響を受けた（GameSpot インタビューの中国語要約、検索要約） — [GCORES](https://www.gcores.com/articles/163058)
- 続編は「ありそうにない」。本作の設計は既存ゲームに新コンテンツと新メカニクスを追加し続けられるため（検索要約） — [Shacknews](https://shacknews.com/article/134437/vampire-survivors-creator-sequel-is-unlikely), [80.lv](https://80.lv/articles/vampire-survivors-dev-says-the-sequel-to-the-game-is-unlikely/)
- Castlevania の影響は初日からあった（検索要約） — [GoNintendo](https://gonintendo.com/contents/42432-vampire-survivors-dev-says-the-castlevania-influence-was-there-from-day-one)
- 開発者は「なぜ売れたのか分からない」「考えると雑念になるので考えない」と発言（検索要約） — [AUTOMATON](https://automaton-media.com/articles/newsjp/20230104-232716/)
- 開発者が諦めかけたところでヒットした経緯（検索要約） — [Barclays Games](https://games.barclays/resource-hub/games/industry-insights/how-vampire-survivors-became-a-hit-when-creator-poncle-was-ready-to-give-up)
- 2023 BAFTA Games Awards で God of War Ragnarök と Elden Ring を抑えてベストゲームを受賞（検索要約） — [The Conversation](https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613)
- データ側に現れる設計意図（一次ソース）: Pentagram のコスト設計（90秒CD・初期 chance 10% で「アイテムを消す」リスク）、Torrona's Box "Cursed item"（強力だが呪われたアイテム）、Curse PowerUp（自己選択の難易度）、「Twitch chat がイベントとレベルアップを制御」モード、"Random LevelUp" / "Random Events" のトグル、`Cpu.json` の協力AI種別（Defensive / Aggressive / ChaoticAF / MirrorInput / DelayedInputCopy / GreedyForPickups / StandsStill / Masochistic）— [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json), [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json), [Cpu.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Cpu.json)

### Inferences
- 「ギャンブル心理の応用」はデータ構造に明確に現れている: レベルアップ（3〜4択の抽選）、宝箱（1/3/5の確率ロール＋スキップ可能な演出）、Luck という「当たりやすさ」を上げる投資先、Gold Fever、Gold Finger、商人の "Spin the Wheel!"。いずれも「結果はランダムだが投資で期待値を上げられる」設計で、可変比率強化スケジュールに相当する。
- AI 同伴者に "StandsStill"（動かない）が用意されていることは、ゲームが「移動入力ゼロでも一定時間成立する」＝放置許容の設計を前提にしていることの傍証。
- 「続編ではなく追加」の方針は、`Stage.json` がデータ駆動で（1分=1行のテーブル、イベントとボスの差し替え）ステージを量産できる構造になっていることと整合する。

### Gaps
- GDC 2023 での Galante 講演は検索結果で確認できなかった（存在自体が未確認）。Edge / GamesIndustry.biz / Noclip / GMTK 等の本文・発言引用（「no aim, only move」「decision density」「idle」に関する直接の言葉）は取得できていない。これらは**本セッションでは一切検証できなかった**ため、レポートでは「要引用確認」とすべき。
- 「画面の視認性（visual noise）」に関する開発者の言及も未取得（オプションに "Flashing VFX" / "Strong Visual Effects" / "Disable blood" / "Damage Numbers" / "Weapons ScreenShake" のトグルがあることのみ一次確認、KQ8 参照）。

---

## KQ7. 比較：Survivor.io（チャプター制・装備・スキル進化・15分）、Brotato（ウェーブ制ショップ・6武器）、20 Minutes Till Dawn（手動エイム＋リロード・10/20分）

### Takeaway
Web検索予算が尽きたため、本セッションでは比較3作の一次・二次ソースを一切取得できなかった。以下はすべて Gaps として扱い、レポートでは別途検証が必要。

### Cited Findings
- （本セッションで取得できた出典なし）

### Inferences
- なし（出典なしのため記載しない）

### Gaps
- Survivor.io: チャプター制（各チャプターの制限時間、ボス）、装備（部位・レアリティ・強化）、スキル進化（アクティブ＋パッシブの組合せ）、"quick kill" 報酬、課金導線。筆者の未検証の記憶では「ステージは約15分、スキルは最大6アクティブ＋6パッシブで、特定アクティブ＋特定パッシブで進化」だが、**出典未取得**。推奨ソース: Survivor.io Wiki（Fandom）、Deconstructor of Fun / GameRefinery / Naavik の Survivor.io 分析記事。
- Brotato: ウェーブ数（筆者の記憶では20ウェーブ、1ウェーブ20〜60秒、ウェーブ間ショップ、武器6枠、素材＝通貨、リロール価格上昇、Danger 0〜5）— **出典未取得**。推奨ソース: Brotato Wiki（brotato.wiki.spellsandguns.com）。
- 20 Minutes Till Dawn: 手動エイム・リロード、10分/20分モード、レベルアップ3択、ルーン（メタ）— **出典未取得**。推奨ソース: 20 Minutes Till Dawn Wiki（Fandom）。
- GitHub 上には比較用の一次データ（Brotato の武器 .tres 等）を含む公開リポジトリは検索で見つからなかった（mod リポジトリのみ）。

---

## KQ8. アクセシビリティとフィードバック：画面揺れ、ヒットフラッシュ、ダメージ数字、サウンド、「juice」、入力方式

### Takeaway
VS は「ヒットフラッシュ（白塗り 120ms がデフォルト、派生は 30〜60ms＋ヒット/衝撃スプライト）」「武器ごとのスクリーンシェイク（オプションでON/OFF）」「ダメージ数字（オプション）」「点滅VFX / 強い視覚効果 / 血の表示のトグル」「SFXの Classic / Blast Processed 切替」「タッチ用の可視ジョイスティック」をデータ/設定レベルで持つ。これらはすべて**オプションで切れる**ことが一次ソースで確認でき、視認性と光過敏への配慮が設計に組み込まれている。

### Cited Findings
- ヒットVFX定義（VSデータ HitVfx.json, 17種）: デフォルト `"0": {isTintFill false, targetTint 0xFFFFFF, duration 120}`、`"1": {isTintFill true, targetTint 0xFFFFFF(白), hit "HitStar2.png", impact "Shockwave3.png", duration 120}`、`"2": {targetTint 0x0000FF(青), "feedback-4.png", duration 30}`、`"3": {targetTint 0xFF0000(赤), "Hit1.png"/"HitBoom2.png", duration 30}`、他は duration 30〜120ms でヒットスプライトと衝撃スプライトを組み合わせる — [HitVfx.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/HitVfx.json)
- オプション項目（ゲーム内テキスト）: "Damage Numbers"、"Weapons ScreenShake"、"Flashing VFX"、"Strong Visual Effects"、"Disable blood"、"Visible joystick"、"Joystick Type"、"Touch screen control stick" / "…type"、"Permanent co-op outlines"、"Visually Invert Stages"、SFX "Classic" / "Blast Processed"、"Screen Refresh Rate"、"Show Defanged Enemies"、"Sequential Chest Mode" — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- 敵の `alpha 0.5`（Ghost）、`tint`、`scale 1.5`（ボス）、`colliderOverride`（Giant Bat radius 0.3）など、見た目と当たり判定を分離するフィールド — [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json)
- 宝箱演出は "PRESS CANCEL TO SKIP" でスキップ可能 — [I2Languages.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Translations/Generated/I2Languages.json)
- 武器 `knockback` 値（Whip なし、Knife 0.5、Peachone 2、Unholy Vespers 4、Heaven Sword 6、Crimson Shroud 20、Pentagram −2（吸引））と敵側 `knockback/maxKnockback/deathKB` による「押し返し」の手触り — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json), [Enemy.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Enemy.json)
- キャラ歩行アニメ: `walkFrameRate` デフォルト 6（1フレーム = 1000/6 ms） — [Data/README.md](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/README.md)

### Inferences
- ヒットフラッシュの基本が「120ms 白塗り」で、特殊効果（凍結=青30ms、火=赤30ms）は短くしているのは、300体規模の群衆でフラッシュが飽和して画面全体が白くなるのを避けるため、と考えられる。
- "Weapons ScreenShake" が「武器ごと」の名称であることから、揺れは武器発動（Lightning Ring, Hellfire 等）に紐づく実装で、被弾時の揺れとは別扱いと推定。
- 入力は移動のみ（攻撃は自動）という通説と整合する一次証拠として、オプションに「エイム」「攻撃ボタン」設定が存在せず、ジョイスティック関連のみがある点が挙げられる。

### Gaps
- 「移動のみ・自動攻撃」を明記した公式/Wiki/開発者の一次ソースは本セッションで取得できなかった（Wikipedia ゲームプレイ節も取得不可）。
- ダメージ数字のフォント/色分け規則、クリティカル表示、SE のレイヤリング（同時発音数の制限、ピッチ揺らぎ）、ヒットストップの有無は未確認。
