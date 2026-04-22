# 发卡系统对接 V 免签方案判断

记录时间：2026-04-21

## 结论

当前发卡系统已有 `PaymentAdapter` 支付抽象，V 免签应新增为独立直连渠道 `vmq`，不要复用现有 `epay` 适配器。

推荐路线：

1. 新增 `lib/payments/providers/vmq.ts`，按直连方式调用 V 免签 `/createOrder`。
2. 新增 `/api/payments/vmq/notify`，独立验证 V 免签回调签名，验签通过后调用 `fulfillPaidOrder(orderNo, "vmq")`。
3. 后台新增 `vmq_*` 配置项，前台支付渠道新增“支付宝个人码 / 微信个人码”。
4. 订单页支持 `provider=vmq` 的二维码展示，并显示 V 免签返回的 `reallyPrice`，避免用户按原价付款导致无法匹配。
5. 若要支持“我已支付，点击刷新”主动查单，需要保存 V 免签返回的 `orderId`，建议给订单表补充支付上游订单号字段。

## 为什么不走已有易支付对接

现有 `EpayProvider` 对接的是易支付兼容网关，字段和语义是：

- 下单字段：`pid`、`type`、`out_trade_no`、`notify_url`、`return_url`、`name`、`money`、`sign_type`。
- 回调字段：`out_trade_no`、`trade_no`、`trade_status`、`sign`。
- 签名：按易支付参数排序后追加商户密钥，支持 MD5/RSA。
- 查单：通过 `api.php?act=order&pid=...&out_trade_no=...`。

V 免签字段和语义不同：

- 下单接口：`/createOrder`。
- 下单字段：`payId`、`type`、`price`、`param`、`notifyUrl`、`returnUrl`、`isHtml`、`sign`。
- 创建签名：`md5(payId + param + type + price + key)`。
- 回调字段：`payId`、`param`、`type`、`price`、`reallyPrice`、`sign`。
- 回调签名：`md5(payId + param + type + price + reallyPrice + key)`。
- 金额匹配重点是 `reallyPrice`，不是商品原价 `price`。

如果强行塞进 `EpayProvider`，需要在一个 provider 内分支处理两套完全不同协议，会导致：

- `epay` 名称和后台配置含义失真。
- 回调路由和验签逻辑混杂，排障困难。
- `queryStatus` 语义不一致，V 免签查单通常需要服务端返回的 V 免签 `orderId`，不是本地 `orderNo`。
- 未来保留真正易支付接口时容易互相污染。

因此 V 免签更像“支付宝当面付”的直连 adapter，而不是易支付子渠道。

## 源码现状

已确认的关键文件：

- `lib/payments/types.ts`：定义 `PaymentAdapter`、`PaymentIntent`、`PaymentCallbackData`、`PaymentStatus`。
- `lib/payments/registry.ts`：注册 `alipay`、`epay` adapter。
- `lib/payments/providers/alipay.ts`：官方支付宝当面付直连实现。
- `lib/payments/providers/epay.ts`：易支付兼容网关实现。
- `app/api/orders/create/route.ts`：创建本地订单后调用 `adapter.createPayment()`。
- `app/api/payments/alipay/notify/route.ts`：支付宝回调后发货。
- `app/api/payments/epay/notify/route.ts`：易支付回调后发货。
- `app/api/config/payments/route.ts`：返回前台可选支付渠道。
- `components/store-front.tsx`：选择支付渠道并提交 `paymentMethod=provider`、`options.channel=channel`。
- `app/orders/[orderNo]/page.tsx`：展示二维码并轮询订单状态。
- `app/api/orders/[orderNo]/check/route.ts`：调用 adapter `queryStatus()` 主动查单。
- `lib/orders/fulfill-order.ts`：支付成功后的幂等发货逻辑。

## 最小可落地改造

不改数据库也能先跑通异步回调：

1. 新增 `VmqProvider`：
   - 配置项：`vmq_enabled`、`vmq_base_url`、`vmq_key`、`site_url`。
   - `createPayment(orderNo, amount, description, options)`：
     - `payId = orderNo`
     - `price = amount.toFixed(2)`
     - `type = 2` 表示支付宝，`type = 1` 表示微信。
     - `notifyUrl = site_url + "/api/payments/vmq/notify"`
     - `returnUrl = site_url + "/orders/" + orderNo`
     - 返回 `qrCode = data.payUrl`，`payUrl = vmq pay page`，`transactionId = data.orderId`。
   - `verifyCallback(data)`：
     - 验签 `payId + param + type + price + reallyPrice + key`
     - `orderNo = payId`
     - 验签通过即返回 `PaymentStatus.PAID`。
