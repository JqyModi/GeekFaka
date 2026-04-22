# OpenFaka GCP + 支付宝当面付部署运行手册

本文档用于固化本仓库在 GCP 上部署发卡站并完成支付宝当面付对接的全过程，覆盖：

- 目标架构
- 关键产物
- 实际部署步骤
- 支付对接方式
- 已知问题与修复记录
- 后续运维建议

本文档以本次实际落地结果为准，适合作为后续复盘、迁移、重建、接手运维时的追溯材料。

## 1. 目标与范围

本次部署目标：

- 在 GCP 上上线一个可访问的发卡网站
- 支持虚拟卡密商品自动发货
- 支持后台管理、商品管理、卡密库存管理
- 接入支付宝当面付
- 实现支付成功后的异步回调发货
- 提供 HTTPS 正式访问能力

本次实际完成内容：

- 站点已部署至 GCP `Compute Engine`
- 域名已接入 `Cloudflare`
- 已启用 HTTPS
- 已完成支付宝当面付下单、回调、自动发货链路
- 已修复首页中文乱码问题
- 已修复订单页支付成功后未自动轮询刷新的问题

## 2. 最终线上信息

当前线上环境：

- GCP 项目 ID：`project-15fbbfc1-0507-47d3-aae`
- GCP 项目 Number：`550305367915`
- 区域：`asia-southeast1-b`
- 实例名：`geekfaka-sg`
- 访问域名：`faka.minai.eu.org`
- 对外固定 IP：`34.21.174.131`
- 站点前台：`https://faka.minai.eu.org`
- 管理后台：`https://faka.minai.eu.org/admin`

当前 DNS 路由：

- 域名托管在 `Cloudflare`
- `faka.minai.eu.org` 的 `A` 记录指向 `34.21.174.131`

当前部署目录：

- 远端代码目录：`/opt/OpenFaka`

当前容器：

- 应用容器：`geekfaka-app`
- 数据库容器：`geekfaka-mysql`

## 3. 代码侧关键改动

为满足“支付宝当面付 + 自动发货 + 可部署到 GCP”的目标，仓库新增或修改了以下关键文件。

### 3.1 支付宝当面付

- [lib/payments/providers/alipay.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/lib/payments/providers/alipay.ts)
  - 新增支付宝支付适配器
  - 支持 `alipay.trade.precreate`
  - 支持 `alipay.trade.query`
  - 支持支付宝回调验签

- [lib/payments/registry.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/lib/payments/registry.ts)
  - 注册 `alipay` 支付适配器

- [app/api/payments/alipay/notify/route.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/app/api/payments/alipay/notify/route.ts)
  - 接收支付宝异步通知
  - 验签成功后调用发货逻辑

- [app/api/orders/[orderNo]/check/route.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/app/api/orders/[orderNo]/check/route.ts)
  - 提供手动查单补偿接口
  - 在用户点击“我已支付，点击刷新”时查询支付状态并触发发货

- [lib/orders/fulfill-order.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/lib/orders/fulfill-order.ts)
  - 抽离统一发货逻辑
  - 异步回调和手动查单共用一套发货流程

### 3.2 后台配置与前台订单页

- [app/admin/(dashboard)/settings/page.tsx](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/app/admin/(dashboard)/settings/page.tsx)
  - 增加支付宝当面付配置项
  - 支持填写 `App ID`、应用私钥、支付宝公钥、网关、手续费

- [app/api/config/payments/route.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/app/api/config/payments/route.ts)
  - 将支付宝支付方式暴露给前台

- [app/orders/[orderNo]/page.tsx](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/app/orders/[orderNo]/page.tsx)
  - 支持展示支付宝二维码
  - 新增待支付状态下的自动轮询
  - 保留手动“我已支付，点击刷新”作为补偿入口

- [app/api/orders/[orderNo]/route.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/app/api/orders/[orderNo]/route.ts)
  - 强制动态返回订单状态
  - 禁止缓存订单状态响应

### 3.3 部署与运行

- [docker-compose.prod.yml](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/docker-compose.prod.yml)
  - 生产环境容器编排

- [.env.production.example](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/.env.production.example)
  - 生产环境变量模板

- [.dockerignore](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/.dockerignore)
  - 避免将 `mysql_data` 等运行时目录打进 Docker build context

- [deploy/nginx/geekfaka.conf](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/nginx/geekfaka.conf)
  - Nginx 反向代理配置

