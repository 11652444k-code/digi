# Survivor.io（ダダサバイバー）とモバイルF2Pサバイバーライクのメタ／ビジネスモデル分解

> **調査上の制約（必読）**
> - 本セッションではネットワークポリシーにより全ての外部ページ取得（WebFetch / curl）が403で遮断され、情報収集はWebSearchの結果要約（スニペット）のみに依存した。さらに途中でWebSearchの共有予算も枯渇したため、計画していた追加検索（日本の売上円換算、TV CM、2024-2026年の年次売上、クローン各社の売上、リテンション指標など）は実施できていない。
> - したがって各記述は「検索結果に現れた範囲」であり、原典全文での裏取りはできていない。数値は原則すべてSensor Tower / AppMagic 等の**推定値（第三者推計）**であり、Habby公式の発表値ではない（Habbyは売上を公表していない）。
> - 調査日：2026年11月3日。各数値には判明している範囲で日付を付した。
> - 検索結果の要約が複数ソースを束ねて提示していたため、一部の数値は「最も可能性の高い出典URL」を付している。確度が低いものは明記した。

---

## KQ1. Survivor.io の基本情報・売上・DL・国別構成・日本での実績・UA・推移

### Takeaway
Survivor.io（開発・パブリッシャー Habby、シンガポール設立の中国系パブリッシャー）は2022年8月のグローバルローンチから2か月で推定7,500万ドル/3,700万DLという異例の立ち上がりを見せ、2024年半ばには累計IAP 5億ドル超、2025年時点でも月500万ドル前後を維持している。ただしピーク（2022年後半〜2023年）からは明確に減少傾向にあり、Habby社内でもArchero 2 / Capybara Go! に主力の座を譲っている。国別では中国・韓国・米国が上位で、「日本シェアが非常に大きい」という仮説は、少なくとも入手できたデータ（ローンチ初期2か月で日本は5位・約6.1百万ドル≒8%）では**裏付けられなかった**（ただしDL数では日本で2022年下半期1位）。

### Cited Findings

