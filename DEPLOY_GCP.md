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
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-east1"
export ZONE="asia-east1-b"
export INSTANCE_NAME="geekfaka-prod"
./deploy/gcp/create-vm.sh
```

创建完成后，把域名的 `A` 记录指向脚本输出的静态 IP。

## 3. Upload the current app

```bash
export PROJECT_ID="your-gcp-project-id"
export ZONE="asia-east1-b"
export INSTANCE_NAME="geekfaka-prod"
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
export PROJECT_ID="your-gcp-project-id"
export ZONE="asia-east1-b"
export INSTANCE_NAME="geekfaka-prod"
export DOMAIN="shop.example.com"
export LETSENCRYPT_EMAIL="you@example.com"
./deploy/gcp/remote-install.sh
```

## 6. First login and Alipay setup

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

## 7. Useful commands on the VM

```bash
cd /opt/OpenFaka
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f geekfaka
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f mysql
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
