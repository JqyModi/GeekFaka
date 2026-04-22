#!/usr/bin/env bash
set -euo pipefail

: "${DOMAIN:?Set DOMAIN}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL}"
: "${WAR_SRC:?Set WAR_SRC}"
: "${APK_SRC:?Set APK_SRC}"

APP_DIR="${APP_DIR:-/opt/vmq}"
DEPLOY_SRC="${DEPLOY_SRC:-/tmp/openfaka-vmq-deploy}"
SERVICE_PORT="${SERVICE_PORT:-18080}"
SKIP_CERTBOT="${SKIP_CERTBOT:-0}"

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx openjdk-17-jre-headless
systemctl enable --now nginx

mkdir -p "${APP_DIR}/"{data,logs,apk}
cp "${WAR_SRC}" "${APP_DIR}/vmq.war"
cp "${APK_SRC}" "${APP_DIR}/apk/vmqApk-v2.0.9.apk"
chmod 644 "${APP_DIR}/vmq.war" "${APP_DIR}/apk/vmqApk-v2.0.9.apk"

cat > /etc/systemd/system/vmq.service <<EOF
[Unit]
Description=V免签 Java Service
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/java -jar ${APP_DIR}/vmq.war --server.port=${SERVICE_PORT} --spring.datasource.url=jdbc:h2:file:${APP_DIR}/data/mq
Restart=always
RestartSec=5
StandardOutput=append:${APP_DIR}/logs/vmq.log
StandardError=append:${APP_DIR}/logs/vmq.log

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/nginx/sites-available/vmq.conf <<EOF
$(sed "s/__DOMAIN__/${DOMAIN}/g; s#__UPSTREAM__#http://127.0.0.1:${SERVICE_PORT}#g" "${DEPLOY_SRC}/gcp/nginx-site.conf")
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/vmq.conf /etc/nginx/sites-enabled/vmq.conf

systemctl daemon-reload
systemctl enable vmq.service
systemctl restart vmq.service

nginx -t
systemctl reload nginx

if [ "${SKIP_CERTBOT}" != "1" ]; then
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${LETSENCRYPT_EMAIL}" --redirect
  systemctl reload nginx
fi

echo "VMQ install completed."
echo "Site: https://${DOMAIN}"
echo "APK: https://${DOMAIN}/vmqApk-v2.0.9.apk"
