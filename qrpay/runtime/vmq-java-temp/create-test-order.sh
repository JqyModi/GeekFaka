#!/bin/zsh
set -euo pipefail

BASE_URL="${VMQ_BASE_URL:-http://127.0.0.1:18080}"
KEY="${VMQ_KEY:-admin}"
PAY_ID="${VMQ_PAY_ID:-test-$(date +%Y%m%d%H%M%S)}"
PARAM="${VMQ_PARAM:-demo}"
TYPE="${VMQ_TYPE:-2}"
PRICE="${VMQ_PRICE:-1.00}"
NOTIFY_URL="${VMQ_NOTIFY_URL:-http://127.0.0.1:19001/notify}"
RETURN_URL="${VMQ_RETURN_URL:-http://127.0.0.1:19001/return}"

SIGN="$(node -e "const crypto=require('node:crypto'); process.stdout.write(crypto.createHash('md5').update(process.argv[1]+process.argv[2]+process.argv[3]+process.argv[4]+process.argv[5]).digest('hex'))" "$PAY_ID" "$PARAM" "$TYPE" "$PRICE" "$KEY")"

curl -sG "$BASE_URL/createOrder" \
  --data-urlencode "payId=$PAY_ID" \
  --data-urlencode "param=$PARAM" \
  --data-urlencode "type=$TYPE" \
  --data-urlencode "price=$PRICE" \
  --data-urlencode "notifyUrl=$NOTIFY_URL" \
  --data-urlencode "returnUrl=$RETURN_URL" \
  --data-urlencode "sign=$SIGN" \
  --data-urlencode "isHtml=0"