2. 新增 `app/api/payments/vmq/notify/route.ts`：
   - 支持 GET/POST。
   - 验签成功后调用 `fulfillPaidOrder(callbackData.orderNo, "vmq")`。
   - 返回纯文本 `success`。
3. `registry.ts` 注册 `VmqProvider`。
4. `app/api/config/payments/route.ts` 增加 V 免签渠道：
   - `vmq_alipay`：支付宝个人码，provider 为 `vmq`。
   - `vmq_wxpay`：微信个人码，provider 为 `vmq`。
5. `components/store-front.tsx` 传递 V 免签渠道：
   - `vmq_alipay -> options.channel = "alipay"`
   - `vmq_wxpay -> options.channel = "wxpay"`
6. `app/orders/[orderNo]/page.tsx` 支持 `paymentProvider === "vmq"` 显示二维码。

这个方案依赖异步回调自动发货，订单页 3 秒轮询数据库即可看到状态变化。

## 推荐增强改造

为了生产可用，建议在最小方案基础上加数据库字段：

- `paymentTradeNo`：保存 V 免签返回的 `orderId`，用于主动查单。
- `paymentAmount`：保存 V 免签返回的 `reallyPrice`，用于订单页明确提示用户实际付款金额。
- `paymentChannel`：保存 `alipay` / `wxpay`，便于后台排障。

原因：

- V 免签为了区分同金额订单，可能要求用户支付 `reallyPrice`，例如 `0.01`、`0.02` 这类偏移金额。
- 当前订单表只有 `totalAmount` 和 `paymentMethod`，无法可靠保存上游订单号和实际支付金额。
- 当前“我已支付，点击刷新”调用 `adapter.queryStatus(orderNo)`；V 免签查单更适合用它返回的 `orderId`，不是本地业务订单号。

如果先不改数据库，可以保留按钮但 V 免签不实现 `queryStatus()`，用户付款后依靠监控端回调和页面轮询完成发货。

## 后台配置建议

新增一个“V 免签（个人码）”支付渠道，配置项：

- `vmq_enabled`：是否启用。
- `vmq_base_url`：V 免签服务地址，例如 `https://pay.example.com`。
- `vmq_key`：V 免签通信密钥，对应 V 免签后台 key。
- `vmq_channels`：启用子渠道，建议取值 `alipay,wxpay`。
- `vmq_fee`：前台展示手续费，可选。

部署到 GCP 时，`site_url` 必须是公网 HTTPS 域名，否则 V 免签服务无法回调发卡站。

## 与本地 V 免签验证环境的对应关系

本地 V 免签已验证通过：

- V 免签服务：`http://127.0.0.1:18080`
- notify URL 测试：`http://127.0.0.1:19001/notify`
- 发卡系统未来本地测试时应设置：
  - `vmq_base_url=http://127.0.0.1:18080`
  - `site_url=http://127.0.0.1:<发卡系统端口>`
  - V 免签 `notifyUrl` 自动生成到 `/api/payments/vmq/notify`

## 下一步实现建议

先做“推荐增强改造”，一次性解决 V 免签最关键的两个问题：实际支付金额展示和主动查单。

实现顺序：

1. Prisma `Order` 增加支付上游字段并生成迁移。
2. 新增 `VmqProvider` 和 notify route。
3. 前台渠道配置和订单页支持 V 免签二维码与实际金额展示。
4. 后台设置页加入 V 免签配置。
5. 本地用已部署的 `qrpay/runtime/vmq-java-temp` 发起 0.01 订单，确认回调能自动发卡。

## 2026-04-21 实施记录

已完成代码接入：

- 新增 `lib/payments/providers/vmq.ts`：
  - 调用 V 免签 `/createOrder`。
  - 下单签名：`md5(payId + param + type + price + key)`。
  - 回调验签：`md5(payId + param + type + price + reallyPrice + key)`。
  - 回调验签后继续校验 `reallyPrice` 与本地订单 `paymentAmount` 一致，避免错误金额触发发货。
  - 支持 `alipay -> type=2`、`wxpay -> type=1`。
  - 返回 `qrCode=payUrl`、`payUrl=/payPage/pay.html?orderId=...`、`displayAmount=reallyPrice`。
