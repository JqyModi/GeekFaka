#!/bin/zsh
set -euo pipefail

BASE_DIR="/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp"
PID_FILE="$BASE_DIR/vmq.pid"
LOG_FILE="$BASE_DIR/logs/vmq.log"
DB_PATH="$BASE_DIR/data/mq"
PORT="18080"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "vmq already running with pid $(cat "$PID_FILE")"
  exit 0
fi

cd "$BASE_DIR"
: > "$LOG_FILE"

nohup java -jar "$BASE_DIR/vmq.war" \
  --server.port="$PORT" \
  --spring.datasource.url="jdbc:h2:file:${DB_PATH}" \
  >"$LOG_FILE" 2>&1 &

echo $! > "$PID_FILE"
PID="$(cat "$PID_FILE")"

for _ in {1..30}; do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "vmq exited during startup"
    tail -n 80 "$LOG_FILE" || true
    rm -f "$PID_FILE"
    exit 1
  fi

  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    echo "started vmq pid $PID on http://127.0.0.1:${PORT}"
    exit 0
  fi

  sleep 1
done

echo "vmq process is running but HTTP is not ready yet, check $LOG_FILE"
exit 1
