# サバイバーライク（バレットヘブン）の技術実装：エンジン選定・アーキテクチャ・性能技法・データ駆動設計・参考資料

調査日: 2026-11-03。エンジン/ツールのバージョンは 2026年11月時点で確認できたものを記載し、日付を付す。
調査環境の制約: Web検索の予算上限に到達し、また WebFetch で到達できたのは github.com のみ（Wikipedia / Steam / Godot公式 / Unity公式 / 各ニュースサイト等は本セッションのネットワーク許可外で 403）。したがって、一次ソースの本文を直接読めなかった事実は検索結果の要約に基づいており、該当箇所には「要約ベース」と注記した。GitHub 上の README / データファイルは直接読んでいる。

---

## Q1. 出荷済みタイトルが実際に使ったエンジン（Vampire Survivors のエンジン移行の経緯を含む）と、新規開発者への含意

### Takeaway
ジャンルの代表作は Unity（20 Minutes Till Dawn / DRG: Survivor / Soulstone Survivors / Megabonk / Death Must Die / 現行 Vampire Survivors）、Godot（Brotato / Halls of Torment）、GameMaker（HoloCure）に分かれ、「Phaser + Electron」で生まれた Vampire Survivors は 2023年8月の v1.6 で性能・コンソール対応を理由に Unity へ全面移行した。新規開発者にとっての含意は「2Dサバイバーライクはどのエンジンでも成立するが、コンソール移植と大量エネミー性能を見据えるなら Unity か Godot が実績上の本命」である。

### Cited Findings

