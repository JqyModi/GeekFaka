#!/usr/bin/env bash
set -euo pipefail

: "${DOMAIN:?Set DOMAIN}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL}"
: "${MYSQL_ROOT_PASSWORD:?Set MYSQL_ROOT_PASSWORD}"
: "${MYSQL_PASSWORD:?Set MYSQL_PASSWORD}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"

APP_DIR="${APP_DIR:-/opt/epay}"
REPO_URL="${REPO_URL:-https://github.com/lopinx/epay.git}"
DB_NAME="${DB_NAME:-epay}"
DB_USER="${DB_USER:-epay}"
DB_PREFIX="${DB_PREFIX:-pay}"
ADMIN_USER="${ADMIN_USER:-admin}"
SITE_NAME="${SITE_NAME:-MinAI EPay}"
SITE_TITLE="${SITE_TITLE:-MinAI EPay Gateway}"
PUBLIC_URL="${PUBLIC_URL:-https://${DOMAIN}/}"
CRON_KEY="${CRON_KEY:-$(openssl rand -hex 12)}"
SYSTEM_KEY="${SYSTEM_KEY:-$(openssl rand -hex 16)}"
DEPLOY_SRC="${DEPLOY_SRC:-/tmp/openfaka-epay-deploy}"

if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl
  systemctl enable --now docker
  systemctl enable --now nginx
fi

mkdir -p "${APP_DIR}"

if [ ! -d "${APP_DIR}/app/.git" ]; then
  rm -rf "${APP_DIR}/app"
  git clone --depth=1 "${REPO_URL}" "${APP_DIR}/app"
else
  git -C "${APP_DIR}/app" fetch --depth=1 origin
  git -C "${APP_DIR}/app" reset --hard origin/master || git -C "${APP_DIR}/app" reset --hard origin/main
fi

rm -rf "${APP_DIR}/deploy"
mkdir -p "${APP_DIR}/deploy"
cp -R "${DEPLOY_SRC}/." "${APP_DIR}/deploy/"

cat > "${APP_DIR}/.env" <<EOF
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=${DB_NAME}
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
EOF

cat > "${APP_DIR}/app/config.php" <<EOF
<?php
/*数据库配置*/
\$dbconfig=array(
  'host' => 'mysql',
  'port' => 3306,
  'user' => '${DB_USER}',
  'pwd' => '${MYSQL_PASSWORD}',
  'dbname' => '${DB_NAME}',
  'dbqz' => '${DB_PREFIX}'
);
EOF

mkdir -p "${APP_DIR}/nginx" "${APP_DIR}/mysql-data"
cp "${APP_DIR}/deploy/Dockerfile" "${APP_DIR}/Dockerfile"
cp "${APP_DIR}/deploy/php.ini" "${APP_DIR}/php.ini"
cp "${APP_DIR}/deploy/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
cp "${APP_DIR}/deploy/nginx/epay.conf" "${APP_DIR}/nginx/default.conf"

docker-compose --env-file "${APP_DIR}/.env" -f "${APP_DIR}/docker-compose.yml" up -d mysql

for _ in $(seq 1 60); do
  if docker exec epay-mysql mariadb-admin ping -u"${DB_USER}" -p"${MYSQL_PASSWORD}" --silent >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! docker exec epay-mysql mariadb -u"${DB_USER}" -p"${MYSQL_PASSWORD}" -Nse "USE ${DB_NAME}; SHOW TABLES LIKE '${DB_PREFIX}_config';" | grep -q "${DB_PREFIX}_config"; then
  tmp_sql="$(mktemp)"
  sed "s/pre_/${DB_PREFIX}_/g" "${APP_DIR}/app/install/install.sql" > "${tmp_sql}"
  cat >> "${tmp_sql}" <<SQL
INSERT INTO \`${DB_PREFIX}_config\` VALUES ('syskey', '${SYSTEM_KEY}');
INSERT INTO \`${DB_PREFIX}_config\` VALUES ('build', '$(date +%F)');
INSERT INTO \`${DB_PREFIX}_config\` VALUES ('cronkey', '${CRON_KEY}');
SQL
  docker exec -i epay-mysql mariadb -u"${DB_USER}" -p"${MYSQL_PASSWORD}" "${DB_NAME}" < "${tmp_sql}"
  rm -f "${tmp_sql}"
fi

docker exec epay-mysql mariadb -u"${DB_USER}" -p"${MYSQL_PASSWORD}" "${DB_NAME}" <<SQL
UPDATE \`${DB_PREFIX}_config\` SET v='${ADMIN_USER}' WHERE k='admin_user';
UPDATE \`${DB_PREFIX}_config\` SET v='${ADMIN_PASSWORD}' WHERE k='admin_pwd';
UPDATE \`${DB_PREFIX}_config\` SET v='${SITE_NAME}' WHERE k='sitename';
UPDATE \`${DB_PREFIX}_config\` SET v='${SITE_TITLE}' WHERE k='title';
UPDATE \`${DB_PREFIX}_config\` SET v='${PUBLIC_URL}' WHERE k='localurl';
UPDATE \`${DB_PREFIX}_config\` SET v='0' WHERE k='reg_open';
UPDATE \`${DB_PREFIX}_config\` SET v='0' WHERE k='test_open';
UPDATE \`${DB_PREFIX}_config\` SET v='0' WHERE k='captcha_open';
UPDATE \`${DB_PREFIX}_config\` SET v='0' WHERE k='mail_cloud';
SQL

touch "${APP_DIR}/app/install/install.lock"

bash "${APP_DIR}/deploy/gcp/install-admin-vendor-assets.sh" "${APP_DIR}/app/assets/vendor"
bash "${APP_DIR}/deploy/gcp/fix-admin-cdn.sh" "${APP_DIR}/app/admin/head.php"
bash "${APP_DIR}/deploy/gcp/fix-login-js.sh" "${APP_DIR}/app/admin/login.php"
bash "${APP_DIR}/deploy/gcp/fix-referer-check.sh" "${APP_DIR}/app/includes/functions.php"

docker-compose --env-file "${APP_DIR}/.env" -f "${APP_DIR}/docker-compose.yml" up -d --build

cat > /etc/nginx/sites-available/epay.conf <<EOF
$(sed "s/__DOMAIN__/${DOMAIN}/g; s#__UPSTREAM__#http://127.0.0.1:8080#g" "${APP_DIR}/deploy/gcp/nginx-site.conf")
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/epay.conf /etc/nginx/sites-enabled/epay.conf
nginx -t
systemctl reload nginx

if [ "${SKIP_CERTBOT:-0}" != "1" ]; then
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${LETSENCRYPT_EMAIL}" --redirect
  systemctl reload nginx
fi

php_sync="$(cat <<'PHP'
<?php
$nosession = true;
require '/opt/epay/app/includes/common.php';
\lib\Plugin::updateAll();
echo "plugins_synced\n";
PHP
)"
docker exec -i epay-php php <<PHP
${php_sync}
PHP

echo "EPay install completed."
echo "Admin URL: ${PUBLIC_URL}admin/"
echo "Cron URLs:"
echo "  ${PUBLIC_URL}cron.php?do=order&key=${CRON_KEY}"
echo "  ${PUBLIC_URL}cron.php?do=notify&key=${CRON_KEY}"
