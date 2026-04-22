#!/bin/zsh
set -euo pipefail

BASE_DIR="/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp"
PID_FILE="$BASE_DIR/vmq.pid"
LOG_FILE="$BASE_DIR/logs/vmq.log"
PORT="18080"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "running pid $(cat "$PID_FILE")"
else
  echo "not running"
fi

if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "http ready on http://127.0.0.1:${PORT}"
else
  echo "http not ready on http://127.0.0.1:${PORT}"
fi

if [[ -f "$LOG_FILE" ]]; then
  echo "--- log tail ---"
  tail -n 40 "$LOG_FILE"
fi
