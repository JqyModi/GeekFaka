#!/bin/zsh
set -euo pipefail

BASE_DIR="/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp"
PID_FILE="$BASE_DIR/vmq.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "pid file not found"
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "stopped vmq pid $PID"
else
  echo "process $PID not running"
fi

rm -f "$PID_FILE"
