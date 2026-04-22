# GCP 部署版本选择：Java 版还是 PHP 版

目标：本地验证成功后部署到 GCP，再与发卡系统对接，实现个人收款码直收和自动回调。

## 结论

如果目标是最快、最少组件、低成本部署到 GCP，建议继续使用 Java 版。

如果目标是使用原版 `/example` 页面、方便按传统 PHP 虚拟主机方式部署、未来可能直接复用 PHP 项目结构，PHP 版也可以，但它不是当前阶段的最优解。

当前推荐：

```text
GCP 一期：Java 版 Vmq + H2/持久磁盘 + HTTPS 反代
后续业务：发卡系统直接对接 /createOrder 和 /notify
```

## 为什么本地先选 Java 版

本机环境现状：

- 有 Java 21
- 没有 PHP
- 没有 Composer
- 没有 MySQL
- 没有 Nginx
- 没有 Docker

Java 版优势：

- 一个 `war` 包即可启动
- 内置 H2 数据库
- 不需要 MySQL
- 不需要 PHP-FPM
- 本地验证成本最低
- 已经完成端到端验证

PHP 版优势：

- 有 `/example` 测试页面
- 与很多传统虚拟主机/宝塔面板部署习惯一致
- 更容易直接改页面、改 PHP 回调示例
- 如果未来发卡系统也是 PHP 技术栈，阅读和二开门槛可能更低

## GCP 上 Java 版是否合适

合适，尤其适合一期验证。

推荐部署方式：

```text
GCE e2-micro/e2-small
Ubuntu
Java 17 或 21
systemd 托管 vmq.war
H2 数据库放持久磁盘目录
Caddy/Nginx 做 HTTPS 反向代理
```

优点：

- 架构简单
- 组件少
- 运维成本低
- 服务端和本地验证环境一致
- 更容易排查问题

风险：

- H2 不适合高并发或多实例
- 老项目代码缺少现代安全加固
- 后台管理、密钥、回调地址需要额外保护
- 如果 GCE 重启，必须确保 systemd 自动拉起

适合场景：

- 单人自用
- 低频订单
- 验证发卡系统对接
- MVP 阶段

## GCP 上 PHP 版是否更合适

不一定。

PHP 版部署到 GCP 通常需要：

```text
GCE
Nginx/Apache
PHP-FPM
MySQL/MariaDB
伪静态规则
目录权限
数据库备份
```

如果你已经有宝塔、LNMP 或 PHP 运维习惯，PHP 版会比较熟悉。但从“少组件、快速上线、降低变量”角度，PHP 版比 Java 版更重。

PHP 版适合：

- 明确要保留 `/example`
- 明确要在 PHP 项目里二开
- 服务器已有 LNMP
- 发卡系统和支付网关都准备放在同一个 PHP/Nginx 栈里

PHP 版不适合：

- 当前只想尽快上线验证
- 不想维护 MySQL
- 不想处理伪静态/PHP-FPM/目录权限
- 想保持和本地验证环境一致

## 发卡系统对接角度

发卡系统对接并不依赖 PHP 版。

核心接口只有：

```text
/createOrder
/getOrder
/checkOrder
/appPush
/appHeart
```

发卡系统只需要做：

1. 生成商户订单号 `payId`
2. 调用 `/createOrder`
3. 展示返回的 `payUrl` 和 `reallyPrice`
4. 接收 `/notify`
5. 验签
6. 发货

所以发卡系统无论是 Next.js、PHP、Go、Java，都可以对接 Java 版 Vmq。

## 推荐 GCP 一期架构

```text
用户浏览器
  -> 发卡系统
  -> 调用 Vmq /createOrder
  -> 展示支付二维码和实际金额

安卓监控端
  -> 监听微信/支付宝到账通知
  -> 调用 Vmq /appPush
  -> Vmq 匹配订单
  -> Vmq 调用发卡系统 /notify
  -> 发卡系统验签发货
```

部署建议：

- Vmq 独立子域名：`pay.example.com`
- 发卡系统独立子域名：`card.example.com`
- HTTPS 必须开启
- Vmq 后台路径加额外 Basic Auth 或限制 IP
- 通讯密钥改成高强度随机值
- H2 数据库每日备份
- systemd 自动重启

## 生产风险和补救

### 漏通知

原因：

- 监控端被杀
- 安卓通知权限变化
- 微信/支付宝通知格式变化
- 网络断开

补救：

- 店员账号独立设备或稳定模拟器
- 后台白名单/自启动/锁屏显示
- 失败重试
- 人工补单后台
- 账单对账脚本

### 金额撞单

V免签通过 `reallyPrice` 做金额区分，并支持分角递增/递减。

建议：

- 订单超时时间短一些
- 同金额并发控制
- 发卡系统侧也保存 `reallyPrice`
- 用户付款页明确提示必须支付实际金额

### 回调失败

建议：

- 发卡系统 `/notify` 必须返回纯文本 `success`
- 记录所有回调日志
- 支持后台重发回调
- 支持人工标记支付

## 最终建议

短期：

```text
继续 Java 版上 GCP
```

理由：

- 本地链路已验证
- GCP 部署简单
- 对接发卡系统不受语言影响
- 少引入 MySQL/PHP-FPM/Nginx 变量

中期：

```text
如果你确实需要 PHP 版 /example 或想深度二开，再单独评估 PHP 版迁移
```

不要因为 `/example` 页面切到 PHP 版。`/example` 只是测试页面，不是生产对接的核心。