- 新增 `/api/payments/vmq/notify`：
  - 支持 GET/POST。
  - 验签成功后调用 `fulfillPaidOrder(orderNo, "vmq")`。
  - 返回 V 免签期望的纯文本 `success`。
- `lib/payments/registry.ts` 注册 `vmq`。
- `app/api/config/payments/route.ts` 增加前台渠道：
  - `vmq_alipay`：支付宝个人码。
  - `vmq_wxpay`：微信个人码。
- `components/store-front.tsx`：
  - 将 `vmq_alipay/vmq_wxpay` 映射为 V 免签需要的 `alipay/wxpay`。
  - 下单后把 `payAmount` 带到订单页。
- `app/orders/[orderNo]/page.tsx`：
  - 支持 `provider=vmq` 展示二维码。
  - 显示 V 免签 `reallyPrice`，并提示按实付金额付款。
- 后台设置页新增 “V免签个人码” 配置入口：
  - `vmq_enabled`
  - `vmq_channels`
  - `vmq_fee`
  - `vmq_base_url`
  - `vmq_key`
- `prisma/schema.prisma` 的 `Order` 增加：
  - `paymentChannel`
  - `paymentTradeNo`
  - `paymentAmount`

验证结果：

- `npx prisma generate`：通过。
- `npx tsc --noEmit`：通过。
- `npm run build`：通过。
- `npm run lint`：未进入代码检查，失败原因是当前 `eslint.config.mjs` 引用了 ESLint 8 不导出的 `eslint/config` 子路径，属于现有工具链配置问题。

数据库同步：

当前 shell 未设置 `DATABASE_URL`，所以没有直接执行 `prisma db push`。本地或 GCP 部署时需要在正确数据库环境下执行：

```bash
DATABASE_URL="file:./prisma/prod.db" npx prisma db push
npx prisma generate
```

如果已有生产 SQLite 文件，`DATABASE_URL` 应指向真实数据库文件，例如：

```bash
DATABASE_URL="file:/app/data/prod.db" npx prisma db push
```

## 2026-04-21 GCP 发卡站部署记录

目标环境：

- GCP project：`project-15fbbfc1-0507-47d3-aae`
- VM：`geekfaka-sg`
- Zone：`asia-southeast1-b`
- 公网域名：`https://faka.minai.eu.org`
- 远端目录：`/opt/OpenFaka`
- 容器：`geekfaka-app`、`geekfaka-mysql`

部署方式：

- 使用本地源码打包上传。
- 排除 `.git`、`.next`、`node_modules`、`mysql_data`、`qrpay/runtime`、`qrpay/repos` 等本地运行产物。
- 远端保留 `.env.production` 和 `mysql_data`。
- 远端源码备份后，通过 `docker-compose --env-file .env.production -f docker-compose.prod.yml up -d --build` 重建。

远端备份：

- 部署脚本在 `/opt` 下生成了 `OpenFaka-backup-<时间戳>.tgz`。

验证结果：

- Docker 镜像构建通过。
- `geekfaka-app` 启动成功。
- 启动日志显示 `prisma db push` 已将数据库同步到最新 schema。
- MySQL 已确认新增订单字段：
  - `paymentAmount`
  - `paymentChannel`
  - `paymentTradeNo`
- 公网页面 `https://faka.minai.eu.org` 返回 HTTP 200。
- `https://faka.minai.eu.org/api/config/payments` 正常返回现有支付渠道。
- 当前生产环境尚未启用 V 免签渠道，因为后台还没有配置 `vmq_enabled`、`vmq_base_url`、`vmq_key`。

部署中遇到的问题：

- 远端 VM 当前使用旧式 `docker-compose`，不是 `docker compose` 插件命令。
- 首次执行 `sudo docker compose ...` 失败，改用 `sudo docker-compose ...` 后正常重建。
- Next.js build 阶段仍会输出 cookies 动态渲染和构建期数据库不可达日志，这与本地验证一致，不影响最终 build 和运行。

下一步：

部署 V 免签服务到 GCP 后，在发卡后台配置：

- `vmq_enabled=true`
- `vmq_base_url=<V免签公网或内网服务地址>`
- `vmq_key=<V免签通信密钥>`
- `vmq_channels=alipay,wxpay`

