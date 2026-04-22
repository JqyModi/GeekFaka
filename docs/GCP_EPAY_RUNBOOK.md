# EPay GCP 部署与联调运行手册

本文档用于固化本次在 GCP 上单独部署 EPay，并将其接入现网 `GeekFaka` 的全过程。重点记录：

- 关键执行步骤
- 线上产物与落点
- 敏感配置项及其存放位置
- 实际问题与修复方案
- 架构边界说明

本文档以本次实际落地结果为准，适合作为后续重建、迁移、排障和交接材料。

## 1. 目标与边界

本次目标：

- 在 GCP 上部署一套独立的 EPay 网关
- 保持现网 `支付宝当面付` 官方链路不变
- 让 `GeekFaka` 新增一条 `provider=epay` 的聚合支付链路
- 验证从下单、支付、回调到自动发卡的完整闭环

本次明确不包含：

- 不提供“无需任何上游”的资金收款能力
- 不绕过支付宝/微信等官方结算体系
- 不把 EPay 当作“个人免进件收款系统”

关键结论：

- **EPay 是聚合网关层，不是资金来源。**
- **要真正收款，仍然需要官方商户、服务商子商户，或第三方聚合上游。**

## 2. 最终线上信息

当前实际环境：

- GCP 项目 ID：`project-15fbbfc1-0507-47d3-aae`
- EPay 实例：`epay-sg`
- 区域：`asia-southeast1-b`
- 固定 IP：`34.142.201.198`
- EPay 域名：`epay.minai.eu.org`
- EPay 后台：`https://epay.minai.eu.org/admin/`
- 证书到期：`2026-07-17`

现网关联站点：

- 发卡站前台：`https://faka.minai.eu.org`
- 发卡站后台：`https://faka.minai.eu.org/admin`

## 3. 选型结论

本次实际选型仓库：

