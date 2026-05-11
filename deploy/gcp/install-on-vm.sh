#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Provide app dir}"
DOMAIN="${2:?Provide domain}"
LETSENCRYPT_EMAIL="${3:?Provide letsencrypt email}"
NGINX_SITE="/etc/nginx/sites-available/geekfaka.conf"

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  COMPOSE="docker compose"
fi

cd "${APP_DIR}"

if [ ! -f .env.production ]; then
  echo ".env.production is missing. Create it from .env.production.example before continuing."
  exit 1
fi

${COMPOSE} -f docker-compose.prod.yml --env-file .env.production up -d --build

sed "s/__DOMAIN__/${DOMAIN}/g" deploy/nginx/geekfaka.conf | tee "${NGINX_SITE}" >/dev/null
ln -sf "${NGINX_SITE}" /etc/nginx/sites-enabled/geekfaka.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

certbot --nginx --non-interactive --agree-tos --redirect -m "${LETSENCRYPT_EMAIL}" -d "${DOMAIN}"

echo "Deployment completed: https://${DOMAIN}"
