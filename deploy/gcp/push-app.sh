#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${ZONE:?Set ZONE}"
: "${INSTANCE_NAME:=geekfaka-sg}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

gcloud compute scp \
  --recurse \
  --zone "${ZONE}" \
  "${ROOT_DIR}" \
  "${INSTANCE_NAME}:/opt/"

echo "Application uploaded to /opt/$(basename "${ROOT_DIR}")"
echo "Next:"
echo "  - first install: create /opt/$(basename "${ROOT_DIR}")/.env.production from .env.production.example, then run deploy/gcp/remote-install.sh"
echo "  - app-only rollout: run deploy/gcp/redeploy-faka.sh"
