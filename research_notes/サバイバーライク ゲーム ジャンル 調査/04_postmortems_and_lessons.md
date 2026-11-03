# サバイバーライク後続作のポストモーテム・開発者談・教訓（成功作と失敗作の比較）

> 調査日: 2026-11-03（状態は2026年11月時点）。
> **調査上の制約**: 本セッションではWebFetch（ページ本文取得）が全ドメインでネットワーク制限によりブロックされ、途中でWebSearchの予算も上限に達した。したがって下記の引用は検索結果のスニペット／要約ベースであり、各記事の全文を読み込んだものではない。引用文は検索結果に表示された範囲のものを採用し、本文未確認の点は各節の「Gaps」に明記した。数字の「日付」は、記事の公開日または記事内で言及された時点を示す。

---

## Q1. Brotato（Blobfish / Thomas Gervraud）

### Takeaway
Brotatoはフランスの一人開発者Thomas Gervraud（Blobfish、4作目）がGodotで作った作品で、2022年5月の無料デモ→Next Fest→2022年9月EA→2023年6月1.0という短い導線で、EA期間中に100万本、2025年には全プラットフォーム合計で1,000万プレイヤーに到達した。モバイルはErabitに独占権を委ね、2025年9月以降はEvil Empireが運営開発を引き継ぎ、本人は新作に専念している。

