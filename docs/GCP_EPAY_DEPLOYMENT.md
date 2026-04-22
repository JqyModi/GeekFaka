# GCP EPay Deployment

详细运行手册见：

- [docs/GCP_EPAY_RUNBOOK.md](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/docs/GCP_EPAY_RUNBOOK.md)

这份文档记录 GeekFaka 旁路聚合网关的部署方案。目标是单独搭建一套开源 EPay 服务，不改动现网 `faka.minai.eu.org` 已跑通的支付宝官方当面付链路。

## 仓库选择

选型仓库：

- `lopinx/epay`
- GitHub: [https://github.com/lopinx/epay](https://github.com/lopinx/epay)

选择原因：

- 仓库本身就是彩虹易支付系实现，接口形态与当前 GeekFaka 的 `lib/payments/providers/epay.ts` 兼容。
- 支持 `submit.php`、异步通知、订单查询、商户 `pid/key` 体系。
- 自带多种支付插件，包括 `alipay`、`wxpay`、`qqpay`、`epay`、`epayn`、`jeepay` 等，可作为独立聚合网关。

需要注意：

- 自建 EPay 只是“聚合网关层”，不是支付资金来源。
- 真正收款仍需要在 EPay 后台配置合规的上游通道。建议优先使用官方或已合规开通的通道，不要把它当成绕过平台规则的手段。

## 部署拓扑

- 现网发卡站：`https://faka.minai.eu.org`
- 新增 EPay 网关：建议使用 `https://epay.minai.eu.org`
- GCP：单独 VM，区域继续使用新加坡 `asia-southeast1-b`
- 运行方式：`Docker Compose`
  - `mariadb`
  - `php:7.4-fpm`
  - `nginx:alpine`
- 宿主机 `nginx + certbot` 负责 TLS

## 当前实际部署

- GCP 项目：`project-15fbbfc1-0507-47d3-aae`
- 实例：`epay-sg`
- 区域：`asia-southeast1-b`
- 固定 IP：`34.142.201.198`
- 线上域名：`https://epay.minai.eu.org`
- 后台地址：`https://epay.minai.eu.org/admin/`
- 证书到期：`2026-07-17`

已完成的线上初始化：

- `pay_plugin` 已同步，当前插件数 `44`
- 已创建官方支付宝上游通道：
  - 名称：`Alipay Official Upstream`
  - 插件：`alipay`
  - 支付方式：`alipay`
  - 接口模式：`3`（当面付扫码）
- 已创建 GeekFaka 专用商户：
  - 商户账号：`geekfaka@local`
  - 商户 UID / PID：`1000`
- 已给发卡站支付回调域名过白：
  - `faka.minai.eu.org`

## GeekFaka 对接结果

GeekFaka 现网 `SystemSetting` 已写入以下 EPay 配置：

- `epay_enabled=true`
- `epay_channels=alipay`
- `epay_api_url=https://epay.minai.eu.org/`
- `epay_pid=1000`
- `epay_sign_type=MD5`
- `epay_fee=0`

说明：

- 现网原有 `支付宝当面付` 官方通道未关闭、未替换
- 新增的是一个额外的支付入口，前台会同时出现：
  - `支付宝当面付`
  - `支付宝`（provider=`epay`）

## 已验证项目

- `https://epay.minai.eu.org` 返回 `200`
- `https://epay.minai.eu.org/admin/` 返回 `200`
- `https://faka.minai.eu.org/api/config/payments` 已返回两条支付方式：
  - `alipay_f2f`
  - `alipay`（provider=`epay`）
- GeekFaka 已成功创建一笔 EPay 测试订单，并返回可访问支付链接：
  - 订单号：`HT-1776479577376-240`
  - `payUrl` 指向 `https://epay.minai.eu.org/submit.php?...`

## 定时任务

线上已安装并启用 `cron`，当前 root crontab：

- 每分钟执行订单处理：
  - `cron.php?do=order`
- 每分钟执行通知重试：
  - `cron.php?do=notify`
- 每 5 分钟执行状态检查：
  - `cron.php?do=check`

注意：

- 具体 `cronkey` 不写入仓库
- 如需迁移或重建，请去线上 `pay_config` 表读取 `cronkey`

## 自动化脚本

新增文件：

- `deploy/epay/gcp/create-vm.sh`
- `deploy/epay/gcp/remote-install.sh`
- `deploy/epay/gcp/bootstrap-remote.sh`
- `deploy/epay/gcp/install-admin-vendor-assets.sh`
- `deploy/epay/gcp/fix-admin-cdn.sh`
- `deploy/epay/gcp/fix-login-js.sh`
- `deploy/epay/gcp/fix-referer-check.sh`
- `deploy/epay/gcp/startup-script.sh`
- `deploy/epay/gcp/nginx-site.conf`
- `deploy/epay/docker-compose.yml`
- `deploy/epay/Dockerfile`
- `deploy/epay/nginx/epay.conf`

## 使用方式

创建 VM：

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export REGION="asia-southeast1"
export ZONE="asia-southeast1-b"
./deploy/epay/gcp/create-vm.sh
```

待 Cloudflare 把子域名指向新 IP 后，执行安装：

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export ZONE="asia-southeast1-b"
export INSTANCE_NAME="epay-sg"
export DOMAIN="epay.minai.eu.org"
export LETSENCRYPT_EMAIL="you@example.com"
export MYSQL_ROOT_PASSWORD="replace-me"
export MYSQL_PASSWORD="replace-me"
export ADMIN_PASSWORD="replace-me"
./deploy/epay/gcp/remote-install.sh
```

## 默认安装后完成的动作

- 从 GitHub 拉取 `lopinx/epay`
- 生成 `config.php`
- 初始化数据库
- 写入 `install.lock`
- 下载后台所需前端依赖到本地 `assets/vendor`
- 将后台 `admin/head.php` 的 CDN 切换到站内本地资源，避免中国网络环境下后台脚本失效
- 修复上游后台登录页对缺失前端依赖的兼容问题
- 修复上游 `checkRefererHost()` 过严导致后台在部分浏览器/代理环境下误判 403 的问题
- 同步插件列表
- 建好宿主机 Nginx 站点
- 申请 Let’s Encrypt 证书

## 已处理的上游兼容问题

- 上游后台默认依赖外部 CDN。中国网络环境下脚本和样式容易加载失败，表现为“能登录，但菜单点击没反应、表格不出数据、按钮无响应”。部署脚本现在会把后台依赖下载到本地 `assets/vendor`，并强制后台走本地资源。
- 后台登录页原逻辑依赖 jQuery/layer，资源加载失败时会退化成普通表单 GET 提交，表现为“页面刷新后仍停在登录页”。部署脚本现在会自动替换为原生 `fetch` 登录逻辑。
- 上游 `checkRefererHost()` 只接受非空 `HTTP_REFERER`。在部分浏览器、代理或安全策略下，请求可能不带 `Referer`，会导致后台登录和部分管理操作直接返回 `403`。部署脚本现在改为：
  - 有 `Origin` 时校验 `Origin`
  - 有 `Referer` 时校验 `Referer`
  - 两者都没有时放行

这项修复只影响后台同源校验，不影响 GeekFaka 的支付回调链路。

## 上线后还需要做的事

1. 在 EPay 后台新增真实商户与支付通道
2. 给 GeekFaka 配置：
   - `epay_api_url`
   - `epay_pid`
   - `epay_key` 或 RSA 密钥
3. 在 EPay 商户域名白名单中加入：
   - `faka.minai.eu.org`
4. 用测试商品验证：
   - 下单
   - 支付
   - EPay 回调
   - GeekFaka 自动发货
