#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${ZONE:?Set ZONE}"
: "${INSTANCE_NAME:=geekfaka-sg}"

REMOTE_APP_DIR="/opt/OpenFaka"

gcloud compute ssh "${INSTANCE_NAME}" --zone "${ZONE}" --command "\
  sudo bash '${REMOTE_APP_DIR}/deploy/gcp/redeploy-on-vm.sh' '${REMOTE_APP_DIR}'"
