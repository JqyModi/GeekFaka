#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-/var/www/html/admin/head.php}"

python3 - "$TARGET" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()

pattern = re.compile(
    r"""\$admin_cdnpublic = 4;\nif\(\$admin_cdnpublic==1\)\{\n.*?\n\}\n\?>""",
    re.S,
)

replacement = """$admin_cdnpublic = 0;
$cdnpublic = '/assets/vendor/';
?>"""

new_text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("admin cdn block not found")

path.write_text(new_text)
PY

grep -n "cdnpublic" -A 3 "$TARGET"
