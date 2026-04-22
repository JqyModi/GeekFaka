#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-/var/www/html/admin/login.php}"

python3 - "$TARGET" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()

pattern = re.compile(r"""function submitlogin\(\)\{\n.*?\n\}\n</script>""", re.S)
replacement = """function submitlogin(){
    var userEl = document.querySelector("input[name='user']");
    var passEl = document.querySelector("input[name='pass']");
    var codeEl = document.querySelector("input[name='code']");
    var user = userEl ? userEl.value.trim() : "";
    var pass = passEl ? passEl.value : "";
    var code = codeEl ? codeEl.value.trim() : "";

    if(user === "" || pass === ""){
        alert("用户名或密码不能为空！");
        return false;
    }

    var submitButton = document.querySelector("input[type='submit']");
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.value = "登录中...";
    }

    fetch("?act=login", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "same-origin",
        body: new URLSearchParams({username: user, password: pass, code: code}).toString()
    }).then(function(response){
        return response.json();
    }).then(function(data){
        if(data.code === 0){
            window.location.href = "./";
            return;
        }
        if(data.vcode === 1){
            var verify = document.getElementById("verifycode");
            if(verify){
                verify.src = "./code.php?r=" + Math.random();
            }
        }
        alert(data.msg || "登录失败");
    }).catch(function(){
        alert("服务器错误");
    }).finally(function(){
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.value = "立即登录";
        }
    });

    return false;
}
</script>"""

new_text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit("submitlogin block not found")

path.write_text(new_text)
PY

grep -n "function submitlogin" -A 40 "$TARGET"
