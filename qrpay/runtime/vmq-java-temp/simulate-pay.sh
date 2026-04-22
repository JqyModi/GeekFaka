#!/bin/zsh
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <type> <reallyPrice> [key] [base_url]"
  echo "example: $0 2 1.00 admin http://127.0.0.1:18080"
  exit 1
fi

TYPE="$1"
PRICE="$2"
KEY="${3:-admin}"
BASE_URL="${4:-http://127.0.0.1:18080}"
T="$(node -e 'process.stdout.write(String(Date.now()))')"
SIGN="$(node -e "const crypto=require('node:crypto'); process.stdout.write(crypto.createHash('md5').update(process.argv[1]+process.argv[2]+process.argv[3]+process.argv[4]).digest('hex'))" "$TYPE" "$PRICE" "$T" "$KEY")"

curl -sG "$BASE_URL/appPush" \
  --data-urlencode "type=$TYPE" \
  --data-urlencode "price=$PRICE" \
  --data-urlencode "t=$T" \
  --data-urlencode "sign=$SIGN"

