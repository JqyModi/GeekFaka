# GeekFaka on GCP

## 1. Install Google Cloud CLI

Google Cloud 有官方命令行工具 `gcloud`。官方安装文档：
- https://cloud.google.com/sdk/docs/install-sdk

完成安装后执行：

```bash
gcloud init
gcloud auth login
gcloud auth application-default login
```

## 2. Create the VM

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export REGION="asia-southeast1"
export ZONE="asia-southeast1-b"
export INSTANCE_NAME="geekfaka-sg"
./deploy/gcp/create-vm.sh
```

创建完成后，把域名的 `A` 记录指向脚本输出的静态 IP。

## 3. Upload the current app

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export ZONE="asia-southeast1-b"
export INSTANCE_NAME="geekfaka-sg"
./deploy/gcp/push-app.sh
```

## 4. Prepare production env on the VM

先 SSH 到 VM：

```bash
gcloud compute ssh "${INSTANCE_NAME}" --zone "${ZONE}"
```

然后编辑：

```bash
cd /opt/OpenFaka
cp .env.production.example .env.production
vim .env.production
```

必须至少修改：
- `NEXT_PUBLIC_URL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `COUPON_API_KEY`

## 5. Install the app and enable HTTPS

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export ZONE="asia-southeast1-b"
export INSTANCE_NAME="geekfaka-sg"
export DOMAIN="faka.minai.eu.org"
export LETSENCRYPT_EMAIL="you@example.com"
./deploy/gcp/remote-install.sh
```

## 6. Faka App-Only Rollout

如果只是发布发卡站新代码，不重做 HTTPS、不改 Nginx、不碰 `vmq/epay`：

```bash
export PROJECT_ID="project-15fbbfc1-0507-47d3-aae"
export ZONE="asia-southeast1-b"
export INSTANCE_NAME="geekfaka-sg"
bash ./deploy/gcp/push-app.sh
bash ./deploy/gcp/redeploy-faka.sh
```

详细说明见：

- [docs/GCP_FAKA_APP_ONLY_ROLLOUT.md](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/docs/GCP_FAKA_APP_ONLY_ROLLOUT.md)

## 7. First login and Alipay setup

后台地址：

```text
https://你的域名/admin
```

登录后：
- 在“站点设置”里把 `网站 URL` 配成 `https://你的域名`
- 在“支付渠道 -> 支付宝当面付”中填写：
- `App ID`
- `应用私钥`
- `支付宝公钥`
- `网关地址` 保持 `https://openapi.alipay.com/gateway.do`

支付宝异步通知地址：

```text
https://你的域名/api/payments/alipay/notify
```

## 8. Useful commands on the VM

```bash
cd /opt/OpenFaka
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f geekfaka
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f mysql
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
