#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${REGION:?Set REGION, e.g. asia-east1}"
: "${ZONE:?Set ZONE, e.g. asia-east1-b}"
: "${INSTANCE_NAME:=geekfaka-sg}"
: "${STATIC_IP_NAME:=geekfaka-ip}"
: "${MACHINE_TYPE:=e2-small}"
: "${BOOT_DISK_SIZE:=30GB}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

gcloud config set project "${PROJECT_ID}"

if ! gcloud compute addresses describe "${STATIC_IP_NAME}" --region "${REGION}" >/dev/null 2>&1; then
  gcloud compute addresses create "${STATIC_IP_NAME}" --region "${REGION}"
fi

STATIC_IP="$(gcloud compute addresses describe "${STATIC_IP_NAME}" --region "${REGION}" --format='value(address)')"

if ! gcloud compute firewall-rules describe geekfaka-allow-web >/dev/null 2>&1; then
  gcloud compute firewall-rules create geekfaka-allow-web \
    --allow tcp:80,tcp:443 \
    --target-tags geekfaka-web \
    --source-ranges 0.0.0.0/0
fi

gcloud compute instances create "${INSTANCE_NAME}" \
  --zone "${ZONE}" \
  --machine-type "${MACHINE_TYPE}" \
  --image-family debian-12 \
  --image-project debian-cloud \
  --boot-disk-size "${BOOT_DISK_SIZE}" \
  --tags geekfaka-web \
  --address "${STATIC_IP}" \
  --metadata-from-file startup-script="${ROOT_DIR}/deploy/gcp/startup-script.sh"

echo "VM created."
echo "Static IP: ${STATIC_IP}"
echo "Next: point your domain A record to this IP, then run deploy/gcp/push-app.sh"
