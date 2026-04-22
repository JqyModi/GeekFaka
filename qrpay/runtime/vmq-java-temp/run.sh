#!/bin/zsh
set -euo pipefail

BASE_DIR="/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp"
DB_PATH="$BASE_DIR/data/mq"

cd "$BASE_DIR"

exec java -jar "$BASE_DIR/vmq.war" \
  --server.port=18080 \
  --spring.datasource.url="jdbc:h2:file:${DB_PATH}"
