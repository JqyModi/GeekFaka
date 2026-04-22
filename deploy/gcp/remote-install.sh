#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${ZONE:?Set ZONE}"
: "${INSTANCE_NAME:=geekfaka-prod}"
: "${DOMAIN:?Set DOMAIN, e.g. shop.example.com}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL}"

REMOTE_APP_DIR="/opt/OpenFaka"

gcloud compute ssh "${INSTANCE_NAME}" --zone "${ZONE}" --command "\
  sudo bash '${REMOTE_APP_DIR}/deploy/gcp/install-on-vm.sh' '${REMOTE_APP_DIR}' '${DOMAIN}' '${LETSENCRYPT_EMAIL}'"
