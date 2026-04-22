FROM php:7.4-fpm-bullseye

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libcurl4-openssl-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libonig-dev \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j"$(nproc)" \
    bcmath \
    curl \
    gd \
    mbstring \
    mysqli \
    pdo_mysql \
    zip \
  && rm -rf /var/lib/apt/lists/*

COPY php.ini /usr/local/etc/php/conf.d/zz-epay.ini

WORKDIR /var/www/html
