#!/bin/zsh
set -euo pipefail

LAN_IP="${1:-$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)}"
PORT="${VMQ_PORT:-18080}"
KEY="${VMQ_KEY:-admin}"

if [[ -z "${LAN_IP}" ]]; then
  echo "failed to detect LAN IP"
  exit 1
fi

echo "${LAN_IP}:${PORT}/${KEY}"
