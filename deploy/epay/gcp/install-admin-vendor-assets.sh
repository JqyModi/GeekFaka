#!/usr/bin/env bash
set -euo pipefail

TARGET_ROOT="${1:-/var/www/html/assets/vendor}"

fetch() {
  local url="$1"
  local dest="$2"
  mkdir -p "$(dirname "${dest}")"
  curl -fsSL "${url}" -o "${dest}"
}

mkdir -p "${TARGET_ROOT}"

# Core admin dependencies
fetch "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js" \
  "${TARGET_ROOT}/jquery/2.1.4/jquery.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js" \
  "${TARGET_ROOT}/twitter-bootstrap/3.4.1/js/bootstrap.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css" \
  "${TARGET_ROOT}/twitter-bootstrap/3.4.1/css/bootstrap.min.css"
fetch "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" \
  "${TARGET_ROOT}/font-awesome/4.7.0/css/font-awesome.min.css"
fetch "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0" \
  "${TARGET_ROOT}/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2"
fetch "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff?v=4.7.0" \
  "${TARGET_ROOT}/font-awesome/4.7.0/fonts/fontawesome-webfont.woff"
fetch "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf?v=4.7.0" \
  "${TARGET_ROOT}/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf"
fetch "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.svg?v=4.7.0" \
  "${TARGET_ROOT}/font-awesome/4.7.0/fonts/fontawesome-webfont.svg"
fetch "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.eot?v=4.7.0" \
  "${TARGET_ROOT}/font-awesome/4.7.0/fonts/fontawesome-webfont.eot"
fetch "https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js" \
  "${TARGET_ROOT}/modernizr/2.8.3/modernizr.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.3/html5shiv.min.js" \
  "${TARGET_ROOT}/html5shiv/3.7.3/html5shiv.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/respond.js/1.4.2/respond.min.js" \
  "${TARGET_ROOT}/respond.js/1.4.2/respond.min.js"

# Modal / dialog / utility libs used by admin pages
fetch "https://cdn.staticfile.net/layer/3.1.1/layer.min.js" \
  "${TARGET_ROOT}/layer/3.1.1/layer.min.js"
fetch "https://cdn.staticfile.net/layer/3.1.1/layer.js" \
  "${TARGET_ROOT}/layer/3.1.1/layer.js"
fetch "https://cdn.staticfile.net/layer/3.1.1/theme/default/layer.css" \
  "${TARGET_ROOT}/layer/3.1.1/theme/default/layer.css"
fetch "https://cdn.staticfile.net/layer/3.1.1/theme/default/icon.png" \
  "${TARGET_ROOT}/layer/3.1.1/theme/default/icon.png"
fetch "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.7.1/clipboard.min.js" \
  "${TARGET_ROOT}/clipboard.js/1.7.1/clipboard.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js" \
  "${TARGET_ROOT}/jquery-cookie/1.4.1/jquery.cookie.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/jquery.qrcode/1.0/jquery.qrcode.min.js" \
  "${TARGET_ROOT}/jquery.qrcode/1.0/jquery.qrcode.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/js/bootstrap-datepicker.min.js" \
  "${TARGET_ROOT}/bootstrap-datepicker/1.9.0/js/bootstrap-datepicker.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.9.0/locales/bootstrap-datepicker.zh-CN.min.js" \
  "${TARGET_ROOT}/bootstrap-datepicker/1.9.0/locales/bootstrap-datepicker.zh-CN.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-colorpicker/2.5.3/js/bootstrap-colorpicker.min.js" \
  "${TARGET_ROOT}/bootstrap-colorpicker/2.5.3/js/bootstrap-colorpicker.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-colorpicker/2.5.3/css/bootstrap-colorpicker.min.css" \
  "${TARGET_ROOT}/bootstrap-colorpicker/2.5.3/css/bootstrap-colorpicker.min.css"

find "${TARGET_ROOT}" -type f | sort