- [deploy/gcp/create-vm.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/gcp/create-vm.sh)
- [deploy/gcp/push-app.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/gcp/push-app.sh)
- [deploy/gcp/remote-install.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/gcp/remote-install.sh)
- [deploy/gcp/install-on-vm.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/gcp/install-on-vm.sh)
- [deploy/gcp/startup-script.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/deploy/gcp/startup-script.sh)

## 4. 基础设施选型与原因

本次没有选 Cloud Run / GKE，而是选择：

- `Compute Engine`
- `Debian 12`
- `Docker Compose`
- `Nginx + Let's Encrypt`
- `Cloudflare DNS`

原因：

- 发卡站需要后台、数据库、库存、异步回调、排障能力
- 对小白和首站来说，单机 VM 最容易理解和维护
- Docker Compose 足够轻量，适合当前业务规模
- Nginx + Certbot 比复杂的 GCP 负载均衡更直接

## 5. 实际部署过程

### 5.1 本地准备

完成内容：

- 在当前工作区拉取 `GeekFaka` 代码
- 补充支付宝相关代码与部署文件
- 安装并配置 `gcloud CLI`
- 通过 `gcloud auth login --no-launch-browser` 完成授权

关键点：

- 资源创建时应使用 `PROJECT_ID`
- 用户最初提供的 `550305367915` 是 `project number`
- 实际项目 ID 为 `project-15fbbfc1-0507-47d3-aae`

### 5.2 GCP 资源创建

早期曾创建欧洲机，后因用户主要服务中国用户而迁移到新加坡。

最终保留资源：

- 实例名：`geekfaka-sg`
- 区域：`asia-southeast1-b`
- 公网 IP：`34.21.174.131`

已删除旧资源：

- 旧欧洲实例：`geekfaka-prod`
- 旧欧洲静态 IP：`34.52.206.225`

### 5.3 域名与 HTTPS

流程：

1. 在 Cloudflare 为 `faka.minai.eu.org` 添加 `A` 记录
2. 先切到 `DNS only`，便于 Let’s Encrypt 校验证书
3. 使用 Nginx + Certbot 申请证书
4. 站点切换为 HTTPS 正式访问

结果：

- `https://faka.minai.eu.org` 可访问
- `https://faka.minai.eu.org/admin` 可访问

### 5.4 生产部署目录与服务

远端目录：

```bash
/opt/OpenFaka
```

生产服务组成：

- `geekfaka-app`
- `geekfaka-mysql`

对外流量路径：

```text
Cloudflare
  -> Nginx (host)
  -> 127.0.0.1:3000
  -> geekfaka-app
```

## 6. 支付宝当面付接入说明

### 6.1 后台配置项

后台支付渠道中需要配置：

- `App ID`
- `应用私钥`
- `支付宝公钥`
- 网关：`https://openapi.alipay.com/gateway.do`

重要区分：

- “应用私钥”必须与支付宝开放平台中上传的“应用公钥”成对
- 网站中的“支付宝公钥”必须填写支付宝平台公钥
- 不能把“应用公钥”误填到“支付宝公钥”位置

### 6.2 回调地址

支付宝异步通知地址：

```text
https://faka.minai.eu.org/api/payments/alipay/notify
```

### 6.3 实际联调结果

已经验证成功的链路：

1. 前台创建订单
2. 调用 `alipay.trade.precreate`
3. 生成支付宝二维码
4. 用户扫码支付
5. 支付宝异步回调到 `notify`
6. 回调验签通过
7. 订单状态更新为 `PAID`
8. 自动发货卡密

已确认成功的订单示例：

- `HT-1776417654064-975`
- `HT-1776419558619-621`

## 7. 数据初始化

为便于联调，初始化了示例分类、示例商品和测试卡密。

初始化内容：

- 分类：`虚拟卡密`
- 商品：`ChatGPT Plus 月卡兑换码`
- 商品：`Midjourney 标准套餐月卡`
- 商品：`支付宝回调测试商品`

测试商品用途：

- 低金额下单
- 支付宝扫码支付
- 验证回调与自动发货链路

## 8. 遇到的问题与解决方案

### 8.1 GCP Billing 未开通

现象：

- 无法启用 `Compute Engine API`
- 无法创建 VM

原因：

- billing account 状态为关闭

解决：

- 在 GCP Billing 页面重新启用 billing
- 将项目重新绑定可用 billing account

### 8.2 部署区域选错

现象：

- 最初机器建在 `europe-west1-b`
- 用户主要服务中国用户，区域不合适

解决：

- 改为新加坡 `asia-southeast1-b`
- 重新分配 IP
- 更新 Cloudflare DNS
- 删除旧欧洲实例和旧静态 IP

