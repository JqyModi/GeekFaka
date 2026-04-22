# V免签推荐组合

更新时间：2026-04-21

## 最终推荐

当前最推荐你采用的组合是：

- 服务端：`szvone/vmqphp`
- 监控端：`zwc456baby/vmqApk`

本地已拉取的仓库位置：

- 服务端原版：
  - [szvone-vmqphp](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp)
- 服务端保守 fork：
  - [wujingquan-vmqphp](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/wujingquan-vmqphp)
- 服务端实验 fork：
  - [hulisang-vmqphp](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/hulisang-vmqphp)
- 监控端原版：
  - [szvone-vmqApk](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqApk)
- 监控端推荐 fork：
  - [zwc456baby-vmqApk](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/zwc456baby-vmqApk)
- 监控端工程升级 fork：
  - [HC-axcc-vmqApk](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/HC-axcc-vmqApk)

## 为什么是这个组合

### 1. 服务端原版的核心逻辑是稳定的

原版服务端关键逻辑集中在：

- [application/index/controller/Index.php](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp/application/index/controller/Index.php)

它已经覆盖了：

- 创建订单
- 金额防撞库 `tmp_price`
- 安卓端心跳接口 `/appHeart`
- 安卓端到账推送接口 `/appPush`
- 商户回调 `notify_url`
- 订单查询 `/getOrder`
- 支付结果轮询 `/checkOrder`
- 超时释放金额
- 补单

从这次比对看，原版最核心的“订单闭环”是完整的，没有必须更换 fork 的证据。

### 2. `zwc456baby/vmqApk` 对实际稳定性提升最大

推荐 APK fork：

- [zwc456baby/vmqApk](https://github.com/zwc456baby/vmqApk)

本地比对确认，它没有改掉服务端协议，而是在原协议之上增强了监控端：

- 仍然使用 `/appHeart`
- 仍然使用 `/appPush`
- 保留原有 host/key 配置方式

但增加了这些稳定性能力：

- 开机自启
- 前台服务
- 锁屏/后台拉起
- post 失败重试
- 电池优化处理
- Android 15 敏感通知权限说明
- 新版微信/支付宝通知匹配兼容
- 某些网络场景下避免连接假死

这类增强，恰好对应你最担心的“挂机不稳定”问题。

### 3. PHP fork 目前没有明显胜者

#### `wujingquan/vmqphp`

优点：

- 基本保留原版结构
- 做了保守升级

缺点：

- 改动有限
- 没有形成决定性优势

#### `hulisang/vmqphp`

优点：

- 明确在做 `PHP 8 + ThinkPHP 8`

缺点：

- 改动太大
- 包括目录结构、依赖、路由、二维码库等整体迁移
- 当前更适合实验，不适合你现在先求稳的阶段

## 已确认的兼容性判断

### 推荐监控端和原版服务端协议兼容

我本地对比后确认：

- 原版服务端仍暴露：
  - `/appHeart`
  - `/appPush`
  - `/getOrder`
  - `/checkOrder`
- `zwc456baby/vmqApk` 仍然向这些接口发请求

这意味着：

- 你不需要为了用推荐 APK fork，再去同步更换一个 PHP fork
- 可以直接采用“原版服务端 + 推荐 APK fork”的组合

## 不建议现在用的组合

### 不建议 1

- `kingfer30/vmqphp` + 任意 APK

原因：

- 仓库里发现了硬编码数据库密码和端口
- 仓库卫生不合格

### 不建议 2

- `hulisang/vmqphp` + `HC-axcc/vmqApk`

原因：

- 两边都属于“改动幅度较大”的版本
- 你现在的目标是先跑稳，不是一次性把所有组件都换成实验版

## 推荐落地顺序

### 第一阶段

- 服务端先用原版 `szvone/vmqphp`
- 监控端用 `zwc456baby/vmqApk`

目标：

- 验证支付后回调稳定性
- 验证店员通知模式
- 验证断网、熄屏、锁屏后的恢复能力

### 第二阶段

- 如果你服务器环境必须 `PHP 8`
- 再单独评估迁移到 `hulisang/vmqphp`

目标：

- 只解决服务端运行环境问题
- 不同时叠加 APK 侧的不确定性

## 你现在最应该基于哪个目录开始

如果现在就要开工，我建议你基于这两个目录：

- 服务端基础：
  - [szvone-vmqphp](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/szvone-vmqphp)
- 监控端基础：
  - [zwc456baby-vmqApk](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/repos/zwc456baby-vmqApk)

## 当前锁定的参考版本

- `szvone-vmqphp`: `d5c8c3f`
- `wujingquan-vmqphp`: `cc190dd`
- `hulisang-vmqphp`: `c5fe5c7`
- `szvone-vmqApk`: `2867df1`
- `zwc456baby-vmqApk`: `1d8158e`
- `HC-axcc-vmqApk`: `f8a438d`
