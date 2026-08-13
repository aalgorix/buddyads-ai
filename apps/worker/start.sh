#!/bin/sh
set -e
echo "[buddyads-worker] container boot cwd=$(pwd)"
echo "[buddyads-worker] starting tsx…"

TSX_BIN="/app/apps/worker/node_modules/.bin/tsx"
ENTRY="/app/apps/worker/src/index.ts"

if [ -x "$TSX_BIN" ]; then
  exec "$TSX_BIN" "$ENTRY"
fi

echo "[buddyads-worker] local tsx missing, using node --import tsx"
cd /app
exec node --import tsx "$ENTRY"
