/**
 * 文言マスタ。プレースホルダ: {name} {job} {facility} {amount} {days}
 * トーン: 魔王は真面目に悪事のつもり、実態はまっとうな雇用主。
 */
export const LINES = {
  recruit: [
    '{job}が「給料出るんですか？」と聞いてきた。出る',
    '{name}を勧誘した。面接は三秒で終わった',
    '{job}の{name}が入社した。社会保険完備だ',
    '{name}が「魔王様の下なら安泰」と言った',
    '{job}を拾った。履歴書は後でいいと言っておいた',
  ],
  recruitFull: [
    '寮が満員だ。魔王城なのに',
    '空き部屋がない。寮を建てねば',
    '定員オーバーだ。魔王城の廊下は寝床ではない',
    'これ以上は詰め込めない。労基がうるさい',
  ],
  assign: [
    '{job}を{facility}に配属した。本人は乗り気だ',
    '{name}を{facility}へ。辞令は手書きだ',
    '{name}が{facility}に着任した。初日から張り切っている',
    '{facility}に{job}が入った。適材適所である',
  ],
  assignMismatch: [
    '{job}を{facility}に入れた。勝手が違うと言っている',
    '{name}が{facility}で首をかしげている',
    '{job}に{facility}は畑違いらしい。まあ頑張れ',
    '{name}「これ、私の仕事ですか？」……そうだ',
  ],
  moraleWarn: [
    '{facility}の士気が下がっている。飯が遠い',
    '{facility}から不満の声。福利厚生を見直すか',
    '{facility}の空気が重い。飯屋を近くに置こう',
    '{facility}で溜息が聞こえる。魔王も少し傷つく',
  ],
  escape: [
    '{job}が逃げた。置き手紙には『一身上の都合』',
    '{name}が退職代行を使って去った',
    '{name}が夜のうちに消えた。有給は残っていた',
    '{job}の{name}が転職した。勇者パーティらしい',
  ],
  retire: [
    '{name}（勤続{days}日）が定年。送別会費{amount}G',
    '{name}が定年を迎えた。花束は経費で落とした',
    '{job}の{name}が引退。退職金代わりに{amount}G',
    '{name}（{days}日）が卒業した。魔王は泣いていない',
  ],
  build: [
    '{facility}を建てた。魔王城より立派かもしれない',
    '{facility}が完成した。テープカットは魔王自ら',
    '{facility}を建設。耐震基準は満たしている',
    '新しい{facility}だ。部下が拍手している',
  ],
  remove: [
    '{facility}を取り壊した。{amount}G戻ってきた',
    '{facility}を撤去。思い出は心に残る',
    '{facility}を解体した。廃材は売れた（{amount}G）',
  ],
  offlineReturn: [
    '寝ている間、部下は真面目に働いていた。意外だ',
    '留守中に{amount}G稼いでいた。有能な部下たちだ',
    'おかえり魔王様。{amount}G貯まっています',
    '城を空けていた間も街は回っていた。少し寂しい',
  ],
  prestigeReady: [
    'この街はもう十分だ。売り払って次へ行こう',
    '十分稼いだ。そろそろ夜逃げの時期だ',
    '魔王の勘が告げている。転生の時だと',
  ],
  prestigeDone: [
    '夜逃げ完了。借金は次の街の自分に任せる',
    '新天地に着いた。前の街のことは忘れよう',
    '転生した。魔王は何度でもやり直す',
  ],
  saveCorrupt: [
    '前世の記憶が飛んだ',
    'セーブが読めない。魔王は記憶喪失になった',
    '帳簿が燃えた。一からやり直しだ',
  ],
  tutorial: {
    0: 'まず人手だ。通りの村人をタップして勧誘しよう',
    1: '働いてもらおう。待機中の村人を選んで露店へ',
    2: '250G貯まったら寮を建てよう。工場の隣が吉だ',
    3: 'あとは任せた。寮で飯屋解禁、稼げば転生できる',
  },
};

/**
 * 場面キーから文言を 1 本選び、プレースホルダを置換して返す。
 * 未知のキーは空文字。値が文字列のキーはそのまま置換する。
 * @param {string} key LINES のキー
 * @param {Object<string, string|number>} [vars] 置換する値
 * @param {() => number} [rng] 乱数 [0,1)
 * @returns {string}
 */
export function pickLine(key, vars = {}, rng = Math.random) {
  const entry = LINES[key];
  let text = '';
  if (Array.isArray(entry)) {
    if (entry.length === 0) return '';
    const i = Math.min(entry.length - 1, Math.floor(rng() * entry.length));
    text = entry[i];
  } else if (typeof entry === 'string') {
    text = entry;
  } else {
    return '';
  }
  return fillVars(text, vars);
}

function fillVars(text, vars) {
  return text.replace(/\{(name|job|facility|amount|days)\}/g, (match, k) =>
    vars[k] === undefined || vars[k] === null ? match : String(vars[k]));
}
