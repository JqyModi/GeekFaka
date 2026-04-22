#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${ZONE:?Set ZONE}"
: "${INSTANCE_NAME:=epay-sg}"
: "${DOMAIN:?Set DOMAIN}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL}"
: "${MYSQL_ROOT_PASSWORD:?Set MYSQL_ROOT_PASSWORD}"
: "${MYSQL_PASSWORD:?Set MYSQL_PASSWORD}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"

GCLOUD_BIN="${GCLOUD_BIN:-$HOME/google-cloud-sdk/bin/gcloud}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
REMOTE_TMP="/tmp/openfaka-epay-deploy"

"${GCLOUD_BIN}" config set project "${PROJECT_ID}"

"${GCLOUD_BIN}" compute ssh "${INSTANCE_NAME}" --zone "${ZONE}" --command "sudo rm -rf ${REMOTE_TMP} && sudo mkdir -p ${REMOTE_TMP} && sudo chown \$USER:\$USER ${REMOTE_TMP}"
"${GCLOUD_BIN}" compute scp --recurse "${ROOT_DIR}/deploy/epay" "${INSTANCE_NAME}:${REMOTE_TMP}" --zone "${ZONE}"

"${GCLOUD_BIN}" compute ssh "${INSTANCE_NAME}" --zone "${ZONE}" --command "\
  sudo env \
    DOMAIN='${DOMAIN}' \
    LETSENCRYPT_EMAIL='${LETSENCRYPT_EMAIL}' \
    MYSQL_ROOT_PASSWORD='${MYSQL_ROOT_PASSWORD}' \
    MYSQL_PASSWORD='${MYSQL_PASSWORD}' \
    ADMIN_PASSWORD='${ADMIN_PASSWORD}' \
    ADMIN_USER='${ADMIN_USER:-admin}' \
    SITE_NAME='${SITE_NAME:-MinAI EPay}' \
    SITE_TITLE='${SITE_TITLE:-MinAI EPay Gateway}' \
    SKIP_CERTBOT='${SKIP_CERTBOT:-0}' \
    DEPLOY_SRC='${REMOTE_TMP}/epay' \
    bash '${REMOTE_TMP}/epay/gcp/bootstrap-remote.sh'"
