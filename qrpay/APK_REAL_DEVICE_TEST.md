# 真机监控端测试

当前本地临时服务端：

- 服务端地址：`http://192.168.1.157:18080`
- APK 手动配置串：`192.168.1.157:18080/admin`
- 通讯密钥：`admin`
- APK 安装包：[/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp/vmqApk-v2.0.9.apk](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/runtime/vmq-java-temp/vmqApk-v2.0.9.apk)

## 我已经确认的前置条件

- 本地 Java 服务端可访问
- `http://127.0.0.1:18080/` 正常返回
- 局域网地址 `http://192.168.1.157:18080/` 在本机可访问
- 服务端监控配置已改成测试值：`key=admin`

## 手机上怎么配

1. 确保手机和这台 Mac 在同一个局域网
2. 安装 `vmqApk-v2.0.9.apk`
3. 打开 App，优先用“手动配置”
4. 输入：`192.168.1.157:18080/admin`
5. 点击“开启服务”或“检测心跳”

心跳正常时，服务端后台 `监控端设置` 页面里：

- `监控端状态` 应变成 `运行正常`
- `最后心跳` 应更新为最新时间

## 必开权限

- 通知使用权 / 通知监听权限
- 后台运行白名单
- 自启动
- 后台弹出界面
- 锁屏显示

如果是 Android 15，还要额外执行：

```bash
adb shell appops set com.vone.qrcode RECEIVE_SENSITIVE_NOTIFICATIONS allow
```

## 真支付测试

1. 在 `V免签` 后台系统设置里填入你自己的支付宝或微信收款码
2. 创建一笔测试订单
3. 记住返回里的 `reallyPrice`
4. 用另一台手机或另一账号，按这个金额实际付款
5. 观察：
   - 安卓监控端是否收到支付通知
   - 后台订单是否从 `等待支付` 变为 `完成`
   - 你的业务回调地址是否收到通知

## 如果不用扫码配置

服务端后台 `监控端设置` 页面本质上展示的是：

```text
window.location.host + "/" + key
```

所以你本地这套环境对应的就是：

```text
192.168.1.157:18080/admin
```

## 排错顺序

1. 手机上的浏览器先访问 `http://192.168.1.157:18080/`
2. 如果打不开，先解决局域网访问、防火墙、同网段问题
3. 如果能打开但 App 心跳失败，优先检查手动配置串是否正确
4. 如果心跳正常但支付无回调，优先检查通知监听权限和系统杀后台
5. 如果支付宝在 Android 15 上漏通知，补执行上面的 `adb shell appops ...`