- `lopinx/epay`
- GitHub: [https://github.com/lopinx/epay](https://github.com/lopinx/epay)

选择原因：

- 接口形态与当前 `GeekFaka` 的 `EPay` 提供方兼容
- 支持商户 `pid/key` 体系
- 自带多种支付插件，便于后续扩展支付宝、微信等上游

备注：

- 仓库本身存在若干中国网络环境和浏览器兼容性问题，已通过部署补丁修复
- 本次没有切换到其他 EPay 分叉仓库，原因是现网问题已可控修复，切库会引入迁移成本和新的未知变量

## 4. 基础设施与部署结构

部署方式：

- `Compute Engine`
- `Debian 12`
- `Docker Compose`
- 宿主机 `nginx + certbot`

服务结构：

- `epay-mysql`
- `epay-php`
- `epay-nginx`

流量路径：

```text
Cloudflare
  -> epay-sg host nginx
  -> 127.0.0.1:8080
  -> epay-nginx
  -> epay-php
```

实际部署目录：

- 应用目录：`/opt/epay`
- 上游源码目录：`/opt/epay/app`
- 部署脚本目录：`/opt/epay/deploy`

## 5. 本次关键执行步骤

### 5.1 GCP 资源创建

执行结果：

- 创建 VM：`epay-sg`
- 区域：`asia-southeast1-b`
- 固定公网 IP：`34.142.201.198`

对应脚本：

- [deploy/epay/gcp/create-vm.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/create-vm.sh)

### 5.2 域名与 HTTPS

执行步骤：

1. 在 Cloudflare 为 `epay.minai.eu.org` 添加 `A` 记录
2. 记录先设置为 `DNS only`
3. 宿主机 `nginx` 配置站点
4. 使用 `certbot` 为 `epay.minai.eu.org` 签发证书

对应脚本：

- [deploy/epay/gcp/remote-install.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/remote-install.sh)
- [deploy/epay/gcp/bootstrap-remote.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/bootstrap-remote.sh)
- [deploy/epay/gcp/nginx-site.conf](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/nginx-site.conf)

### 5.3 EPay 初始化

执行步骤：

1. 拉取 `lopinx/epay`
2. 生成 `config.php`
3. 初始化数据库
4. 写入 `install.lock`
5. 同步支付插件
6. 配置管理员账号
7. 安装定时任务

关键结果：

- `pay_plugin` 已同步
- 已创建 GeekFaka 专用商户
- 已创建支付宝上游通道
- 已将 `faka.minai.eu.org` 加入白名单

### 5.4 GeekFaka 对接

已写入的关键配置：

- `epay_enabled=true`
- `epay_channels=alipay`
- `epay_api_url=https://epay.minai.eu.org/`
- `epay_pid=1000`
- `epay_sign_type=MD5`

实际效果：

- 发卡站保留原 `支付宝当面付`
- 新增一条 `支付宝` 聚合入口，底层走 EPay

## 6. 关键线上产物与存放位置

### 6.1 站点与服务

- EPay 应用：`/opt/epay/app`
- Docker Compose：`/opt/epay/docker-compose.yml`
- 宿主机 Nginx 站点：`/etc/nginx/sites-available/epay.conf`
- 宿主机 Alipay 代理：`/etc/nginx/conf.d/alipay-gateway.conf`

### 6.2 数据库

- 数据库名：`epay`
- 表前缀：`pay`

关键表：

- `pay_config`
- `pay_channel`
- `pay_plugin`
- `pay_user`
- `pay_order`
- `pay_cache`

### 6.3 定时任务

当前 root crontab 关键任务：

- `cron.php?do=order`
- `cron.php?do=notify`
- `cron.php?do=check`

### 6.4 密钥与敏感配置落点

以下信息**存在生产环境，但不写入仓库明文**：

- MySQL root 密码
- MySQL 业务用户密码
- EPay 管理员密码
- EPay 商户密钥 / RSA 密钥
- 支付宝上游私钥
- `cronkey`
- `syskey`

实际落点：

- 数据库配置：`/opt/epay/.env`
- PHP 数据库连接：`/opt/epay/app/config.php`
- 系统配置缓存：`pay_cache`
- 业务配置主表：`pay_config`
- 支付通道配置：`pay_channel.config`

建议读取方式：

- 优先通过后台查看
- 或在服务器上查询 `pay_config` / `pay_channel`
- 不要把真实密钥再抄进仓库

## 7. 实际遇到的问题与解决方案

### 7.1 容器内直连支付宝网关失败

现象：

- EPay 生成订单后，打开网关支付页报错
- 典型报错：`OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to openapi.alipay.com:443`

排查结论：

- 宿主机可访问支付宝网关
- 容器内直连存在 TLS / 网络链路问题

解决方案：

- 宿主机 `nginx` 新增支付宝反向代理
- EPay 上游插件改为访问宿主机代理地址，而不是容器内直连 `openapi.alipay.com`

结果：

- EPay 支付页恢复可用
- EPay 链路可正常完成支付宝下单

### 7.2 登录页回到原页面，无法进入后台

现象：

- 输入账号密码后，页面刷新但仍停在登录页

根因：

- 登录页依赖 jQuery/layer
- 资源加载失败时，表单退化为普通 GET 提交

解决方案：

- 将后台登录页改为原生 `fetch` 登录逻辑

对应补丁：

- [deploy/epay/gcp/fix-login-js.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/fix-login-js.sh)

### 7.3 后台登录接口返回 403

现象：

- 登录请求直接返回 `{"code":403}`

根因：

- 上游 `checkRefererHost()` 要求必须有 `HTTP_REFERER`
- 部分浏览器、代理环境下该头不存在

解决方案：

- 校验逻辑改为：
  - 有 `Origin` 时校验 `Origin`
  - 有 `Referer` 时校验 `Referer`
  - 两者都没有时放行

对应补丁：

- [deploy/epay/gcp/fix-referer-check.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/fix-referer-check.sh)

### 7.4 后台功能能显示但点击无响应 / 表格没数据

现象：

- 登录成功
- 退出正常
- 其他菜单无响应，或数据表不加载

根因：

- 后台默认依赖外部 CDN
- 中国网络环境下外链资源不稳定

解决方案：

- 将后台依赖下载到本地 `assets/vendor`
- 强制后台资源改为站内路径

对应补丁：

- [deploy/epay/gcp/install-admin-vendor-assets.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/install-admin-vendor-assets.sh)
- [deploy/epay/gcp/fix-admin-cdn.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/fix-admin-cdn.sh)

### 7.5 EPay 订单已支付，但 GeekFaka 不自动发卡

现象：

- 支付成功
- 订单页停留在待支付
- 点“我已支付，点击刷新”后才发货

根因：

- 订单状态轮询逻辑未真正上线到生产前端 bundle

解决方案：

- 重新完整构建并发布 GeekFaka 前端
- 确认订单页轮询逻辑已进入生产 chunk

结果：

- 支付成功后，前台订单页可自动刷新并展示卡密

## 8. 实际闭环验证结果

已完成验证：

- EPay 后台可登录
- EPay 后台通道、订单、商户等页面可正常使用
- 发卡站可创建 EPay 订单
- EPay 可生成支付宝支付链接与二维码
- 支付完成后，EPay 可完成异步通知
- GeekFaka 可接收 EPay 回调并自动发卡

验证样例：

- 订单号：`HT-1776479577376-240`
- 订单号：`HT-1776507327236-653`
- 订单号：`HT-1776508356738-242`

## 9. 自动化脚本清单

本次为 EPay 实际补充的部署脚本：

- [deploy/epay/gcp/create-vm.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/create-vm.sh)
- [deploy/epay/gcp/remote-install.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/remote-install.sh)
- [deploy/epay/gcp/bootstrap-remote.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/bootstrap-remote.sh)
- [deploy/epay/gcp/startup-script.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/startup-script.sh)
- [deploy/epay/gcp/install-admin-vendor-assets.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/install-admin-vendor-assets.sh)
- [deploy/epay/gcp/fix-admin-cdn.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/fix-admin-cdn.sh)
- [deploy/epay/gcp/fix-login-js.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/fix-login-js.sh)
- [deploy/epay/gcp/fix-referer-check.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/epay/gcp/fix-referer-check.sh)

## 10. 架构认知修正

本次实践后的结论必须明确：

- **自建 EPay 并不会自动获得支付宝/微信的收款能力**
- **EPay 只是对接多种上游的中间层**
- **没有上游，就没有真实资金流**

因此：

- 如果你已有官方支付宝当面付，EPay 可以把它包装成一条聚合通道
- 如果你想接微信支付，仍然需要：
  - 微信官方商户 / 小微商户 / 服务商子商户
  - 或第三方聚合支付上游
- 如果你想做“个人二维码收款”，那是另一类系统，不是 EPay 天生解决的问题

## 11. 关于“个人二维码收款”的结论

本次实践结论：

- **是的，如果你的目标是“个人二维码收款、无需官方进件、像码支付那样工作”，通常还需要另一个“码支付/监听收款码”体系。**
- 这类系统和 EPay 的角色不同：

### EPay

- 聚合网关
- 负责订单、商户、通道、回调、分发
- 需要上游支付能力作为资金来源

### 码支付

- 监听个人收款码或个人支付结果
- 将个人到账事件映射到订单
- 常见实现方式是挂机、回调桥接、App 监听、店员收款码中转等

因此更准确的架构是：

```text
发卡站 GeekFaka
  -> EPay
    -> 官方商户 / 服务商子商户 / 第三方聚合上游
```

或者：

```text
发卡站 GeekFaka
  -> 码支付系统
```

或者：

```text
发卡站 GeekFaka
  -> EPay
    -> 码支付上游
```

最后一种并不少见：EPay 继续做聚合层，真正的“个人收款能力”由某个码支付系统充当上游提供。

## 12. 后续建议

建议按优先级处理：

1. 继续保留现有 `支付宝当面付` 官方链路作为主收款方式
2. 如果要接微信，优先找合规上游，不要先把“免签/码支付”当主链路
3. 如果确实要试个人二维码收款，单独搭建测试环境，不直接替换现网支付主通道
4. 将 EPay 继续定位为“网关聚合层”，不要把它误当成“收款资质替代品”
