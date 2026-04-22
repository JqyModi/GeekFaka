#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${REGION:?Set REGION, e.g. asia-southeast1}"
: "${ZONE:?Set ZONE, e.g. asia-southeast1-b}"
: "${INSTANCE_NAME:=vmq-sg}"
: "${STATIC_IP_NAME:=vmq-ip}"
: "${MACHINE_TYPE:=e2-small}"
: "${BOOT_DISK_SIZE:=20GB}"

GCLOUD_BIN="${GCLOUD_BIN:-$HOME/google-cloud-sdk/bin/gcloud}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

"${GCLOUD_BIN}" config set project "${PROJECT_ID}"

if ! "${GCLOUD_BIN}" compute addresses describe "${STATIC_IP_NAME}" --region "${REGION}" >/dev/null 2>&1; then
  "${GCLOUD_BIN}" compute addresses create "${STATIC_IP_NAME}" --region "${REGION}"
fi

STATIC_IP="$("${GCLOUD_BIN}" compute addresses describe "${STATIC_IP_NAME}" --region "${REGION}" --format='value(address)')"

if ! "${GCLOUD_BIN}" compute firewall-rules describe vmq-allow-web >/dev/null 2>&1; then
  "${GCLOUD_BIN}" compute firewall-rules create vmq-allow-web \
    --allow tcp:80,tcp:443 \
    --target-tags vmq-web \
    --source-ranges 0.0.0.0/0
fi

if ! "${GCLOUD_BIN}" compute instances describe "${INSTANCE_NAME}" --zone "${ZONE}" >/dev/null 2>&1; then
  "${GCLOUD_BIN}" compute instances create "${INSTANCE_NAME}" \
    --zone "${ZONE}" \
    --machine-type "${MACHINE_TYPE}" \
    --image-family debian-12 \
    --image-project debian-cloud \
    --boot-disk-size "${BOOT_DISK_SIZE}" \
    --tags vmq-web \
    --address "${STATIC_IP}" \
    --metadata-from-file startup-script="${ROOT_DIR}/deploy/vmq/gcp/startup-script.sh"
fi

echo "VMQ VM ready."
echo "Static IP: ${STATIC_IP}"
echo "Next: point your vmq subdomain A record to this IP, then run deploy/vmq/gcp/remote-install.sh"
