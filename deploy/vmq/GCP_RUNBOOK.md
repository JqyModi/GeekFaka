# V免签 GCP 部署与联调运行手册

本文档用于固化本次在 GCP 上部署 Java 版 V免签，并将其接入现网 `GeekFaka` 的全过程。重点记录：

- 关键执行步骤
- 线上产物与落点
- 敏感配置项及其存放位置
- 实际问题与修复方案
- 与发卡站联调时的关键坑

本文档以本次实际落地结果为准，适合作为后续重建、迁移、排障和交接材料。

## 1. 目标与边界

本次目标：

- 在 GCP 上部署一套可公网访问的 V免签服务
- 通过 `vmq.minai.eu.org` 提供管理后台、支付页和监控端 APK 下载
- 将 `GeekFaka` 新增的 `provider=vmq` 渠道指向该服务
- 验证从下单、扫码支付、监控端上报、异步回调到自动发卡的完整闭环

本次明确包含：

- 个人二维码免签收款
- 微信 / 支付宝个人收款码
- 监控端通知监听回调
- 与 `GeekFaka` 的自动发货打通

本次明确不包含：

- 官方商户进件
- 第三方代收平台
- 高可用、多实例或自动扩缩容
- 容器化部署 V免签服务端

关键结论：

- **本次最终落地的是 Java 版 V免签，而不是 PHP 版。**
- **当前方案已在 GCP + 模拟器微信环境下完成真实 `0.01` 元全链路验证。**

## 2. 最终线上信息

当前实际环境：

