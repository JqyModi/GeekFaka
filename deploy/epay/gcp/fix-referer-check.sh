#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-/var/www/html/includes/functions.php}"

python3 - "$TARGET" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

old = """function checkRefererHost(){
\tif(!$_SERVER['HTTP_REFERER'])return false;
\t$url_arr = parse_url($_SERVER['HTTP_REFERER']);
\t$http_host = $_SERVER['HTTP_HOST'];
\tif(strpos($http_host,':'))$http_host = substr($http_host, 0, strpos($http_host, ':'));
\treturn $url_arr['host'] === $http_host;
}"""

new = """function checkRefererHost(){
\t$http_host = $_SERVER['HTTP_HOST'];
\tif(strpos($http_host,':'))$http_host = substr($http_host, 0, strpos($http_host, ':'));
\tif(!empty($_SERVER['HTTP_ORIGIN'])){
\t\t$url_arr = parse_url($_SERVER['HTTP_ORIGIN']);
\t\tif(empty($url_arr['host']) || $url_arr['host'] !== $http_host)return false;
\t}
\tif(!empty($_SERVER['HTTP_REFERER'])){
\t\t$url_arr = parse_url($_SERVER['HTTP_REFERER']);
\t\tif(empty($url_arr['host']) || $url_arr['host'] !== $http_host)return false;
\t}
\treturn true;
}"""

if old not in text:
    raise SystemExit("checkRefererHost block not found")

path.write_text(text.replace(old, new, 1))
PY

grep -n "function checkRefererHost" -A 12 "$TARGET"
