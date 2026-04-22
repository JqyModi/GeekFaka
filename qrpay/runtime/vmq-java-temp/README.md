# 临时部署目录

位置：

- `/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp`

用途：

- 本地临时运行 `V免签 Java 服务端`
- 使用本地 H2 数据库，不依赖 MySQL

默认信息：

- 访问地址：`http://127.0.0.1:18080`
- 默认账号：`admin`
- 默认通讯密钥：`admin`

脚本：

- 前台运行：`./run.sh`
- 启动：`./start.sh`
- 停止：`./stop.sh`
- 状态：`./status.sh`
- 模拟回调接收：`node ./mock-callback.js`
- 创建测试订单：`./create-test-order.sh`
- 模拟到账推送：`./simulate-pay.sh <type> <reallyPrice>`
- 查看 APK 手动配置串：`./show-apk-config.sh`

数据文件：

- H2 数据库：`data/mq.mv.db`
- 日志：`logs/vmq.log`

建议：

- 本机联调优先使用 `./run.sh`，开一个终端持续运行服务
- 另一个终端再访问 `http://127.0.0.1:18080`
- 如果在当前工具环境里测试后台启动，子进程可能被回收，不影响你手工在终端里运行

本地支付测试最小闭环：

1. 终端 A 运行 `./run.sh`
2. 终端 B 运行 `node ./mock-callback.js`
3. 后台把通讯密钥设置成你要测试的值，例如 `admin`
4. 运行 `./create-test-order.sh`
5. 从返回结果里拿到 `data.orderId` 和 `data.reallyPrice`
6. 运行 `./simulate-pay.sh 2 <reallyPrice>`
7. 在终端 B 看是否收到 `/notify` 请求，且返回 `success`
