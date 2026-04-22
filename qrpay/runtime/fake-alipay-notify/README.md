# Fake Alipay Notify

This is a local-only Android test app with package name `com.eg.android.AlipayGphone`.

It posts a notification containing `成功收款1.00元`, so `V免签监控端` can parse it as an Alipay payment notification and call `/appPush`.

It is only for local emulator testing.
