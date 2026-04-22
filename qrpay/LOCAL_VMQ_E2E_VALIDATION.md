# V免签本地端到端验证记录

本文记录本地临时部署、MuMu 模拟器接入、通知监听验证、假支付宝到账通知测试，以及过程中遇到的坑和解决方式。

验证日期：2026-04-21

## 最终结论

本地已经验证通过完整链路：

```text
创建订单 -> 监控端收到支付宝格式到账通知 -> 解析金额 -> 调用 /appPush -> 服务端匹配订单 -> 异步回调
```

已确认状态：

- Java 服务端运行在 `http://127.0.0.1:18080`
- MuMu 模拟器中 `V免签监控端` 已安装并配置
- 服务端 `jkstate=1`
- 通知监听权限已启用
- 假支付宝测试 App 发出 `成功收款1.00元` 通知后，订单变为 `state=1`
- 本地 mock 回调服务收到 `/notify`

## 本地目录

```text
qrpay/runtime/vmq-java-temp
qrpay/runtime/fake-alipay-notify
qrpay/runtime/android-build-tools
```

关键文件：

- `qrpay/runtime/vmq-java-temp/vmq.war`
- `qrpay/runtime/vmq-java-temp/run.sh`
- `qrpay/runtime/vmq-java-temp/mock-callback.js`
- `qrpay/runtime/vmq-java-temp/create-test-order.sh`
- `qrpay/runtime/vmq-java-temp/simulate-pay.sh`
- `qrpay/runtime/vmq-java-temp/vmqApk-v2.0.9.apk`
- `qrpay/runtime/fake-alipay-notify/build/fake-alipay-notify.apk`

## 服务端部署

使用 Java 版 `szvone/Vmq`，原因是当前本机没有 PHP、Composer、MySQL、Nginx/Docker，而 Java 版只依赖 Java 和 H2。

启动：

```bash
cd /Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp
./run.sh
```

服务地址：

```text
http://127.0.0.1:18080
```

MuMu 模拟器访问 Mac 的局域网地址：

```text
http://192.168.1.157:18080
```

监控端手动配置串：

```text
192.168.1.157:18080/admin
```

后台测试配置：

```text
user=admin
pass=admin
key=admin
notifyUrl=http://127.0.0.1:19001/notify
returnUrl=http://127.0.0.1:19001/return
wxpay=https://example.com/wx-test
zfbpay=https://example.com/zfb-test
close=5
payQf=1
```

## 本地回调接收器

启动：

```bash
cd /Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp
node ./mock-callback.js
```

监听地址：

```text
http://127.0.0.1:19001/notify
http://127.0.0.1:19001/return
```

## 创建测试订单

```bash
cd /Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp
./create-test-order.sh
```