## 2026-04-21 GCP V免签部署记录

目标：

- 子域名：`vmq.minai.eu.org`
- 复用 VM：`geekfaka-sg`
- V免签目录：`/opt/vmq`
- Java 服务端口：`127.0.0.1:18080`
- systemd 服务：`vmq.service`
- H2 数据库：`/opt/vmq/data/mq.mv.db`
- APK：`/opt/vmq/apk/vmqApk-v2.0.9.apk`

已完成：

- 安装 `openjdk-17-jre-headless`。
- 上传 `vmq.war` 到 `/opt/vmq/vmq.war`。
- 上传监控端 APK 到 `/opt/vmq/apk/vmqApk-v2.0.9.apk`。
- 创建 systemd 服务 `/etc/systemd/system/vmq.service`。
- `vmq.service` 已启用开机自启并处于 `active` 状态。
- 本机验证通过：
  - `http://127.0.0.1:18080/index.html` 返回 V免签页面。
  - Nginx 使用 `Host: vmq.minai.eu.org` 反代到 V免签成功。
  - `http://vmq.minai.eu.org/` 在强制解析到 `34.21.174.131` 时可返回 V免签页面。
- Nginx 配置：
  - `/` 代理到 V免签 `index.html`。
  - `/vmqApk-v2.0.9.apk` 指向监控端 APK。
  - 其他路径反代到 `127.0.0.1:18080`。

后续结果：

- Cloudflare DNS 已修正为回源到 `34.21.174.131`。
- `dig @8.8.8.8 +short vmq.minai.eu.org A` 已返回 `34.21.174.131`。
- `certbot --nginx -d vmq.minai.eu.org` 已成功签发 HTTPS。
- 证书路径：
  - `/etc/letsencrypt/live/vmq.minai.eu.org/fullchain.pem`
  - `/etc/letsencrypt/live/vmq.minai.eu.org/privkey.pem`
- 证书到期时间：`2026-07-20`
- 公网验证通过：
  - `https://vmq.minai.eu.org/` 返回 200
  - `https://vmq.minai.eu.org/vmqApk-v2.0.9.apk` 可下载监控端 APK

发卡站生产配置已写入：

- `vmq_enabled=true`
- `vmq_base_url=https://vmq.minai.eu.org`
- `vmq_key` 已从默认值改为自定义密钥，不在文档中明文记录
- `vmq_channels=alipay,wxpay`
- `vmq_fee=0`

验证结果：

- `https://faka.minai.eu.org/api/config/payments` 已返回：
  - `vmq_alipay`
  - `vmq_wxpay`

当前线上状态：

- 发卡站：`https://faka.minai.eu.org`
- V免签：`https://vmq.minai.eu.org`
- 生产环境已不再使用默认 V免签通信密钥

联调补充结论：

- 模拟器内微信到账通知已经可以被监控端捕获，说明“通知监听 -> 监控端上报”链路是通的。
- 一次真实 `0.01` 元联调中，V免签 Java 服务端首次异步回调返回了 `HTTP 400`，但问题不在签名、金额或库存。
- 根因是 Java 版 V免签 在异步回调时对 `param` 的 URL 编码不稳定，若下单时传入中文商品名或空格，可能把回调 URL 拼坏，导致发卡站拒收。
- 已在发卡站 `VmqProvider` 中调整为向 V免签 传递纯 ASCII 的 `orderNo` 作为 `param`，避免后续真实支付时首次自动回调失败。

剩余建议：

- 保持 V免签 后台、监控端 APK、发卡站三处通信密钥一致。
- 新订单应使用修复后的版本重新发起，再做一次真实 `0.01` 元联调。
- 若后续要迁移 PHP 版，也要优先验证其回调对 `param` 的 URL 编码是否稳定。

## 2026-04-22 全链路联调完成记录

最终结果：

- 发卡站下单、V免签建单、模拟器微信付款、监控端上报、V免签异步回调、发卡站自动发货，这条链路已经全部跑通。
- 本轮验证说明当前方案在“免签 + 个人收款码 + 自动回调”目标下可落地，后续可基于此迁移到新的 GCP 环境。

关键执行步骤：