- GCP 项目 ID：`project-15fbbfc1-0507-47d3-aae`
- 复用 VM：`geekfaka-sg`
- 区域：`asia-southeast1-b`
- 公网 IP：`34.21.174.131`
- V免签域名：`vmq.minai.eu.org`
- V免签地址：[https://vmq.minai.eu.org](https://vmq.minai.eu.org)
- APK 下载地址：[https://vmq.minai.eu.org/vmqApk-v2.0.9.apk](https://vmq.minai.eu.org/vmqApk-v2.0.9.apk)
- HTTPS 证书到期：`2026-07-20`

关联站点：

- 发卡站前台：`https://faka.minai.eu.org`
- 发卡站 V免签异步回调：`https://faka.minai.eu.org/api/payments/vmq/notify`

## 3. 选型结论

本次实际选型：

- Java 版 V免签 WAR 包
- 与 `szvone-vmqphp` 同系后台页面和接口语义

选择原因：

- 本地已优先跑通
- 后台功能完整，兼容监控端 APK
- 对接 `GeekFaka` 时只需要标准 `/createOrder`、`/appPush`、回调链路即可

为什么不是 PHP 版：

- 当前实际跑通并上线的是 Java 版
- Java 版作为单 WAR 包部署，在 GCP 上更直接
- 不依赖额外 PHP-FPM / Nginx / MySQL 组合即可启动服务端

保留意见：

- 如果未来要长期维护、二次开发后台或统一 LEMP 栈，PHP 版仍然值得重新评估
- 但当前“迁移可复现”目标下，应优先复用已验证成功的 Java 方案

## 4. 基础设施与部署结构

部署方式：

- `Compute Engine`
- `Debian 12`
- `systemd`
- 宿主机 `nginx + certbot`
- Java 17 运行 `vmq.war`

服务结构：

```text
Cloudflare
  -> vmq.minai.eu.org
  -> GCP VM host nginx
  -> 127.0.0.1:18080
  -> vmq.war
```

实际部署目录：

- V免签根目录：`/opt/vmq`
- WAR 包：`/opt/vmq/vmq.war`
- H2 数据库：`/opt/vmq/data/mq.mv.db`
- 日志目录：`/opt/vmq/logs`
- APK 目录：`/opt/vmq/apk`

systemd 服务：

- 服务文件：`/etc/systemd/system/vmq.service`
- 服务名：`vmq.service`

Nginx 站点：

- `sites-available`：`/etc/nginx/sites-available/vmq.conf`
- `sites-enabled`：`/etc/nginx/sites-enabled/vmq.conf`

## 5. 本次关键执行步骤

### 5.1 准备 GCP 资源

本次没有新建 VM，直接复用了已有发卡站机器：

- VM：`geekfaka-sg`
- Zone：`asia-southeast1-b`

如果迁移到新环境，可先创建一台 Debian 12 VM，并放行：

- `80`
- `443`
- 如需 SSH：`22`

推荐最小规格：

- `e2-medium` 或以上
- 磁盘 `20GB+`

### 5.2 域名与 DNS

执行步骤：

1. 在 Cloudflare 为 `vmq.minai.eu.org` 添加 `A` 记录
2. 指向 GCP VM 公网 IP
3. 初次签发证书前，将记录设为 `DNS only`
4. 证书签发成功后，再决定是否切回代理

验证命令：

```bash
dig @8.8.8.8 +short vmq.minai.eu.org A
```

### 5.3 安装 Java 17

SSH 到目标 VM：

```bash
gcloud compute ssh geekfaka-sg \
  --project=project-15fbbfc1-0507-47d3-aae \
  --zone=asia-southeast1-b
```

安装运行时：

```bash
sudo apt-get update
sudo apt-get install -y openjdk-17-jre-headless nginx certbot python3-certbot-nginx
```

验证：

```bash
java -version
```

### 5.4 准备目录与文件

创建目录：

```bash
sudo mkdir -p /opt/vmq/{data,logs,apk}
sudo chown -R $USER:$USER /opt/vmq
```

上传文件：

- `vmq.war`
- `vmqApk-v2.0.9.apk`

目标位置：

```text
/opt/vmq/vmq.war
/opt/vmq/apk/vmqApk-v2.0.9.apk
```

### 5.5 创建 systemd 服务

创建 `/etc/systemd/system/vmq.service`：

```ini
[Unit]
Description=V免签 Java Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/vmq
ExecStart=/usr/bin/java -jar /opt/vmq/vmq.war --server.port=18080 --spring.datasource.url=jdbc:h2:file:/opt/vmq/data/mq
Restart=always
RestartSec=5
StandardOutput=append:/opt/vmq/logs/vmq.log
StandardError=append:/opt/vmq/logs/vmq.log

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable vmq.service
sudo systemctl start vmq.service
```

### 5.6 配置 Nginx 反代

创建 `/etc/nginx/sites-available/vmq.conf`：

```nginx
server {
    listen 80;
    server_name vmq.minai.eu.org;

    location = /vmqApk-v2.0.9.apk {
        alias /opt/vmq/apk/vmqApk-v2.0.9.apk;
        default_type application/vnd.android.package-archive;
    }

    location = / {
        proxy_pass http://127.0.0.1:18080/index.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:18080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.7 签发 HTTPS

执行：

```bash
sudo certbot --nginx \
  --non-interactive \
  --agree-tos \
  --redirect \
  -m tube25.us@gmail.com \
  -d vmq.minai.eu.org
```

### 5.8 配置发卡站接入

在 `GeekFaka` 中写入：

- `vmq_enabled=true`
- `vmq_base_url=https://vmq.minai.eu.org`
- `vmq_key=<与 V免签后台一致的通信密钥>`
- `vmq_channels=alipay,wxpay`
- `vmq_fee=0`

### 5.9 配置 V免签后台

后台中必须填写：

- 异步回调：`https://faka.minai.eu.org/api/payments/vmq/notify`
- 同步回调：`https://faka.minai.eu.org/`
- 通信密钥：与发卡站一致

二维码上传方式：

- 普通个人收款码应上传到系统设置页的微信码 / 支付宝码
- 不要走固定金额二维码库入口

### 5.10 配置监控端 APK

监控端配置要点：

- host 只填域名或域名端口，例如 `vmq.minai.eu.org`
- 不要填写 `vmq.minai.eu.org/admin`
- key 填 V免签后台一致的通信密钥
- 开启通知监听权限、关闭电池优化、允许自启动

### 5.11 联调验证

建议最小联调流程：

1. 发卡站发起 `0.01` 元订单
2. 选择 `vmq_wxpay` 或 `vmq_alipay`
3. 使用微信或支付宝扫码支付
4. 监控端监听到账通知
5. 监控端上报到 V免签
6. V免签 异步回调发卡站
7. 发卡站订单自动从 `PENDING` 变为 `PAID`

## 6. 关键线上产物与存放位置

- WAR：`/opt/vmq/vmq.war`
- H2 DB：`/opt/vmq/data/mq.mv.db`
- 日志：`/opt/vmq/logs/vmq.log`
- APK：`/opt/vmq/apk/vmqApk-v2.0.9.apk`
- systemd：`/etc/systemd/system/vmq.service`
- Nginx 站点：`/etc/nginx/sites-available/vmq.conf`
- 证书：`/etc/letsencrypt/live/vmq.minai.eu.org/`

## 7. 敏感配置项及其落点

以下信息存在生产环境，但不应写入仓库明文：

- V免签通信密钥
- 发卡站 `vmq_key`
- 发卡站管理员密码
- 服务器 SSH 私钥

实际落点：

- V免签后台数据库：H2 `mq.mv.db`
- 发卡站：`SystemSetting.vmq_key`

## 8. 实际遇到的问题与解决方案

### 8.1 Cloudflare 代理导致 Certbot 签证失败

- 原因：Cloudflare 代理拦住了回源校验
- 解决：先切 `DNS only`，签发成功后再按需切回代理

### 8.2 上传普通收款码时报“二维码金额有误”

- 原因：误走了固定金额二维码库入口
- 解决：改在系统设置页上传无金额通用码

### 8.3 保存二维码时报“请输入异步回调地址”

- 异步回调：`https://faka.minai.eu.org/api/payments/vmq/notify`
- 同步回调：`https://faka.minai.eu.org/`

### 8.4 监控端 host 填错成 `/admin`

- 原因：APK 实际调用的是 `http://host/appPush`
- 解决：host 只能填纯域名或域名端口

### 8.5 支付后订单一直停留在 `PENDING`

- 排查结果：监控端已上报，问题在 V免签 异步回调发卡站时收到 `HTTP 400`
- 根因：Java 版 V免签 对 `param` 的 URL 编码不稳定
- 解决：发卡站 `lib/payments/providers/vmq.ts` 改为传纯 ASCII 的 `orderNo` 作为 `param`

### 8.6 是否必须用真机

- 结论：不是必须
- 本次结果：已在模拟器环境中完成真实 `0.01` 元支付验证

## 9. 常用运维命令

```bash
sudo systemctl status vmq.service
sudo journalctl -u vmq.service -n 100 --no-pager
tail -n 100 /opt/vmq/logs/vmq.log
sudo systemctl restart vmq.service
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certificates
ss -lntp | grep 18080
```

## 10. 迁移到新 GCP 时的最小清单

- 一台 Debian 12 VM
- 公网 IP
- 一个 V免签域名
- Java 17
- Nginx + Certbot
- `vmq.war`
- `vmqApk-v2.0.9.apk`
- 发卡站已支持 `vmq` 渠道
- 发卡站与 V免签 使用同一通信密钥

## 11. 当前结论

- Java 版 V免签已经在 GCP 上稳定跑通基础服务
- 与 `GeekFaka` 的免签个人码收款链路已经完成闭环验证
- 后续如需迁移到新的 GCP，只要按本文档重做一遍，并保持通信密钥、回调地址、域名与发卡站配置一致，即可复现当前线上结果。
