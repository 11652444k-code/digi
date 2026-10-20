/**
 * 職業マスタ。weight は出現の重み、favored は得意施設の id。
 * names は表示名テーブル（ランダムに 1 つ選ぶ）。
 */
export const JOBS = {
  villager: {
    id: 'villager', label: '村人', icon: '🧑‍🌾', weight: 50, favored: null,
    names: ['ハンス', 'ミルカ', 'トービン', 'エルザ', 'ポポロ', 'グレタ', 'ノルド', 'リリカ', 'ボルグ', 'ネッサ', 'カブラ', 'ムギノ'],
  },
  cook: {
    id: 'cook', label: '料理人', icon: '🧑‍🍳', weight: 20, favored: 'canteen',
    names: ['ガルムス', 'ペペロン', 'シチューナ', 'ブイヨネ', 'マルゴ', 'コショウタ', 'フラン', 'グリルド', 'ソテラ', 'ミネスト', 'ポトフィ'],
  },
  merchant: {
    id: 'merchant', label: '商人', icon: '👨‍💼', weight: 20, favored: 'stall',
    names: ['ドルフ', 'ゼニガル', 'カネル', 'ソロバン', 'メルカド', 'ベルナ', 'トレドル', 'ギルダン', 'コインズ', 'ウリテ', 'バザル'],
  },
  smith: {
    id: 'smith', label: '鍛冶師', icon: '🧑‍🔧', weight: 10, favored: 'factory',
    names: ['ガンドル', 'ハガネル', 'ボルツ', 'アンヴィル', 'テツゾウ', 'フイゴン', 'グラム', 'ヴォルカ', 'ドワルフ', 'カナトコ', 'スミティ'],
  },
};

export const JOB_IDS = Object.keys(JOBS);
