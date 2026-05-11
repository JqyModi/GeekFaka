#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Provide app dir}"

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  COMPOSE="docker compose"
fi

cd "${APP_DIR}"

if [ ! -f .env.production ]; then
  echo ".env.production is missing. Create it before continuing."
  exit 1
fi

echo "[1/4] Rebuilding geekfaka app image"
${COMPOSE} -f docker-compose.prod.yml --env-file .env.production build geekfaka

echo "[2/4] Restarting geekfaka app container"
${COMPOSE} -f docker-compose.prod.yml --env-file .env.production up -d geekfaka

echo "[3/4] Container status"
${COMPOSE} -f docker-compose.prod.yml --env-file .env.production ps

echo "[4/4] Recent app logs"
docker logs --tail 120 geekfaka-app

echo "Faka app rollout completed."
