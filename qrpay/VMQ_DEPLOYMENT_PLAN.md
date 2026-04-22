# V免签落地部署方案

更新时间：2026-04-21

适用组合：

- 服务端：`szvone/vmqphp`
- 监控端：`zwc456baby/vmqApk`

对应本地目录：

- 服务端：
  - [szvone-vmqphp](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp)
- 监控端：
  - [zwc456baby-vmqApk](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/zwc456baby-vmqApk)

## 目标

搭一套：

- 个人二维码直收
- 免签
- 支付成功自动回调
- 尽量降低挂机不稳定性
- 有补单和兜底能力

## 先说架构

这套方案的真实链路是：

1. 你的业务系统调用 `vmqphp` 创建订单
2. `vmqphp` 根据金额防撞规则生成 `really_price`
3. 用户扫你的微信/支付宝个人码支付
4. 安卓端 `vmqApk` 监听到账通知
5. `vmqApk` 调用服务端 `/appPush`
6. 服务端匹配 `really_price + type`
7. 服务端回调你的业务系统 `notify_url`

所以这里有三个系统：

- 你的业务系统
- `vmqphp` 服务端
- 安卓监听端

## 目录建议

你可以在 `qrpay` 下按这个结构整理：

```text
qrpay/
  OPEN_SOURCE_QRPAY_RESEARCH.md
  VMQ_FORK_SCREENING.md
  VMQ_RECOMMENDED_STACK.md
  VMQ_DEPLOYMENT_PLAN.md
  repos/
    szvone-vmqphp/
    zwc456baby-vmqApk/
```

## 一期推荐环境

### 服务端

- Linux 服务器 1 台
- Nginx + PHP-FPM
- MySQL 5.7 / 8.0
- PHP 7.x 优先

原因：

- 原版 `vmqphp` 是 ThinkPHP 5.1 老项目
- 最稳妥不是上最新 PHP，而是先用兼容性更好的环境跑通

### 监控端

- 安卓真机 1 台，优先
- 模拟器只做备选

原因：

- 你核心风险在通知监听稳定性
- 真机通常比模拟器更稳

## 服务端部署

### 1. 准备代码

使用：

- [szvone-vmqphp](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp)

### 2. 准备数据库

导入：

- [vmq.sql](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp/vmq.sql)

默认会创建这些表：

- `pay_order`
- `pay_qrcode`
- `setting`
- `tmp_price`

其中关键表作用：

- `pay_order`：订单主表
- `pay_qrcode`：固定金额二维码表
- `setting`：后台配置
- `tmp_price`：金额防撞占位表

### 3. 改数据库配置

修改：

- [config/database.php](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp/config/database.php)

至少要改：

- `hostname`
- `database`
- `username`
- `password`
- `hostport`

默认值里写的是：

- 数据库名：`vmq`
- 用户：`root`
- 密码：`root`
- 端口：`3306`

不要直接用默认值上线。

### 4. 配置 Web 根目录

站点根目录指向：

- [public](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp/public)

### 5. 配置伪静态

这个项目走 ThinkPHP 路由，必须有伪静态。

关键接口路由定义在：

- [route/route.php](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp/route/route.php)

里面会用到：

- `/createOrder`
- `/getOrder`
- `/checkOrder`
- `/appHeart`
- `/appPush`

### 6. 首次登录后台

初始化数据在 `setting` 表里，默认后台账号密码是：

- 用户名：`admin`
- 密码：`admin`

你第一次进后台后应立即修改：

- 后台账号密码
- 通讯密钥 `key`
- 默认 `notifyUrl`
- 默认 `returnUrl`
- 超时关闭时间 `close`
- 微信 / 支付宝默认收款码

## 服务端关键配置项

### 1. 通讯密钥

用途：

- 业务系统创建订单签名
- 安卓端调用 `/appHeart` 和 `/appPush` 签名
- 服务端回调你的业务系统时签名

这个值必须足够随机。

### 2. `payQf`

含义：

- 控制金额冲突时向上还是向下偏移

原版逻辑会把金额乘以 100，再尝试插入 `tmp_price` 表：

- 成功则占用
- 冲突则递增或递减一分钱

所以你的业务系统拿到 `reallyPrice` 后，必须以这个值作为实际支付金额。

### 3. `wxpay` / `zfbpay`

含义：

- 默认微信 / 支付宝收款二维码地址

如果后台 `pay_qrcode` 表里有某个具体金额的二维码，就会优先用该固定金额二维码。

## 业务系统如何对接

### 1. 创建订单

业务系统请求：

- `/createOrder`

主要参数：

- `payId`
- `type`
- `price`
- `param`
- `notifyUrl`
- `returnUrl`
- `sign`

签名规则：

- `md5(payId + param + type + price + key)`

### 2. 业务系统必须保存这些值

创建订单成功后，服务端会返回：

