# GCP 发卡站单独发布手册

适用目标：把 `OpenFaka` 新代码发布到 `https://faka.minai.eu.org`，同时 **不改动** `vmq.minai.eu.org` 与 `epay.minai.eu.org` 服务本身。

## 影响范围

这套发布只会影响：

- `faka.minai.eu.org`
- GCP 实例 `geekfaka-sg`
- 目录 `/opt/OpenFaka`
- 容器 `geekfaka-app`
- 发卡站自己的数据库（由 `geekfaka-app` 启动时同步 schema）

这套发布 **不会直接改动**：

- `vmq.minai.eu.org`
- `epay.minai.eu.org`
- V免签 Java 服务
- EPay PHP 服务
- 它们各自的数据库或配置文件

## 为什么只发布发卡站就够

当前仓库的 `Dockerfile` 与 [docker-entrypoint.sh](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/docker-entrypoint.sh) 已经决定了：

- 新镜像启动时会等待发卡站数据库可用
- 然后执行：

```bash
prisma db push --accept-data-loss --skip-generate
```

也就是说，这次新增的：

- 商品 SEO 字段
- 文章 SEO 字段
- `ProductOpportunity`
- `ContentTask`

都会在 `geekfaka-app` 重启时自动同步到发卡站数据库。

## 发布前确认

先确认 `.env.production` 中这几个值正确：

```env
NEXT_PUBLIC_URL=https://faka.minai.eu.org
DATABASE_URL=...
```

并确认后台系统设置里至少这几个值正确：

- `site_url = https://faka.minai.eu.org`
- `vmq_base_url = https://vmq.minai.eu.org`
- `epay_api_url = https://epay.minai.eu.org/`

如果这些值已经正确，发布时通常不需要改 `vmq` / `epay`。

## 最小发布步骤

### 1. 本地上传代码到实例

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export ZONE="asia-southeast1-b"
export INSTANCE_NAME="geekfaka-sg"
bash ./deploy/gcp/push-app.sh
```

### 2. 在远端只重发卡站应用

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export ZONE="asia-southeast1-b"
export INSTANCE_NAME="geekfaka-sg"
bash ./deploy/gcp/redeploy-faka.sh
```

这一步实际做的事只有：

```bash
cd /opt/OpenFaka
docker compose -f docker-compose.prod.yml --env-file .env.production build geekfaka
docker compose -f docker-compose.prod.yml --env-file .env.production up -d geekfaka
```

注意：

- 不会执行 Nginx 证书重签发
- 不会重建 `vmq` / `epay`
- 不会碰 `mysql_data`

## 发布后检查

### 1. 容器状态

```bash
ssh -i ~/.ssh/id_rsa modi@34.21.174.131
cd /opt/OpenFaka
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

期望：

- `geekfaka-app` 为 `Up`
- `geekfaka-mysql` 为 `Up`

### 2. 发卡站前后台

```bash
curl -I https://faka.minai.eu.org
curl -I https://faka.minai.eu.org/admin
```

### 3. 新功能检查

- 后台是否出现“增长运营”
- 商品管理里是否出现：
  - `详情页 Slug`
  - `SEO 标题 / 描述 / 关键词`
  - `补货阈值`
- 前台商品详情页是否可访问：
  - `/products/<slug>`

### 4. 支付回归

至少用一个低价商品验证：

- 下单
- 跳转订单页
- 支付成功
- 自动发货

## 风险提示

- 当前 `docker-entrypoint.sh` 使用 `prisma db push --accept-data-loss`
- 这对“新增字段/新增表”是方便的，但如果后续出现删字段、改字段类型，就要先做备份和变更评估

对这次增长功能上线来说，主要是新增表和新增字段，风险相对可控。