### 8.3 首页中文乱码

现象：

- 前台商品和分类显示为乱码

原因：

- 早期导入测试数据时，MySQL 客户端会话字符集错误
- 中文字符串以错误编码写入数据库

解决：

- 统一按 `utf8mb4` 修正数据库内容
- 使用稳定方式重写分类名、商品名、描述

结论：

- 当前首页中文已恢复正常

### 8.4 支付宝密钥配置错误

现象：

- 下单时报验签错误

原因：

- 应用私钥与应用公钥不匹配
- 或支付宝公钥填写错误

解决：

- 重新核对 `App ID`
- 重新上传/填写正确密钥对
- 区分“应用公钥”和“支付宝公钥”

### 8.5 “商户协议状态非正常状态”

现象：

- 支付创建时支付宝返回协议状态异常

原因：

- 支付宝当面付开通状态或签约状态未完全可用

解决：

- 等待用户侧开通/协议状态修正
- 重新测试后恢复正常

### 8.6 支付成功后没有自动展示卡密

现象：

- 支付成功后必须手动点击“我已支付，点击刷新”

排查结果：

- 支付宝异步通知其实已成功到达
- 订单状态和自动发货也已完成
- 真正的问题是订单页停留在旧的 `PENDING` 前端状态
- 早期虽然源码已加入轮询，但线上容器还在跑旧前端构建产物

解决：

- 在订单页加入定时轮询逻辑
- 在订单状态接口中禁用缓存并强制动态返回
- 重新完整构建并替换线上容器
- 确认新前端 chunk 已包含 `setInterval`

修复后结果：

- 支付成功后，订单页可在数秒内自动切换到成功页并展示卡密

### 8.7 Docker 构建被运行时数据目录污染

现象：

- 远端 `docker-compose build` 报错
- `mysql_data` 被打进 build context

原因：

- 缺少 `.dockerignore`

解决：

- 增加 [.dockerignore](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/.dockerignore)
- 排除 `.git`、`node_modules`、`.next`、`mysql_data`

## 9. 当前已知运行方式

### 9.1 查看服务状态

```bash
ssh -i ~/.ssh/id_rsa modi@34.21.174.131
cd /opt/OpenFaka
docker-compose -f docker-compose.prod.yml ps
```

### 9.2 查看应用日志

```bash
docker logs --tail 200 geekfaka-app
```

### 9.3 查看数据库容器日志

```bash
docker logs --tail 200 geekfaka-mysql
```

### 9.4 重新部署

如果只是代码变更后重发：

1. 将代码同步到 `/opt/OpenFaka`
2. 重新构建并拉起应用容器

```bash
cd /opt/OpenFaka
docker-compose -f docker-compose.prod.yml build geekfaka
docker-compose -f docker-compose.prod.yml up -d --force-recreate geekfaka
```

注意：

- `docker-compose.prod.yml` 中服务名是 `geekfaka`
- 容器名是 `geekfaka-app`

## 10. 环境变量与敏感信息管理

以下信息不应写入仓库：

- 管理员密码
- MySQL 密码
- JWT Secret
- 优惠码 API Key
- 支付宝应用私钥
- 支付宝公钥原文

建议：

- 仅保留 [.env.production.example](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/.env.production.example) 模板
- 真实值只保存在远端 `/opt/OpenFaka/.env.production`
- 如需交接，单独走密码管理器或安全通道

## 11. 当前交付状态

截至本文档编写时，以下目标已完成：

- GCP 单机生产环境部署完成
- Cloudflare 域名接入完成
- HTTPS 启用完成
- 支付宝当面付接入完成
- 异步回调完成
- 自动发货完成
- 中文乱码问题已修复
- 支付成功后订单页自动刷新问题已修复

## 12. 后续建议

建议后续继续做以下工作：

- 将管理员密码、数据库密码、支付配置做一次正式轮换
- 为 MySQL 增加定期备份
- 增加 `ufw` 或更严格的 GCP 防火墙规则
- 将 Nginx、应用、数据库日志纳入统一轮转
- 将测试商品与演示卡密从正式站点中清理或单独隔离
- 增加订单页支付成功后的更明显提示动画或倒计时提示
- 如后续订单量增长，可将 MySQL 独立迁移至 `Cloud SQL`

## 13. 文档用途说明

本文档属于“运行手册 / 部署纪要”性质，不是营销文档，也不是只面向开发者的简版 README。

适用场景：

- 重建同一套环境
- 他人接手运维
- 迁移到新实例
- 复盘支付与回调问题
- 排查线上自动发货故障