### Cited Findings
- Gervraudは2018年にCS（情報科学）の学業を終えた直後からインディー開発を始め、以後すべての自作にジャガイモを登場させてきた。それがBrotatoの土台になった。キャラ名はBroforce的なランボー風キャラから着想（2024-02、Xbox Wire仏語版インタビュー） — [Xbox Wire FR](https://news.xbox.com/fr-fr/2024/02/09/entretien-exclusif-avec-thomas-gervraud-brotato-le-jeu-qui-a-de-la-patate/)
- 同インタビューで、ファンタジー／中世より現代設定のほうが「同時に6本の武器を持つ」メカニクスに創造的余地があると語っている（2024-02） — [Xbox Wire FR](https://news.xbox.com/fr-fr/2024/02/09/entretien-exclusif-avec-thomas-gervraud-brotato-le-jeu-qui-a-de-la-patate/)
- Brotatoは一人スタジオBlobfishの4作目（2022時点） — [gamesinresearch](https://gamesinresearch.com/brotato/); [dev.to（Godot/GDScript採用の解説）](https://dev.to/wlz/why-brotato-bet-on-godot-and-gdscript-the-free-2d-engine-behind-a-1-million-copy-potato-4ip7)
- デモは2022-05-02に公開され、Steamの「Going Rogue: A Festival of Persistence」と2022年6月Next Festに参加。EA開始前に4万件のウィッシュリストを獲得（1.0リリースPR、2023-06） — [Games Press: Brotato 1.0 Release](https://www.gamespress.com/Brotato-10-Release)
- 2022年6月、Next Fest向けにデモを更新：武器合成システム、武器セット、新Trait2種、新アイテム32、新武器4、新ウェーブ2を追加（開発者X投稿、2022-06） — [Blobfish on X](https://x.com/blobfishdev/status/1536384192594026496?lang=en)
- Steam EA開始2022-09-27、1.0は2023-06-23（Wikipedia） — [Wikipedia: Brotato](https://en.wikipedia.org/wiki/Brotato)
- EA期間中（2022年内）に100万本超を販売（Wikipedia、Indie Maker List） — [Wikipedia](https://en.wikipedia.org/wiki/Brotato); [Indie Maker List](https://indiemakerlist.com/p/thomas-gervraud/)
- 2025年時点でPC・コンソール・モバイル合計1,000万プレイヤー超（2025-09、Gematsu） — [Gematsu](https://www.gematsu.com/2025/09/brotato-post-launch-development-moved-to-evil-empire)
- 第三者のSteam販売推計は大きくばらつく：Raijin.gg 約300万（2026-10時点）、Gamalytic 790万（レンジ500万〜1,080万）、GameRevenueData 550〜580万 — [Raijin.gg](https://raijin.gg/app/1942280/Brotato); [Gamalytic](https://gamalytic.com/game/1942280); [GameRevenueData](https://gamerevenuedata.com/games/brotato/)
- モバイル：Blobfishは2022年12月にモバイル移植・パブリッシングの独占権をErabit Studiosに譲渡（Blobfish自身の声明として報道）。Android/iOS版は2023-03-28に無料版とプレミアム版の両方で配信 — [Wikipedia](https://en.wikipedia.org/wiki/Brotato)
- 2025年9月、Dead Cells DLCやThe Rogue Prince of Persiaを手がけたEvil EmpireがBrotatoのポストローンチ開発を引き継ぎ、Blobfishは監修に回り新作に専念。Gervraudは「才能あるチームの下でゲームがどう進化するか楽しみで、また自分でBrotatoを楽しめるのが嬉しい」旨をコメント。第一弾で資源を集めて肥大化する新敵「Gobbler」追加（2025-09） — [Gematsu](https://www.gematsu.com/2025/09/brotato-post-launch-development-moved-to-evil-empire); [Niche Gamer](https://nichegamer.com/brotato-post-launch-development-picked-up-by-evil-empire/)
- 開発者はNotionで公開ロードマップ／情報ページを運用 — [Blobfish Notion: Brotato](https://blobfishgames.notion.site/Brotato-cb88a14520ba4703ae9aed4ab438427c)
- 設計面の第三者評価（日本語note）：Brotatoは「ヴァンサバ系の完成形」であり、VSの長く中断不能なランや複雑な進化システムを削ぎ落とし、狭いアリーナと20ウェーブ構成で1試合を短く保っている（記事日付は検索結果に未表示） — [note: 栗城 紡](https://note.com/kurisiro_tumugi/n/nb76d92dcabc7)
- コミュニティの設計評価：Danger（難易度）レベルがボスの難度をスケールさせる（攻略ガイド）；ショップが使っていない武器ばかり出す、序盤のリロールが高い、ウェーブ2の素材が少ない等の不満スレッドがSteamに複数存在 — [maingamers guide](https://www.maingamers.com/games/brotato/posts/brotato-beginner-waves-shop); [Steam討論: Shop items and weapons issue](https://steamcommunity.com/app/1942280/discussions/0/3810657379790871866/); [Steam討論: early shops](https://steamcommunity.com/app/1942280/discussions/0/601894733441203577/)
- Redditでの「次に遊ぶべきVS系」投票（1,757票）でVS（141票）に次ぐ2位（124票） — [Rogueranker](https://rogueranker.com/games-like-megabonk/)
- 2022年のPC Gamerは、VSの1年後時点で既にクローンのブームが起きていると指摘しており、Brotatoはこの初期波の中で発売された — [PC Gamer: So, so many Vampire Survivors clones](https://www.pcgamer.com/so-so-many-vampire-survivors-clones-came-out-this-year/)

### Inferences
- 「無料デモを数か月前に出してフェスに2回乗せる→EA→9か月で1.0」という導線は、Zukowskiがデータで示す「デモはフェスの数か月前に出した方が中央値の2.5倍のウィッシュリストを得る」原則と整合する（後述Q9参照）。
- 一人開発者がEA中に100万本を売った後、運営をEvil Empireに委ねたのは、「サバイバーライクはローンチ後も更新を期待される」ジャンル特性と、一人開発者の持続可能性の矛盾への解として注目に値する。
- 「現代設定だから武器6本同時が自然」という発言は、テーマがメカニクスの説得力を支えるという設計観を示す。

### Gaps
- Brotatoの正味の開発期間（開始月〜EAまでの月数）を示す一次情報は検索結果に出なかった。
- 「なぜ6本なのか」「ウェーブ＋ショップ構造を選んだ理由」「難易度（Danger）設計の意図」「EA価格設定の根拠」をGervraud本人が語った一次資料は見つからなかった（Xbox Wire仏語インタビューの全文に含まれる可能性があるが本文未取得）。
- Erabit版モバイルの売上・DL数の公式数値は見つからなかった。
- Chris ZukowskiのBrotato単独ケーススタディは検索結果に出なかった。

---

## Q2. 20 Minutes Till Dawn（flanne）

### Takeaway
flanneは5年以上かけた野心的なRPG（Spiritlink Tactics）で燃え尽きた後、VSに触発されて数か月で20MTDを作り、2022-06-08のEA初週で50万ドル超（14.3万ウィッシュリスト、36時間で11万本）を記録。本人は「経験の浅いソロ開発者が野心的RPGに5年コミットしたのは大きな誤り」と明言しており、短い開発サイクルと短いランの両方が成功要因として語られる。

### Cited Findings
- 開発者・パブリッシャーともflanne（Steamストア表記） — [Steam: 20 Minutes Till Dawn](https://store.steampowered.com/app/1966900/20_Minutes_Till_Dawn/)
- flanneは大学でCSを専攻し、プログラマとして働いた後にゲーム制作へ。米東海岸拠点で5年以上のゲーム開発経験 — [GNL Magazine](https://genelmag.com/article/survive-the-night-in-20-minutes-till-dawn); [Absolutely Skint review](https://www.absolutelyskint.com/20-minutes-till-dawn-review/)
- 20MTDはサイドプロジェクトとして開始。戦術RPG「Spiritlink Tactics」に数年を費やして燃え尽き、休憩として数か月で20MTDを制作。VSに触発され「非常に短い開発サイクル」で試したかった（Wikipedia） — [Wikipedia: 20 Minutes Till Dawn](https://en.wikipedia.org/wiki/20_Minutes_Till_Dawn)
- flanne本人の言葉（HowToMarketAGame、2022-06-14）：「Spiritlink Tacticsに5年以上費やしたのは、経験の浅いソロ開発者が野心的なRPGにコミットするという大きな誤りだったと思う」 — [HTMAG: 20 Minutes Till Dawn's half-million-dollar week](https://howtomarketagame.com/2022/06/14/20-minutes-till-dawn/)
- EA開始2022-06-08。Steam EA初週で50万ドル超の売上 — [Wikipedia](https://en.wikipedia.org/wiki/20_Minutes_Till_Dawn); [HTMAG](https://howtomarketagame.com/2022/06/14/20-minutes-till-dawn/)
- HTMAGのケーススタディ：ローンチ時ウィッシュリスト143,196件、最初の36時間で110,042本、4日後の総売上（Steam手数料前）約538,035ドル（2022-06） — [HTMAG](https://howtomarketagame.com/2022/06/14/20-minutes-till-dawn/)
- EA時の価格は2.99ドル（TouchArcade、2023-06） — [TouchArcade](https://toucharcade.com/2023/06/06/20-minutes-till-dawn-1-0-update-release-date-iphone-android-pc-free/)
- 1.0は2023-06-08にiOS/Android/PCで同時配信（Erabit Studiosが発表）。Switch版はその前年12月に配信 — [TouchArcade](https://toucharcade.com/2023/06/06/20-minutes-till-dawn-1-0-update-release-date-iphone-android-pc-free/); [GameFAQs news](https://gamefaqs.gamespot.com/news?id=90059)
- モバイル版はErabit Studios名義で配信され、Erabitが中国向けパブリッシングも担当との記述 — [TouchArcade forum thread](https://toucharcade.com/community/threads/20-minutes-till-dawn-by-erabit-studios.425211/)
- 第三者推計の累計Steam総売上は約656万ドル（推計であり公式値ではない） — [Steam Revenue Calculator](https://steam-revenue-calculator.com/app/1966900/20-minutes-till-dawn)
- 視覚面：ほぼモノクロームの画面構成は称賛される一方、一部プレイヤーにはテキストが読みづらいという指摘 — [WC Robinson review](https://wcrobinson.org/2024/03/31/20-minutes-till-dawn-review-roguelike-survival-with-a-lovecraftian-twist/)

### Inferences
- 「手動エイム＋リロード」はVSとの明確な差別化点であり、20分固定という尺はタイトル自体がピッチになっている（タイトルで「短いラン」を約束する設計）。
- Brotatoと同様、モバイル／中国展開は自前ではなくErabitという専門パブリッシャーに委ねる「分業パターン」が成功ソロ開発者に共通する。

### Gaps
- flanneが「ランを短く保つ理由」「手動エイム採用の理由」「EAで学んだこと」を語った一次資料は検索結果に出なかった（HTMAG記事本文に含まれる可能性があるが未取得）。
- itch.ioの無料版「10 Minutes Till Dawn」が集客にどう寄与したかの一次情報は未確認。
- 累計の公式販売本数は未公表／未発見。

---

## Q3. HoloCure（Kay Yu）

### Takeaway
HoloCureはアニメーターKay Yuが「趣味」として作ったHololive非公式ファンゲームで、2022-06-23にitch.ioで無料公開、2023年にCover社の許諾を得てSteamにも無料配信。Yuは翻訳・サーバー費を自腹で負担し寄付も拒み、Cover公式の収益化枠（Holo Indie）が出来た後も無料を貫いた。既存IPのファン層＋VS/Magic Survival型の遊び＋釣り・ハウジング等の副次システムで、Steam史上最高評価級のローグライクとなった。

### Cited Findings
- 無料の非公式Hololiveファンゲームで、Vampire SurvivorsとMagic Survivalに強く影響を受けた、と公式itch.ioページに明記。最初の公開ビルドは2022-06-23 — [itch.io: HoloCure](https://kay-yu.itch.io/holocure); [Kay Yu on X（2022-06）](https://x.com/kaynimatic/status/1540183579556073473)
- Yuは収益化に関心がなく、アニメーターとしての収入で低い開発費を賄っていると述べた。翻訳費やサーバー費を含め全額自己負担で、寄付も「純粋な情熱プロジェクトに保ちたい」として拒否 — [Wikipedia: HoloCure](https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans!); [Hololive Fan Wiki](https://hololive.wiki/wiki/HoloCure)
- 2023年にCover Corporationから非商用ファンゲームとしてのSteam配信許諾を取得 — [Wikipedia](https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans!)
- CoverがHolo Indie（承認ファンゲームの収益化を認める枠）を開設した後も、Yuは繰り返し販売を拒否。GamesRadarは「Steam史上最高評価のローグライクの一つ」の「金嫌いの作者」と評した（2024） — [GamesRadar](https://www.gamesradar.com/money-hating-creator-of-one-of-the-highest-rated-roguelikes-in-steam-history-says-oops-i-made-a-second-game-in-the-most-casual-reveal-of-2024/)
- GameMaker Studio 2製で、Yuは2008年からこのエンジンに親しんでいる。本人推定で75%を自作、翻訳と追加アートは外注 — [Wikipedia](https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans!)
- Steamの開発者投稿で、ゲーム開発はあくまで個人の趣味であり、空き時間にしか作業できないと説明。アップデート0.8が「予定よりはるかに長くかかっている」ことも認めている — [Steam: HoloCure news](https://steamcommunity.com/app/2420510/allnews/)
- 副次システム：スタンプは0.5で導入、各武器に3つまで装着・入替可能。Greed Stampは後に短いクールダウンを追加するナーフ — [TV Tropes: HoloCure](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/HoloCure); [HoloCure Wiki: Fishing Pond](https://holocure.wiki.gg/wiki/Fishing_Pond)
- Holo Houseモードは0.6で登場し、釣り（魚がかかるとリズムゲーム）・農業・料理を含む — [Siliconera preview](https://www.siliconera.com/preview-holocure-is-worth-playing-even-if-new-to-hololive/); [HoloCure Wiki](https://holocure.wiki.gg/wiki/Fishing_Pond)
- 次作Holo X BreakはHolo Indie枠で出し、HoloCure自体は独立のまま維持するとCoverに伝えた — [Wikipedia](https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans!)
- 2023年のKoefficientインタビュー（二次引用）：Holostarsを含む全メンバー追加を計画 — [Hololive Fan Wiki](https://hololive.wiki/wiki/HoloCure)
- Steamフォーラムでは「なぜ無料か」が繰り返し質問され、非営利が許諾条件だとするファンの見解がある（公式声明ではない） — [Steam討論: Free? How?](https://steamcommunity.com/app/2420510/discussions/0/3810661398179810659/)

### Inferences
- HoloCureは「既存IPの巨大ファン層」と「無料」の掛け算で、マーケティング費ゼロで配信者・ファンアートの連鎖を得た事例。新規参入者が再現するには、IP許諾か自前のコミュニティが前提となる。
- 「趣味であり空き時間のみ」という制約下で、0.8が遅延している事実は、無料ファンゲームの「持続性リスク」を示す。

### Gaps
- Steamのレビュー件数・好評率の具体値は検索結果に出なかった（GamesRadarの「最高評価級」という表現のみ）。
- Yuが「スコープをどう決めたか」「なぜ無料を貫くのか」を自分の言葉で語った一次インタビュー全文は未取得（Koefficient動画は二次引用のみ）。
- 2026年時点の0.8の配信状況は未確認。

---

## Q4. Halls of Torment（Chasing Carrots）

### Takeaway
シュトゥットガルトの4人規模スタジオChasing Carrotsは、14年・4作の後にGodot製のHalls of Tormentで初ヒットを出した。2023-05-24のEA開始から約2か月で45.5万本、2024-10にSteamで100万本。本人たちは「最大の影響はVampire Survivors」と明言し、前作Good Companyから「スコープ・スケール・リスク管理」を学んだと語っている。

### Cited Findings
- EA開始は2023-05-24、10%オフ、#madewithgodot と開発者Xで告知 — [Chasing Carrots on X](https://x.com/Chasing_Carrots/status/1661378225728020484)
- EA開始から約2か月で455,311本を販売。大半は米国市場（GamesMarkt、独語、2023年） — [GamesMarkt: Alle Zahlen](https://www.gamesmarket.global/chasing-carrots-alle-zahlen-zum-stuttgarter-ueberraschungshit-halls-of-torment-2e3b1978d0b4425cb8297bee76c33f6c/)
- 2024年10月、Steamで100万本突破を発表。「リリース直後でのこの達成は我々にとって大きな成果」とコメントし、無料アップデート継続を表明 — [GamingOnLinux（2024-10）](https://www.gamingonlinux.com/2024/10/halls-of-torment-hits-1-million-sales-more-free-updates-planned/)
- 1.0正式リリースは2024-09-24。クレジット：ディレクターPaul Lawitzki、プロデューサーMara Mehlitz、プログラマーDominik Schneider、アーティストDaniel Karner。開発者は「最大の影響は2022年のVampire Survivors」と述べ、ビジュアル面の影響としてArcanum、Nox、Fallout、Planescape: Tormentを挙げている — [Wikipedia: Halls of Torment](https://en.wikipedia.org/wiki/Halls_of_Torment)
- W4 Gamesインタビュー：Halls of Tormentでヒットするまでに4作・14年かかった。「寛大な投資家に恵まれた」 — [W4 Games interview](https://www.w4games.com/blog/w4-games-news-1/interview-with-chasing-carrots-developer-of-halls-of-torment-120)
- FullCleared（1.0前のメールインタビュー）：前作Good Companyからの最大の学びは「プロジェクトのスコープとスケールの決め方、リスクの管理の仕方」 — [FullCleared interview](https://fullcleared.com/features/inside-halls-of-torment-an-interview-with-chasing-carrots/)
- 80.lvの特集では「クエストベースのメタ進行」と90年代風ビジュアルを特徴として列挙 — [80.lv](https://80.lv/articles/halls-of-torment-a-survival-roguelite-with-90s-visual-style)
- レビュー側の評価：設計者はVSから差別化しようとするより「あえて寄せる（leaned in）」方向を取った — [FullCleared review](https://fullcleared.com/reviews/halls-of-torment-review/)
- コンソール展開と拡張（GamesMarkt英語版） — [GamesMarkt](https://www.gamesmarket.global/chasing-carrots-halls-of-torment-is-expanding-and-coming-to-consoles-a10bb4598d346929d7e3de150b8a15d1/)
- 映像インタビュー：Interviewing Indies Ep 7（Paul、スタジオ史とHoT） — [YouTube](https://www.youtube.com/watch?v=FKIFalBJab8)

### Inferences
- 「寄せる」設計（VSの型を維持）＋「強い美術コンセプト（Diablo 1世代のダークファンタジーの質感）」＋「クエスト型アンロック」の組み合わせが、差別化を"遊び方"ではなく"見た目と目標設計"で達成した例と言える。
- 投資家付きの小規模スタジオが、EAから2か月で45万本という速度を出したことは、2023年半ばでも「ジャンルの窓」は開いていたことを示す。

### Gaps
- 「Diablo」を直接言及した開発者発言は検索結果に出なかった（Wikipediaの影響一覧にもDiabloはない）。
- 手動エイムオプションに関する開発者コメントは未確認。
- 開発期間（着手〜EA）、EA時の価格、GamesMarkt記事の他の数字（予算等）は本文未取得のため不明。

---

## Q5. Deep Rock Galactic: Survivor（Funday Games / Ghost Ship Publishing）

### Takeaway
既存IP（DRG）×サバイバーライクの代表例。Funday GamesがGhost Ship創業者と会ってから6か月で発表し、2024-02-14のEA初週で50万本、1か月で100万本、2026-10に200万本超。開発者は「市場に溢れるサバイバーライクに急かされた」「他の新興作を機能単位に分解した」「イノベーションは極力低く抑える」と、意図的に"安全な設計＋強いコミュニティ"を選んだことを明かしている。

### Cited Findings
- EA開始2024-02-14、1週間で50万本、同時接続ピーク約57,000（PC Gamer、2024-02） — [PC Gamer](https://www.pcgamer.com/deep-rock-galactic-survivor-sells-half-a-million-copies-in-its-first-week-of-early-access-as-developer-funday-games-reveals-plans-for-the-future/)
- 2024年3月に100万本（Game Developer） — [Game Developer](https://www.gamedeveloper.com/business/deep-rock-galactic-survivor-grows-to-sell-1-million-early-access-copies); [PC Gamer: sails past a million](https://www.pcgamer.com/games/roguelike/deep-rock-galactic-survivor-sails-past-a-million-sold-as-developers-salute-players-ravenous-appetite-for-space-dwarf-content/)
- 2026-10-27のプレスリリースで、EA以来200万本超。Knockout拡張（Brawlerクラス、新バイオーム）が2026-11-17にXbox/Steamで配信予定 — [Mynewsdesk press release](https://www.mynewsdesk.com/uk/swipe-right/pressreleases/deep-rock-galactic-survivor-knockout-expansion-to-release-on-november-17th-3474651); [GamingOnLinux（2026-10）](https://www.gamingonlinux.com/2026/10/deep-rock-galactic-survivor-knockout-expansion-arrives-november-17/)
- 比較：本家DRGは2018年EAから3年で200万本（PC Gamer） — [PC Gamer](https://www.pcgamer.com/deep-rock-galactic-survivor-sells-half-a-million-copies-in-its-first-week-of-early-access-as-developer-funday-games-reveals-plans-for-the-future/)
- 1.0は2025-09-17（Gear＝装備システム追加） — [Steam news](https://store.steampowered.com/news/app/2321470/view/516332808973582390); [GamingOnLinux（2025-09）](https://www.gamingonlinux.com/2025/09/deep-rock-galactic-survivor-is-an-excellent-horde-survival-game-1-0-out-now/); [GameSpot](https://www.gamespot.com/articles/deep-rock-galactic-survivor-1-0-launches-in-september-minus-one-mode/1100-6530779/)
- GamesRadarインタビュー：Funday GamesがGhost Ship創業者と会ってから6か月で発表。「（Ghost Shipは）地球上で最も活発なコミュニティの一つを持ち、新しいゲームを渇望していた」。毎日ストアに溢れるサバイバーライクが「速く動く」動機になった。VSだけでなく他の新興作からも着想を得て「それらを機能に分解した（We broke them down into features）」。売れないかもしれないという不安があった — [GamesRadar](https://www.gamesradar.com/games/roguelike/deep-rock-galactic-survivors-devs-were-scared-the-roguelike-spin-might-not-sell-but-thankfully-they-have-one-of-the-most-active-communities-on-the-planet/)
- Fundayのプロデューサー：DRGをシングルプレイのバレットヘブン型オートシューターに翻案するのは「自然なフィット」だった（PS5版PR） — [Games Press](https://www.gamespress.com/en-US/BULLET-HEAVEN-SPINOFF-DEEP-ROCK-GALACTIC-SURVIVOR-OUT-NOW-ON-PLAYSTATI)
- Funday Games CCO Anders Leicht Rohde：「我々は請求書を抱えた50人のスタジオだ」「奇妙に聞こえるが、我々はイノベーションを可能な限り低く保とうとしている」（イノベーションのためのイノベーションは生き残るには高くつく） — [GamesRadar](https://www.gamesradar.com/games/fps/deep-rock-galactic-roguelike-dev-says-innovation-for-innovations-sake-is-too-expensive-to-survive-were-a-studio-of-50-people-with-bills-to-pay/)
- EA初期ロードマップ：新バイオーム、バイオームごとのミューテーター、ドローンBoscoの独立アップグレードツリー — [PC Gamer](https://www.pcgamer.com/deep-rock-galactic-survivor-sells-half-a-million-copies-in-its-first-week-of-early-access-as-developer-funday-games-reveals-plans-for-the-future/); [Rogueliker roadmap](https://rogueliker.com/deep-rock-galactic-survivor-roadmap/)
- コミュニティ運営：Ghost Ship Publishingの広報責任者Alex Skronskiが、冗談半分だが競技性の高いeスポーツ風イベント「Ultimate Challenge Invitationals」やコミュニティ構築について語っている — [Rogueliker interview](https://rogueliker.com/deep-rock-galactic-survivor-interview/); [Gamereactor（community）](https://www.gamereactor.eu/ghost-ship-publishings-marketing-lead-reveals-the-key-to-building-a-community-as-strong-as-deep-rock-galactics-1676383/); [Gamereactor（esport）](https://www.gamereactor.eu/we-chat-with-ghost-ship-publishing-about-turning-deep-rock-galactic-survivor-into-a-compelling-esport-1676293/)
- Ghost Ship Publishing CEOのインタビュー（新しいパブリッシング方針、EAの利点） — [Game Rant](https://gamerant.com/ghost-ship-publishing-interview-early-access-new-games-deep-rock-galactic/)

### Inferences
- 「IPのコミュニティを借りる」「機能を分解して安全に組む」「EAで長期運営」の三点セットは、資金のある中規模スタジオがジャンル後期に参入する際の定石として読める。
- 「イノベーション最小化」宣言は、ジャンル後期の参入者にとって"新規性"より"確実なテーマ適合（採掘＝地形破壊）"が売れる要因だったことを示唆する。

### Gaps
- DRG:Survivorチームの正確な人数、開発期間、EA価格は検索結果に出なかった。
- Ghost Ship Publishingがジャンル全体についてどう述べたか（Game Rantインタビュー本文）は未取得。

---

## Q6. Megabonk（Vedinad、2025）

### Takeaway
Megabonkはソロ開発者Vedinadによる3Dサバイバーライクで、2025-09-18のSteam発売から2週間で100万本（第三者推計は約130万本）、同時接続ピーク117,336人を記録した。本人は「大作の発売が重なる日に出すなと皆に警告された」中で発売を強行し、YouTube Shorts等の短尺動画で集客。Chris Zukowskiは「2025年5月時点でVS・Brotato・DRG:Sが市場の75%超を占めていたが、Megabonkが登場してジャンルを乗っ取った」と分析している。

### Cited Findings
- 2025-09-18にSteamで発売、2週間で100万本。開発者Vedinadが10-02にSNSで公表 — [Game Developer](https://www.gamedeveloper.com/business/indie-hit-megabonk-moves-over-a-million-copies-in-two-weeks); [VGChartz](https://www.vgchartz.com/article/465897/megabonk-sales-top-1-million-units-in-2-weeks/); [TechBriefly](https://techbriefly.com/2025/10/08/vedinads-megabonk-surpasses-one-million-sales-on-steam/)
- Video Game Insightsの推計では総販売は約130万本に近い（2025-10） — [VGChartz](https://www.vgchartz.com/article/465897/megabonk-sales-top-1-million-units-in-2-weeks/)
- 同時接続ピーク117,336（SteamDB） — [Wikipedia: Megabonk](https://en.wikipedia.org/wiki/Megabonk); [Bullet Haven review](https://bullethaven.com/review/megabonk)
- 発売3日で10万本（Game Spark、2025-09-22）、同接5万人突破（Game Spark、2025-09-27） — [Game Spark 09-22](https://www.gamespark.jp/article/2025/09/22/157449.html); [Game Spark 09-27](https://www.gamespark.jp/article/2025/09/27/157736.html)
- Vedinadの発言：「今夜はスパゲッティにソースを多めにかけて食べる」；「修正したいこと、変更したいことがたくさんある」「疲れたので少し休む」（2025-10） — [PC Gamer](https://www.pcgamer.com/games/roguelike/vampire-survivors-like-megabonk-makes-megabucks-selling-a-million-copies-in-2-weeks-and-currently-has-more-daily-players-than-borderlands-4-on-steam-ill-be-eating-spaghetti-with-extra-sauce-tonight/); [GamesRadar](https://www.gamesradar.com/games/roguelike/out-of-nowhere-roguelike-hit-megabonk-has-sold-1-million-copies-in-2-weeks-solo-creator-says-ill-be-eating-spaghetti-with-extra-sauce-tonight/); [AUTOMATON](https://automaton-media.com/articles/newsjp/megabonk-20251003-360199/); [gamebusiness.jp](https://www.gamebusiness.jp/article/2025/10/03/25185.html)
- 発売日の動画で「今日ゲームを出すなと皆に警告されてきた。他の巨大タイトルのど真ん中で発売するからだ」と語り、極めて混雑したリリース時期に発売した — [GamingOnLinux（2025-10）](https://www.gamingonlinux.com/2025/10/megabonk-is-a-mega-success-selling-1-million-in-2-weeks-after-being-repeatedly-told-to-delay-it/)
- 集客はYouTube Shortsの短尺フォーマットを活用。「Wishlist Megabonk on Steam to help me out」という呼びかけ。序盤の敵（舌の長い禿頭）はフォロワーの提案から採用 — [New Leaf News review](https://newleafnews.network/2025/09/19/vedinad-megabonk-indie-game-review/)
- 設計上の差別化（コミュニティ分析）：バニーホップで丘を登り群れを跳び越えられる（見下ろし型には不可能）；固定アップグレードではなくレアリティ付きランダム強化；3Dステージ構造はRisk of Rain 2由来 — [Rogueranker](https://rogueranker.com/games-like-megabonk/); [Steam討論](https://steamcommunity.com/app/3405340/discussions/0/598541076225201662/)
- 価格は約9.99ドル（ガイドサイト） — [megabonk.org FAQ](https://megabonk.org/faq/is-megabonk-worth-it)
- Steam評価：2025-11時点で「非常に好評」・英語レビュー約3万件との報道と、「圧倒的に好評」95%との記述が併存（ソース間で不一致） — [Checkpoint Gaming](https://checkpointgaming.net/news/2025/11/megabonk-has-withdrawn-from-the-game-awards-2025/); [Bullet Haven](https://bullethaven.com/review/megabonk)
- The Game Awards 2025：Best Debut Indie Gameにノミネート後、開発者が「以前に別スタジオ名義で出した作品があり、デビュー作に該当しない」として辞退。その後Players' Voice部門の30作に再ノミネートされ「これまで以上に戻ってきた（We're more back than ever）」（2025-11） — [Game Informer](https://gameinformer.com/2025/11/19/megabonk-developer-withdraws-from-the-game-awards); [Kotaku](https://kotaku.com/megabonk-dev-officially-withdraws-it-from-the-game-awards-2000645270); [GamesRadar](https://www.gamesradar.com/games/roguelike/megabonk-dev-dropped-out-of-the-game-awards-on-a-technicality-but-now-the-roguelike-is-back-with-a-players-voice-nomination-were-more-back-than-ever/); [Screen Rant](https://screenrant.com/megabonk-vedinad-game-awards-withdraw-not-debut-indie-game/)
- 発売後の運営：公式ロードマップは「作るよう努力する」との発言のみで未公開（2025-10）；Spookyアップデートは新マップ追加のため遅延；2026-01-26の1.0.64で帽子追加と進行バグ対応；ガイドサイトによれば最新は2026-02-04の1.0.69で、コンソール版の確定日程なし（ガイドサイトは信頼度が低い） — [Dexerto roadmap](https://www.dexerto.com/wikis/megabonk/megabonk-roadmap/); [Screen Rant: Spooky delayed](https://screenrant.com/megabonk-new-map-content-update-coming-soon/); [TheSixthAxis](https://www.thesixthaxis.com/2026/01/26/megabonk-update-1-0-64-adds-hats-and-addresses-progress-issue/); [megabonk.org patch notes](https://megabonk.org/guides/patch-notes/)
- 市場分析（Chris Zukowski「The cycle of a hit genre」2025-11-12）：2025年5月時点でVS・Brotato・DRG:Sの3作がジャンル市場の75%超を占めていた。BrotatoらによりVSのシェアは一時25%未満に落ちていた。そこへMegabonkが登場し、競合のシェアを目に見えて食いながらジャンルを乗っ取った — [HTMAG: The cycle of a hit genre](https://howtomarketagame.com/2025/11/12/the-cycle-of-a-hit-genre/)
- スペイン語のケーススタディ：2025年には飽和していたジャンルで、戦略的ポジショニング、計算された客層の重なり、配信者への訴求、本物らしいトーンで抜け出した。ピッチは「3D化」＋「Risk of Rain」参照 — [marketingyvideojuegos.com](https://marketingyvideojuegos.com/casos-de-exito/megabonk-vendio-1-3m-copias-dos-semanas-2025/)
- 注意：devlandmarketing.comの「ケーススタディ」はトレーラー内の隠しカウンターやDiscordコード等、裏付けのない記述が多く、信頼性が低い（検索結果の評価でも捏造の疑い） — [devlandmarketing（非推奨）](https://devlandmarketing.com/megabonk-case-study)
- 日本の配信者も含め各国で人気との国内報道 — [Game Spark 09-27](https://www.gamespark.jp/article/2025/09/27/157736.html)

### Inferences
- Megabonkは「ジャンルの第2波（2022–23）が終わった後の2025年」に、3D化＋移動の自由度（ジャンプ）＋ミーム的トーン＋短尺動画の三点で再度市場を開いた。ジャンルの"窓"は閉じたのではなく、十分に新しい切り口があれば再度開くことを示す。
- 「混雑日に出すな」という定説に反して成功した事実は、短尺動画で既に需要を作れていれば発売日の競合は決定的でないことを示唆する（ただし一般化はできない）。
- 発売後のロードマップ不在と更新ペースの鈍化は、ソロ開発者が100万本級のコミュニティ期待を抱える難しさを示す（Brotatoは外部スタジオに委ねる形で解決）。

### Gaps
- 開発期間、Vedinadの過去作名義、使用エンジン、マーケティング戦略を本人が体系的に語ったインタビューは検索結果に出なかった。
- 2026年の累計販売本数（200万本到達など）を示す資料は見つからなかった。
- ZukowskiのHTMAG記事本文（市場シェア算出方法等）は未取得。

---

## Q7. その他の注目作（開発者発言があるもの）

### Takeaway
Soulstone Survivors（1人→12人へ拡大、100万本超）、Rogue: Genesia（Mod出身ソロ、3万ドル想定が初年度約45万ドル）、Yet Another Zombie Survivors（1.0で2週間8.8万本、累計約75万〜100万本）、Jotunnslayer（EA2週間で10万本）、Picayune Dreams（GameMaker Awards 2024最優秀）、Boneraiser Minions（ソロ、DLCではなく無料更新主義）、Death Must Die（EA価格を段階的に引き上げる宣言）など、二番手以降にも「テーマ／切り口を1つ強く持った作品」が複数、数十万〜100万本規模に達している。

### Cited Findings
**Soulstone Survivors（Game Smithing）**
- Game Lead Allan SmithがGamescom LATAM 2025で、1.0でEAにない大量のロアとストーリーを追加すると語った — [Game Rant interview](https://gamerant.com/soulstone-survivors-roguelike-action-lore-early-access-steam/); [Game Rant（launch）](https://gamerant.com/soulstone-survivors-lore-early-access-full-release-story-backstory/)
- PS/Xbox版は6月17日に発売（Rogueliker） — [Rogueliker interview](https://rogueliker.com/soulstone-survivors-interview/); [Rogueliker review](https://rogueliker.com/soulstone-survivors-review/)
- 100万本超・「非常に好評」、収益で1人体制から12人スタジオに拡大（二次的なブログ記事のため要注意） — [expertgamereviews](https://expertgamereviews.com/soulstone-survivors-vampire-survivors-success-story/); [digitrendz](https://digitrendz.blog/newswire/business/23365/how-game-smithing-rode-the-vampire-survivors-success-wave/)
- 第三者推計の総売上約1,115万ドル（推計） — [Steam Revenue Calculator](https://steam-revenue-calculator.com/app/2066020/soulstone-survivors)
- 2022年のPC Gamerも初期クローン群の一つとして言及 — [PC Gamer](https://www.pcgamer.com/so-so-many-vampire-survivors-clones-came-out-this-year/)

**Rogue: Genesia（Huard Ouadi）**
- リヨンのソロ開発者。Mod「Epic Boss Fight」が300万DL超で、その成功がゲーム開発への移行を後押し — [indiegames.wtf interview](https://indiegames.wtf/interviews/rogue-genesia/)
- 2022年のインタビューで「3万ドル程度を想定していた」が、時点で総売上448,426ドル。「初めて出荷した作品でこの成功は極めて稀」 — [indiegames.wtf](https://indiegames.wtf/interviews/rogue-genesia/)
- GamesRadar：「想定よりはるかに売れた」ことでフルタイム開発が可能になり、2023年にコンテンツ追加後に価格を9ドルに引き上げ — [GamesRadar: gold rush](https://www.gamesradar.com/games/action/vampire-survivors-kicked-off-a-game-development-gold-rush-but-has-a-legitimately-new-genre-emerged-between-the-cash-ins/)
- EA開始2022年9月、1.0は2025年3月。30万DL超、5,000件超のレビューで「非常に好評」 — [Games Press: Rogue Genesia 1.0](https://www.gamespress.com/Rogue-Genesia-Slashes-Its-Way-Out-of-Early-Access-V10-is-Out-Now-on-St)
- 差別化：Slay the Spire風のマップと複数ステージ（PC Gamer 2022） — [PC Gamer](https://www.pcgamer.com/so-so-many-vampire-survivors-clones-came-out-this-year/)
- 第三者推計総売上：約290万〜393万ドル（推計がソースで食い違う） — [Steam Revenue Calculator](https://steam-revenue-calculator.com/app/2067920/rogue:-genesia); [games-stats](https://games-stats.com/steam/game/rogue-genesia/)

**Yet Another Zombie Survivors（Awesome Games Studio）**
- GameDiscoverCo「When 1.0 goes nice」：1.0後2週間で8.8万本、PC累計推計約75万本（2026） — [GameDiscoverCo](https://newsletter.gamediscover.co/p/when-10-goes-nice-yet-another-zombie)
- GamingOnLinuxとの対談（2026-10）：最大の課題は「プレイヤーが望むコンテンツを詰め込みつつ全プラットフォーム同時リリースすること」 — [GamingOnLinux](https://www.gamingonlinux.com/2026/10/a-chat-with-awesome-games-studio-about-yet-another-zombie-survivors/)
- スタジオ自身はSteam/GOG/PS/Xbox合計で100万本近いと主張。Switch版は14.99ドル、無料デモ付き — [Happy Gamer](https://happygamer.com/yet-another-zombie-survivors-switch-release-170802/)
- 91%以上の好評率（Game Rant） — [Game Rant](https://gamerant.com/new-games-steam-yet-another-zombie-survivors-reviews/)
- 1.0時点でco-opなし（レビューで短所として指摘）。Steamフォーラムではsurvivor.ioの3Dコピー／アセットフリップとの非難スレッドも — [playday.one review](https://playday.one/2026/08/30/yet-another-zombie-survivors-review/); [Steam討論](https://steamcommunity.com/app/2163330/discussions/0/3803902828476428640)

**Jotunnslayer: Hordes of Hel（Games Farm / Grindstone）**
- 2025年2月のEA開始から2週間で10万本超（GamesMarkt） — [GamesMarkt](https://www.gamesmarket.global/jotunnslayer-hordes-of-hel/)
- RPGamerインタビュー（2026-08）でGrindstoneのMatej Hudákは「我々がやった中で最大のもの」と述べ、「数字よりプレイヤーのフィードバックを重視した。プレイヤーは狙いを理解し、他の人に伝えてくれた」 — [RPGamer](https://rpgamer.com/2026/08/jotunnslayer-hordes-of-hel-interview/)
- 第三者推計の売上約230万ドル — [games-stats](https://games-stats.com/steam/game/jotunnslayer-hordes-of-hel/)
- 発売日はソースで不一致（2025-01-21説、2025-02説） — [Game8](https://game8.co/articles/games/jotunnslayer-hordes-of-hel)

**Picayune Dreams（Stepford）**
- Creative Bloqインタビュー：GameMaker Awards 2024でBest Game受賞。「VSはAndyと私がかなり遊んでいたもので、Andyは通話中にTouhouを配信していた」。次に何を作るか迷った際に成長中のこのジャンルで作る案が出た。見出しの言葉：「開発の3分の1あたりで、このゲームが大嫌いになった」 — [Creative Bloq](https://www.creativebloq.com/3d/video-game-design/the-challenges-of-being-an-indie-dev-about-a-third-of-the-way-through-the-games-development-i-hated-the-damn-thing)
- 公式に掲げる影響：VS（ホード生存ローグライク）、Touhou（本物の弾幕）、Yume Nikki（シュールな絵と秘密）、Diablo（パワースケーリングとアイテム表示） — [Steam: Picayune Dreams](https://store.steampowered.com/app/2088840/); [Games Press](https://www.gamespress.com/Picayune-Dreams-PC-Launch)
- 体制：Stepford（プログラム）、Andyland（アート）、milkypossum（音楽）、パブリッシャー2 Left Thumbs。2023年12月PC発売 — [COGconnected](https://cogconnected.com/2023/12/picayune-dreams-is-out-now-on-pc/); [Steam announcements](https://steamcommunity.com/app/2088840/announcements/)

**Boneraiser Minions（caiys）**
- ソロ開発、GameMaker製。EA 2022-08-05、1.0 2023-03-09 — [PCGamingWiki](https://www.pcgamingwiki.com/wiki/Boneraiser_Minions); [Steam](https://store.steampowered.com/app/1944570/Boneraiser_Minions/)
- 開発者はDLCを「あまりやらない」方針で、新アイデアはアップデートとして出す。「あらゆるコンテンツ案を入れたtxtファイルがある」（2024-12のフォーラム回答） — [Steam討論: Gonna make a DLC?](https://steamcommunity.com/app/1944570/discussions/0/501685685359540276/)

**Death Must Die（Realm Archive）**
- EA開始2023-11-14。開発者はEA価格を低めに設定し、大型パッチごとに引き上げると表明（Steamページ上の引用） — [Steam: Death Must Die](https://store.steampowered.com/app/2334730/Death_Must_Die/)
- レビュー20,985件・90%好評だが、直近は賛否混在（「完全に放置された」vs「完成作のよう」） — [Game8 review](https://game8.co/articles/reviews/death-must-die-review); [Steam Community](https://steamcommunity.com/app/2334730)

**Deep Rock以外のIP系／日本語圏**
- Choo Choo Survivor（鉄道ヴァンサバ、"非常に好評"）：開発者は少し前まで鉄道の機械エンジニア（Game Spark、2023-07） — [Game Spark](https://www.gamespark.jp/article/2023/07/25/132374.html)
- Machick 2（ニワトリヴァンサバ、2025-10）：「業界でまだ見たことのない新しいもの」を作りたくて魔法のニワトリを主役に。全要素を遊び尽くすには300時間以上 — [Game Spark](https://www.gamespark.jp/article/2025/10/07/158136.html)
- Mana Alchemy（2026-10、3人体制）：「ヴァンサバの1ランごとにリセットされる仕組みが、インフレしていったら面白い」という発想からオープンワールド化 — [Game Spark](https://www.gamespark.jp/article/2026/10/12/173503.html)
- Blow Away Survivors（2024-07）：VS流行期に「敵を吹き飛ばす要素」とジャンルの相性に着目して開発。2019年のアプリでの技術的限界が心残りだった — [INDIE GAMES JOURNAL](https://indiegamesjournal.jp/2024/07/558.html)
- サバイバルコード（ByteRockers' Games、2026-03正式リリース、540円）：プログラミングで攻撃を組むヴァンサバ系 — [AUTOMATON](https://automaton-media.com/articles/newsjp/20260312-428666/)
- EIR（2026年冬予定）：ヴァンサバライク×オートチェス的アップグレード — [ファミ通](https://www.famitsu.com/article/202604/70781)

### Inferences
- 二番手群の共通点は「1つの強い切り口」：Slay the Spire風マップ（Rogue: Genesia）、弾幕×夢（Picayune）、ネクロマンサーの召喚（Boneraiser）、北欧神話×高品質アート（Jotunnslayer）、分隊制ゾンビ（YAZS）。純粋な"VSの再現"だけで数十万本に至った例は、今回の検索では見つからなかった。
- 「EA価格を段階的に上げる」（Death Must Die、Rogue: Genesia）は複数のソロ開発者が採用しており、EAでの早期購入者優遇とコンテンツ増加の整合を取る定石になっている。

### Gaps
- Spellbook Demonslayers、Nomad Survival、Vampire Hunters、Shape of Dreams、Goobies、Army of Ruin、Keeper's Toll、Bio Prototype、Gunlocked、Void Scrappers、Tiny Rogues、Swarm Grinder、Nordic Ashes、Sea of Survivorsについては、検索予算の上限により開発者発言を取得できなかった。
- Soulstone Survivorsの公式売上数値と開発者の言葉での「VSの波にどう乗ったか」は未取得（二次ブログのみ）。

---

## Q8. 失敗したクローン側：なぜ売れなかったか

### Takeaway
失敗側の一次資料は少ないが、見つかった範囲では「コアの手触りが最後まで良くならなかった」「開発が遅くて数百本の競合に先を越された」（Star Survivorsポストモーテム）、「本家の武器名を変えただけのリスキン」「同じ開発者の他作と同じアセット」（Warhammer Survivors／Entropy Survivorsのフォーラム）、「プレイヤーが画面のゴチャつきに埋もれる」（RPS経由）が主因として挙がる。市場側では2026年8月だけでBullet Heavenタグの新作が72本出ており、供給過多が前提条件になっている。

### Cited Findings
- Star Survivors（ソロ開発、itch.ioポストモーテム）：2022年12月の難航したプロトタイプ期の後、「コアのゲームプレイが気持ちよくならなかった」ため前に進めなかった。ジャンル定義作の直後に着手したが、開発が遅く、数百本の競合が先にリリース。システムはツインスティックシューターの枠組みに転用し、プロジェクトは放棄 — [itch.io: Star Survivors postmortem](https://dandoesathing.itch.io/star-survivors/devlog/612575/postmortem)
- Warhammer Survivors（Steamフォーラム）：「VSにWarhammerアセットを被せたリスキン」「武器の多くは本家の改名（Whip→Sword、Knife→Bolter、Magic Wand→Lasgun）」との批判。「製品版は買わない」という声 — [Steam討論: most derivative clone](https://steamcommunity.com/app/3669620/discussions/0/839503122780964607/); [Steam討論: This is horrible](https://steamcommunity.com/app/3669620/discussions/0/839503122780936383/)
- Entropy Survivors（Steamフォーラム）：同じ開発者の他作にも同じカエルとロボットのキャラが出ているとして「アセットフリップ」と指摘（反論もあり） — [Steam討論: just a asset flip](https://steamcommunity.com/app/2602030/discussions/0/604141771964926710/)
- Yet Another Zombie Survivorsにも「survivor.ioの3Dアセットフリップコピー」との非難スレッド（ロック済み、反論あり） — [Steam討論](https://steamcommunity.com/app/2163330/discussions/0/3803902828476428640)
- Rock Paper Shotgun（Wikipedia経由）：VSクローンの大半は、本家に比べてプレイヤーを視覚的なゴチャつきから識別させるのが下手だった — [Wikipedia: Vampire Survivors–like](https://en.wikipedia.org/wiki/Vampire_Survivors%E2%80%93like)
- 視認性に関するプレイヤーの声：敵弾が混沌の中で事実上見えない→アウトラインや不透明度スライダーの提案（itch.io）；開発者自身が「視覚ノイズが多すぎて重要要素が埋もれる」と記す更新ログ — [itch.io post](https://itch.io/post/13269305); [Magic Survivors devlog](https://donragout.itch.io/magicsurvivors/devlog/474463/update-2023-01-10)
- 供給過多：2026年8月だけでSteamに「Bullet Heaven」タグの新作が72本発売（GameDiscoverCo集計）。2025年のSteamタイトル名では「Simulator」が最多で、「Survivors」「Backrooms」「Idle」「Cozy」が増加傾向 — [GameDiscoverCo newsletter（archive）](https://newsletter.gamediscover.co/archive)
- 2022年の時点でPC Gamerは「VSの1年後に既にクローンのブーム」とし、同年のWordleクローンの洪水に例えた — [PC Gamer](https://www.pcgamer.com/so-so-many-vampire-survivors-clones-came-out-this-year/)
- 「クローンが増える理由は開発コストの低さ。フォーミュラの単純さが参入障壁を下げる」 — [RetroStyle Games blog](https://retrostylegames.com/blog/vampire-survivors-clones/)
- 「一見儲かりそうなSurvivors系市場の分け前を狙う開発者でジャンルが溢れた」（個人ブログのクローン連載、2023-12／2024-05／2025-09「Neverending Story」） — [Cubic Creativity: Clones 3](https://cubiccreativity.wordpress.com/2023/12/16/vampire-survivors-clones-3-the-next-generation/); [Clones 4](https://cubiccreativity.wordpress.com/2024/05/25/vampire-survivors-clones-4-partly-cloudy-with-a-chance-of-vampires/); [Clones 5](https://cubiccreativity.wordpress.com/2025/09/06/vampire-survivors-clones-5-neverending-story/)
- Jeff Vogel（Bottomfeeder）：「インディー市場がこれほど大量に溢れていると、残っているジャンルはほとんどない」 — [Bottomfeeder: the fast life and fiery death of](https://bottomfeeder.substack.com/p/the-fast-life-and-fiery-death-of); 関連エッセイ「Five Bucks To Feel Like a God」 — [Bottomfeeder](https://bottomfeeder.substack.com/p/five-bucks-to-feel-like-a-god)
- モバイル側の"成功したクローン"：Habbyの Survivor.io はSensor Towerによれば1日50万ドルのIAP収益（TheGamerはこれを「パクリが栄えるのを見るのは辛い」と批判） — [TheGamer](https://www.thegamer.com/vampire-survivors-rip-off-survivor-io-mobile-clone-copy-cat/)
- VS本家のフォーラムにも「このゲームが素晴らしすぎることの弊害（クローンの氾濫）」というスレッド — [Steam討論](https://steamcommunity.com/app/1794680/discussions/0/6266252158288773561/)

### Inferences
- 失敗要因は大別して (1) 手触り（コアループが"気持ちよく"ならない）、(2) 差別化不在（リスキン／改名武器／流用アセット）、(3) 視認性（プレイヤーと敵弾の識別）、(4) タイミング（遅い開発で数百本に先を越される）、(5) 供給過多（月70本超）の5点に整理できる。
- Steamフォーラムの「アセットフリップ」「リスキン」判定は販売直後に付くレッテルで、以後の口コミを決定づける。公開前の段階でこのレッテルを回避できる"固有の見た目と固有のメカニクス"が必須。

### Gaps
- Chris Zukowski／GameDiscoverCoがサバイバーライクの「売れなかった側」の中央値（レビュー数・売上分布）を示した記事本文は未取得。
- r/gamedevの具体的な失敗ポストモーテムスレッドは検索で出なかった（検索結果はitch.ioのみ）。
- 「デモなし」「価格」「性能（低スペック端末での処理落ち）」が失敗要因だとする一次資料は今回見つからなかった。

---

## Q9. ジャンル分析エッセイ・市場データ・日本語圏の知見

### Takeaway
市場データ面では、Zukowskiが「2025年5月時点で上位3作が75%超を占める寡占→Megabonkによる塗り替え」を、GameDiscoverCoが「Bullet Heavenタグ新作が月72本（2026-08）」を示し、Valveは2026年5月に「Bullet Heaven」を公式タグ化した。設計分析では「武器が小さなシステムとして戦う」「チュートリアル不要」「数秒ごとの報酬」「ギャンブル由来の演出心理」「不均衡（壊れたシナジー）を許容」「配信・短尺で説明しやすい」が反復して挙がる。日本語圏ではGame Spark等の開発者インタビューに加え、ゲームジャム（ss1w／unity1week）で「要素を絞れば5日で作れる」という知見が共有されている。

### Cited Findings
**市場・ジャンル命名**
- Chris Zukowski「The cycle of a hit genre」（2025-11-12）：2025年5月時点でVS・Brotato・DRG:Sが市場の75%超、Megabonkがジャンルを乗っ取った — [HTMAG](https://howtomarketagame.com/2025/11/12/the-cycle-of-a-hit-genre/)
- GameDiscoverCo「Charting the rise of (Vampire) Survivors-likes」（ジャンル興隆の統計分析。本文未取得） — [GameDiscoverCo](https://newsletter.gamediscover.co/p/charting-the-rise-of-vampire-survivors)
- Valveは2026年5月、新タグ17件の一つとして「Bullet Heaven」を追加。説明文は「Bullet Hellの反対。自動攻撃で群れを倒しながらアップグレードに集中する」 — [PC Gamer](https://www.pcgamer.com/gaming-industry/its-official-steam-decrees-bullet-heaven-the-name-of-the-vampire-survivors-genre/); [GamesRadar](https://www.gamesradar.com/games/roguelike/steam-canonizes-the-vampire-survivors-subgenre-thats-spawned-a-million-clones/); [TweakTown](https://www.tweaktown.com/news/111680/steam-has-finally-given-vampire-survivors-and-similar-games-its-own-genre-tag/index.html)
- GamesRadar（2026-05）はMegabonkを「昨年の傑出した一作」と位置づけ — [GamesRadar](https://www.gamesradar.com/games/roguelike/steam-canonizes-the-vampire-survivors-subgenre-thats-spawned-a-million-clones/)
- PC GamerのRobin Valentineは「Vampire Survivors-like」という呼称を嫌い「survivor games」「auto-shooters」を推した — [Wikipedia: Vampire Survivors–like](https://en.wikipedia.org/wiki/Vampire_Survivors%E2%80%93like)
- GamesRadar「VSはゲーム開発のゴールドラッシュを起こしたが、金儲けの中から本当に新しいジャンルは生まれたか」（Rogue: Genesia等の開発者取材） — [GamesRadar](https://www.gamesradar.com/games/action/vampire-survivors-kicked-off-a-game-development-gold-rush-but-has-a-legitimately-new-genre-emerged-between-the-cash-ins/)
- Zukowskiの汎用データ（Next Fest）：フェスで得たウィッシュリストの68〜88%はデモ未DLの人から；デモをフェスの数か月前に出した作品は中央値の約2.5倍；2026年2月の中央値は自己申告調査で806件（GDCoの全デモ推計は約200件） — [Steam Page Analyzer: Next Fest results](https://www.steampageanalyzer.com/blog/steam-next-fest-results); [同: Do Steam demos increase sales](https://www.steampageanalyzer.com/blog/do-steam-demos-increase-sales)
- HTMAG「インディーは今が黄金期だという楽観論」（2025-11-04） — [HTMAG](https://howtomarketagame.com/2025/11/04/the-optimistic-case-that-indie-games-are-in-a-golden-age-right-now/)

**VSが機能する理由（設計分析）**
- 「武器が戦う。各武器は個性を持つ小さなシステム」 — [nowloading.co](https://nowloading.co/vampire-survivors-weapons)
- 長いチュートリアルも複雑なUIも覚える操作もなく、最初のアップグレード選択がフックが消える前に来る — [Kokutech design analysis](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors)
- 「数秒以上、良いことが起きない時間がほとんどない」；達成リストが同じコンテンツの反復に副目標を与える；失敗ランでもゴールドがメタ進行に貢献 — [Indie Game Analysis](https://iga.outright.io/games/vampiresurvivors/); [jboger substack](https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors)
- Luca Galanteはギャンブル業界出身で、スロットの派手な演出の知見を宝箱開封演出に活用。「もう一回」の引力と「ニアミス効果」 — [University of Portsmouth blog](https://www.port.ac.uk/news-events-and-blogs/blogs/popular-culture/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game); [Platinum Paragon](https://platinumparagon.info/psychology-of-vampire-survivors/)
- 極端なシナジー（無限スケール・ほぼ無敵）を急いで削除しない「不均衡の許容」 — [Kokutech](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors)
- 配信・クリップで「ルールを知らない人にも説明できるフック」であること；ルートボックス・課金なしの"倫理的"設計が口コミを後押し — [jboger substack](https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors); [Platinum Paragon](https://platinumparagon.info/psychology-of-vampire-survivors/)

**日本語圏**
- Game Spark開発者インタビュー（Choo Choo Survivor／Machick 2／Mana Alchemy）は Q7 参照
- INDIE GAMES JOURNALの制作者コメント（Blow Away Survivors）は Q7 参照
- ゲームメーカーズ（2025-07）：poncle（VS開発元）が即オファーしたキーボードアクション『Berserk or Die』の設計深掘り（poncleがパブリッシャーとして日本作品を拾う動きの例） — [ゲームメーカーズ](https://gamemakers.jp/article/2025_07_16_111093/)
- ss1wゲームジャムの振り返り：ヴァンサバ系ミニゲームを5日で完成。コンセプトに必要な要素を絞り込むことが重要 — [coacoa.net](https://coacoa.net/others/ss1w_vansurv/)
- Unity 2Dヴァンサバ風オートエイム：300体の敵で試すと、物理判定による検索よりタグ検索の方が高速 — [coacoa.net](https://coacoa.net/unity_explain/vans_autoaim/)
- unity1week「うら」（2026-03）：ヴァンサバ風テンプレートアセットを使って参加した事例 — [note: ヤマショウ](https://note.com/yamasho55/n/nd9a4f410a925)
- 「VSのパクリと思われているが、実際はダダサバイバー（Survivor.io）から着想」と述べる作者の振り返り — [note: シュー unity1week「ためる」](https://note.com/bixcube/n/n1c444731073e)
- AIだけでヴァンサバライクを作る連載（軽量化のため画像・音楽を分離しHTML側を作り直し；アニメーション表現とローグライク要素の不足が課題） — [note: 8ball.AI.art](https://note.com/8ball_ai_art8888/n/nba14841640d5)
- AI製ヴァンサバライクをSteamで売る試み（2026-09記事。作業配分は「広報4割、新要素4割、バグ潰し2割」、EA版2026-11-02予定・正式版2027年初頭予定） — [note: Arata Hakuma](https://note.com/arata_hakuma/n/n750309ce4755)
- 日本語のヴァンサバライク感想まとめ（2025-12） — [格安ガジェットブログ](https://yasugad.hatenablog.com/entry/2025/12/31/190000)
- 『Vampire Survivors』をジャンルの祖として「コスパ最強」と評する日本語レビュー — [note: 鉄ナイン](https://note.com/tetsunain_game/n/n0db25b4284b6)

### Inferences
- 「上位3作で75%超」という寡占構造は、新規参入者が"中位"を狙う市場ではなく、"上位に食い込む固有の切り口"がなければ尾部に埋もれることを意味する。Megabonkの例は、その切り口が十分なら寡占は崩せることも示す。
- 日本語圏の知見は「作り方（テンプレ・最適化・ジャム）」に偏り、商業的ポストモーテム（売上と反省）は少ない。国内参入者は海外の数字を参照する必要がある。

### Gaps
- Game Maker's Toolkit、Adam Millard（The Architect of Games）、Design Delve、Noclip のVS／サバイバーライク専用動画は検索結果に出なかった（存在の有無を確認できず）。
- 電ファミニコゲーマー、4Gamer、Zenn、Qiitaの「ヴァンサバ系を作った」ポストモーテムは検索結果に出なかった。
- GameDiscoverCoのジャンル分析本文（作品数・売上分布・中央値）は未取得。

---

## Q10. 統合：ヒットの共通差別化要因、開発期間・チーム規模、"窓"の長さ、2026年参入者への助言

### Takeaway
成功作は例外なく「VSの型（自動攻撃・レベルアップ選択・短いラン・メタ進行）を保ったまま、1つの強い切り口（テーマ/IP、操作の変更、次元の変更、構造の変更）」を持ち、無料デモ→EA→1.0の導線と、短尺動画／配信に乗る見た目を備えていた。ソロでも数か月〜1年、小規模チームでも1年強で市場に出し、EA後も更新を続けている。窓は2022–23年の第1〜2波の後も2025年のMegabonkで再び開いたが、月70本超が出る2026年の市場では「切り口の強さ」の要求水準が上がっている。

### Cited Findings（上記各節からの要点集約。各項目の出典は該当節）
- 保つべきもの（Keep）：
  - 自動攻撃とアップグレード選択に集中する核（Valveタグ定義） — [PC Gamer](https://www.pcgamer.com/gaming-industry/its-official-steam-decrees-bullet-heaven-the-name-of-the-vampire-survivors-genre/)
  - 失敗ランでも進むメタ進行、数秒ごとの報酬、極端なシナジーの許容 — [Kokutech](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors); [IGA](https://iga.outright.io/games/vampiresurvivors/)
  - 低価格帯（20MTD 2.99ドル、Megabonk 約9.99ドル、YAZS Switch 14.99ドル） — [TouchArcade](https://toucharcade.com/2023/06/06/20-minutes-till-dawn-1-0-update-release-date-iphone-android-pc-free/); [megabonk.org](https://megabonk.org/faq/is-megabonk-worth-it); [Happy Gamer](https://happygamer.com/yet-another-zombie-survivors-switch-release-170802/)
  - 無料デモ→フェス→EA→1.0の導線（Brotato 4万WL、20MTD 14.3万WL） — [Games Press](https://www.gamespress.com/Brotato-10-Release); [HTMAG](https://howtomarketagame.com/2022/06/14/20-minutes-till-dawn/)
- 変えるべきもの（Change）＝ヒット作の切り口：
  - 操作：手動エイム＋リロード（20MTD） — [Wikipedia](https://en.wikipedia.org/wiki/20_Minutes_Till_Dawn)
  - 構造：ウェーブ＋ショップ＋狭いアリーナで短いラン（Brotato）；Slay the Spire風マップ（Rogue: Genesia） — [note](https://note.com/kurisiro_tumugi/n/nb76d92dcabc7); [PC Gamer](https://www.pcgamer.com/so-so-many-vampire-survivors-clones-came-out-this-year/)
  - 次元：3D＋ジャンプで地形を越える（Megabonk） — [Rogueranker](https://rogueranker.com/games-like-megabonk/)
  - テーマ/IP：DRG（採掘）、Hololive（無料ファンゲーム）、北欧神話、鉄道、ニワトリ — [GamesRadar](https://www.gamesradar.com/games/roguelike/deep-rock-galactic-survivors-devs-were-scared-the-roguelike-spin-might-not-sell-but-thankfully-they-have-one-of-the-most-active-communities-on-the-planet/); [itch.io](https://kay-yu.itch.io/holocure); [GamesMarkt](https://www.gamesmarket.global/jotunnslayer-hordes-of-hel/); [Game Spark](https://www.gamespark.jp/article/2023/07/25/132374.html); [Game Spark](https://www.gamespark.jp/article/2025/10/07/158136.html)
  - 美術：90年代CRPG風（Halls of Torment）、ほぼモノクローム（20MTD）、夢×弾幕（Picayune） — [80.lv](https://80.lv/articles/halls-of-torment-a-survival-roguelite-with-90s-visual-style); [WC Robinson](https://wcrobinson.org/2024/03/31/20-minutes-till-dawn-review-roguelike-survival-with-a-lovecraftian-twist/); [Steam](https://store.steampowered.com/app/2088840/)
  - 目標設計：クエスト型アンロック（HoT）、スタンプ・釣り・ハウジング等の副次システム（HoloCure） — [80.lv](https://80.lv/articles/halls-of-torment-a-survival-roguelite-with-90s-visual-style); [Siliconera](https://www.siliconera.com/preview-holocure-is-worth-playing-even-if-new-to-hololive/)
- 避けるべきもの（Avoid）：
  - 本家武器の改名リスキン、流用アセット（Warhammer Survivors／Entropy Survivorsの反応） — [Steam討論](https://steamcommunity.com/app/3669620/discussions/0/839503122780964607/); [Steam討論](https://steamcommunity.com/app/2602030/discussions/0/604141771964926710/)
  - プレイヤー／敵弾が埋もれる視覚設計 — [Wikipedia（RPS経由）](https://en.wikipedia.org/wiki/Vampire_Survivors%E2%80%93like)
  - 手触りが固まらないまま長期化し、競合に先を越される（Star Survivors） — [itch.io](https://dandoesathing.itch.io/star-survivors/devlog/612575/postmortem)
  - ソロでの野心的大作化（flanne「5年の大作は誤り」） — [HTMAG](https://howtomarketagame.com/2022/06/14/20-minutes-till-dawn/)
  - ローンチ後の運営放置（Death Must Dieの直近レビュー「放置」、Megabonkのロードマップ不在） — [Game8](https://game8.co/articles/reviews/death-must-die-review); [Dexerto](https://www.dexerto.com/wikis/megabonk/megabonk-roadmap/)
- 開発期間・チーム規模（判明分）：
  - 20MTD：ソロ、数か月（サイドプロジェクト） — [Wikipedia](https://en.wikipedia.org/wiki/20_Minutes_Till_Dawn)
  - Brotato：ソロ（4作目）、デモ2022-05→EA 2022-09→1.0 2023-06 — [Games Press](https://www.gamespress.com/Brotato-10-Release); [Wikipedia](https://en.wikipedia.org/wiki/Brotato)
  - HoloCure：ほぼソロ（75%自作）、趣味・空き時間 — [Wikipedia](https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans!)
  - Halls of Torment：4人クレジット、EA 2023-05→1.0 2024-09 — [Wikipedia](https://en.wikipedia.org/wiki/Halls_of_Torment)
  - DRG:S：50人スタジオ（全社）、会合から6か月で発表、EA 2024-02→1.0 2025-09 — [GamesRadar](https://www.gamesradar.com/games/fps/deep-rock-galactic-roguelike-dev-says-innovation-for-innovations-sake-is-too-expensive-to-survive-were-a-studio-of-50-people-with-bills-to-pay/); [GamesRadar](https://www.gamesradar.com/games/roguelike/deep-rock-galactic-survivors-devs-were-scared-the-roguelike-spin-might-not-sell-but-thankfully-they-have-one-of-the-most-active-communities-on-the-planet/)
  - Megabonk：ソロ — [GamesRadar](https://www.gamesradar.com/games/roguelike/out-of-nowhere-roguelike-hit-megabonk-has-sold-1-million-copies-in-2-weeks-solo-creator-says-ill-be-eating-spaghetti-with-extra-sauce-tonight/)
  - Picayune Dreams：3人＋パブリッシャー — [COGconnected](https://cogconnected.com/2023/12/picayune-dreams-is-out-now-on-pc/)
  - Mana Alchemy：3人 — [Game Spark](https://www.gamespark.jp/article/2026/10/12/173503.html)
- "窓"の推移：
  - 2022年：VSの1年後に既にクローンブーム（PC Gamer）；20MTD（6月）、Brotato（9月）、Rogue: Genesia（9月）、Boneraiser（8月）が同年に成功 — [PC Gamer](https://www.pcgamer.com/so-so-many-vampire-survivors-clones-came-out-this-year/)
  - 2023年：Halls of Torment（5月、2か月で45万本）、Death Must Die（11月） — [GamesMarkt](https://www.gamesmarket.global/chasing-carrots-alle-zahlen-zum-stuttgarter-ueberraschungshit-halls-of-torment-2e3b1978d0b4425cb8297bee76c33f6c/)
  - 2024年：DRG:S（2月、初週50万本） — [PC Gamer](https://www.pcgamer.com/deep-rock-galactic-survivor-sells-half-a-million-copies-in-its-first-week-of-early-access-as-developer-funday-games-reveals-plans-for-the-future/)
  - 2025年：Jotunnslayer（2月、2週間で10万本）、上位3作で75%超の寡占（5月）、Megabonk（9月、2週間で100万本） — [GamesMarkt](https://www.gamesmarket.global/jotunnslayer-hordes-of-hel/); [HTMAG](https://howtomarketagame.com/2025/11/12/the-cycle-of-a-hit-genre/)
  - 2026年：Valveが「Bullet Heaven」を公式タグ化（5月）、8月だけで72本の新作、YAZS 1.0が2週間で8.8万本、DRG:Sが200万本（10月） — [PC Gamer](https://www.pcgamer.com/gaming-industry/its-official-steam-decrees-bullet-heaven-the-name-of-the-vampire-survivors-genre/); [GameDiscoverCo](https://newsletter.gamediscover.co/archive); [GameDiscoverCo](https://newsletter.gamediscover.co/p/when-10-goes-nice-yet-another-zombie); [Mynewsdesk](https://www.mynewsdesk.com/uk/swipe-right/pressreleases/deep-rock-galactic-survivor-knockout-expansion-to-release-on-november-17th-3474651)

### Inferences（2026年参入者への助言）
1. **「VSの型＋切り口1つ」を1文で言えるまで企画を削る**。成功作は全てタイトルや1枚絵で切り口が伝わる（20分／ジャガイモ／3D／採掘／鉄道）。Steamフォーラムは発売直後に「リスキン」判定を下すので、武器名の変更やアセット流用は致命的。
2. **数か月〜1年で出せる規模に収め、デモをフェスの数か月前に出す**。flanneの「5年は誤り」、Star Survivorsの「遅くて先を越された」、Zukowskiの「デモ早出しで2.5倍」が同じ方向を指す。
3. **視認性を最優先の品質基準にする**。クローンが最も多く失敗した点（RPS）であり、Megabonkや20MTDのように配色・シルエットで解く。
4. **EAで低価格から入り、更新ごとに価格を上げる**（Rogue: Genesia、Death Must Die）。ただしEA後の更新停止は即座にレビューに反映される（Death Must Die）。
5. **ローンチ後の運営を設計段階で決める**。ソロ成功者は外部委託（Brotato→Evil Empire、モバイル→Erabit）で解決しており、ソロでロードマップを約束しきれないMegabonkは更新停滞が話題化した。
6. **短尺動画・配信で"説明不要の絵"が作れるか**を企画判定に入れる（Megabonk＝Shorts、DRG:S＝既存コミュニティ、HoloCure＝ファン層）。
7. **2026年の月70本超の供給下では、既存IP・既存コミュニティを持つ参入者が有利**（DRG:S、HoloCure）。持たない場合は「次元／操作／構造」の変更という、より大きな切り口が必要になる（Megabonkの3D化が直近の証左）。
8. **「イノベーション最小化」も戦略になりうる**（Funday Games）が、それはIPとコミュニティという別の資産がある場合に限られる。

### Gaps
- 成功作の「正味の開発期間（人月）」と「予算」はほぼ公表されておらず、本調査でも定量比較はできなかった。
- サバイバーライクのSteam売上分布（中央値、レビュー0〜10件の作品比率）を示す一次データ（GDCo／Zukowski記事本文）は取得できなかったため、「失敗作の典型像」は定性的推論にとどまる。
- 2026年に発売された新作（Bullet Heavenタグ72本/月）のうち何が売れたかの個別データは未調査。
- 本セッションではWebSearchの予算上限とWebFetchの全面ブロックにより、上記の各記事本文の確認、ならびにSpellbook Demonslayers等の残りタイトル、GMTK／Architect of Games等の映像エッセイ、電ファミ・4Gamer・Zenn・Qiitaの日本語ポストモーテムの調査ができなかった。追加調査が必要な場合は別セッション（またはhowtomarketagame.com、newsletter.gamediscover.co、gamesradar.com、gamespark.jp、note.com、en.wikipedia.org、steamcommunity.com 等のネットワーク許可）が必要。