示例返回：

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "payId": "test-20260421220549",
    "orderId": "202604212205497763",
    "payType": 2,
    "price": 1.0,
    "reallyPrice": 1.0,
    "payUrl": "https://example.com/zfb-test",
    "isAuto": 1,
    "state": 0
  }
}
```

## MuMu 模拟器安装监控端

MuMu 自带 adb：

```bash
/Applications/MuMuPlayer.app/Contents/MacOS/MuMuEmulator.app/Contents/MacOS/tools/adb
```

连接可用设备：

```bash
ADB=/Applications/MuMuPlayer.app/Contents/MacOS/MuMuEmulator.app/Contents/MacOS/tools/adb
$ADB connect 127.0.0.1:5555
$ADB devices -l
```

已验证可用设备：

```text
127.0.0.1:5555
127.0.0.1:16384
```

安装新版监控端：

```bash
$ADB -s 127.0.0.1:5555 install -r qrpay/runtime/vmq-java-temp/vmqApk-v2.0.9.apk
```

如果出现签名不一致：

```text
INSTALL_FAILED_UPDATE_INCOMPATIBLE
```

说明模拟器里已有同包名旧版，需要先卸载：

```bash
$ADB -s 127.0.0.1:5555 uninstall com.vone.qrcode
$ADB -s 127.0.0.1:5555 install -r qrpay/runtime/vmq-java-temp/vmqApk-v2.0.9.apk
```

启动：

```bash
$ADB -s 127.0.0.1:5555 shell monkey -p com.vone.qrcode -c android.intent.category.LAUNCHER 1
```

## 监控端权限

已经处理的权限：

- 通知监听权限
- 后台常驻权限

确认通知监听：

```bash
$ADB -s 127.0.0.1:5555 shell dumpsys notification | rg 'com.vone.qrcode/com.vone.vmq.NeNotificationService2'
```

服务端状态确认：

```bash
curl -s -c /tmp/vmq.cookies 'http://127.0.0.1:18080/login?user=admin&pass=admin' >/dev/null
curl -s -b /tmp/vmq.cookies 'http://127.0.0.1:18080/admin/getSettings'
```

正常结果里应有：

```json
{
  "jkstate": "1"
}
```

## 假支付宝测试 App

用途：在不安装/登录真实支付宝的情况下，发出包名为 `com.eg.android.AlipayGphone` 的通知，触发 V免签监控端的支付宝解析逻辑。

测试 App 源码：

```text
qrpay/runtime/fake-alipay-notify
```

构建产物：

```text
qrpay/runtime/fake-alipay-notify/build/fake-alipay-notify.apk
```

安装：

```bash
$ADB -s 127.0.0.1:5555 install -r qrpay/runtime/fake-alipay-notify/build/fake-alipay-notify.apk
$ADB -s 127.0.0.1:5555 shell monkey -p com.eg.android.AlipayGphone -c android.intent.category.LAUNCHER 1
```

点击按钮发送通知：

```text
支付宝通知 / 成功收款1.00元
```

V免签监控端日志确认：

```bash
$ADB -s 127.0.0.1:5555 logcat -d -t 300 | rg '包名:|标题:|内容:|匹配成功|appPush|onResponse'
```

已验证日志：

```text
包名:com.eg.android.AlipayGphone
标题:支付宝通知
内容:成功收款1.00元
onAccessibilityEvent: 匹配成功： 支付宝 到账 1.00
onResponse  push: http://192.168.1.157:18080/appPush?...type=2&price=1.0...
onResponse  push: {"code":1,"msg":"成功","data":null}
```

服务端订单确认：

```bash
curl -s 'http://127.0.0.1:18080/getOrder?orderId=202604212205497763'
```

正常结果：

```json
{
  "state": 1
}
```

mock 回调收到：

```text
GET /notify
payId=test-20260421220549
type=2
price=1.0
reallyPrice=1.0
```

## 遇到的坑和解决

### 1. Java 服务端没有 `/example`

当前 Java 版 `szvone/Vmq` 没有 `/example` 页面，访问返回 404。`/example` 是 PHP 版 `vmqphp/public/example` 里的测试页面。

解决：本地用 `create-test-order.sh` 和 `mock-callback.js` 替代。

### 2. 后台脚本运行时进程容易被当前工具环境回收

当前 Codex 工具环境对后台子进程不稳定，`start.sh` 可能出现进程刚起就被回收或状态误判。

解决：本地测试优先使用：

```bash
./run.sh
```

### 3. Java 版默认通讯密钥不一定是 `admin`

首次初始化后，数据库里的 `key` 可能是随机值，不一定等于 README 里的 `admin`。

解决：通过后台 `admin/saveSetting` 或页面改成固定测试值 `admin`。

### 4. MuMu 的 `mumutool` 控制服务不可用

`mumutool info/open/install_apk` 返回：

```text
URLSessionTask failed with error: 无法连接服务器。
```

解决：改用 MuMu 自带 adb，连接 `127.0.0.1:5555` 或 `127.0.0.1:16384`。

### 5. adb 设备一度显示 offline

最初设备列表中 `127.0.0.1:20000/21000` 为 offline。

解决：等待 MuMu Android 实例真正启动后，连接新增端口：

```bash
adb connect 127.0.0.1:5555
adb connect 127.0.0.1:16384
```

### 6. APK 安装签名冲突

安装新版监控端时报错：

```text
INSTALL_FAILED_UPDATE_INCOMPATIBLE
```

原因：模拟器中已有旧版 `com.vone.qrcode`，签名不同。

解决：

```bash
adb uninstall com.vone.qrcode
adb install -r vmqApk-v2.0.9.apk
```

### 7. shell 通知无法模拟支付宝包名

Android 自带：

```bash
cmd notification post
```

不能伪造包名，无法触发 V免签中对 `com.eg.android.AlipayGphone` 的分支。

解决：编译一个本地测试 APK，包名设置为：

```text
com.eg.android.AlipayGphone
```

### 8. 本机没有 Android SDK/build-tools

本机没有 `android.jar/aapt2/d8/apksigner`。

解决：下载官方 Android command-line tools，并用 `sdkmanager` 安装：

```bash
platforms;android-35
build-tools;35.0.0
platform-tools
```

### 9. Java lambda 编译失败

构建测试 APK 时 lambda 编译失败：

```text
cannot find symbol LambdaMetafactory.metafactory
```

解决：把 lambda 改成匿名 `View.OnClickListener`。

### 10. 真实付款测试仍需真实通知来源

本地假支付宝测试只能证明监听、解析、回调链路成立。生产环境要稳定工作，仍需真实微信/支付宝/店员通知在监控端设备上出现。

## 下一步建议

本地验证已经满足继续推进条件。下一步应进入云端部署和业务对接：

1. 在 GCP 部署服务端
2. 使用公网 HTTPS 域名
3. 监控端设备配置公网域名和通讯密钥
4. 发卡系统创建订单时调用 `/createOrder`
5. 发卡系统接收并验签 `/notify`
6. 增加补单、重试和人工确认后台
