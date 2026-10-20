#!/usr/bin/env bash
# tests/game/*.test.js をすべて node で実行し、1 つでも失敗したら非 0 で終了する。
cd "$(dirname "$0")/../.." || exit 1
status=0
for f in tests/game/*.test.js; do
  if ! node "$f"; then
    echo "FAIL: $f" >&2
    status=1
  fi
done
if [ "$status" -eq 0 ]; then echo "all game tests passed"; fi
exit "$status"