**Vampire Survivors（poncle）— Phaser → Unity**
- 開発者 Luca "poncle" Galante は 2020年に失業中、Phaser フレームワークで Vampire Survivors を作り始めた（要約ベース） — [Wikipedia: Vampire Survivors](https://en.wikipedia.org/wiki/Vampire_Survivors)
- Wikipedia のインフォボックスはエンジンを「Phaser（v1.6 以前）／Unity（v1.6 以降）」と記載。2022年に Galante は「業界標準（industry-standard）のエンジンへ移植して全体性能を改善する」と説明していた（要約ベース） — [Wikipedia: Vampire Survivors](https://en.wikipedia.org/wiki/Vampire_Survivors)
- 2023年7月12日に「8月17日に新エンジンへ完全移行」と告知。日本語報道は Automaton（協力プレイと Nintendo Switch 版も同時） — [GamingOnLinux 2023-07](https://www.gamingonlinux.com/2023/07/vampire-survivors-switching-to-new-game-engine-on-august-17) ; [Automaton 2023-07-13](https://automaton-media.com/articles/newsjp/20230713-255589/)
- 2023年8月、v1.6 でローカル協力プレイと新エンジンが同時にライブ — [GamingOnLinux 2023-08](https://www.gamingonlinux.com/2023/08/vampire-survivors-co-op-and-new-game-engine-upgrade-is-live)
- 新エンジンは当初 PC で旧エンジンと並行提供する計画だったが時間切れとなり、モバイルとコンソールに先に実装された（要約ベース） — [80.lv](https://80.lv/articles/vampire-survivors-will-get-new-engine-dlcs-updates-in-2023)
- PC Gamer は移行理由として「スローダウンとフレームドロップが起きる」ことを挙げ、開発者ノートには「新エンジンでも直さないもの（仕様だから）：壁のすり抜け」とあった（要約ベース） — [PC Gamer](https://www.pcgamer.com/vampire-survivors-was-such-a-big-hit-its-getting-a-whole-new-engine/)
- Windows Central（Xbox Wire のインタビューを引用）: poncle テクニカルディレクター Sam McGarry は「全体目標はプレイヤーに（エンジン変更を）気付かせないこと」と述べ、Xbox コンソールで良好に動作させるために作り直したと報じられた（要約ベース） — [Windows Central](https://www.windowscentral.com/gaming/vampire-survivors-was-rebuilt-just-to-run-well-on-xbox-consoles)
- Phaser 公式は 2024年の無料アップデート「Space-54」を「Vampire Survivors の元エンジンである Phaser へのトリビュート」と説明 — [Phaser News 2024-02](https://phaser.io/news/2024/02/vampire-survivors-space-54)
- 台湾メディア TechBang は、Unity の料金騒動（2023年9月）の直後に Galante が「二度と Unity を使わない」と発言し、必要なら再度エンジンを変えるかもしれないと述べたと報道（単一の二次ソース、要注意） — [TechBang](https://www.techbang.com/posts/109967-vampire-survivor-developers-never-use-unity-again)
- 旧 Phaser ビルドは現在も Steam の `old-engine` ベータブランチとして配布されており、それを C に書き直した PS Vita 非公式移植の README によると、使用 Phaser は 3.55.2。通常プレイは 60fps 付近だが「画面内に約300体」の重い波で 25〜30fps に落ち、原因は敵の物理処理とドローコールが Vita の CPU 上限に達するため — [vampire-survivors-vita README](https://github.com/Federicoilgrandebardo/vampire-survivors-vita)
- 現行版は Unity + IL2CPP。コミュニティのデータ抽出ツール VampireUnpacker の README は「Vampire Survivors は Unity を IL2CPP で使っており完全には逆コンパイルできない」とし、AssetRipper を前提にしている — [VampireUnpacker README](https://github.com/SurvivatonsAndMore/VampireUnpacker)
- 現行版向けカスタムキャラ MOD「Bloodlines」は Unity 向け MOD ローダー MelonLoader を要求（Unity であることの傍証） — [nwfistere/bloodlines](https://github.com/nwfistere/bloodlines)
- 現行版のゲームデータは JSON 群（Weapon.json / Character.json / Enemy.json / Stage.json / PowerUp.json / Arcana.json / Item.json / Achievement.json / Adventure*.json / LimitBreak.json / HitVfx.json 等、v1.16 から抽出）として存在 — [VampireSurvivorsFiles: Data/Vampire Survivors](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/tree/main/Data/Vampire%20Survivors)
- poncle 公式のローカライズ用ツールは Node.js で .xlsx → ゲームが直接読む .json へ変換する（スプレッドシート駆動の運用） — [Poncle/vampire-survivors-localisation](https://github.com/Poncle/vampire-survivors-localisation)
- 早期アクセスは 2021年12月17日に itch.io、2022年1月に Steam、正式版 1.0 は 2022年10月20日（要約ベース） — [Wikipedia: Vampire Survivors](https://en.wikipedia.org/wiki/Vampire_Survivors)
- 1.0 時点の計画コンテンツは「24キャラ・48武器（進化含む）・20パワーアップ・通常5ステージ＋特殊5ステージ」（事前計画の報道、要約ベース） — [PC Invasion](https://pcinvasion.com/vampire-survivors-more-characters-weapons-launch)

**Brotato（Blobfish / Thomas Gervraud）— Godot**
- エンジンは Godot。開発者 Thomas Gervraud（一人スタジオ Blobfish、リヨン→チューリッヒ）。2025年9月に継続開発を Evil Empire に移管（要約ベース） — [Wikipedia: Brotato](https://en.wikipedia.org/wiki/Brotato)
- Brotato のコンテンツ（武器・アイテム・キャラ・敵・難易度）は Godot の Resource（.tres）として定義されており、MOD 用 ContentLoader は `ContentData` リソースに `WeaponData` / `ItemData` / `CharacterData` / `EnemyData` / `UpgradeData` / `ConsumableData` / `SetData` / `ChallengeData` / `DifficultyData` の配列を持たせて読み込む。武器は「ティアごとに1リソース」 — [BrotatoMods/Brotato-ContentLoader](https://github.com/BrotatoMods/Brotato-ContentLoader)
- 公式翻訳は CSV ファイルで管理されている — [BrotatoMods/Brotato-Translations](https://github.com/BrotatoMods/Brotato-Translations)

**Halls of Torment（Chasing Carrots）— Godot**
- Godot 製。前作 Good Company は Unity だったが本作で Godot に移行（要約ベース） — [Wikipedia: Halls of Torment](https://en.wikipedia.org/wiki/Halls_of_Torment) ; [GamingOnLinux 2024-10（100万本）](https://gamingonlinux.com/2024/10/halls-of-torment-hits-1-million-sales-more-free-updates-planned)
- GodotFest 2025 でリードプログラマー Paul Lawitzki が「A Peek Under the Hood: Technical Learnings from Halls of Torment」を講演。概要にはプロジェクト構造・プログラミングパターン・プロファイリング・性能問題への対処・モジュール式エンティティ間通信・カスタムエディタのビルドは割に合うか、が含まれる（要約ベース。本セッションからは動画ページにアクセス不可） — [media.ccc.de](https://media.ccc.de/v/godotfest2025-a-peek-under-the-hood-technical-learnings-from-halls-of-torment)

**HoloCure（Kay Yu）— GameMaker**
- GameMaker 製、Windows で 2022年6月に itch.io で無料公開、Steam 版は Ver0.6（2023年8月）（要約ベース） — [Wikipedia: HoloCure](https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans!) ; [Automaton 2023-07-16](https://automaton-media.com/articles/newsjp/20230716-255972/)
- コミュニティ製 MOD ローダーは自身を「非YYC（YoYo Compiler を使わない）GameMaker Studio 2 用 MOD ローダー」と説明しており、HoloCure が GameMaker の VM ランタイムで配布されていることを示唆 — [steviegt6/holocure-modloader](https://github.com/steviegt6/holocure-modloader)

**20 Minutes Till Dawn（flanne）— Unity**
- Wikipedia インフォボックスは Developer: flanne、Engine: Unity（要約ベース） — [Wikipedia: 20 Minutes Till Dawn](https://en.wikipedia.org/wiki/20_Minutes_Till_Dawn)
- Unity 向け MOD フレームワーク BepInEx のプラグインとして MOD が作られている（Unity の傍証） — [Zeprus/20MTD-DiscoShoggoth](https://github.com/Zeprus/20MTD-DiscoShoggoth)
- 日本語の開発者インタビュー（GameBusiness.jp, 2022-06）: ソロ開発、影響元は Vampire Survivors と Nova Drift、早期アクセスは2〜3か月の予定（要約ベース） — [GameBusiness.jp](https://www.gamebusiness.jp/article/2022/06/15/20252.html)

**Deep Rock Galactic: Survivor（Funday Games）— Unity**
- Wikipedia はエンジンを Unity と記載。Funday Games が 2022年 Gamescom で Ghost Ship Games CEO と Vampire Survivors について話したことが発端。初週50万本、その後100万本（要約ベース） — [Wikipedia](https://en.wikipedia.org/wiki/Deep_Rock_Galactic:_Survivor) ; [GameSpot](https://gamespot.com/articles/deep-rock-galactic-spin-off-sells-half-a-million-copies-in-its-first-week/1100-6521307/) ; [Gamereactor](https://www.gamereactor.eu/deep-rock-galactic-survivor-has-shipped-a-million-units-1376923/)
- ローンチ時の敵は「10種類以上、ボス戦は最大3つ」（要約ベース） — [Gematsu 2023-03](https://www.gematsu.com/2023/03/survivor-like-auto-shooter-deep-rock-galactic-survivor-announced-for-pc)

**Megabonk（vedinad）— Unity（3D）**
- Unity 製、開発開始 2024年8月、2025年9月 Steam 発売、2週間で100万本（要約ベース） — [Wikipedia: Megabonk](https://en.wikipedia.org/wiki/Megabonk)
- ランタイムは IL2CPP。コミュニティのネットプレイ MOD は BepInEx 6 の IL2CPP ビルドを使用し、`UnityPlayer.dll` と `Megabonk_Data` の存在を記載 — [Fcornaire/megabonk-together](https://github.com/Fcornaire/megabonk-together)
- 逆アセンブル調査ノートは「Assembly-CSharp（IL2CPP）を逆コンパイルしたもので、C# メソッド実装はすべてスタブ、実ロジックは GameAssembly.dll のネイティブ側」と説明。武器は `WeaponData` ScriptableObject で定義され、ゲームプレイ武器は 30 種 — [lukeod/megabonk_research README](https://github.com/lukeod/megabonk_research) ; [weapons.md](https://github.com/lukeod/megabonk_research/blob/main/weapons.md)
- 「見た目は良くないのに Steam の新センセーション」という評と、「Megabonk で 800万ドル作れるか？それともプレイヤーはピクセルアートが好きなのか」という業界ニュースレターの議論（3D ローポリ vs ピクセルアートの文脈） — [VidaExtra](https://www.vidaextra.com/accion/nueva-sensacion-steam-siquiera-tiene-buenos-graficos-donde-ha-salido-que-especial) ; [Game Dev Report](https://gamedevreport.beehiiv.com/p/can-you-make-megabonk-8mil-or-do-players-like-pixel-art)

**Soulstone Survivors（Game Smithing）— Unity**
- Gamers Heroes のインタビュー見出しに「Game Smithing の Allan Smith が Unity エンジンについて語る」とあり、Unity 製（要約ベース） — [Gamers Heroes](https://www.gamersheroes.com/features/soulstone-survivors-interview-game-smithings-allan-smith-talks-community-unity-engine-and-snow-covered-trees/)
- MOD コミュニティ（Thunderstore）には BepInEx の IL2CPP パックが登録されており、IL2CPP ビルドと推定 — [Thunderstore: Soulstone Survivors BepInExPack_IL2CPP](https://thunderstore.io/c/soulstone-survivors/p/BepInEx/BepInExPack_IL2CPP/)
- PC に加え PS5 / Xbox Series X|S 版が 2025年6月17日発売（要約ベース） — [Game Developer press release](https://www.gamedeveloper.com/press-release/soulstone-survivors-the-god-making-action-roguelike-launches-for-pc-playstation-5-and-xbox-series-x-s-today)

**Death Must Die（Realm Archive）— Unity（Mono）**
- 4人チーム、早期アクセス 2023年11月14日（要約ベース） — [GIGA.de](https://www.giga.de/news/steam-geheimtipp-kombiniert-2-der-groessten-hits-der-letzten-jahre/) ; [Gematsu](https://www.gematsu.com/games/death-must-die)
- MOD リポジトリは `BepInEx_UnityMono_x86` を要求しており Unity + Mono スクリプティングバックエンド。アーカイブ理由に「ゲームが x86 から x64 に移行した」「バージョンごとにコードが大きく変わる」とある — [JustArion/DeathMustDieMods](https://github.com/JustArion/DeathMustDieMods)

**Survivor.io（Habby / Gorilla Game Studio）— エンジン未確認**
- 開発は Gorilla Game Studio、パブリッシャーは Habby（要約ベース） — [Axios 2022-08](https://www.axios.com/2022/08/26/survivorio-habby-tiktok-ios-android)
- TikTok 経由で IAP 1,500万ドル・1,200万 DL（2022年）、3年後も月500万ドル（要約ベース） — [MobileGamer.biz](https://mobilegamer.biz/tiktok-drives-habbys-survivor-io-past-15m-iap-revenue-12m-downloads/) ; [Global Games Forum](https://www.globalgamesforum.com/ctv/how-survivor.io-continues-to-pull-in-5-million-a-month-three-years-later)
- エンジン（Unity か Cocos か）を明言する一次ソースは見つからなかった（下記 Gaps）。

### Inferences
- 「Phaser/Electron で当たった後に Unity に作り直す」経路は、Web 技術スタックでは Xbox/Switch/PlayStation 移植と大量エネミー時の性能が限界になることを示す実例。Vita 移植 README の「300体で物理とドローコールが限界」も同方向の傍証（ただし Vita は特殊なハード）。
- 最近のヒット（Megabonk 2025, Soulstone 2025 コンソール, DRG Survivor）は IL2CPP の Unity。Mono のまま出した Death Must Die は後から x64 に移行しており、小規模チームでもビルド設定の変更が後追いで発生し得る。
- Godot 実績（Brotato 1,000万本規模の報道、Halls of Torment 100万本）は「Godot で商業的に十分」の証左。ただし両作とも 2022〜2023年開発開始で Godot 3 系の可能性が高いが、バージョンの一次ソースは未確認（Gaps）。
- HoloCure が GameMaker の VM ランタイムで成立している点は、「数百体規模なら高度な最適化なしでも成立する」ことを示す（無料配布で性能要件が緩い点に注意）。

### Gaps
- poncle の Steam 公式告知（2023-07-12 / 08-17）の原文は本セッションから取得不可。「Unity を選んだ理由」の一次発言（Xbox Wire インタビュー全文）も未読。
- Survivor.io のエンジン: Habby の求人や APK 内部（`libil2cpp` 等）を確認できず未確定。
- Brotato / Halls of Torment の Godot メジャーバージョン（3.x か 4.x か）、GDScript か C# か、の一次ソース未確認。
- Soulstone Survivors の Unity バージョン/レンダーパイプライン、Halls of Torment 講演の中身（敵数・プロファイル結果）は未取得。
- Vampire Survivors 早期アクセス（2021-12）時点の武器数・ステージ数の確実な一次ソースなし（「7キャラ」という一覧情報は出典ページを特定できず）。

---

## Q2. 2026年に新規プロジェクトを始める場合のエンジン選定（Unity / Godot 4 / GameMaker / Phaser・PixiJS / Bevy / Unreal / Defold / Construct）

### Takeaway
2026年11月時点では、Unity 6.x（ランタイム料金撤回済、Personal 上限 20万ドル）と Godot 4.6〜4.7（無料・MIT、Jolt 物理デフォルト化、Web/モバイル強化）が二大候補で、Web 配信優先なら Phaser 4 / PixiJS v8（GPU インスタンシングで百万スプライト級）、Rust なら Bevy 0.20。GameMaker はコンソール出力に Enterprise（$799.99/年）が必要で、次世代ランタイム GMRT は 2027年1月から商用無料と告知されている。

### Cited Findings

**Unity**
- Unity は Unity 6 LTS 出荷前にランタイム料金を撤回。Personal は無料のまま、収益/資金調達の上限を 10万ドル→20万ドルへ倍増（要約ベース） — [Unity Blog: Unity is canceling the Runtime Fee](https://unity.com/blog/unity-is-canceling-the-runtime-fee) ; [Notebookcheck](https://www.notebookcheck.net/Unity-cancels-Runtime-Fee-before-controversial-pricing-structure-even-goes-into-effect-in-Unity-6.887828.0.html)
- 2026年の料金: Personal は年収益＋資金調達 20万ドルまで、Pro は 20万ドル超で必須、Enterprise は 2,500万ドル超で必須。Pro/Enterprise は 2026年1月12日から 5% 値上げで Pro は年 2,310ドル（月 210ドル）。Unity 6 では Personal でもスプラッシュ画面が任意（要約ベース） — [Unity pricing updates](https://unity.com/products/pricing-updates) ; [CG Channel 2025-11-10](https://www.cgchannel.com/?p=171673) ; [Engines Database: State of Unity Licensing in 2026](https://enginesdatabase.com/blog/state-of-unity-licensing-in-2026/)
- Unity 公式 ECS サンプルは Unity 6.2 と Entities / Netcode / Physics / Entities.Graphics の 1.4 系パッケージを使用（2026-11 時点 README） — [Unity-Technologies/EntityComponentSystemSamples](https://github.com/Unity-Technologies/EntityComponentSystemSamples)
- Unity 公式の無料アセット「DOTS Survivors」は Unity 6 で開発された ECS ベースのサバイバー型完全プロジェクトで、15種の敵×最大4色＝42体のユニーク敵を含む（要約ベース、性能数値の記載なし） — [Unity Asset Store #309340](https://assetstore.unity.com/packages/slug/309340)
- V Rising は DOTS/ECS 上に 1,600 の ECS システムで構築（大規模 ECS 実例、要約ベース） — [Unity case study: V Rising](https://unity.com/case-study/v-rising)

**Godot 4.x**
- Godot 4.5（2025年9月）: シェーダーベイカー（起動時のシェーダーコンパイル・スパイク緩和）、チャンク化タイルマップ物理（衝突形状の結合で物理計算削減）、2D 専用ナビゲーションサーバーと非同期更新、Web ビルドの WebAssembly SIMD、ステンシルバッファ、SMAA、SDL3 ゲームパッド入力、Android 16KB ページ対応。4.5.1 は安定性修正（要約ベース） — [GameFromScratch: Godot 4.5 Released](https://gamefromscratch.com/godot-4-5-released/) ; [It's FOSS](https://itsfoss.com/news/godot-4-5-release/) ; [DigitalProduction](https://digitalproduction.com/2025/09/17/godot-4-5-new-buffers-better-access-more-control/) ; [GitHub releases](https://github.com/godotengine/godot/releases)
- Godot 4.6（2026年1月27日前後）: 新規プロジェクトで Jolt が 3D 物理のデフォルト（既存プロジェクトは自動移行されない）、Modern テーマ、ドッキング刷新、Node ID、LibGodot（ライブラリとして埋め込み）、IK 復活、SSR 刷新、差分 PCK パッチ。Windows の既定 API が D3D12 になったという報道と Vulkan 継続という報道が食い違う（要約ベース） — [GameFromScratch: Godot 4.6 Released](https://gamefromscratch.com/godot-4-6-released/) ; [CG Channel 2026-01-27](https://www.cgchannel.com/?p=173665) ; [AlternativeTo](https://alternativeto.net/news/2026/1/godot-4-6-debuts-modern-theme-jolt-physics-node-ids-and-libgodot-embed)
- GitHub の 4.6 ブランチ CHANGELOG には 4.6.3 保守リリース（2026-05-20）が、master の CHANGELOG には 4.7 セクション（2026-06-18 付）が存在し、2026年11月時点では 4.7 系が最新安定版と推定 — [godot CHANGELOG (4.6 branch)](https://github.com/godotengine/godot/blob/4.6/CHANGELOG.md) ; [godot CHANGELOG (master)](https://github.com/godotengine/godot/blob/master/CHANGELOG.md)
- 2026年10〜11月に更新されたオープンソースのサバイバー型 Web ゲームは「Godot 4.7、ブラウザ到達性のため GL Compatibility レンダラー」を使用 — [Mocas-12/no-survivor-game](https://github.com/Mocas-12/no-survivor-game)
- Godot Foundation は 4.5.2 と 4.6 でモバイル開発に注力した大型更新を出したと報道（2026年4月、要約ベース） — [GameDev.net: Godot Mobile Update April 2026](https://gamedev.net/news/2713-godot-mobile-update-april-2026/)
- Godot 公式ドキュメント（CPU 最適化）: GDScript は使いやすさ優先で性能は二の次、重い計算は速い言語へ。C# は「速度と使いやすさの中間」だが GC ポーズ/リークがあり、オブジェクトプーリングを推奨。C++（GDExtension）が最速。ノードのオーバーヘッドは「数千〜数万ノード」で問題化。デフォルト物理ティックは 60Hz で 30/20Hz に下げると CPU 負荷は減るがジッターと入力遅延が増える — [godot-docs: cpu_optimization.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/cpu_optimization.rst)
- Godot C# スターターキット（Godot 4.6, C#）の作者計測: 既定の Godot 物理では同時約 50 体、Jolt 物理で約 200 体（約4倍）、200 体超で性能低下。Jolt は現状マルチスレッド動作しない旨 — [DarkRewar/SurvivorsStarterKit](https://github.com/DarkRewar/SurvivorsStarterKit)

**GameMaker**
- 非商用は無料（コンソール以外の全プラットフォーム）。販売には Professional ライセンス（$99.99 の買い切り）。商用コンソール出力には Enterprise（$79.99/月 または $799.99/年）とプラットフォームホルダーの承認が必要（要約ベース） — [GameWorldObserver](https://gameworldobserver.com/?p=21945) ; [TechRadar](https://www.techradar.com/gaming/consoles-pc/gamemaker-engine-transforms-its-business-model-and-introduces-a-one-time-fee)
- 次世代ランタイム GMRT は 2027年1月1日から商用利用も無料と告知。ただしコンソール出力は引き続き Enterprise と承認済み開発者ステータスが必要（2026年10月報道、要約ベース） — [GamingOnLinux 2026-10](https://www.gamingonlinux.com/2026/10/gamemaker-announce-their-next-gen-runtime-gmrt-will-be-free-for-commercial-use/) ; [PocketGamer.biz](https://www.pocketgamer.biz/gamemaker-makes-gmrt-free-for-commercial-use-from-2027/)

**Phaser / PixiJS（Web）**
- Phaser v4.0.0（GitHub リリースページ上は 4月10日、年の表示なし。4.1.0 は 2026-04-30、4.2.0 は 2026-06-19、4.2.1 は 2026-07-09）: v3 のパイプラインをノードベース WebGL レンダラーに置換。`SpriteGPULayer` は「100万スプライトを1ドローコールで描画、標準描画の最大100倍高速」で、位置/回転/スケール/α/ティント/フレームを GPU 駆動でアニメーション可能。`TilemapGPULayer` はタイルマップ1レイヤーを1クアッドで描画。WebGPU への言及はなし — [phaser releases](https://github.com/phaserjs/phaser/releases) ; [v4.0.0 release notes](https://github.com/phaserjs/phaser/releases/tag/v4.0.0)
- PixiJS v8（2024年3月）: Bunnymark 100k スプライト（全て移動）で CPU 約50ms→約15ms、GPU 約9ms→約2ms（v7→v8）。静止 100k では CPU 約21ms→約0.12ms。WebGPU バックエンドを搭載するが「WebGPU が常に WebGL より速いわけではない（CPU バウンドが多い）」と明記 — [pixijs.com blog: pixi-v8-launches](https://github.com/pixijs/pixijs.com/blob/main/blog/2024-03-05-pixi-v8-launches.md)
- PixiJS 性能ガイド: スプライトは「最大16テクスチャ（ハード依存）」までバッチ可能、ブレンドモード変更はバッチを切る、スプライトシートが最速、カリングは既定オフ、古いモバイルでは `antialias:false` と `@0.5x` テクスチャを推奨 — [pixijs.com docs: performance-tips](https://github.com/pixijs/pixijs.com/blob/main/docs/guides/concepts/performance-tips.md)
- PixiJS `ParticleContainer`（実験的）は「数十万〜数百万パーティクルを高FPSで」、例は 10万パーティクル。子要素・イベント・フィルタ非対応、動的プロパティは既定で position のみ — [pixijs.com docs: particle-container](https://github.com/pixijs/pixijs.com/blob/main/docs/guides/components/scene-objects/particle-container.md)
- Web 向け OSS 実装例: Phaser 3 + TypeScript の「poke-survivors」、依存ゼロの HTML5 Canvas 実装「canvas-vampire-survivors」、WebGPU + TypeScript でアセットなし・手続き描画の「dreamtide-ts」 — [GitHub topic: vampire-survivors](https://github.com/topics/vampire-survivors) ; [Noniv/dreamtide-ts](https://github.com/Noniv/dreamtide-ts)

**Bevy（Rust）**
- リリース履歴: 0.17（2025-09-30）、0.18（2026-01-13）、0.19（2026-06-19）、0.20（2026-10-08）、0.20.1（10月28日） — [bevy-website content/news](https://github.com/bevyengine/bevy-website/tree/main/content/news) ; [bevy releases](https://github.com/bevyengine/bevy/releases)
- Bevy 製サバイバー型 OSS: seancribbs/survivors-game（13★）、JamesHDuffield/ascii-rust（12★）、ワークショップ用の gpn-survivors / born-survivors（1プレイヤー・無限敵・自動武器・HP・キル数・時間・ゲームオーバーの最小構成） — [GitHub search 2026-11-03](https://github.com/seancribbs/survivors-game) ; [zff.dev: born-survivors](https://zff.dev/mayas/born-survivors)

**Unreal / その他**
- Unreal Engine 5 + Blueprint のサバイバー型（Survivor.io 風）学習プロジェクトが存在（15★） — [FahimKamal/UE5_Survivor_io](https://github.com/FahimKamal/UE5_Survivor_io)
- Flecs（ECS）+ raylib（C++）で作る「ECS Survivors」ブログ連載（全10パート、衝突の高速化・レベルアップ・タイルマップ tmxlite を含む）、GPL-3.0、WASM ビルドあり — [ptidejteam/ecs-survivors](https://github.com/ptidejteam/ecs-survivors)
- C + raylib の単一ファイル実装「c-blob-survival」（186★）は「数千体の敵を扱える」と主張、WASM で 120fps を目標 — [bones-ai/c-blob-survival](https://github.com/bones-ai/c-blob-survival)

### Inferences
- 料金面: Godot（MIT）と Bevy（MIT/Apache）はゼロコスト。Unity は年収益 20万ドル超で年 2,310ドル/席。GameMaker はコンソールを出す段階で年 800ドルが必須となり、2D 専用かつコンソール必須の小規模チームでは Godot/Unity との比較で不利。
- 技術天井: Web（Phaser 4 / PixiJS v8）は描画側は百万スプライト級でも、ゲームロジック（衝突・AI）は JS のシングルスレッドが律速。VS の Phaser 版が「300体で物理が限界」になった Vita 例は極端だが、JS 側ロジックの設計（空間分割・プール）が必須であることを示す。
- Godot 4 で素直にノード（CharacterBody2D + Area2D）で敵を作ると 50〜200 体が実務上の壁（DarkRewar の計測）。それ以上は Q3 の「配列＋空間グリッド＋MultiMesh」か C#/GDExtension が必要。
- 日本語学習資源の量は Unity ≫ Godot ＞ その他（Q6 参照、ただし本セッションでは定量確認不可）。

### Gaps
- Defold / Construct / Cocos の 2026 年時点の料金・性能に関する一次ソースは取得できなかった（検索予算上限）。
- Godot 4.6/4.7 の公式リリースノート本文（godotengine.org）は本セッションから到達不可。D3D12 既定化の真偽は未確認。
- Unity 6.3 以降のバージョン詳細（2026年）と Entities 1.4 の変更点の一次ソース未取得。
- Phaser 4.0.0 の正確なリリース年（ページ上で年表示なし）。

---

## Q3. パフォーマンス技法（敵数・衝突・描画）と実測値

### Takeaway
出荷作品と OSS に共通する定石は「敵をノード/GameObject にしない（配列や ECS で持つ）」「空間ハッシュ/グリッドで敵同士の分離と武器ヒット判定を O(近傍) にする」「敵は『プレイヤーへ向かう＋ボイド分離』だけ」「描画は MultiMesh / GPU インスタンシング / 単一アトラスでバッチ」「プール＋ゼロアロケーション」で、GDScript 単体でも 700 体＋6武器で約 3ms/フレーム、MultiMeshInstance2D は 3万メッシュ/フレームの報告がある。

### Cited Findings

**オブジェクトプール / GC 回避**
- Unity の VS クローン（181★）は `Dictionary<string, Queue>` のプールを起動時に満たし、敵・武器エフェクト・ダメージ表示テキスト・クリスタルをプール管理。目的は `Destroy`/`Instantiate` による GC 起因のフレームドロップ回避 — [SikPang/Unity-VampireSurvivors-Copy](https://github.com/SikPang/Unity-VampireSurvivors-Copy)
- Unity 製モバイル VS クローン（282★、Unity 2021.3+、MIT）はモンスター・弾・アイテム・宝箱・ダメージテキストをプール、無限背景シェーダー、キーフレーム方式のスポーン率制御、ScriptableObject によるキャラ/レベル定義 — [matthiasbroske/VampireSurvivorsClone](https://github.com/matthiasbroske/VampireSurvivorsClone)
- Godot 公式: C# は GC ポーズがあるのでプーリング推奨 — [godot-docs: cpu_optimization.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/cpu_optimization.rst)

**空間分割（グリッド / 空間ハッシュ / クアッドツリー）**
- 無限マップで「敵も弾もプレイヤー近傍に集中し、グリッドは有限」という2つの問題に対し、x,y をハッシュして 1 次元配列に格納する方式で世界境界を不要にした（Modulus7 devlog, 数百体の敵＋数千パーティクル）（要約ベース） — [stales.itch.io: Collision detection](https://stales.itch.io/modulus7/devlog/971426/collision-detection)
- 素朴な全対全は O(N²)、空間グリッドで「1000オブジェクト → 約100候補ペア」に削減（要約ベース） — [PyBulletFleet docs](https://pybulletfleet.readthedocs.io/en/latest/architecture/collision-overview.html)
- Unity アセット「Enemy Masses」のドキュメント: 物理 Overlap ではなく敵位置キャッシュを問い合わせる設計、グリッド再構築間隔は可変（0.1秒だと高精度・高 CPU）（要約ベース） — [Enemy Masses docs](https://arawn-software-publishing.gitbook.io/enemy-masses/basics/enemycrowd/melee-and-projectile-system/player-skills-system-example-implementation)
- 2013年のデモ「SpaceMarine」は空間ハッシュで 500 体、作者は「これ以上は逃げ場がなくなり面白くない」とデザイン上の上限を記載（要約ベース） — [ed-apostol/SpaceMarine](https://github.com/ed-apostol/SpaceMarine)
- c-blob-survival はクアッドツリーで衝突、ピックアップ用クアッドツリーの範囲は 32k、敵が多いとき「プレイヤー付近で過分割」によるクラッシュ既知 — [bones-ai/c-blob-survival](https://github.com/bones-ai/c-blob-survival)

**敵 AI と分離（ソフト衝突 / ボイド）**
- c-blob-survival: 敵はボイド式分離（separation）、遠方の敵は破棄、画面外の敵は更新もボイド計算もしない — [bones-ai/c-blob-survival](https://github.com/bones-ai/c-blob-survival)
- Godot 向けサバイバー型テンプレート「Survivors Kit」は「敵はノードではなく packed array に格納、空間グリッドでヒット判定、敵タイプごとに 1 つの MultiMeshInstance2D で描画」し、性能テストでは「700 体＋最大レベル武器6本で 1 フレームあたり約 3ms のゲームロジック（純 GDScript）」（自己申告、要約ベース） — [Godot Forum: Survivors Kit](https://forum.godotengine.org/t/survivors-kit-a-complete-survivors-like-template-for-godot-4-700-enemies-in-plain-gdscript-web-demo/146090)
- Godot スターターキット作者計測: 既定物理 50 体 → Jolt 200 体（物理ベースの敵は Jolt でも 200 体が壁） — [DarkRewar/SurvivorsStarterKit](https://github.com/DarkRewar/SurvivorsStarterKit)
- Vita 移植: 約 300 体で「敵の物理とドローコール」が CPU を使い切り 25〜30fps — [vampire-survivors-vita](https://github.com/Federicoilgrandebardo/vampire-survivors-vita)

**描画バッチ / インスタンシング / 頂点アニメーション**
- Godot 公式 MultiMesh ドキュメント: 「1 回の描画プリミティブで最大数百万オブジェクト」、個別インスタンスの画面/視錐台カリング不可（全部描くか描かないか）、`visible_instance_count` で描画数を絞る、インスタンスデータは `INSTANCE_CUSTOM` でシェーダーへ、GDScript は「数千インスタンスまでなら十分」、数万を毎フレーム処理するなら Servers API、最大規模は GDExtension（C++）で `RenderingServer.multimesh_set_buffer()` で一括更新 — [godot-docs: using_multimesh.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/using_multimesh.rst)
- Godot フォーラム: 数百体でラグが出たケースに MultiMeshInstance2D を推奨、投稿者の環境で「少なくとも 3 万メッシュ/フレームを 80FPS で維持」。制約は「メッシュごとに Transform と Color は設定できるがテクスチャは個別設定できない」（要約ベース） — [Godot Forum: 2D Rendering Performance](https://forum.godotengine.org/t/2d-rendering-performance/45719)
- Godot 公式「数千匹の魚をアニメーションさせる」: ボーンは CPU 処理なので数千体では毎フレーム数千回の計算になる → MultiMesh ＋ 頂点シェーダー（`TIME`、`INSTANCE_CUSTOM.x` で位相、`.y` で速度 50〜150%）で「ローエンド機でも数千体」。ただし毎フレーム全インスタンスの transform を GDScript で更新するのは「それでも遅い可能性が高い」 — [godot-docs: animating_thousands_of_fish.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/vertex_animation/animating_thousands_of_fish.rst)
- Godot 公式 Servers ドキュメント: シーンツリーは「複雑さ・性能低下・メモリ増」を伴い、数万インスタンスを毎フレーム処理する場合に RenderingServer / PhysicsServer2D を RID で直接扱う。`canvas_item_create` → `canvas_item_add_texture_rect` → `canvas_item_set_transform`、物理は `body_create` ＋ `body_set_force_integration_callback`。サーバーから値を「返す」関数を毎フレーム呼ぶと同期待ちで激しく遅くなる — [godot-docs: using_servers.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/using_servers.rst)
- Godot 最適化 devlog（Radiant Sloth）: 「一度に十数体スポーンするとラグスパイク」→ ノード数削減、PhysicsServer/VisualServer で直接制御（コードは読みにくくなる）、状態異常の見た目は必要時に遅延生成、タイマー/簡易アニメは Tween で代替（要約ベース） — [radiantslothgames.itch.io devlog #9](https://radiantslothgames.itch.io/destroy-the-monoliths/devlog/499567/devlog-9-how-to-optimize-your-game-made-with-godot-22)
- Godot 公式 2D ベンチの内訳: 約 66% がキャンバス描画、約 50% がグラフィックスドライバ内（CPU 最適化ドキュメントの例） — [godot-docs: cpu_optimization.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/cpu_optimization.rst)
- Phaser 4 `SpriteGPULayer`: 100 万スプライト/1 ドローコール、位置・回転・スケール・α・ティント・フレームを GPU 側でアニメーション — [Phaser v4.0.0](https://github.com/phaserjs/phaser/releases/tag/v4.0.0)
- PixiJS: 16 テクスチャまでバッチ、ブレンドモード変更でバッチ切断、スプライトシート推奨 — [pixijs performance-tips](https://github.com/pixijs/pixijs.com/blob/main/docs/guides/concepts/performance-tips.md)

**Unity: Burst / Jobs / ECS**
- Unity 事例「Far North」: 巨大ゾンビ群でプロトタイプ時に性能問題 → 敵ロジックを DOTS へ、毎フレーム C# Job System でジョブをスケジュール、数千体でアーキタイプチャンクが多数になるため `IJobChunk` を選択（数値はスニペットに含まれず、要約ベース） — [Unity: Far North case](https://on.unity.com/37DOzWF)
- ボイドのプロトタイプ devlog: ECS 版は 100 ボイドで 130fps、「1,000 ボイドは従来の Unity では破綻するが ECS なら大丈夫」「10,000 ボイドで 60fps も非現実的ではない」（未検証の推定、要約ベース） — [itch.io devlog: First Jobs prototype](https://itch.io/devlog/118083/first-jobs-prototype.amp)
- DOTS 製サバイバー（Unity 2022.3.17f1, Entities 1.3.10, Entities Graphics 1.4.8）: 移動・攻撃・スポーン・ダメージ・バフ・属性集計を Burst/Job 化。ScriptableObject 設定を Addressables で読み BlobAsset 化、UI は XLua — [MiShoU-msu/DOTS-Survivors](https://github.com/MiShoU-msu/DOTS-Survivors)
- 韓国 Inflearn の Unity 6 ECS/DOTS 講座は「数万の敵と弾を同時に扱う設計」と宣伝（マーケティング表現） — [Inflearn: Unity 6 ECS/DOTS Masterclass](https://www.inflearn.com/en/course/절대강좌-유니티6-ecsdots-프로)
- Unity 公式サンプルは Unity 6.2 + Entities 1.4 — [EntityComponentSystemSamples](https://github.com/Unity-Technologies/EntityComponentSystemSamples)

**固定タイムステップ**
- Godot 既定の物理ティックは 60Hz。30/20Hz へ下げると CPU 負荷は減るがジッターと入力遅延 — [godot-docs: cpu_optimization.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/cpu_optimization.rst)
- Godot 公式の一般最適化: 「まず計測」、CPU と GPU は独立で遅い方がフレーム時間を決める、定常的低 FPS / 間欠スパイク / ロード遅延の 3 種を区別、モバイルは複数端末で計測 — [godot-docs: general_optimization.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/general_optimization.rst)

### Inferences
- 敵数の目安（本調査で得た実測の整理、ハード不明のものが多い点に注意）:
  - ノード/物理ボディ方式（Godot 4, C#）: 50〜200 体
  - 配列＋空間グリッド＋MultiMesh（Godot 4, GDScript）: 700 体で 3ms
  - MultiMeshInstance2D 描画のみ: 3 万/フレーム @80fps
  - C + raylib + クアッドツリー: 「数千体」
  - Unity DOTS: 1 万エンティティ 60fps は現実的な目標値
  - Web（PixiJS v8/Phaser 4）: 描画は 10 万〜100 万スプライト、ロジックは別途設計要
- 「60fps = 16.67ms」の予算に対し、ゲームロジック 3ms（700 体）は十分余裕があり、サバイバーライクの典型的な同時敵数（数百〜1,000 体強）は GDScript でも設計次第で到達可能。
- 敵同士の分離はボイド分離（画面外は省略）が最も多く採用され、「重なりを許容する」単純化も現役（VS の壁すり抜けが「仕様」である点からも、厳密物理は不要）。
- ダメージ数字は必ずプール（複数 OSS が共通実装）。

### Gaps
- Halls of Torment / Brotato / 20MTD など出荷作品の「画面内敵数」「フレーム予算配分」の公式数値は未取得（Halls of Torment の講演は未視聴）。
- フローフィールドを採用した出荷サバイバーライクの一次ソースは見つからなかった。
- Unity 2D での `Graphics.DrawMeshInstanced` / SpriteRenderer SRP Batcher の具体的ベンチ記事は検索予算上限で未取得。
- 「敵のマージによるカリング」「敵上限（cap）」の実装を明示した出荷作品ソースなし（VS の Stage.json に `minimum` / `frequency` はあるが、`maxEnemies` 相当は確認できず）。

---

## Q4. モバイル固有（バッテリー/熱、30 vs 60fps、タッチ操作、解像度、低価格 Android、広告 SDK）

### Takeaway
一次ソースから確認できたのは「タッチした位置に出る仮想ジョイスティック」「タッチ端末では MSAA を下げる」「古い端末では AA オフ・半解像度テクスチャ」「Web ビルドはスレッド無効化で COOP/COEP を回避」といった実装慣行までで、バッテリー・熱・30/60fps 方針・広告 SDK コストに関する定量的な出荷作品ソースは本調査では得られなかった。

### Cited Findings
- Unity 製 VS クローン（Android/iOS 対応）: 「プレイヤーがタッチしてドラッグした場所に仮想ジョイスティックが出現」する方式 — [SikPang/Unity-VampireSurvivors-Copy](https://github.com/SikPang/Unity-VampireSurvivors-Copy)
- Unity 製モバイル VS クローン（282★）: モバイルと PC の入力を両対応、無限背景はシェーダーで描画 — [matthiasbroske/VampireSurvivorsClone](https://github.com/matthiasbroske/VampireSurvivorsClone)
- Godot 4.7 の Web 向けサバイバー型: タッチジョイスティック、MSAA はデスクトップ 4x / タッチ端末 2x、Web ビルドは約 39〜40MB（大半がエンジン）、スレッド無効化により SharedArrayBuffer / COOP/COEP ヘッダー不要、ローエンド実機での検証は未実施と明記 — [Mocas-12/no-survivor-game](https://github.com/Mocas-12/no-survivor-game)
- PixiJS: 古いモバイル端末は遅い。`useContextAlpha:false`、`antialias:false`、`@0.5x.png` の低解像度テクスチャを使う — [pixijs performance-tips](https://github.com/pixijs/pixijs.com/blob/main/docs/guides/concepts/performance-tips.md)
- Godot: 物理ティックを 60Hz から 30/20Hz に落とすと CPU 負荷減（ジッター/入力遅延の代償）；モバイルは複数端末で計測 — [godot-docs: cpu_optimization.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/cpu_optimization.rst) ; [general_optimization.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/performance/general_optimization.rst)
- Godot 4.5 は Android 16KB ページサイズ対応、4.5.2/4.6 はモバイル注力（要約ベース） — [It's FOSS](https://itsfoss.com/news/godot-4-5-release/) ; [GameDev.net 2026-04](https://gamedev.net/news/2713-godot-mobile-update-april-2026/)
- Vampire Survivors の iOS/Android 版は 2022年12月に配信（要約ベース） — [Gematsu 2022-12](https://www.gematsu.com/2022/12/vampire-survivors-now-available-for-ios-android)
- VS の新エンジンは「モバイルとコンソールに先に実装」された（要約ベース） — [80.lv](https://80.lv/articles/vampire-survivors-will-get-new-engine-dlcs-updates-in-2023)
- Survivor.io は TikTok 経由で IAP 1,500万ドル・1,200万 DL、3年後も月 500万ドル規模（モバイル F2P の商業規模、要約ベース） — [MobileGamer.biz](https://mobilegamer.biz/tiktok-drives-habbys-survivor-io-past-15m-iap-revenue-12m-downloads/) ; [Global Games Forum](https://www.globalgamesforum.com/ctv/how-survivor.io-continues-to-pull-in-5-million-a-month-three-years-later)

### Inferences
- poncle が新エンジンをモバイル/コンソール先行で出したことは、Phaser/Electron 版の性能問題がモバイルで最も深刻だったことを示唆する（直接の発言は未確認）。
- モバイルでは「物理ティック 30Hz・描画 60fps」のような分離や、タッチ端末での AA/解像度の段階的縮小が現実的な出発点。

### Gaps
- バッテリー/熱、30fps と 60fps の採用方針、低価格 Android の目標端末、広告 SDK（AdMob/IronSource 等）統合コストに関する出荷作品の一次ソースは未取得（検索予算上限）。
- Survivor.io の技術的実装（エンジン、同時敵数）は未確認。

---

## Q5. データ駆動設計（武器/パッシブ/進化/レベル、レベルアップ抽選、ステータス計算式、スポーンテーブル、セーブ/メタ、シード、シミュレーション）

### Takeaway
Vampire Survivors は「武器＝レベル1の完全オブジェクト＋以降は差分オブジェクトの配列」という JSON 構造、ステージは「分ごとの `minimum`/`frequency`/`enemies[]`/`bosses[]`/`events[]`」テーブル、メタ進行は PowerUp ごとのランク配列（例: COOLDOWN は -2.5%×2 ランク、AMOUNT は +1 で 5,000 金貨）で表現され、クールダウン総減少は -90% で上限。Megabonk は「(加算の和)×(基礎の和)×(乗算の積)」の3層スタック、Brotato は Godot Resource（.tres）、Unity 系 OSS は ScriptableObject（＋Addressables/Blob）を採用している。

### Cited Findings

**武器/進化データ（Vampire Survivors, v1.16 抽出）**
- `Weapon.json` はトップレベルキーが武器 ID（WHIP, VAMPIRICA, MAGIC_MISSILE, HOLY_MISSILE, KNIFE, THOUSAND, AXE, SCYTHE, CROSS, HEAVENSWORD, HOLYBOOK, VESPERS, FIREBALL, HELLFIRE, GARLIC, VORTEX, HOLYWATER, BORA, DIAMOND, ROCHER, LIGHTNING, LOOP, PENTAGRAM…）、値は配列。要素0がレベル1の完全オブジェクト、要素1以降は「そのレベルで変化するステータスのみ」の差分オブジェクト（レベルNは基礎＋差分1..N-1 の累積）。進化武器は要素1つの配列 — [VampireSurvivorsFiles: Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)
- 基礎オブジェクトのフィールド: `level, sealable, bulletType, price, name, description, tips, texture, frameName, evoSynergy, evoInto, evolvesFrom, requires, isEvolution, isUnlocked, hidden, poolLimit, rarity, tags, hitVFX, volume, interval, repeatInterval, duration, hitBoxDelay, intervalDependsOnDuration, power, area, speed, amount, penetrating, knockback, critChance, critMul, hitsWalls, unexcludeSelf`。差分オブジェクトのフィールド: `amount, power, area, speed, interval, repeatInterval, duration, penetrating, addEvolvedWeapon`。クールダウンは `interval`（ミリ秒）で表現され、明示的な `maxLevel` はなく配列長がレベル数 — 同上
- WHIP の例: Lv2 `{"amount": 1}`、Lv3 `{"power": 0.5}`、Lv4 `{"power": 0.5, "area": 0.1}`、最終 `{"power": 0.5, "addEvolvedWeapon": "VAMPIRICA"}`（進化の解放をデータで表現） — 同上
- Megabonk の `WeaponData` ScriptableObject フィールド: `eWeapon, icon, onlySpawnWhenCloseEnemies, element, upgradeData, baseStats, damage, knockback, critChance, projectiles, projectileBounces, projectileSpeed, canBounce, attackDuration, maxDuration, endCooldown, burstTime, minBurstInterval, maxSizeMultiplier, effectDuration, procCoefficient, spawnProjectileRange, amplificationMode, useVision, canMultiHit, hasCrosshair, isAura`。ゲームプレイ武器は 30 種（EWeapon 0〜30 から Test を除く） — [lukeod/megabonk_research: weapons.md](https://github.com/lukeod/megabonk_research/blob/main/weapons.md)
- Brotato: `WeaponData` はティアごとに 1 リソース、`add_to_chars_as_starting` で初期武器割当。アイテム/キャラ/敵/難易度も同様に Resource — [Brotato-ContentLoader](https://github.com/BrotatoMods/Brotato-ContentLoader)
- Unity OSS: Roo-Roo-Roo の Unity 6 テンプレートは「ScriptableObject 駆動の構成、モジュール式戦闘/スキルシステム、イベントチャンネル、バフ（燃焼/凍結/減速）、進化武器、重み付き手続きマップタイル」。元は Asset Store で 30 ドルで販売されていたものを MIT 公開 — [Roo-Roo-Roo/survivors-roguelike-kit](https://github.com/Roo-Roo-Roo/survivors-roguelike-kit)
- Unity DOTS 版: 属性システムは「base/current 値と Add/Mul/Override 修飾子の集計」、ダメージパイプラインは BlendPlayerAttack → BaseDamage → Crit → Armor → Multiply の段階構成で実行時パッチ可能、ScriptableObject 設定を Addressables で読み込み Blob 化 — [MiShoU-msu/DOTS-Survivors](https://github.com/MiShoU-msu/DOTS-Survivors)
- 韓国製 Unity クローン: 敵 4 種の定義を ScriptableObject に持ち、シングルトン経由でアクセス。「タイプごとにクラスを作るより ScriptableObject を選んだ」 — [SikPang/Unity-VampireSurvivors-Copy](https://github.com/SikPang/Unity-VampireSurvivors-Copy)

**ステータス修飾のスタック（加算 vs 乗算）と計算式**
- Vampire Survivors: Cooldown 減少は合計 -90% でハードキャップ（-110% でも -90% 扱い）。Pentagram と Gorgeous Moon は別途「発動間隔 15 秒」の上限。持続型武器のクールダウン＝基礎クールダウン＋基礎持続時間（Duration ステータスの増分は無視）。Empty Tome は 1 レベルあたり -8%、Lv5 で -40%（Steam コミュニティ投稿、要約ベース） — [Steam Community discussion](https://steamcommunity.com/app/1794680/discussions/0/3418810907938657965) ; [Steam Community discussion 2](https://steamcommunity.com/app/1794680/discussions/0/3418810183136167267)
- VS Wiki: Area はプレイヤーの基礎 100% から修正、SpellStrike のダメージは「Might の 1.25 倍」を追加で乗算、SpellStream は Area を乗算、一部武器は Amount を無視（要約ベース） — [vampire.survivors.wiki: Area](https://vampire.survivors.wiki/w/Area) ; [Spellstrike](https://vampire.survivors.wiki/w/Spellstrike) ; [Spellstream](https://vampire.survivors.wiki/w/Spellstream) ; [Clear Asteroids (Fandom)](https://vampire-survivors.fandom.com/wiki/Clear_Asteroids)
- Megabonk の最終値（`StatComponents::GetFinalValue`）: `(Additive1 + Additive2) × (Base1 + Base2) × (Multiplicative1 × Multiplicative2)`。加算修飾は合計、乗算修飾は積、`AddFlat` は基礎値に直接加算。防御後ダメージ = (1 − Armor) × BaseDamage、最終 = × (1 − DamageReduction)。クリティカル: 基本回数 floor(critChance)、端数は確率で追加、1 回 2.0×、n≥2 回で (n×0.5)² + (n+1)（2回 4.0×、3回 6.25×、4回 9.0×）。Projectiles と Bounces は floor で整数化。移動速度倍率 = ((Stat − 1.5) × 0.25) + 1.0 を [1.0, 4.0] にクランプ。ダメージは [1, 2,147,483,600] にクランプ。レアリティ倍率 1.0×（Common）〜2.0×（Legendary）、アップグレード値 = round(基礎値 × レアリティ倍率, 2)、Common は 50% で修飾子 1 or 2 個 — [lukeod/megabonk_research: mechanics.md](https://github.com/lukeod/megabonk_research/blob/main/mechanics.md) ; [weapons.md](https://github.com/lukeod/megabonk_research/blob/main/weapons.md)

**レベルアップ抽選（リロール/スキップ/バニッシュ）**
- VS の `PowerUp.json`（メタ進行）には隠し項目として `REROLL`（1 ランク +2、価格 500、5 ランク）、`SKIP`（+2、価格 100、5 ランク）、`BANISH`（+2、価格 100、5 ランク）、`RECYCLE`（+0.1、500）があり、リロール/スキップ/バニッシュの回数が「ランク配列」としてデータ化されている — [VampireSurvivorsFiles: PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json)
- 武器の基礎オブジェクトに `rarity` と `poolLimit` があり、抽選重みと所持上限がデータ側にある — [Weapon.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Weapon.json)
- 韓国製 Unity クローン: レベルアップごとにランダム 3 択 — [SikPang/Unity-VampireSurvivors-Copy](https://github.com/SikPang/Unity-VampireSurvivors-Copy)
- Godot Web 向け作例: 19 枚のアップグレードカードのプール、ティア制のフォーム 20 種 — [Mocas-12/no-survivor-game](https://github.com/Mocas-12/no-survivor-game)

**敵スポーンスケジュール**
- VS `Stage.json`: ステージ群（FOREST, LIBRARY, …）ごとに配列、要素0がステージ設定、以降が分ごとのエントリ。分エントリの例（minute 2）: `"minute": 2, "minimum": 50, "frequency": 500, "enemies": ["BAT1", "BAT2", "BAT3"]`。他に `bosses[]`、`events[]`（`eventType, delay, repeat, chance, duration`）、`treasure`/`arcanaTreasure`（`chances, level, prizeTypes[], fixedPrizes[]`）、`arcanaHolder`。ステージ設定には `mods`（`TimeLimit, ClockSpeed, PlayerPxSpeed, EnemySpeed, ProjectileSpeed, GoldMultiplier, EnemyHealthMultiplier, LuckBonus, XPBonus`）、`hyper`（同＋`StartingSpawns`）、`inverse`（`TimeMods: start, hpPerMinute, speedPerMinute`）、破壊物（`destructibleType, destructibleFreq, destructibleChance, destructibleChanceMax, maxDestructibles`）、`startingSpawns, spawnType, dayNight`、タイルマップは Tiled の JSON（`tilemapTiledJSON, tilemapTiledIMG`）を参照。ファイルは 14,468 行 — [VampireSurvivorsFiles: Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json)
- Unity モバイルクローン: 敵スポーン確率とレートを「キーフレームシステム」で制御 — [matthiasbroske/VampireSurvivorsClone](https://github.com/matthiasbroske/VampireSurvivorsClone)
- 韓国製 Unity クローン: 0.5 秒ごとに四方からスポーン、ステージごとに異なるキー — [SikPang/Unity-VampireSurvivors-Copy](https://github.com/SikPang/Unity-VampireSurvivors-Copy)
- Godot Web 作例: スコア上昇でスポーン間隔 0.9 秒→0.3 秒、ボス波ごとに敵 HP 約 1.15 倍 — [Mocas-12/no-survivor-game](https://github.com/Mocas-12/no-survivor-game)

**セーブ / メタ進行**
- VS の `PowerUp.json` 全表（価格・ランク・1 ランクあたりの修正値）: POWER +0.05×5（200）、ARMOR +1×3（600）、MAXHEALTH +0.1×3（200）、REGEN +0.1×5（200）、COOLDOWN -0.025×2（900）、AREA +0.05×2（300）、SPEED +0.1×2（300）、DURATION +0.15×2（300）、AMOUNT +1×1（5,000）、MOVESPEED +0.05×2（300）、MAGNET +0.25×2（300）、LUCK +0.1×3（600）、GROWTH +0.03×5（900）、GREED +0.1×5（200）、CURSE +0.1×5（1,666）、REVIVAL +1×1（10,000）、SEAL〜SEAL4 各 10 ランク（2,000〜8,000）。価格は要素0にのみ存在し、ランクごとの価格上昇はデータに無い（ゲーム側計算） — [PowerUp.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/PowerUp.json)
- コミュニティ製「パワーアップ最安購入順計算機」が存在（価格がランクごとに逓増する設計の傍証） — [benediktwerner/vampire-survivors-power-up-calculator](https://github.com/benediktwerner/vampire-survivors-power-up-calculator)
- Godot Web 作例: ベストスコアは Web では localStorage、デスクトップではファイル保存 — [Mocas-12/no-survivor-game](https://github.com/Mocas-12/no-survivor-game)
- Roo-Roo-Roo テンプレート: セーブ/設定システムを同梱 — [survivors-roguelike-kit](https://github.com/Roo-Roo-Roo/survivors-roguelike-kit)

**ローカライズ / スプレッドシート運用**
- poncle 公式: 公開ローカライズ用スプレッドシート（.xlsx）を Node スクリプトでゲームが読む .json に変換、`langs.json` に言語定義 — [Poncle/vampire-survivors-localisation](https://github.com/Poncle/vampire-survivors-localisation)
- Brotato 公式翻訳は CSV — [Brotato-Translations](https://github.com/BrotatoMods/Brotato-Translations)

**バランス調整のためのシミュレーション / ボット**
- VS 用「整数線形計画で最適コンボを生成」するツール — [ychalier/vampire-survivors-combo-builder](https://github.com/ychalier/vampire-survivors-combo-builder)
- Brotato 用「D6 を全 64 キャラで自動プレイするワンクリックボット」（Steam Workshop MOD）と「オートバトラー化 MOD（botato）」がコミュニティに存在 — [HelpFreedom/brotato-full-autobot](https://github.com/HelpFreedom/brotato-full-autobot) ; [boardengineer/botato](https://github.com/boardengineer/botato)
- Godot 作例: 難易度を線形回帰で調整するサバイバー型 — [SebastianGranadosJ/Capybara-Survivor-GodotGame](https://github.com/SebastianGranadosJ/Capybara-Survivor-GodotGame)

### Inferences
- VS の「基礎＋差分配列」は、スプレッドシート 1 行＝1 レベルで管理しやすく、`addEvolvedWeapon` のような「レベル到達時トリガ」もデータで表現できる。新規開発でも JSON/CSV→Resource/ScriptableObject の変換パイプラインを最初に作る価値がある。
- 計算式は「加算系（Might +%）は合計してから乗算」「クールダウンは下限（VS -90%、PowerUp 側は -5%）を設ける」「Amount/Projectiles は整数化」が共通パターン。Megabonk の 3 層式は Path of Exile 系の増加/倍加に相当する実装例。
- スポーンテーブルは「分（または秒）ごとの最低同時数（`minimum`）と出現頻度（`frequency`）＋敵 ID リスト」で十分で、VS もそれ以上複雑な構造は持たない。
- 決定論的シードは VS/Brotato とも公式に明示したソースが無く、一般にこのジャンルでは不要（リプレイ/デイリーが無いため）。

### Gaps
- VS の武器レベルアップ時の抽選アルゴリズム（重み、所持武器優先、空きスロット判定）はデータから読めず、コード側の一次ソースなし。
- Brotato のステータス計算式（例: % ダメージと乗算の順序）の一次ソース未取得。
- セーブデータ形式（VS の SaveData.sav の暗号化有無等）や、出荷作品が決定論的シードやヘッドレスシミュレーションでバランス調整している一次ソースは見つからなかった。

---

## Q6. オープンソース／チュートリアル／テンプレート（GitHub、YouTube、アセットストア、日本語資料）

### Takeaway
GitHub の「vampire-survivors」トピックには 72 リポジトリがあり、スター上位は Unity 製モバイルクローン（282★）、C/raylib（186★）、Unity 韓国製（181★）、Godot 4 C# キット（110★）、Flecs/raylib の ECS 連載（71★）。動画講座は GDQuest（Godot 4、無料、2025年9月更新）、Firebelley Games（Udemy）、Branno（Godot 4）、Goldmetal「Undead Survivor」（Unity、韓国語）が定番で、無料テンプレートは Unity 公式「DOTS Survivors」と MIT 化された元 30 ドルの Unity 6 キットがある。日本語の Qiita/Zenn/YouTube 資料は本セッションでは定量確認できなかった。

### Cited Findings

**GitHub（2026-11-03 時点のスター数、`gh search repos` による）**
- トピック「vampire-survivors」は 72 リポジトリ — [GitHub topic: vampire-survivors](https://github.com/topics/vampire-survivors)
- Unity: matthiasbroske/VampireSurvivorsClone（282★, Unity 2021.3+, MIT, モバイル, 20+ 武器/4 敵/2 ボス、中国語ローカライズ） — [repo](https://github.com/matthiasbroske/VampireSurvivorsClone)
- Unity: SikPang/Unity-VampireSurvivors-Copy（181★, 2022年, 6 武器, Android/iOS, MIT, README は韓国語） — [repo](https://github.com/SikPang/Unity-VampireSurvivors-Copy)
- Unity: Roo-Roo-Roo/survivors-roguelike-kit（45★, Unity 6 Built-in RP, MIT, 元 Asset Store 30 ドル, DOTween 同梱のため商用は DOTween ライセンス要, ピクセル/UI アセットの一部は AI 生成） — [repo](https://github.com/Roo-Roo-Roo/survivors-roguelike-kit)
- Unity: getsentry/sentaur-survivors（18★, Unity 2022.3.7f1, Apache 2.0, 4 武器/7 敵/7 アイテム） — [repo](https://github.com/getsentry/sentaur-survivors)
- Unity: newtron-vania/Undead_Survivor（90★, 韓国語, 武器 6 種, オブジェクトプール, Asset Store「Undead Survivor Assets Pack」使用） — [repo](https://github.com/newtron-vania/Undead_Survivor-Vampire_Survivor-copy-practice)
- Unity DOTS: MiShoU-msu/DOTS-Survivors（4★, Unity 2022.3.17, Entities 1.3.10, Turbo Makes Games 系チュートリアルのアセットを元にリファクタ） — [repo](https://github.com/MiShoU-msu/DOTS-Survivors) ; Balkera/DOTS-Survivor（Turbo Makes Games に触発されたモバイル向け） — [repo](https://github.com/Balkera/DOTS-Survivor)
- Godot: DarkRewar/SurvivorsStarterKit（110★, Godot 4.6, C#, MIT, Jolt, 4 スペル/5 敵, KayKit/Kenney アセット） — [repo](https://github.com/DarkRewar/SurvivorsStarterKit)
- Godot: Mocas-12/no-survivor-game（33★, Godot 4.7, GDScript, Web 版, MIT） — [repo](https://github.com/Mocas-12/no-survivor-game)
- Godot: migalvalm/vampire-survivors-clone（28★, Godot 4.0）、antwxne/CAU_Napoleon_Game（25★）、sh-cho/godot-survivor-tutorial（9★, Firebelley Udemy 講座準拠）、Gatreh/vampire-survivors-clone（8★, GDQuest 準拠）、SarutobiSasuke8/BrotatoLike（Godot 4, Brotato 風学習用） — [GitHub search](https://github.com/sh-cho/godot-survivor-tutorial)
- Godot マルチプレイ: ape1121/Godot4-Multiplayer-Survivor-IO-Game（50★, サーバー権威, WebSocket+SSL, MultiplayerSynchronizer/MultiplayerSpawner, HTML5 向け, MIT） — [repo](https://github.com/ape1121/Godot4-Multiplayer-Survivor-IO-Game)
- C/C++: bones-ai/c-blob-survival（186★, C+raylib, クアッドツリー, ボイド）、ptidejteam/ecs-survivors（71★, Flecs+raylib, ブログ 10 パート, GPL-3.0）、Cakez77/VampireSurvivors（43★, OpenGL）、Ninetyfiv3/ProjectVoid（47★, Qt） — [c-blob-survival](https://github.com/bones-ai/c-blob-survival) ; [ecs-survivors](https://github.com/ptidejteam/ecs-survivors)
- Web: giovanneluna/poke-survivors（18★, Phaser 3+TS）、pedrobarretto/pokemon-survivors（28★, TS）、ricardo-foundry/canvas-vampire-survivors（7★, 依存ゼロ Canvas）、JPTER78/pokesurvivor（503★, HTML, 非営利ファンゲーム）、Noniv/dreamtide-ts（WebGPU） — [GitHub topic](https://github.com/topics/vampire-survivors)
- Rust/Bevy: seancribbs/survivors-game（13★）、JamesHDuffield/ascii-rust（12★）、schweller/vs-demake-lowrezjam2023（12★） — [seancribbs/survivors-game](https://github.com/seancribbs/survivors-game)
- Python: kairess/Vampire-Survivors-Python（pygame, 韓国語動画付き） — [repo](https://github.com/kairess/Vampire-Survivors-Python)
- Java: Quillraven/slime-survivor（LibGDX, YouTube チュートリアル用） — [repo](https://github.com/Quillraven/slime-survivor)
- VS の実データ: SurvivatonsAndMore/VampireSurvivorsFiles（v1.16 の JSON 一式）と VampireUnpacker — [VampireSurvivorsFiles](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles) ; [VampireUnpacker](https://github.com/SurvivatonsAndMore/VampireUnpacker)
- Brotato MOD 基盤: BrotatoMods/Brotato-ContentLoader（17★）、Brotato-Brotils（11★）、GodotModding/godot-mod-loader — [Brotato-ContentLoader](https://github.com/BrotatoMods/Brotato-ContentLoader)

**動画 / 講座 / 書籍**
- GDQuest「Your First 2D Game From Zero in Godot 4: Vampire Survivor Style」: Godot 4.x、2025年9月更新、デモ DL あり、「Vampire Survivors 系は一座りで作れる最も簡単で満足度の高いゲームの一つ」（要約ベース）。YouTube 動画 ID は GwCiGixlqiU（学習リポの説明より） — [GDQuest library](https://www.gdquest.com/library/first_2d_game_godot4_vampire_survivor) ; [chriskilinc/Godot-GDQuest-VampireSurvivor-tutorial](https://github.com/chriskilinc/Godot-GDQuest-VampireSurvivor-tutorial)
- Branno「Make a Vampire Survivors Clone in Godot 4」: Godot フォーラムで「より高度で長い講座」と紹介（要約ベース） — [Godot Forum thread](https://forum.godotengine.org/t/make-a-2d-action-adventure-rpg-in-godot-4/52120)
- Firebelley Games「Create a Complete 2D Survivor Style Game in Godot 4」（Udemy） — [sh-cho/godot-survivor-tutorial README](https://github.com/sh-cho/godot-survivor-tutorial)
- Packt 書籍「Learning GDScript by Developing a Game with Godot 4」（Sander Vanhove）は Vampire Survivors 風ゲームを題材（要約ベース） — [Packt](https://subscription.packtpub.com/book/game-development/9781804616987/7)
- Goldmetal「Undead Survivor」（Unity, YouTube, 韓国語）: 学習リポジトリが「youtube lecture https://www.youtube.com/@goldmetal」を明記 — [hun2ch98/undead-survivor-unity](https://github.com/hun2ch98/undead-survivor-unity)
- Turbo Makes Games（Johnny Thompson）の Unity DOTS/ECS チュートリアルと DOTS Jam — [JohnnyTurbo/2020-LTS-ECS-Tutorials](https://github.com/JohnnyTurbo/2020-LTS-ECS-Tutorials)
- Inflearn「Unity 6 ECS/DOTS Programming Masterclass」（韓国語・有料） — [Inflearn](https://www.inflearn.com/en/course/절대강좌-유니티6-ecsdots-프로)
- Godot フォーラムの無料チュートリアル一覧（HeartBeast, Maker Tech 等） — [godotforums.org](https://godotforums.org/d/40607-a-big-list-of-great-free-godot-tutorial-series-videos)

**テンプレート / アセットストア**
- Unity 公式「DOTS Survivors」（無料、Unity 6、ECS、15 種×4 色＝42 敵）（要約ベース） — [Asset Store #309340](https://assetstore.unity.com/packages/slug/309340)
- Roo-Roo-Roo キット（元 30 ドル→無料 MIT, Unity 6） — [repo](https://github.com/Roo-Roo-Roo/survivors-roguelike-kit)
- Godot「Survivors Kit」（700 体 GDScript, Web デモ、価格はフォーラム投稿に記載なし/未確認） — [Godot Forum](https://forum.godotengine.org/t/survivors-kit-a-complete-survivors-like-template-for-godot-4-700-enemies-in-plain-gdscript-web-demo/146090)
- Martin Senges「Survivors Game Template」（Godot 4, itch.io, 価格未確認） — [itch.io devlog](https://martin-senges.itch.io/survivors-game-template/devlog/612239/release-of-my-survivors-template)
- hvnsart「Vampire Survivors Template」（itch.io, 価格未確認） — [itch.io](https://hvnsart.itch.io/vampire-survivors-template/purchase)
- zedtix「Megabonk: Complete Game Template（無料 DL）」「vampire-survivors」（itch.io） — [zedtix.itch.io/megabonk-template](https://zedtix.itch.io/megabonk-template) ; [zedtix.itch.io/vampire-survivors](https://zedtix.itch.io/vampire-survivors)
- Unity「Enemy Masses」（数千ユニット向けスキルシステム、ドキュメントあり、価格未確認） — [docs](https://arawn-software-publishing.gitbook.io/enemy-masses/basics/enemycrowd/melee-and-projectile-system/player-skills-system-example-implementation)
- Unity「Undead Survivor Assets Pack」（Asset Store、Goldmetal 講座用） — [newtron-vania README](https://github.com/newtron-vania/Undead_Survivor-Vampire_Survivor-copy-practice)

**日本語資料**
- 日本語報道: Automaton（VS エンジン移行 2023-07-13、HoloCure Steam 版 2023-07-16、Megabonk 2025-11-19）、Game*Spark、Inside Games、GameBusiness.jp（20MTD 開発者インタビュー 2022-06-15）、Mogura VR（HoloCure 開発者インタビュー） — [Automaton](https://automaton-media.com/articles/newsjp/20230713-255589/) ; [GameBusiness.jp](https://www.gamebusiness.jp/article/2022/06/15/20252.html) ; [Mogura VR](https://www.moguravr.com/holocure-developer-interviews/)
- Godot 公式ドキュメントの日本語訳（MultiMesh ページ） — [godot-ja.readthedocs.io](https://godot-ja.readthedocs.io/ja/latest/tutorials/performance/using_multimesh.html)
- Zenn（Happy Elements）: Unity ECS 0.51 で新作を開発した知見（高性能要求のため ECS を積極採用、メモリ効率は良いがデバッグは難しい）（要約ベース、サバイバーライク専用ではない） — [Zenn: hekk_ac_20221201](https://zenn.dev/happy_elements/articles/hekk_ac_20221201)
- GitHub 上の日本語リポジトリ（いずれも 0★、学習/AI 生成が中心）: mitsuruyamaura/Universal_2D_TopView_Shooter_Sample（「汎用2Dトップビューシューター。ヴァンサバなど」Unity）、Ryuki-Arai/InspireVampireSurvivors、gennsan0108/GuysAreLeaders（Unity）、yoshukin-cpu/vansaba-like（Godot, AI 生成）、rindadan0212-stack/hyakki-yagyo-survivors（Web/Canvas） — [mitsuruyamaura repo](https://github.com/mitsuruyamaura/Universal_2D_TopView_Shooter_Sample)

### Inferences
- 学習導線の充実度は Godot 4（GDQuest 無料＋Udemy＋Branno）と Unity（Goldmetal の韓国語講座が事実上の標準、英語では Turbo Makes Games の DOTS）が突出。日本語ではニュース記事は豊富だが、実装チュートリアルは GitHub 上でも小規模なものしか見つからず、英語/韓国語資料への依存が前提。
- 無料テンプレートを出発点にするなら、Unity は「DOTS Survivors（公式、ECS）」か「Roo-Roo-Roo キット（MonoBehaviour＋ScriptableObject）」、Godot は「DarkRewar（C#、ノード方式）」か「Survivors Kit（GDScript、配列＋MultiMesh、有料の可能性）」が構造の対照として有用。

### Gaps
- Qiita / Zenn / note / YouTube の「ヴァンサバ風 作り方」記事・動画の具体名・本数・エンジン別分布は、検索予算上限により未確認。
- Godot Asset Library や Unity Asset Store の価格（Survivors Kit, Martin Senges, hvnsart 等）は未確認。
- Branno 講座の長さ・Godot バージョン、Firebelley 講座の時間数は未確認。

---

## Q7. アセット制作（ピクセル/ベクター/3D ローポリ、アセットパック、ローンチ時コンテンツ量、ツール）

### Takeaway
OSS の作例は Kenney（CC0）、KayKit（Kay Lousberg）、Quaternius（CC0）、itch.io の個人作家パック（Luiz Melo, Sven Thole, Cainos）、Unity Asset Store の無料「Undead Survivor Assets Pack」を組み合わせており、ローンチ時の規模感は VS 1.0 計画（24 キャラ/48 武器/20 パワーアップ/10 ステージ）、DRG: Survivor（敵 10 種以上・ボス最大 3）、Megabonk（武器 30 種）、最小構成の OSS は「武器 4〜6・敵 4〜7・ボス 1〜2」。Megabonk の成功はローポリ 3D でも成立することを示す。

### Cited Findings
- Godot C# キットのクレジット: KayKit Character Animations / Dungeon Pack / Skeletons Pack（Kay Lousberg）、Pattern Pack（Kenney） — [DarkRewar/SurvivorsStarterKit](https://github.com/DarkRewar/SurvivorsStarterKit)
- Godot Web 作例: Quaternius「Ultimate Spaceships」（CC0 1.0）、フォントは Noto Sans SC サブセットと ZCOOL KuaiLe（SIL OFL）、SE/BGM は手続き合成 — [Mocas-12/no-survivor-game](https://github.com/Mocas-12/no-survivor-game)
- 韓国製 Unity クローン: Monsters Creatures Fantasy（Luiz Melo）、Hero Knight Pixel Art（Sven Thole）、Pixel Art Top Down Basic（Cainos） — [SikPang/Unity-VampireSurvivors-Copy](https://github.com/SikPang/Unity-VampireSurvivors-Copy)
- Sentaur Survivors: 音楽は Rolemusic「37 ohmperios」（CC BY 4.0）、コントローラーアイコンは Wikimedia Commons（CC BY-SA 4.0）、DOTween は独自ライセンス — [getsentry/sentaur-survivors](https://github.com/getsentry/sentaur-survivors)
- Roo-Roo-Roo キット: ピクセルアートと UI の一部は AI 生成、手描き風は作者制作 — [survivors-roguelike-kit](https://github.com/Roo-Roo-Roo/survivors-roguelike-kit)
- Kenney 連携ツール: Godot 用ドック「kenney-assets-helper」（20★）、Bevy 用ローダー「bevy-kenney-assets」 — [phnix-dev/kenney-assets-helper](https://github.com/phnix-dev/kenney-assets-helper) ; [rust-adventure/bevy-kenney-assets](https://github.com/rust-adventure/bevy-kenney-assets)
- Unity「Undead Survivor Assets Pack」（Asset Store） — [newtron-vania README](https://github.com/newtron-vania/Undead_Survivor-Vampire_Survivor-copy-practice)
- ツール: VS のステージは Tiled の JSON（`tilemapTiledJSON`）を参照 — [Stage.json](https://github.com/SurvivatonsAndMore/VampireSurvivorsFiles/blob/main/Data/Vampire%20Survivors/Stage.json) ; ECS Survivors は Tiled 連携に tmxlite — [ptidejteam/ecs-survivors](https://github.com/ptidejteam/ecs-survivors)
- ローンチ時コンテンツ量:
  - VS 1.0 の計画: 24 キャラ、48 武器（進化含む）、20 パワーアップ、通常 5＋特殊 5 ステージ（要約ベース） — [PC Invasion](https://pcinvasion.com/vampire-survivors-more-characters-weapons-launch)
  - VS の最初の DLC「Legacy of the Moonspell」（2022-12-15）: 新ステージ 1、新キャラ・新武器を追加（要約ベース） — [GameSpot](https://gamespot.com/articles/vampire-survivors-dlc-adds-new-characters-weapons-and-one-huge-stage-on-december-15/1100-6509753/)
  - DRG: Survivor 早期アクセス: 敵 10 種以上、ボス最大 3（要約ベース） — [Gematsu](https://www.gematsu.com/2023/03/survivor-like-auto-shooter-deep-rock-galactic-survivor-announced-for-pc)
  - Megabonk: ゲームプレイ武器 30 種、ステータス列挙 57 項目 — [lukeod/megabonk_research](https://github.com/lukeod/megabonk_research)
  - Unity 公式 DOTS Survivors: 敵 15 種（色違い込み 42） — [Asset Store #309340](https://assetstore.unity.com/packages/slug/309340)
  - 最小構成の OSS: Sentaur（武器 4/敵 7/アイテム 7）、matthiasbroske（武器 20+/敵 4/ボス 2）、DarkRewar（スペル 4/敵 5）、SikPang（武器 6/敵 4）、Mocas-12（敵 6/ボス 6/フォーム 20/カード 19） — 各 README 上記
  - Brotato は現在 64 キャラ（自動ボット MOD の説明より、ローンチ時ではない） — [HelpFreedom/brotato-full-autobot](https://github.com/HelpFreedom/brotato-full-autobot)
- 3D ローポリ: Megabonk は「グラフィックは良くない」と評されつつ 2 週間で 100 万本（要約ベース） — [VidaExtra](https://www.vidaextra.com/accion/nueva-sensacion-steam-siquiera-tiene-buenos-graficos-donde-ha-salido-que-especial) ; [Wikipedia: Megabonk](https://en.wikipedia.org/wiki/Megabonk)
- HoloCure の Kay Yu は WayForward（River City Girls）のリードアニメーター出身（ピクセルアニメの品質が強み）（要約ベース） — [holocure.wiki.gg: Kay Yu](https://holocure.wiki.gg/wiki/Kay_Yu)

### Inferences
- 最小実行可能（MVP）サバイバーライクの目安は「武器 6〜8（うち進化 2〜3）・パッシブ 6〜8・敵 6〜10・ボス 2〜3・ステージ 1〜2」程度で、出荷レベル（VS 1.0 / DRG）はその 3〜5 倍。
- Tiled（または LDtk）による JSON タイルマップは VS 自身が採用しており、エンジン非依存の無難な選択。
- 無料/CC0 資産（Kenney, Quaternius, KayKit）だけでも 3D ローポリの MVP は組めるが、商業的差別化は HoloCure（手描きアニメ）や Megabonk（キャラ/演出）のように「見た目のフック」に投資している。

### Gaps
- Aseprite / LDtk / Spine の採用実例や価格、Humble Bundle / OpenGameArt の具体パックは検索予算上限により未確認。
- 各出荷作品のローンチ時の正確な武器・キャラ数（Brotato 0.6 EA、20MTD EA、HoloCure 0.1、Halls of Torment EA）は未取得。

---

## Q8. ネットコード / 協力プレイの実現可能性とコスト

### Takeaway
Vampire Survivors は 2023年8月のローカル協力プレイ（v1.6）から 2025年10月31日のオンライン協力プレイ（v1.14、最大 4 人）まで 2 年以上を要し、当時「オンラインは一桁か二桁難しい」と述べていた。Brotato と Megabonk は公式より先にコミュニティ MOD（Steam Networking / P2P 最大 6 人）が実装したが、いずれもデシンクや同期漏れを抱えており、サバイバーライクの大量エネミー同期は「ホスト主導の部分同期」が現実解になっている。

### Cited Findings
- VS ローカル協力プレイは v1.6（2023年8月）で追加。当時開発陣は「オンラインは現時点で一桁か二桁難しい（an order of magnitude or two more complicated）」と発言（要約ベース） — [GamingOnLinux 2023-08](https://www.gamingonlinux.com/2023/08/vampire-survivors-co-op-and-new-game-engine-upgrade-is-live) ; [Push Square 2025-10](https://www.pushsquare.com/news/2025/10/vampire-survivors-online-co-op-confirmed-will-probably-crash-your-game-in-record-time)
- VS オンライン協力プレイは v1.14（2025年10月31日）で最大 4 人。Steam で公開ベータを先行実施。PS/Steam/iOS/Android が先で Xbox は遅延。オンラインでは「全員がレベルアップするまでレベルアップ画面が出ないバッチ方式」「ポーズは全員を止めず、短い無敵時間のみ」（要約ベース） — [Nintendo Wire](https://nintendowire.com/news/2025/10/29/vampire-survivors-1-14-update-set-for-release-on-october-31st-includes-online-co-op-dlc-updates-and-a-free-dlc-pack/) ; [Gematsu](https://www.gematsu.com/2025/10/vampire-survivors-version-1-14-update-announced-adds-online-co-op-and-more) ; [Siliconera（公開ベータ）](https://www.siliconera.com/vampire-survivors-online-co-op-public-beta-live-on-steam/)
- Brotato 非公式オンライン MOD「BrotatoOnline」: Steam は `SteamNetworkingMessages`、LAN は ENet、共通の `SessionManager` でホスト/クライアント・再接続・ルーティング。設計は「ホスト主導の混合同期」で、クライアントは Brotato の元ロジックでローカルシミュレーションを維持して通信量を抑制、戦闘はホストのスナップショット/イベントをクライアントがレプリカへ適用。最大 4 人。対応 Brotato 1.1.15.4 / ModLoader 6.2.0。UI を書き換える MOD はクリック同期を壊す — [xx666zz/BrotatoOnline](https://github.com/xx666zz/BrotatoOnline)
- Brotato「Brotatogether」（45★）は `steam_connection.gd` と `networking/` を持つ Steam ベースの MOD — [boardengineer/Brotatogether](https://github.com/boardengineer/Brotatogether/tree/main/Pasha-Brotatogether)
- Megabonk 非公式「megabonk-together」: P2P オンライン最大 6 人、IPv6 や直結失敗時はリレー（自己ホスト可能なマッチメイク/リレーサーバー同梱）、重要な相互作用は信頼性あり送信・それ以外は非信頼。同期は「武器/アップグレード、弾（不完全）、モンスター（移動・ターゲット・攻撃）、宝箱、祠、ポータル」で、デシンク（ゴールド、ゴーストアイテム）やマップ読込時クラッシュが既知。BepInEx 6（IL2CPP）、v1.0.49 向け — [Fcornaire/megabonk-together](https://github.com/Fcornaire/megabonk-together)
- Megabonk「multibonk」: TCP でホストがポート 25565 待受、ngrok/RadminVPN でトンネル、プレイヤー位置とマップ生成は同期済み、ドロップ/XP/宝箱は未実装、MelonLoader — [guilhermeljs/multibonk](https://github.com/guilhermeljs/multibonk)
- Godot 4 のサーバー権威型サバイバー（Survivor.io 風）: ヘッドレス Linux サーバー、WebSocket+SSL（Let's Encrypt 証明書）、MultiplayerSynchronizer / MultiplayerSpawner ＋ カスタム RPC、HTML5 クライアント — [ape1121/Godot4-Multiplayer-Survivor-IO-Game](https://github.com/ape1121/Godot4-Multiplayer-Survivor-IO-Game)
- Unity 3D VS 風で協力プレイを特徴とする OSS（10★） — [TheNishishiro/Requiem-for-a-Lost-World](https://github.com/TheNishishiro/Requiem-for-a-Lost-World)
- Phaser/Electron の LAN 協力サバイバー作例 — [BoominKimLogibros/codmos-survival](https://github.com/BoominKimLogibros/codmos-survival)
- Unity 公式 ECS サンプルには Netcode for Entities 1.4 のサンプルと「ECS Network Racing」が含まれる — [EntityComponentSystemSamples](https://github.com/Unity-Technologies/EntityComponentSystemSamples)

### Inferences
- ローカル協力プレイは「入力とカメラ・レベルアップ UI の多人数化」が主な作業で、VS が v1.6 で同時に実装できた規模。オンラインは数百〜千体の敵同期が本質的に重く、VS でも 2 年強、コミュニティ MOD でも「部分同期＋デシンク許容」に留まる。
- 現実的な設計は「ホスト権威＋敵は決定論的ローカルシミュレーション or 低頻度スナップショット、重要イベント（レベルアップ、宝箱、ボス）は信頼性送信、レベルアップはバッチ化」。VS のバッチレベルアップはこの設計上の帰結と読める。
- 新規開発では「ローカル協力は初期から設計（入力抽象化・複数プレイヤー配列）、オンラインは v1.0 後」が実績に沿う。

### Gaps
- VS オンライン協力の実装方式（ロールバック/ロックステップ/ホスト権威、Unity Netcode か独自か）の技術的一次ソースなし。
- Soulstone Survivors / DRG: Survivor / Halls of Torment の公式協力プレイ有無と実装（検索予算上限で未確認）。
- オンライン協力の開発コスト（人月）や、リレーサーバー運用費に関する公開データなし。