- `orderId`
- `reallyPrice`
- `payUrl`
- `timeOut`

你的系统必须保存：

- 自己的订单号 `payId`
- V免签订单号 `orderId`
- 实际支付金额 `reallyPrice`

### 3. 查询支付结果

前端轮询：

- `/checkOrder?orderId=...`

如果支付成功，接口会返回拼好的跳转地址。

### 4. 异步回调

服务端在 `/appPush` 匹配到订单后，会请求你的 `notify_url`

回调参数核心是：

- `payId`
- `param`
- `type`
- `price`
- `reallyPrice`
- `sign`

签名规则：

- `md5(payId + param + type + price + reallyPrice + key)`

你的回调接口必须：

- 验签
- 幂等
- 成功后返回纯文本 `success`

否则原版会把订单状态记为异步通知失败。

## 安卓端部署

### 1. 推荐使用的仓库

使用：

- [zwc456baby-vmqApk](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/zwc456baby-vmqApk)

### 2. 为什么不用原版 APK

推荐 fork 增加了这些稳定性能力：

- 开机自启
- 前台服务
- 失败后重试
- 后台长时间挂起时拉前台重发
- Android 15 限制说明
- 新版微信 / 支付宝通知兼容

这正好是你“不要一直开屏挂机，但要尽量稳”的需求。

### 3. 监控端权限

从 [AndroidManifest.xml](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/zwc456baby-vmqApk/app/src/main/AndroidManifest.xml) 可以看到，这个 fork 额外依赖这些能力：

- 通知监听
- 前台服务
- 开机广播
- 网络状态
- 电池优化白名单

你实际部署时，至少要手动确认：

- 通知使用权已开启
- 自启动已开启
- 电池优化无限制
- 锁屏显示已允许
- 后台弹窗已允许

### 4. Android 15 特别说明

这个 fork 的 README 明确要求：

```bash
appops set com.vone.qrcode RECEIVE_SENSITIVE_NOTIFICATIONS allow
```

如果是 Android 15，必须做这一步，否则支付宝某些通知可能监听不全。

### 5. 推荐设备设置

建议：

- 用一台专门的安卓机，不装太多 App
- 微信 / 支付宝 / vmqApk 全部加入无限制
- 关闭系统自动清理
- 保持 WLAN 休眠不掉线
- 不开省电模式

## 收款账号建议

### 1. 不要用日常主号直接试生产

建议分离：

- 日常号
- 收款号

### 2. 店员通知模式优先

优先用：

- 微信店员到账通知
- 支付宝店员通到账通知

原因：

- 对 iPhone 主号更友好
- 安卓机只负责接收通知
- 设备职责更清晰

## 一期联调步骤

### 1. 服务端单机通

先确认：

- 后台能登录
- 配置能保存
- `/appHeart` 可访问

### 2. 安卓端通心跳

在 App 中配置：

- `host`
- `key`

然后点击检测心跳，确认后台里：

- `lastheart` 在更新
- `jkstate = 1`

### 3. 通知监听测试

点击“检测监听权限”，确认能收到测试通知。

### 4. 创建测试订单

让你的业务系统调用 `/createOrder`。

重点看返回值：

- 是否生成 `orderId`
- 是否返回 `reallyPrice`

### 5. 支付测试

用另一个账号支付，观察：

- 安卓端是否收到通知
- 服务端 `lastpay` 是否更新
- `pay_order.state` 是否变成成功
- 你的业务系统回调是否收到

## 二期兜底建议

### 1. 必做幂等

你的回调接口必须按 `payId` 或业务订单号做幂等。

### 2. 必做补单页

因为通知链路再稳也可能漏单，所以你的业务系统至少要有：

- 手动补单
- 按 `payId/orderId` 查询状态

### 3. 必做“重新检测支付”

用户前端应保留一个按钮：

- 我已支付，重新检测

它本质上就是继续查 `/checkOrder`

### 4. 必做金额唯一化

不要让多个待支付订单长期堆积在同一金额区间。

## 当前这套方案的核心风险

### 1. 漏通知

原因：

- 系统限制
- 电池优化
- 新版支付宝 / 微信通知格式变化

### 2. 撞单

原因：

- 同金额订单并发

应对：

- 依赖 `reallyPrice`
- 订单尽快超时关闭

### 3. 回调失败

原因：

- 你的 `notify_url` 超时
- 没返回 `success`

应对：

- 回调接口尽量快
- 业务逻辑异步化

## 我对你当前阶段的建议

不要先改源码，先按推荐组合把整链路跑通。

第一阶段只验证四件事：

1. 安卓端通知能不能稳定进来
2. `/appPush` 能不能准确匹配订单
3. 你的回调接口能不能稳定返回 `success`
4. 一夜熄屏后第二天还能不能继续工作

只要这四件事成立，这套系统就有继续投入的价值。
