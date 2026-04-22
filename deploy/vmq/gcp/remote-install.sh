#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${ZONE:?Set ZONE}"
: "${INSTANCE_NAME:=vmq-sg}"
: "${DOMAIN:?Set DOMAIN}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL}"
: "${WAR_PATH:?Set WAR_PATH, local path to vmq.war}"
: "${APK_PATH:?Set APK_PATH, local path to vmqApk-v2.0.9.apk}"

GCLOUD_BIN="${GCLOUD_BIN:-$HOME/google-cloud-sdk/bin/gcloud}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
REMOTE_TMP="/tmp/openfaka-vmq-deploy"

"${GCLOUD_BIN}" config set project "${PROJECT_ID}"

"${GCLOUD_BIN}" compute ssh "${INSTANCE_NAME}" --zone "${ZONE}" --command "sudo rm -rf ${REMOTE_TMP} && sudo mkdir -p ${REMOTE_TMP}/assets && sudo chown \$USER:\$USER ${REMOTE_TMP} ${REMOTE_TMP}/assets"
"${GCLOUD_BIN}" compute scp --recurse "${ROOT_DIR}/deploy/vmq" "${INSTANCE_NAME}:${REMOTE_TMP}" --zone "${ZONE}"
"${GCLOUD_BIN}" compute scp "${WAR_PATH}" "${INSTANCE_NAME}:${REMOTE_TMP}/assets/vmq.war" --zone "${ZONE}"
"${GCLOUD_BIN}" compute scp "${APK_PATH}" "${INSTANCE_NAME}:${REMOTE_TMP}/assets/vmqApk-v2.0.9.apk" --zone "${ZONE}"

"${GCLOUD_BIN}" compute ssh "${INSTANCE_NAME}" --zone "${ZONE}" --command "\
  sudo env \
    DOMAIN='${DOMAIN}' \
    LETSENCRYPT_EMAIL='${LETSENCRYPT_EMAIL}' \
    WAR_SRC='${REMOTE_TMP}/assets/vmq.war' \
    APK_SRC='${REMOTE_TMP}/assets/vmqApk-v2.0.9.apk' \
    SKIP_CERTBOT='${SKIP_CERTBOT:-0}' \
    DEPLOY_SRC='${REMOTE_TMP}/vmq' \
    bash '${REMOTE_TMP}/vmq/gcp/bootstrap-remote.sh'"