**ローンチと初期の爆発的成長（2022年）**
- 2022年8月下旬時点でAxiosが「今モバイルで最もホットなゲーム」として取り上げ、TikTok広告が成長を後押ししたと報道 — [Axios 2022-08-26](https://www.axios.com/2022/08/26/survivorio-habby-tiktok-ios-android)
- 「TikTokがHabbyのSurvivor.ioをIAP売上1,500万ドル・1,200万DL超へ押し上げた」（ローンチ直後の報道・記事タイトルのみ確認） — [mobilegamer.biz](https://mobilegamer.biz/tiktok-drives-habbys-survivor-io-past-15m-iap-revenue-12m-downloads/)
- Sensor Tower独占チャート：Survivor.ioが米国で1位、中国・日本でトップ3入り（2022年、記事タイトルのみ確認） — [mobilegamer.biz](https://mobilegamer.biz/exclusive-sensor-tower-charts-habbys-survivor-io-hits-us-number-one-top-three-in-china-and-japan/)
- ローンチ2か月で累計IAP 7,500万ドル超・3,700万DL（AppMagic推計）。売上上位市場は中国2,030万ドル、韓国1,820万ドル、米国1,260万ドル、台湾790万ドル、日本610万ドル — [mobilegamer.biz 2022-10](https://mobilegamer.biz/two-months-in-survivor-io-passes-75m-from-37m-downloads/)
- Sensor Tower APAC Awards 2022：Survivor.ioは2022年下半期に**日本のモバイルゲームDLランキング1位** — [Sensor Tower blog](https://sensortower.com/blog/sensor-tower-apac-awards-2022-winners)
- 『アーチャー伝説』のHabby新作『ダダサバイバー』が日米中韓でDL1位獲得（2022年、記事タイトルのみ） — [chinagamenews.net](https://chinagamenews.net/market-info-1018/)；関連記事 [recgame.jp](https://recgame.jp/news/detail/1883)、[chinagamenews.net market-info-1020](https://chinagamenews.net/market-info-1020/)
- AppMagic：2022年8月の月間売上/DL上位タイトルにSurvivor.ioが登場 — [GameDev Reports (AppMagic Aug 2022)](https://gamedevreports.substack.com/p/appmagic-top-mobile-games-by-revenue-265)

**2023年**
- Sensor Tower調査：モバイル・ハイブリッドカジュアルの2023年世界IAP収益は前年比30%増の21億ドル超。『ダダサバイバー』は2023年1〜11月のIAP収益**2.4億ドル**で同カテゴリ収益トップをキープ — [gamebiz.jp 2023-12](https://gamebiz.jp/news/378767)
- 2023年1月27日時点のGoogle Play（日本）売上ランキングで『ダダサバイバー』が29位、初のトップ30入り — [gamebiz.jp](https://gamebiz.jp/news/363439)
- 2023年6月17〜23日のApp Store（日本）週間売上ランキングで24〜27位前後 — [gamebiz.jp](https://gamebiz.jp/news/370842)
- 2022年後半にAppMagicベースで累計IAP 2.5億ドル超との記述、および「2022年中盤〜後半の巨大な売上を維持するのは困難」とのアナリスト評 — [mobilegamer.biz data drop](https://mobilegamer.biz/data-drop-survivor-io-midcore-market-intel-nfl-rivals-mags-financials-dragon-quest-indias-gaming-boom-and-more/)
- TikTokマーケティング事例記事：「2億ドル超の売上」 — [CreatorDB blog](https://creatordb.app/blog/lessons-from-survivor-io-tiktok-marketing/)

**2024年〜2025年（累計5億ドル超、月500万ドル）**
- Sensor Towerアナリスト推計で累計IAPが**5億ドル超**（2024年）。国別シェアは中国24.2%、米国21.2%、韓国21.2%（米韓同率2位） — [WN Hub](https://wnhub.io/news/finance/item-43301)
- 2024年半ばに累計IAP 5億ドル超を突破し、その後も月500〜600万ドルを継続。トップ支出国は中国24.2%、韓国21.2%、米国21.2%。DL当たり平均課金額は韓国15.50ドル、中国約9ドル、米国約4.90ドル — [Games Forum / symphonyonline「How Survivor.io continues to pull in $5 million a month three years later」](https://www.gf.symphonyonline.co.uk/news/how-survivor.io-continues-to-pull-in-5-million-a-month-three-years-later)
- 2024年の分析：直近30日のDLは約100万だが同期間の売上は約500万ドル — [Fungies 2024](https://fungies.io/zombie-io-mobile-game-monetization-methods-and-strategies.md)
- 2024年11月の月間売上が500万ドルの「新安値」に落ちたとするYouTube動画（タイトル "Survivor.io's Revenue is PLUMMETING"） — [YouTube](https://www.youtube.com/watch?v=66HippAfTRQ)
- Naavik「The Evolution of Hybridcasual」：同記事で取り上げたハイブリッドカジュアル群のIAP収益をプールすると、Survivor.ioだけで**85%**を占める — [Naavik](https://naavik.co/deep-dives/evolution-of-hybridcasual-deepdive/)

**Habby全体のポートフォリオと相対位置（2025〜2026年）**
- Habbyは2018年1月シンガポール設立。累計IAP上位は Survivor!.io **4.76億ドル**、Archero 2.65億ドル、Archero 2 1.56億ドル、Capybara Go! 1.39億ドル、Souls 0.56億ドル（AppMagic推計・時点不明、おそらく2025年） — [PocketGamer.biz Habby company profile](https://www.pocketgamer.biz/industry/habby/)
- Habbyが累計ユーザー支出**20億ドル**・3.5億DLを突破。Survivor.ioが40%、Archeroが22%を占める（AppMagic） — [mobilegamer.biz data digest](https://mobilegamer.biz/data-digest-savvys-moonton-swoop-liftoff-kills-ipo-habby-hits-2bn-fallout-shelter-more/)；[Gamigion](https://www.gamigion.com/habby-hits-2b-in-user-spending-and-350m-downloads/)
- Capybara Go!ソフトローンチ時点（2024年）でHabby累計プレイヤー支出10億ドル超 — [PocketGamer.biz](https://www.pocketgamer.biz/after-1bn-in-player-spending-hybridcasual-specialist-habby-soft-launches-text-based-idle-rpg-capybara-go/)
- Capybara Go!は2025年2月2日に累計1億ドル突破 — [PocketGamer.biz](https://www.pocketgamer.biz/habbys-capybara-go-surpasses-100m-in-gross-player-spending/)
- Archero 2 は初週660万ドル（Archero累計の10%超）、初30日で3,280万ドル — [PocketGamer.biz 初週](https://www.pocketgamer.biz/habbys-archero-2-makes-6-6m-in-first-week-over-10-of-archeros-lifetime-earnings/)；[PocketGamer.biz 30日](https://www.pocketgamer.biz/archero-2-makes-328m-in-first-30-days-from-player-spending/)；[Game World Observer 2025-01-20](https://gameworldobserver.com/2025/01/20/archero-2-revenue-8-million-in-11-days-vs-original-game)
- Wittle Defender（Habby新作）は2025年6月9日グローバルローンチ、日次売上30万ドル超だが「Survivor.io、Capybara Go、Archero 1&2には及ばない」 — [AppMagic on X 2025-06](https://x.com/AppMagicRocks/status/1935640675569291769)
- Deconstructor of Fun「HABBY's Hybridcasual Empire: The Template That Built a Powerhouse」（2025-07-31）がHabbyのテンプレートを分析（本文は取得不可） — [DoF](https://www.deconstructoroffun.com/blog/2025/7/31/habbys-hybridcasual-empire-the-template-that-built-a-powerhouse)
- 2025年の新作トップ10（計22億ドル）はアジア系が席巻、との記事（Habby関連の言及あり、本文未確認） — [PocketGamer.biz](https://www.pocketgamer.biz/asia-dominates-2025s-biggest-mobile-releases-as-top-10-new-games-make-22bn/)

**日本市場の推定値（セルラン分析サイト・時点不明）**
- APPLION：『ダダサバイバー』月間売上推定**1億2,000万円**（iOS/Android）、ゲーム147位 — [APPLION](https://applion.jp/iphone/app/1528941310/market/)
- iDayo：日本App Store仮想順位239位（日付不明） — [iDayo](https://idayo.jp/?cmd=apd&apid=1528941310&country=jp)
- ゴリラwiki：売上推移予測で114位（2026年8月欄は「-」） — [ゴリラwiki](https://gorillawiki.jp/salesapp/1528941310)
- Game-i 世界分析ページ（本文取得不可） — [Game-i](https://game-i.daa.jp/?cmd=world_analytics&apid=1528941310)
- 日本公式タイトルは『ダダサバイバー』、App Store JPのデベロッパ表記は "HABBY" — [App Store JP](https://apps.apple.com/jp/app/%E3%83%80%E3%83%80%E3%82%B5%E3%83%90%E3%82%A4%E3%83%90%E3%83%BC/id1528941310)

**UA／マーケティング**
- Naavik：ある週のTikTok広告トップ10のうち3本がSurvivor.ioの広告だった（2022年） — [Naavik「How Survivor.io Mastered TikTok UA」](https://naavik.co/digest/how-habby-mastered-tiktok-ua-for-survivor/)
- Matej LancaricによるグローバルローンチUAケーススタディ（本文取得不可） — [lancaric.me](https://lancaric.me/survivor-io-global-launch-ua-case-study/)；[blakeir.com 転載](https://blakeir.com/survivorio-global-launch-ua-case-study)
- Habby傘下の『ダダサバイバー』のTV CMに関する情報は検索では見つからなかった（後述Gaps）。

### Inferences
- **年次売上の推移（推計）**：ローンチ2か月で7,500万ドル→2023年1〜11月2.4億ドル→2024年半ば累計5億ドル超→2024年11月以降は月500万ドル前後（年換算約6,000万ドル）。2023年の月平均約2,200万ドルから2024年末には1/4程度へ減少しており、**「2024〜2026年に売上は明確に減少した」はおおむね成立**。ただし2025〜2026年の月次データは入手できていない。
- **累計売上の数値の食い違い**：PocketGamer.bizのHabbyプロフィールは4.76億ドル、別の検索要約には6.284億ドル・4.645億ドルという数字も現れ、「Habby 20億ドルの40%」なら約8億ドルになる。AppMagicの「グロス（ストア手数料込み）」と「ネット」の違い、および集計時点の違いが原因と推測される（グロス→ネットは概ね×0.7）。
- **日本シェア**：初期2か月の日本売上6.1百万ドルは全体7,500万ドルの約8%で、中国27%・韓国24%・米国17%に遠く及ばない。DLでは日本1位（2022年下半期）だったので、「日本はDLは多いが課金率は相対的に低い」市場と見るのが妥当。APPLIONの「月1.2億円（約80万ドル）」が正しければ、全世界500万ドル/月に対し約15%で、初期より日本比率は上がっている可能性があるが、推計サイト同士の比較であり確度は低い。
- 韓国のDL当たり課金額15.50ドルが米国の3倍超という点は、Habbyが韓国・中国・日本などアジア市場向けの価格・パック設計を重視している可能性を示唆する。

### Gaps
- Sensor Tower / AppMagic / data.ai の**年別（2022/2023/2024/2025/2026）の正式な売上・DL推計**は入手できなかった（検索要約にしか現れず、原典ページは取得不可）。
- **日本の累計／年間売上（円建て）**、日本のシェア（%）、日本のApp Store売上最高順位は確認できなかった。ゴリラwiki・APPLION等の推計は時点不明。
- **日本でのTV CM**の有無・放映時期・起用タレントは検索で一切ヒットせず（未実施の可能性も含め未確認）。
- Habby Japan のPR TIMESプレスリリース、ファミ通App、AUTOMATON等の日本語報道は本セッションでは到達できなかった。
- マーケティング費（UA spend）の推定額、CPIは見つからなかった。
- 2025年・2026年の月次売上、DAU/MAU、3周年（2025年8月）時点の数値は未取得。

---

## KQ2. Vampire Survivors からのコアループ変更点（章構成・進化・モード・ヒーロー）

### Takeaway
Survivor.ioはVampire Survivorsの「1ランで完結するローグライト」を、**エネルギーで区切られた章（チャプター）攻略 + 永続装備・ヒーロー育成 + 複数の周回モード（Trials／Patrol／Daily Challenge／Clan）**という典型的な中華系モバイルRPGのメタに載せ替えた。章数は2026年9月時点でファンwiki上350章まで拡張されており、ラン内の「武器＋対応パッシブ→進化」はVSのシステムを踏襲しつつ、ラン外に巨大な成長レイヤー（S級→SS級装備、Astral Forge、Chaos Fusion）を積み増し続けている。

### Cited Findings
- AppQuantum（PocketGamer.biz寄稿、2022年10月）がSurvivor.ioの「革新と反復」を分解（本文取得不可） — [AppQuantum](https://www.appquantum.com/news/october-2022/appquantums-deconstruct-for-pocketgamer.biz-how-innovation-and-iteration-has-transformed-survivor.io.html)
- Naavikディープダイブ「Survivor.io: Will It Follow in Archero's Footsteps?」：メタゲームは序盤はよく課金させるが**すぐに進行の壁に当たり**、そこで安価な序盤パックが魅力的になる。新規の有料ヒーローは既存より大幅に強くはできない（既存の進捗に多大な労力がかかるため） — [Naavik](https://naavik.co/deep-dives/survivorio-archeros-footsteps/)
- 章（Chapters）：ファンwikiによれば**2026年9月17日時点で350章** — [Survivor.io Fandom: Chapters](https://survivorio.fandom.com/wiki/Chapters)
- 章の例：Chapter 2 "City Park"、Chapter 6 "Suburbia"、Chapter 15 "Core Control"、Chapter 20 "Desert Center" — [AppGamer Chapter 6](https://www.appgamer.com/survivorio/chapter-6-suburbia)；[AppGamer Wiki](https://www.appgamer.com/survivorio-wiki-guide/)；[YouTube Chapter 20](https://www.youtube.com/watch?v=ie5aHYCztJ0)
- 進化（Evolution）の例：Durian（粘着爆弾）はパッシブ "HE Fuel" と組み合わせて Caltrops に進化する — [Pro Game Guides（2022年）](https://progameguides.com/survivor-io/how-to-clear-chapters-1-10-in-survivor-io/)
- Trials：Chapter 2 "City Park" クリア後に解放。既存レベルを高難度で再プレイするモードで、他モードでは入手不可の特別アイテム（進化系アップグレードに使う Gold DNA 等）の主要入手源 — [AppGamer Trials](https://www.appgamer.com/survivorio/strategy-guide/trials)
- Daily Challenge（デイリーチャレンジ）はリソース獲得機会、Weekly Tasks は難度が高く1週間の猶予、期間限定イベントが限定モードを追加 — [AppGamer Weekly Tasks](https://www.appgamer.com/survivorio/weekly-tasks)
- Patrol（放置報酬）：定期的に回収し、余剰エネルギーは Quick Patrol に使う推奨 — [AppGamer Grinding Guide](https://www.appgamer.com/survivorio/grinding-guide)
- Clan 機能はアップデートで追加され、Clan Expedition / Clan Exploration が存在（APKMirrorのパッチノート） — [APKMirror Survivor.io 2.x releases](https://www.apkmirror.com/apk/habby/survivor-io/survivor-io-2-6-0-release/)
- 「Zone Operation」というシーズン制モードへの言及あり（詳細不明） — [APKMirror 2.10.0](https://apkmirror.com/apk/habby/survivor-io/survivor-io-2-10-0-release)
- ヒーロー：Common、Worm、Tsukiyomi、Catnip などが存在し、S級ヒーローのスキルボタンはリマップ可能 — [MuMu Hero Tier List](https://www.mumuglobal.com/blog/survivorio-hero-tier-list.html)
- ヒーロー Energy Essence（ヒーローLv上げ素材）は章クリアとPatrolで獲得 — [GamerJournalist](https://gamerjournalist.com/how-to-use-energy-essence-in-survivor-io/)
- 2026年10月時点のティアリスト（武器・スキル・装備）が更新され続けている — [Gfinity tier list (Oct 2026)](https://www.gfinityesports.com/article/survivor-io-tier-list)
- 日本語攻略：Game8『ダダサバイバー』攻略 — [Game8](https://game8.jp/dadasurvivor/546656)；神ゲー攻略 — [kamigame](https://kamigame.jp/dadasurvivor/index.html)
- 紹介記事：「1000体以上のゾンビを一人で倒す、片手操作のローグライク。基本プレイ無料でガチャ等の課金要素はあるが無課金でも十分遊べる」 — [appmatch.jp](https://appmatch.jp/?p=42885)

### Inferences
- VSとの最大の差は「**1ラン＝章＝エネルギー消費単位**」にしたこと。これによりセッション数が制限され、放置報酬（Patrol）・Trials・Daily Challenge といった「同じコアを別報酬テーブルで回す」モードを並列に置くことで、1日のプレイ動機を複数の時間帯に分散させている。
- 350章（2026年9月）という規模は、章そのものをコンテンツ消費財ではなく「装備パワーを測るゲート」として使っていることを示す。進行の壁（Naavik）は章ごとの推奨戦力で作られ、壁の直前で安価パックを提示するのが基本設計。
- 「武器＋特定パッシブ＝進化」はVSからそのまま持ち込まれた唯一の"ラン内"深み。Habbyはラン内のビルド幅を増やすより、**ラン外（装備・ヒーロー・Tech Parts・Astral Forge）**を増やす方向で4年間アップデートしてきた。

### Gaps
- 章の制限時間（約15分とされる）・固定時刻のボス出現・章ごとの敵構成など、ラン内構造の数値は検索結果に現れず**未確認**（記憶ベースでは「章は約15分、途中にミニボス、終盤にボス」だが要検証）。
- 進化レシピの網羅表（武器×パッシブ一覧）は Fandom wiki / AppGamer に存在するが本セッションでは取得不可。記憶ベースの例（Kunai＋Koga Ninja Scroll→Spirit Shuriken、Lightchaser＋Ronin Oyoroi→Eternal Light 等）は**未検証**。
- Collection（図鑑）、Endless モード、Void Zone、ヒーローの昇格（Ascension）仕様、Guild/Clan の具体的な報酬設計は確認できなかった。
- 季節イベント・コラボ（アニメIP等）の有無は検索できず未確認。

---

## KQ3. マネタイズ機構の詳細（装備ガチャ・ジェム・エネルギー・広告・パス・サブスク・価格）

### Takeaway
Survivor.ioの収益の中核は**装備ガチャ（Supply）とその合成・昇格チェーン**であり、Common→Good→Better→Excellent(+1/+2)→Epic→Legendary→S級（Void/Eternal/Chaos 系統）→SS級（Starforged Havoc）と、4年間で上位ティアを積み増し続けている。周辺に エネルギー課金（ジェム100/200/300）、Survivor Pass（19.99ドル）、月額カード（9.99ドル、上限エネルギー30→50）、Piggy Bank（0.99ドル〜）、キャラ直販（日本で約4,140〜4,320円）、そして回数制限付きのリワード広告が配置される。

### Cited Findings

**エネルギー**
- 章1回のプレイに**5エネルギー**消費。回復は**20分に1ポイント**。上限は**30**、月額カード購入で**50**に拡張（月額約10ドル） — [WriterParty Energy Guide](https://writerparty.com/party/survivor-io-energy-guide/)；[Games Adda](https://gamesadda.in/gaming/survivor-io-get-energy/)
- ジェムでのエネルギー購入：15エネルギーを1日3回まで、価格は1回目100ジェム、2回目200、3回目300と逓増 — [MTurboGamer「Best Way To Spend Gems」2022-10](https://mturbogamer.com/2022/10/survivor-io-best-way-to-spend-gems/)
- 広告視聴で5エネルギー回復、クールダウンに入るまで3回まで。レベルアップ（アカウントLv）ごとに5エネルギー回復。Quick Patrol は報酬1回につき15エネルギー — [WriterParty Gold DNA & Energy](https://writerparty.com/party/survivor-io-how-to-get-gold-dna-and-energy/)
- 上記ガイドは最も新しいものでも約1,376日前（2023年初頭）のもので、現行仕様と異なる可能性がある（検索要約による注記）。

**装備ティアと合成**
- 装備グレードは Grey→Green→Blue→Purple→Yellow→Red と進み、Purple と Yellow のみ +1/+2 のサブティアあり（別ガイドは Normal / Good / Better / Excellent / S-Grade Excellent と表記し、名称が一致しない） — [PocketGamer best gear](https://Pocketgamer.com/survivor-io/best-gear/)；[Pro Game Guides equipment tier list](https://progameguides.com/survivor-io/survivor-io-best-equipment-tier-list/)
- 通常武器の合成チェーン：Good→Better→Excellent→Excellent+1→Excellent+2、Epic は同一の Excellent+2 を2個合成。「最終的に全部位を S-Grade Excellent にする必要がある」 — [AppGamer Equipment Guide](https://www.appgamer.com/survivorio/equipment-guide)
- **SS級装備（Starforged Havoc）**：S級から鍛造。作成に Eternal Core 50（Eternal S級を分解して入手）、Void Core 50（Void S級を分解）、Base Tech Material 2,000（非S級装備の分解）。SS級は現在6部位（Twin Lance、Stardust Sash 等）。Fandom では Cosmic Cast レシピに Voidwaker Core と 2,000キューブ と記載され、数値が一致しない — [Survivor.io Fandom: SS equipment](https://survivorio.fandom.com/wiki/SS_equipment)；[MTurboGamer SS Gear Guide 2026-07](https://mturbogamer.com/2026/07/survivor-io-ss-gear-guide-upgrade-order/)；[MTurboGamer Starforged Havoc 2026-08](https://mturbogamer.com/2026/08/survivor-io-starforged-havoc/)
- **Astral Forge**：S級は3段階の直線強化、SS級は Eternal側5段階＋Void側5段階の計10段階。各段階に Epic（黄）の Lightchaser（Eternal側）／Void Power（Void側）を素材として要求、S-Core は段階により10〜80個、Tech Material 500〜1,000。Relic Core が全SS装備の主ボトルネック — [Survivor.io Fandom: Astral forge](https://survivorio.fandom.com/wiki/Astral_forge)；[MTurboGamer Astral Forge 2026-07](https://mturbogamer.com/2026/07/survivor-io-ss-gear-astral-forge/)
- **Chaos Fusion**：SS装備の Astral Forge 合計評価が3つ星以上で解放。1つ星につき Relic Core 1、Chaos Core 20、Base Tech Material 500、Epic の Chaos 系アイテム1。Chaos Core は Sword of Disorder / Armor of Quietus 等 Chaos 系S級の分解で入手 — [MTurboGamer Chaos Fusion 2026-07](https://mturbogamer.com/2026/07/survivor-io-chaos-fusion/)
- 武器の入手・進化・解放・強化ガイド（2026-07） — [MTurboGamer Weapons Guide](https://mturbogamer.com/2026/07/survivor-io-weapons-guide/)

**パス・サブスク・パック（USD）**
- Survivor Pass（バトルパス相当）：**19.99ドル**、無料ティアあり — [Survivor.io Fandom: Survivor Pass](https://survivorio.fandom.com/wiki/Survivor_Pass)；2022年12月のガイドでも「プレミアムは約20ドル」 — [MTurboGamer Survivor Pass Guide](https://mturbogamer.com/2022/12/survivor-io-survivor-pass-guide/)
- App Store 掲載のIAP：「Month Card 2」**9.99ドル**、「Small Piggy Bank」**0.99ドル** — [App Store (US)](https://apps.apple.com/app/survivor-io/id1528941310)
- 2022年時点のショップ：2,500ジェムで20ドル — [MTurboGamer 2022-10](https://mturbogamer.com/2022/10/survivor-io-best-way-to-spend-gems/)

**日本価格（円）**
- Game8：パスは【通常パス】**700円**、【高級パス】**1,500円**。ジェム入手数は通常パス最大5,000個、高級パス最大10,200個。「他のパック等と比べて割高・基本的にはおすすめしない（★1）」との評価項目あり（どのパックへの評価かは要約からは不明） — [Game8 ダダサバイバー 課金](https://game8.jp/dadasurvivor/546656)
- Game8：キャラクターは課金またはジェムで直接購入可。例：ツキヨミ**4,140円**、ウィチェ**4,320円**（Android価格） — [Game8（別記事群）](https://game8.jp/dadasurvivor/557751)

**広告**
- App Store上のユーザーレビュー：「ブーストが事実上必須になる。5〜7本の広告を見ると1分のクールダウンに入り、その後また広告が見られる」 — [App Store (US) レビュー](https://apps.apple.com/app/survivor-io/id1528941310)
- Google Playレビュー分析レポート（Kimola）のタイトルは「公平な広告と着実な進行のF2Pゲーム」 — [Kimola](https://kimola.com/reports/comprehensive-survivor-io-feedback-strategic-analysis-report-google-play-en-us-142073)
- Survivor.io のモデルは「IAPを軸にしたハイブリッド」で、クジラとカジュアル層の両方を維持した — [Games Forum / symphonyonline](https://www.gf.symphonyonline.co.uk/news/how-survivor.io-continues-to-pull-in-5-million-a-month-three-years-later)

### Inferences
- **エネルギー経済の計算**：上限30・20分/1回復なら 0→満タンは10時間、自然回復は1日72エネルギー＝約14ラン。無課金の基本枠は「30エネルギー=6ラン」を1日2〜3回に分けて消費する形で、広告3回（+15）、ジェム3回（+45、計600ジェム）、Lvアップで上乗せ。月額カードで上限50にするのは「寝ている間の溢れ」を減らす典型設計。
- **ティアの積み増し**がライブ運営の主軸。2022年のS級（Void/Eternal）→2026年のSS級＋Astral Forge 10段階＋Chaos Fusion と、既存課金者の「次の目標」を数年単位で供給。素材は「下位装備を分解した Core」なので、ガチャの"はずれ"も素材として価値を持ち、**ガチャ回転数そのものが上位進行に直結**する（典型的なArcheroモデルの拡張）。
- 価格帯：Survivor Pass 19.99ドルは一般的なモバイルBP（4.99〜9.99ドル）より高く、Habbyが「高ARPPU市場（韓国・中国・日本）向けの高価格パス」を採っていることを示唆。一方、日本のGame8が示す「通常パス700円／高級パス1,500円」はUSの19.99ドルと対応しておらず、別種のパス（デイリー系や複数パスの一部）の可能性が高い。
- 広告は**回数制限＋クールダウン**で「IAPの代替」ではなく「IAPへの導線」として機能させている。Fungiesの数字（DL100万/月に対し売上500万ドル/月＝DL当たり5ドル）からも、広告ではなくIAP主導と見るのが整合的。

### Gaps
- **ガチャ（Supply）の提供割合（%）**は検索結果に現れず未確認。
- Habbyが公開している**広告売上比率**（IAP vs Ads）は不明。AppMagicの「IAPのみ」推計であることに注意。
- スターターパック、週パック、期間限定パック、Chapter解放ゲート、Piggy Bank の上位価格帯、ジェム価格表（USD/JPY）の全体像は未取得。
- 「通常パス／高級パス」が何のパス（Survivor Pass のJP版か、別パスか）なのかはGame8の本文を読めず不明。
- 2026年現在の最新ショップ構成（Game8/kamigame/fandomの最新ページ）は取得不可。

---

## KQ4. リテンション／進行設計（デイリーループ、壁、課金チューニング、KPIベンチマーク）

### Takeaway
日次ループは「エネルギー（30上限・20分回復）で章を数回→Patrol回収→Daily Challenge/Trials→広告3回でエネルギー補充→デイリー/ウィークリー任務」で構成され、進行の壁は章ごとの装備要求値で作られる。Naavikは「序盤の課金性は高いがすぐ壁に当たり、安い序盤パックが効く」構造と評価。サブジャンル固有のD1/D7/D30公開ベンチマークは入手できず、ハイブリッドカジュアル全体の指標（Sensor Tower：トップHCはトップカジュアルよりD7が高い、ARPDAU $0.15〜0.50 等）で代替する。

### Cited Findings
- Naavik：メタゲームは序盤の課金が強いが**進行の壁**にすぐ当たり、そこで安価な序盤パッケージが魅力的になる。新ヒーローを既存より大幅に強くできないため、ヒーロー販売の天井がある — [Naavik](https://naavik.co/deep-dives/survivorio-archeros-footsteps/)
- エネルギー上限30／回復20分／1ラン5／広告3回／ジェム3回／月額カードで50 — [WriterParty](https://writerparty.com/party/survivor-io-energy-guide/)；[MTurboGamer](https://mturbogamer.com/2022/10/survivor-io-best-way-to-spend-gems/)
- Trials は Chapter 2 クリア後解放で、Gold DNA 等の限定素材源 — [AppGamer Trials](https://www.appgamer.com/survivorio/strategy-guide/trials)
- Daily Challenge / Weekly Tasks / 期間限定イベントモード — [AppGamer Weekly Tasks](https://www.appgamer.com/survivorio/weekly-tasks)
- Patrol 報酬の定期回収と、Lvアップ回復を活かすため「Patrol回収前に5エネルギー使う」等の最適化Tips — [AppGamer Grinding Guide](https://www.appgamer.com/survivorio/strategy-guide/grinding-guide)；[WriterParty](https://writerparty.com/party/survivor-io-how-to-get-gold-dna-and-energy/)
- 広告ブーストが実質必須で、5〜7本視聴後に1分クールダウン（ユーザーレビュー） — [App Store (US)](https://apps.apple.com/app/survivor-io/id1528941310)
- Sensor Tower（Playio経由の二次引用）：2025年のハイブリッドカジュアルはマネタイズ面の最大の伸びを示し、**トップHCタイトルはトップカジュアルよりD7リテンションが高い**。サブジャンル別IAP比率は Action & Strategy で81.9% — [Playio blog](https://blog.playio.co/mobile-game-genres-list)
- ハイブリッドカジュアルのブレンドARPDAU目安：**0.15〜0.50ドル**（ハイパーカジュアルは0.03〜0.08ドル）。記事自身が「中程度の確度」と注記 — [Game Growth Advisor 2026-04](https://gamegrowthadvisor.com/blog/2026-04-16-hybrid-casual-game-design-strategy-2026/)
- Voodoo Corentin Selz（2023年）：iOS米国でIAP ARPDAU約0.10ドルなら強いゲーム、広告ARPDAUと合わせて1年LTV約3ドルが射程 — [PocketGamer.biz](https://www.pocketgamer.biz/corentin-selz-voodoo-from-hypercasual-to-hybrid-casual/)
- ハイブリッドカジュアルのKPI解説（D1/D7/D30、ARPDAU、LTV の考え方） — [TapNation KPIs blog](https://www.tap-nation.io/blog/kpis-that-matter-metrics-to-track-in-hybrid-casual-games/)
- Survivor.io：直近30日DL約100万に対し売上約500万ドル（2024年） — [Fungies](https://fungies.io/zombie-io-mobile-game-monetization-methods-and-strategies.md)

### Inferences
- **デイリーループ設計の骨格**：(1) ログイン→Patrol回収（放置報酬）→(2) 30エネルギーで6ラン（約1ランあたり数分〜15分）→(3) Trials／Daily Challenge で限定素材→(4) 広告3回・ジェムで追加ラン→(5) デイリー／ウィークリー任務達成→(6) 装備合成・強化で次章の戦力要求を満たす。進行が止まる＝「章の戦力ゲートに届かない」状態で、そこに安価パック・Survivor Pass・月額カードが提示される。
- 「壁の位置」はNaavik記事（2022年）時点で既に序盤にあり、以降4年間のアップデートは壁を"前倒し"ではなく"上に伸ばす"方向（S→SS→Astral Forge→Chaos）で、既存の高課金者のLTVを伸ばしてきたと解釈できる。
- ARPDAU／LTV について Survivor.io 固有の公開値はないが、DL当たり課金（韓国15.5ドル、中国9ドル、米国4.9ドル）はハイブリッドカジュアル平均LTV（約3ドル）を大きく上回り、「ハイブリッドカジュアルの皮を被ったミッドコアRPG」として扱うべき。

### Gaps
- Survivor.io 固有の **D1/D7/D30、セッション長、セッション数/日、課金率、ARPDAU、ARPPU** の公開値は見つからなかった。
- サバイバーライク・サブジャンル固有のリテンションベンチマーク（GameAnalytics / Liftoff / Sensor Tower 等）は検索予算切れで未取得。
- 「無課金プレイヤーが止まる章」の具体的な位置、章ごとの推奨戦力値表は未確認。

---

## KQ5. 他のモバイルサバイバーライクのマネタイズ（Vampire Survivors mobile／Brotato／20 Minutes Till Dawn／クローン群／日本向けタイトル）

### Takeaway
原典 Vampire Survivors のモバイル版（2022年12月）は「無料・IAPなし（DLC除く）・ラン終了時の任意広告のみ」という"free-for-real"方針で、UAゼロでも初週100万DL・1.5か月で300万DLを達成したが売上額は非公開。Brotato と 20 Minutes Till Dawn は Erabit による買い切り（約4.99ドル）移植。中華系クローン（Zombie Waves、Heroes vs Hordes 等）は広告重めのハイブリッド型で、売上規模の確かな数字は本セッションでは得られなかった。

### Cited Findings

**Vampire Survivors（poncle）モバイル版**
- モバイル版は無料・IAPなし。広告はラン終了時に任意で視聴し、追加ゴールドや復活を得る。「現時点では広告プロンプトを消す課金手段はない」 — [TouchArcade レビュー 2022-12-09](https://toucharcade.com/2022/12/09/vampire-survivors-mobile-review-controller-cloud-save-sync-dlc-unlock-iphone-ipad-pro/)
- poncle は「free-for-real」と表現し、マネタイズは最小限でゲームを中断しない設計 — [PocketGamer.biz「vampire survivors developer takes new approach to monetisation」](https://www.pocketgamer.biz/vampire-survivors-developer-takes-new-approach-to-monetisation)
- 初週100万DL超。poncle は **UAに一切投資しておらず、全てオーガニック** — [mobilegamer.biz](https://mobilegamer.biz/vampire-survivors-mobile-has-passed-1m-downloads-in-its-first-week/)
- 2023年1月中旬に300万DL突破、1日約6万DL（AppMagic） — [Game World Observer 2023-01-17](https://gameworldobserver.com/2023/01/17/vampire-survivors-mobile-3-million-downloads-appmagic)；[mobilegamer.biz](https://mobilegamer.biz/vampire-survivors-mobile-hits-3m-downloads/)
- poncle はアプリストアに溢れるクローンに対抗するためモバイル版を急いで出した — [mobilegamer.biz](https://mobilegamer.biz/indie-hit-vampire-survivors-just-dropped-on-mobile/)
- 広告からの収益額は「判断が難しい」と報道（公式売上は非公開） — [mobilegamer.biz](https://mobilegamer.biz/vampire-survivors-mobile-hits-3m-downloads/)
- 2022年のベストiPhoneゲームが Apple Arcade をスキップし完全無料で配信された、との評 — [iMore](https://www.imore.com/gaming/the-best-iphone-game-of-2022-skipped-apple-arcade-and-its-totally-free)

**Brotato / 20 Minutes Till Dawn（Erabit Studios）**
- Brotato モバイル版は Erabit Studios による**買い切り（プレミアム）**で2023年3月28日にiOS/Android配信、価格 **4.99ドル** — [TouchArcade 2023-03-28](https://toucharcade.com/2023/03/28/top-down-roguelite-shooter-brotato-is-out-now-on-ios-and-android-as-a-premium-release/)；[PocketGamer release](https://www.pocketgamer.co.uk/brotato/release/)
- Erabit は 20 Minutes Till Dawn のモバイル版も手掛けた。20MTD はモバイルで**有料版とフリーミアム版の2本立て**、プレミアム版4.99ドル（iOSローンチ時は約2.99ドル） — [Wikipedia: 20 Minutes Till Dawn](https://en.wikipedia.org/wiki/20_Minutes_Till_Dawn)
- Brotato 事前登録・配信報道 — [PocketGamer](https://www.pocketgamer.com/brotato/pre-registration-live-now-android-ios)

**クローン／フォロワー（中華系・欧米系）**
- Heroes vs Hordes（Swift Games）：Common Sense Media は「ゲーム内広告とマネタイズの重圧が体験を支配する」と評価 — [Common Sense Media](https://www.commonsensemedia.org/app-reviews/heroes-vs-hordes-survival)；Swift Games は AMC Networks と Walking Dead ローグライトを開発中 — [PocketGamer.biz AMC Networks](https://www.pocketgamer.biz/industry/amc-networks/)
- Zombie Waves：Flexion が「Top Grossing game」として代替ストア配信契約を締結。Flexion の代替ストア展開は Google Play 売上に平均10%を上乗せ — [Inderes / Flexion release](https://inderes.dk/releases/flexion-mobile-flexion-signs-top-grossing-game-zombie-waves)（開発元 Fun Formula との記載はペルシャ語レビューのみで未裏取り — [zoomg.ir](https://www.zoomg.ir/game-articles/418819-zombie-waves-mobile-game/)）
- Survivor Idle Run（Z-RPG）：AppGoblin推計で売上構成 **IAP 41%／広告 59%**、月間売上1万ドル未満 — [AppGoblin](https://www.appgoblin.info/apps/1666329575)
- 「Fast follow」（Hit Points #143）：Survivor.io とVSクローンの話題を扱ったニュースレター（本文未確認） — [Hit Points](https://newsletter.hitpoints.co/143-fast-follow/)
- 2025年後半のモバイル縦画面ローグライク総覧（本文未確認） — [antinomy.me](https://antinomy.me/posts/roguelike-mobile-game-2025/)
- Naavik「The Evolution of Hybridcasual」：IAP主導の Survivor.io が同記事内タイトル群のIAP合計の85%を占めた — [Naavik](https://naavik.co/deep-dives/evolution-of-hybridcasual-deepdive/)

### Inferences
- モバイルのサバイバーライクは3つのビジネスモデルに分岐した：(a) **premium移植**（Brotato、20MTD：4.99ドル前後）、(b) **広告のみの"free-for-real"**（VS mobile：UA不要の知名度があるIPにのみ成立）、(c) **IAP主導ハイブリッド**（Survivor.io：装備ガチャ＋エネルギー＋パス）。売上規模で桁違いなのは (c) のみであり、(a)(b) はPC/コンソールのブランド価値を守る選択。
- Survivor Idle Run の「広告59%」のような小規模フォロワーは、Survivor.io と同じ皮でも広告依存に留まり、IAPを回す深いメタ（装備合成チェーン）を持てていない点が差になっていると推測。
- Heroes vs Hordes のレビュー評価から、欧米系フォロワーは「広告過多」で評判を落としやすく、Habby の「広告は回数制限付きの導線」という節度ある設計との差がリテンションに効いている可能性。

### Gaps
- VS mobile の DLC（Legacy of the Moonspell 等）のモバイル価格、2024〜2026年の累計DL・広告収益、poncle がその後 ad-free IAP を追加したかは未確認。
- Zombie Waves、Heroes vs Hordes、Brotato モバイル、20MTD モバイルの**売上・DL推計**は検索予算切れで未取得。
- 日本で猫テーマ等の広告を大量出稿しているサバイバーライク（質問にあった『惑星破壊にゃんにゃん』系）の**実在タイトル名・パブリッシャーは特定できなかった**（検索未実施）。Habby 以外に日本市場で目立つサバイバーライク・パブリッシャーの特定も未達。
- Supercent / Voodoo / Homa / Supersonic がサバイバーライク型のハイブリッドカジュアルを出しているかの個別タイトル確認は未実施。

---

## KQ6. ハイブリッドカジュアル・テンプレート化のトレンド（Voodoo／Homa／Supercent、CPI、広告比率、ARPDAU／LTV）

### Takeaway
ハイブリッドカジュアルは2023年21億ドル（Sensor Tower、+30%）→2025年42億ドル（+20%）→2026年上半期24億ドル（+23%）とカジュアル系で唯一伸び続けるセグメントで、Survivor.io はその「IAP型」の代表格として2023年に収益トップを占めた。一方 Supercent 型は広告70%／IAP30%、Voodoo はIAP ARPDAU 0.10ドル・1年LTV 3ドルを「強いゲーム」の目安とするなど、同じ"ハイブリッド"でも収益構造は二極化している。

### Cited Findings
- Sensor Tower：ハイブリッドカジュアルの2023年世界IAP収益は21億ドル超（前年比+30%）、『ダダサバイバー』が収益トップ（2023年1〜11月で2.4億ドル） — [gamebiz.jp](https://gamebiz.jp/news/378767)
- ハイブリッドカジュアルのIAP収益は2025年に**42億ドル（+20%）**、2026年上半期は+23%で約24億ドル。両期間で売上が伸びた唯一のカジュアルセグメント — [Anahata Interactive](https://anahatainteractive.com/blog/hybrid-casual-pulling-ahead-2026)；[Game World Observer 2026-01-21](https://gameworldobserver.com/2026/01/21/in-2025-the-revenue-of-the-mobile-gaming-market-grew-but-only-slightly-analysis)
- Sensor Tower（二次引用）：2025年はハイブリッドカジュアルがマネタイズ面で最大の伸び、トップHCはトップカジュアルよりD7が高い、Action & Strategy サブジャンルのIAP比率81.9% — [Playio](https://blog.playio.co/mobile-game-genres-list)
- Voodoo：IAP ARPDAU は2022年1月→2023年3月で10倍。2024年Q4のIAP収益は月平均985万ドル、累計IAP 2.58億ドル — [Wikipedia: Voodoo (company)](https://en.wikipedia.org/wiki/Voodoo_(company))
- Voodoo Corentin Selz：IAP ARPDAU（iOS US）約0.10ドルで強いゲーム、広告込みで1年LTV約3ドル — [PocketGamer.biz](https://www.pocketgamer.biz/corentin-selz-voodoo-from-hypercasual-to-hybrid-casual/)
- Supercent：主力タイトルは**広告70%／IAP30%**、主力2本で月700〜1,200万ドル — [Gamigion](https://www.gamigion.com/supercents-meteoric-rise-on-the-hybrid-casual-gaming-scene/)
- ハイブリッドカジュアルのブレンドARPDAU 0.15〜0.50ドル、ハイパーカジュアル 0.03〜0.08ドル — [Game Growth Advisor 2026-04](https://gamegrowthadvisor.com/blog/2026-04-16-hybrid-casual-game-design-strategy-2026/)
- CPI：米国カジュアル／パズル Android で1.50〜3.50ドル、別の集計では0.14〜2.00ドルと手法で大きく異なる。CPI は LTV の30〜70%が目安 — [Game Growth Advisor CPI 2026-03](https://gamegrowthadvisor.com/blog/2026-03-17-user-acquisition-cpi-benchmarks-2026/)
- ハイパーカジュアルのマーケティング／マネタイズ・レポート（Gamesforum Intelligence、2025-07） — [InvestGame PDF](https://investgame.net/wp-content/uploads/2025/07/Gamesforum-Intelligence-Hypercasual-Gaming-Report.pdf)
- StudioKrew は Survivor.io を「ハイブリッドカジュアルが長期マネタイズ可能なシステムへスケールした事例」として挙げる — [StudioKrew](https://studiokrew.com/blog/hybrid-casual-games-vs-traditional-mobile-games/)
- モバイル・ローグライク市場規模を2025年約9.77億ドルとする市場レポート（手法不明・信頼性低） — [Dataintelo](https://dataintelo.com/report/roguelike-games-market)
- Survivor.io の成功は「IAPを軸にしたハイブリッド」でクジラとカジュアルの双方を保持したこと — [Games Forum / symphonyonline](https://www.gf.symphonyonline.co.uk/news/how-survivor.io-continues-to-pull-in-5-million-a-month-three-years-later)

### Inferences
- Survivor.io は Sensor Tower のハイブリッドカジュアル分類で2023年にトップだが、DL当たり課金（4.9〜15.5ドル）はVoodooの「1年LTV 3ドル」の目安を数倍上回る。つまり**Habbyのテンプレートは"ハイブリッドカジュアル"というよりミッドコアRPGのメタをカジュアルなコアに接続したもの**で、広告主導の Supercent 型とは別物として設計判断すべき。
- 自社タイトルの設計指針として：広告主導型（Supercent：広告70%）を選ぶなら短セッション・高頻度・低CPI前提、IAP主導型（Habby：ガチャ合成チェーン＋エネルギー）を選ぶならアジア高ARPPU市場（韓国・中国・日本・台湾）への対応（価格帯・パス高額化・ローカライズ）が前提になる。

### Gaps
- サバイバーライク限定の CPI／ARPDAU／LTV ベンチマークは公開情報として見つからなかった。
- Homa、Supersonic のサバイバーライク型タイトルと数値は未調査（検索予算切れ）。
- Sensor Tower の「2025年ハイブリッドカジュアル」レポート原典は取得不可で、Playio 等の二次引用に依存。

---

## KQ7. アナリストの見解：なぜ Survivor.io は他のクローンが失敗したところで成功したのか

### Takeaway
入手できた分析（Naavik、AppQuantum、Axios、Lancaric、DoF の記事タイトル・要約）に共通するのは、(1) Archero で実証済みの **Habby メタ（装備ガチャ・エネルギー・章ゲート）をそのまま移植**した反復力、(2) **TikTok 広告の圧倒的な出稿量と創造性**（週間トップ10広告の3本）、(3) 進行の壁の直前で効く**安価パックの配置**、(4) 中国・韓国など**高ARPPU市場でのIAP主導設計**、の4点。VS 原作が「広告のみ・UAゼロ」で300万DL規模に留まったのと対照的に、Habby はUAと深いメタで売上を桁違いにした。

### Cited Findings
- Naavik：Survivor.io のメタは Archero の後継として設計され、序盤で課金を取りつつ壁で安価パックを効かせる。新ヒーローの強さに上限があるため、ヒーロー売り切りではなく装備・進行を売る構造 — [Naavik](https://naavik.co/deep-dives/survivorio-archeros-footsteps/)
- Naavik：TikTok 広告の週間トップ10に3本が Survivor.io（2022年）、Habby は TikTok UA を"マスター"した — [Naavik TikTok UA](https://naavik.co/digest/how-habby-mastered-tiktok-ua-for-survivor/)
- Axios：「目を引くゲームプレイコンセプトと TikTok 上の人気広告」で頂点に — [Axios](https://www.axios.com/2022/08/26/survivorio-habby-tiktok-ios-android)
- AppQuantum：「革新と反復（Innovation and Iteration）」が Survivor.io を変えた（PocketGamer.biz 寄稿、2022-10） — [AppQuantum](https://www.appquantum.com/news/october-2022/appquantums-deconstruct-for-pocketgamer.biz-how-innovation-and-iteration-has-transformed-survivor.io.html)
- Deconstructor of Fun：Habby の「テンプレート」がパワーハウスを築いた（2025-07-31、本文未取得） — [DoF](https://www.deconstructoroffun.com/blog/2025/7/31/habbys-hybridcasual-empire-the-template-that-built-a-powerhouse)
- Games Forum：IAP主導のハイブリッドでクジラとカジュアル層を同時に維持。中国・韓国・米国が各2割強。3年後も月500万ドル — [Games Forum / symphonyonline](https://www.gf.symphonyonline.co.uk/news/how-survivor.io-continues-to-pull-in-5-million-a-month-three-years-later)
- mobilegamer.biz アナリスト：2022年中盤〜後半の巨大な売上を維持するのは難しかった — [mobilegamer.biz](https://mobilegamer.biz/data-drop-survivor-io-midcore-market-intel-nfl-rivals-mags-financials-dragon-quest-indias-gaming-boom-and-more/)
- poncle（VS）は UA をせずオーガニックのみ、広告のみ、売上は不明 — [mobilegamer.biz](https://mobilegamer.biz/vampire-survivors-mobile-has-passed-1m-downloads-in-its-first-week/)
- Hit Points「Fast follow」が Survivor.io のファストフォロー戦略を論じる（本文未確認） — [Hit Points #143](https://newsletter.hitpoints.co/143-fast-follow/)

### Inferences
- **成功要因の構造化（自社設計への示唆）**
  1. コア：VS の「自動攻撃＋移動のみ＋進化」をそのまま採用し、学習コストゼロで広告→初回プレイの転換率を最大化。
  2. メタ：Archero 流の「装備6部位×レアリティ合成×エネルギー」を流用し、開発リスクを下げつつ IAP の深さを確保。
  3. UA：TikTok 向けの縦型ショート動画と大量出稿で2022年の低CPI環境を取り切った（ローンチ2か月で3,700万DL）。
  4. 市場：中国・韓国・台湾・日本といった高ARPPUのアジア市場を最初から主戦場にし、DL当たり課金を欧米の2〜3倍にした。
  5. 運営：S級→SS級→Astral Forge→Chaos Fusion と上位ティアを継ぎ足し、350章まで伸ばして高課金者の目標を枯らさない。
- 失敗したクローンとの差は「コアの模倣」ではなく、(2)(3)(4)(5)の**メタ・UA・市場・運営の総合力**にある。広告過多のフォロワー（Heroes vs Hordes 評）や IAP の浅いフォロワー（Survivor Idle Run：広告59%）は、コアだけ真似て残りを欠いた例と位置づけられる。

### Gaps
- Deconstructor of Fun、Naavik、GameRefinery、Sensor Tower、Liftoff の各分析の**本文**は取得できておらず、要約・タイトルからの推論が多い。
- GameRefinery／Liftoff のサバイバーライク関連レポート、Mobile Dev Memo の言及は検索未実施。
- Reddit r/SurvivorIO、note.com の日本語分析は到達できなかった。

---

## 付録：本セッションで未検証の「記憶ベース」事項（必ず再確認すること）
以下は調査担当者の事前知識に基づくもので、本セッションでは出典を確認できなかった。レポートに採用する場合は要裏取り。
- 章の制限時間は約15分で、途中に複数回のミニボス／エリート波、終盤に章ボス。クリアで章報酬（装備ガチャ素材・ジェム）。
- 進化レシピは「武器＋固定パッシブ」で、例：Kunai＋Koga Ninja Scroll→Spirit Shuriken、Lightchaser＋Ronin Oyoroi→Eternal Light、Revolver＋HE Fuel→Void Power、Shotgun＋Energy Cube→Defender、Forcefield＋Energy Drink→Pressure Forcefield 等（各組み合わせは要検証）。
- 装備ガチャ（Supply）は単発・10連で、10連確定枠があり、ジェム価格は10連で約2,000〜3,000ジェム規模（数値は要検証）。
- ヒーロー（Common／Worm／Tsukiyomi／Catnip／Wiche／King／Yelena 等）は欠片収集による昇格（Ascension）で段階強化。
- Habby の日本法人・日本向けコミュニティ運営（X公式 @dadasurvivor 等）の存在。
