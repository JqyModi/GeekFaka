#!/usr/bin/env bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl nginx certbot python3-certbot-nginx openjdk-17-jre-headless

systemctl enable --now nginx

mkdir -p /opt/vmq/{data,logs,apk}
chmod 755 /opt/vmq
