/**
 * state.nextId をインクリメントして `<prefix>_<n>` 形式の ID を採番する。
 * @param {object} state
 * @param {string} prefix 'p' | 'f' | 's'（末尾の '_' はあってもなくてもよい）
 * @returns {string}
 */
export function nextId(state, prefix) {
  const base = prefix.endsWith('_') ? prefix.slice(0, -1) : prefix;
  const n = Number.isFinite(state.nextId) ? state.nextId : 1;
  state.nextId = n + 1;
  return `${base}_${n}`;
}
