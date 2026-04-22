# OpenFaka 故障响应手册

本文档用于线上故障时快速判断、分级、排查和恢复。

适用环境：

- 域名：`faka.minai.eu.org`
- 实例：`geekfaka-sg`
- 目录：`/opt/OpenFaka`

## 1. 故障分级

### P1

满足任一情况：

- 整站不可访问
- 支付无法创建
- 支付成功但订单普遍不发货
- 后台无法登录且无法修复配置

### P2

满足任一情况：

- 首页可打开，但订单页异常
- 只有部分支付不回调
- 商品名称乱码
- 个别订单状态异常

### P3

满足任一情况：

- 日志告警但业务未中断
- 后台个别页面显示异常
- 测试商品库存问题

## 2. 首次响应流程

发生故障后，先做这 5 步：

1. 确认影响范围
2. 确认是访问问题、支付问题还是发货问题
3. 检查容器状态
4. 检查应用日志
5. 检查最近一次改动

## 3. 整站不可访问

现象：

- 浏览器打不开
- `curl` 返回超时或 `502`

### 3.1 检查站点响应

```bash
curl -I https://faka.minai.eu.org
curl -I https://faka.minai.eu.org/admin
```

### 3.2 检查容器

```bash
ssh -i ~/.ssh/id_rsa modi@34.21.174.131
cd /opt/OpenFaka
docker-compose -f docker-compose.prod.yml ps
```

处理：

- 如果 `geekfaka-app` 不在 `Up`，先看应用日志
- 如果 `geekfaka-mysql` 不在 `Up`，先恢复数据库容器

### 3.3 检查应用日志

```bash
docker logs --tail 200 geekfaka-app
```

### 3.4 检查宿主机

```bash
free -h
df -h
uptime
```

如果机器卡死：

- 优先通过 SSH 检查资源
- SSH 不通时考虑重启实例

GCP 重启：

```bash
gcloud compute instances reset geekfaka-sg \
  --zone=asia-southeast1-b \
  --project=project-15fbbfc1-0507-47d3-aae
```

## 4. 支付创建失败

现象：

- 下单后无法展示二维码
- 后台日志出现 `Payment initiation failed`

### 4.1 查看应用日志

```bash
docker logs --tail 200 geekfaka-app
```

重点错误：

- `验签出错`
- `商户协议状态非正常状态`
- `DECODER routines::unsupported`

### 4.2 常见原因

#### 密钥不匹配

表现：

- `验签出错`

处理：

- 核对 `App ID`
- 核对应用私钥
- 核对支付宝公钥

#### 商户协议状态异常

表现：

- `商户协议状态非正常状态`

处理：

- 到支付宝开放平台确认当面付开通和签约状态

#### 私钥格式错误

表现：

- `DECODER routines::unsupported`

处理：

- 重新粘贴 PEM 格式私钥
- 确认没有多余空格、错误换行、错误头尾

## 5. 支付成功但没有自动发货

现象：

- 用户已支付
- 订单仍停留在 `PENDING`
- 没有卡密展示

### 5.1 先判断是“回调没到”还是“前端没刷新”

看日志：

```bash
docker logs --tail 300 geekfaka-app
```

如果能看到：

- `Received Alipay callback`

说明：

- 回调已到
- 优先怀疑前端未刷新或订单页跑旧 JS

如果看不到：

- 优先怀疑支付宝通知未打到站点

### 5.2 查订单状态

```bash
curl -s https://faka.minai.eu.org/api/orders/订单号
```

如果返回：

- `status = PAID`

说明：

- 服务端已完成发货
- 问题在前端页面状态未更新

### 5.3 查前端 chunk 是否包含轮询

先拿订单页当前 chunk：

```bash
curl -s https://faka.minai.eu.org/orders/订单号 | grep -o '/_next/static/chunks/app/orders/%5BorderNo%5D/page-[^"]*js' | head -n 1
```

再查 chunk 内容：

```bash
curl -s 'https://faka.minai.eu.org/_next/static/chunks/app/orders/%5BorderNo%5D/page-实际chunk名.js' | tr ';' '\n' | grep -n 'setInterval\|/api/orders/'
```

如果没有 `setInterval`：

- 说明线上仍是旧前端构建
- 需要重新完整构建并替换容器

## 6. 页面乱码

现象：

- 首页商品或分类名称显示乱码

原因：

- 数据导入时使用了错误字符集

排查方向：

- 查数据库中商品/分类的真实值
- 确认 MySQL 会话字符集是否为 `utf8mb4`

说明：

- 本次已修复过一次历史乱码问题
- 后续导入中文数据时必须统一按 `utf8mb4`

## 7. 订单页不自动刷新

现象：

- 支付后必须手动点击“我已支付，点击刷新”

排查顺序：

1. 查订单服务端状态是否已 `PAID`
2. 查支付宝回调是否到达
3. 查订单页前端 chunk 是否包含轮询
4. 查浏览器是否仍缓存旧页面

处理：

- 强制刷新页面
- 重新打开订单页
- 如线上仍是旧 chunk，重新部署前端容器

## 8. 重新部署

### 8.1 常规重发

```bash
cd /opt/OpenFaka
docker-compose -f docker-compose.prod.yml build geekfaka
docker-compose -f docker-compose.prod.yml up -d --force-recreate geekfaka
```

### 8.2 重发后验证

```bash
docker-compose -f docker-compose.prod.yml ps
curl -I https://faka.minai.eu.org
```

### 8.3 注意事项

- 服务名是 `geekfaka`，不是 `app`
- 容器名是 `geekfaka-app`
- 如果构建报 `mysql_data` 权限问题，先检查 `.dockerignore`

## 9. 实例重启的触发条件

只有在这些情况下才建议重启实例：

- SSH 都明显卡死
- 应用与数据库容器无法拉起
- 系统资源异常且短时间无法自行恢复

重启前要知道：

- 这会中断当前请求
- 订单页会短暂不可访问

## 10. 响应完成后的复盘记录

每次故障处理完成后，建议记录：

- 故障开始时间
- 故障结束时间
- 影响范围
- 根因
- 临时止血动作
- 最终修复动作
- 是否需要补充文档或脚本

## 11. 快速命令索引

查看容器：

```bash
docker-compose -f docker-compose.prod.yml ps
```

看应用日志：

```bash
docker logs --tail 200 geekfaka-app
```

看数据库日志：

```bash
docker logs --tail 100 geekfaka-mysql
```

查订单状态：

```bash
curl -s https://faka.minai.eu.org/api/orders/订单号
```

检查订单页 chunk：

```bash
curl -s https://faka.minai.eu.org/orders/订单号 | grep -o '/_next/static/chunks/app/orders/%5BorderNo%5D/page-[^"]*js' | head -n 1
```

实例重启：

```bash
gcloud compute instances reset geekfaka-sg \
  --zone=asia-southeast1-b \
  --project=project-15fbbfc1-0507-47d3-aae
```