1. 在发卡站接入独立 `vmq` 支付适配器，不复用 `epay`。
2. 部署 Java 版 V免签到 `vmq.minai.eu.org`，通过 Nginx 反代并签发 HTTPS。
3. 在发卡站后台写入：
   - `vmq_enabled=true`
   - `vmq_base_url=https://vmq.minai.eu.org`
   - `vmq_key=<与 V免签后台一致的通信密钥>`
   - `vmq_channels=alipay,wxpay`
4. 在 V免签后台“系统设置”中填写：
   - 异步回调：`https://faka.minai.eu.org/api/payments/vmq/notify`
   - 同步回调：`https://faka.minai.eu.org/`
   - 通信密钥：与发卡站一致
5. 上传的是“无金额通用收款码”，入口为后台设置页的微信码/支付宝码，不是固定金额二维码库。
6. 在模拟器或真机安装监控端 APK，配置：
   - host 只填域名或域名端口，不要带 `/admin`
   - key 填与 V免签后台一致的通信密钥
7. 发起真实 `0.01` 元订单后，用微信扫码支付，等待监控端监听到账通知并自动上报。

本轮遇到的主要问题与解决方案：

- 问题：上传二维码时报“二维码金额有误”。
  - 原因：走到了固定金额二维码库页面，这个页面要求每张码手动填写金额。
  - 解决：改为在系统设置页上传“无金额通用收款码”。

- 问题：保存二维码时报“请输入异步回调地址”。
  - 解决：异步回调填 `https://faka.minai.eu.org/api/payments/vmq/notify`，同步回调填 `https://faka.minai.eu.org/`。

- 问题：模拟器微信付款后，通知栏已收到到账通知，但发卡订单一直 `PENDING`。
  - 初始现象：前端轮询正常，但订单状态没有变化，点击“我已支付”也仍是未支付。
  - 排查结果：监控端实际上已经把到账通知推送到 V免签，问题不在监听链路，而在 V免签调用发卡站异步回调时收到 `HTTP 400`。
  - 根因：Java 版 V免签对 `param` 的 URL 编码不稳定；下单时若把中文商品名和空格传入 `param`，首次异步回调 URL 可能被拼坏，导致发卡站拒收。
  - 解决：将发卡站传给 V免签 的 `param` 改为纯 ASCII 的 `orderNo`，避免编码问题。
  - 修复位置：`lib/payments/providers/vmq.ts`

- 问题：怀疑是监控端没配置好，是否必须换真机。
  - 结论：不是必须。只要模拟器里的微信到账通知能被监控端读取，模拟器也可以完成联调。
  - 当前结论：本次就是在模拟器环境下完整跑通的。

- 问题：GCP 部署时命令不兼容。
  - 原因：远端 VM 用的是旧式 `docker-compose`，不是 `docker compose`。
  - 解决：统一改为 `docker-compose --env-file .env.production -f docker-compose.prod.yml ...`

- 问题：V免签 HTTPS 证书签发失败。
  - 原因：Cloudflare 代理返回 `522`，Certbot 无法回源验证。
  - 解决：先把 `vmq.minai.eu.org` 设为 `DNS only`，签完证书后再按需切回代理。

回溯时建议优先检查的地方：

- 发卡站 `SystemSetting` 中的 `vmq_key` 是否与 V免签后台、监控端一致。
- V免签后台上传的是不是“无金额通用码”而不是二维码金额库。
- 监控端 host 是否错误填写成了 `vmq.minai.eu.org/admin`。
- 发卡站创建订单传给 V免签 的 `param` 是否仍为纯 ASCII。
- 生产环境是否仍然使用 `docker-compose` 而非 `docker compose`。

迁移到新的 GCP 时的最小清单：

- 一台可运行 Docker 的 Linux VM，用于部署 OpenFaka。
- 一台或同机部署的 Java 17 运行环境，用于运行 V免签 `vmq.war`。
- 两个域名：
  - 发卡站，例如 `faka.example.com`
  - V免签，例如 `vmq.example.com`
- 两个 HTTPS 证书，确保：
  - 发卡站可被 V免签公网回调访问
  - V免签可被监控端和用户支付页正常访问
- 同步以下配置：
  - OpenFaka 的 `vmq_*`
  - V免签后台回调地址
  - 监控端 host/key

当前结论：

- 这套方案已经完成本地到线上、从部署到真实支付联调的闭环验证。
- 后续若要接发卡业务，只需要基于现有 `vmq` 渠道继续做商品、模板、售后和运营层配置，不需要再重做支付链路基础设施。
