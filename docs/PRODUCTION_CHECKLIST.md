# OpenFaka 生产检查清单

本文档用于日常巡检、上线前后核对、重启后复查，以及交接时快速确认生产站点状态。

适用站点：

- 域名：`https://faka.minai.eu.org`
- 实例：`geekfaka-sg`
- 区域：`asia-southeast1-b`

## 1. 日常巡检

建议频率：

- 每天至少 1 次
- 每次支付配置变更后
- 每次重启实例或重建容器后

### 1.1 外部访问

检查项：

- 首页能打开
- 管理后台能打开
- HTTPS 证书正常
- 页面文字无乱码

命令：

```bash
curl -I https://faka.minai.eu.org
curl -I https://faka.minai.eu.org/admin
```

期望：

- 返回 `200`
- 不是 `502`
- 不是证书错误

### 1.2 容器状态

命令：

```bash
ssh -i ~/.ssh/id_rsa modi@34.21.174.131
cd /opt/OpenFaka
docker-compose -f docker-compose.prod.yml ps
```

期望：

- `geekfaka-app` 为 `Up`
- `geekfaka-mysql` 为 `Up`

### 1.3 应用日志

命令：

```bash
docker logs --tail 200 geekfaka-app
```

重点关注：

- `AlipayNotify`
- `OrderCreate`
- `OrderCheck`
- `Payment initiation failed`
- `JWT verification failed`

说明：

- `JWT verification failed` 在未登录后台或 Next 构建相关场景下偶尔出现，不一定是故障
- `AlipayNotify` 没有异常且能看到 `Received Alipay callback` 是正常信号

### 1.4 数据库日志

命令：

```bash
docker logs --tail 100 geekfaka-mysql
```

重点关注：

- 容器是否频繁重启
- 是否出现磁盘满、权限、损坏错误

### 1.5 支付闭环抽检

抽检方式：

- 用低价测试商品下单
- 打开订单页
- 完成支付宝支付
- 验证订单页是否自动切为成功
- 验证卡密是否自动发货

期望：

- 扫码后数秒内自动显示卡密
- 无需点击“我已支付，点击刷新”

### 1.6 上游货源同步

适用于启用了 API 货源的商品。

环境变量必须配置：

```bash
SUPPLIER_SECRET_KEY=一段独立的长随机字符串
SUPPLIER_SYNC_TOKEN=一段仅 cron 知道的长随机字符串
```

说明：

- `SUPPLIER_SECRET_KEY` 用于加密后台保存的上游 API Key，生产环境上线后不要随意更换
- `SUPPLIER_SYNC_TOKEN` 用于保护 `/api/suppliers/sync` 定时同步入口

手动触发全量货源同步：

```bash
curl -X POST \
  -H "Authorization: Bearer $SUPPLIER_SYNC_TOKEN" \
  https://faka.minai.eu.org/api/suppliers/sync
```

手动触发单个货源同步：

```bash
curl -X POST \
  -H "Authorization: Bearer $SUPPLIER_SYNC_TOKEN" \
  "https://faka.minai.eu.org/api/suppliers/sync?supplierId=供应商ID"
```

期望：

- 返回 JSON 中 `success` 为 `true`
- 后台「货源管理」中供应商健康状态不是 `ERROR`
- 已导入商品的库存和成本价跟随上游刷新
- 后台订单列表能看到供应商履约状态和上游订单号

建议 cron：

```bash
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer $SUPPLIER_SYNC_TOKEN" https://faka.minai.eu.org/api/suppliers/sync >/dev/null
```

## 2. 上线前检查

在修改代码、支付逻辑、订单页逻辑、Nginx 配置之前，先确认以下内容。

### 2.1 代码与配置

- 本地代码已保存
- 生产环境 `.env.production` 不会被覆盖为错误值
- 生产环境已配置 `SUPPLIER_SECRET_KEY` 和 `SUPPLIER_SYNC_TOKEN`
- 不会误删 `mysql_data`
- `.dockerignore` 存在

### 2.2 资源健康

- GCP 实例运行中
- SSH 可登录
- 磁盘空间充足
- 内存未长期打满

命令：

```bash
free -h
df -h
uptime
```

### 2.3 回滚准备

至少明确这三件事：

- 当前线上镜像是否还在本机可用
- 当前 `/opt/OpenFaka/.env.production` 已备份
- 当前 Nginx 配置已保留

## 3. 上线后检查

每次重新部署后，按顺序执行：

1. 检查容器状态
2. 检查首页与后台
3. 检查订单页前端 chunk 是否更新
4. 用测试商品下单
5. 完成一笔真实测试支付

### 3.1 基础检查

```bash
docker-compose -f docker-compose.prod.yml ps
curl -I https://faka.minai.eu.org
curl -I https://faka.minai.eu.org/admin
```

### 3.2 检查订单页是否引用了新前端 chunk

```bash
curl -s https://faka.minai.eu.org/orders/测试订单号 | grep -o '/_next/static/chunks/app/orders/%5BorderNo%5D/page-[^"]*js' | head -n 1
```

用途：

- 排查“源码改了但线上还是旧 JS”的问题

### 3.3 检查订单页前端 chunk 是否包含轮询

```bash
curl -s 'https://faka.minai.eu.org/_next/static/chunks/app/orders/%5BorderNo%5D/page-实际chunk名.js' | tr ';' '\n' | grep -n 'setInterval\|/api/orders/'
```

用途：

- 排查“支付成功后页面不自动刷新”的问题

## 4. 支付配置变更清单

每次修改支付宝后台配置或 OpenFaka 支付配置时，必须核对：

- `App ID` 正确
- 应用私钥正确
- 支付宝公钥正确
- 网关为 `https://openapi.alipay.com/gateway.do`
- 回调地址为 `https://faka.minai.eu.org/api/payments/alipay/notify`

变更后必须做一次真实小额测试支付。

## 5. 数据与库存检查

### 5.1 商品库存

确认：

- 测试商品是否还有库存
- 正式商品是否存在“已上架但库存为 0”
- API 货源商品是否存在“同步时间过旧但仍上架”
- API 货源商品是否存在“上游库存为 0 但本地仍显示可售”

### 5.2 订单状态

关注：

- 是否存在大量长期 `PENDING` 订单
- 是否存在支付成功但未发货订单
- 是否存在 `SupplierOrder` 状态为 `PARTIAL` 或 `FAILED` 的订单

如果发现异常，应立即对照故障响应手册排查。

## 6. 不要做的操作

- 不要直接删除 `mysql_data`
- 不要把真实密钥写进仓库
- 不要在未确认 DNS/证书状态前切回 Cloudflare 代理
- 不要在内存紧张时同时重建太多容器
- 不要误把应用公钥填到支付宝公钥位置

## 7. 巡检结论记录建议

每次巡检建议记录：

- 巡检时间
- 首页状态
- 后台状态
- HTTPS 状态
- 容器状态
- 最近支付回调是否正常
- 是否执行了真实支付抽检
- 是否发现异常
