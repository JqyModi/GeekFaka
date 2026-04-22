#!/usr/bin/env bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y git curl nginx certbot python3-certbot-nginx docker.io docker-compose

systemctl enable --now docker
systemctl enable --now nginx

mkdir -p /opt/epay
chmod 755 /opt/epay
