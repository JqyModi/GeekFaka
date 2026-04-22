# V免签 Fork 深挖筛选

更新时间：2026-04-21

## 结论

如果你现在要挑一个比原版更适合当前环境的分支，结论不是“整套换一个 fork”，而是：

- `监控端 APK` 优先选 `zwc456baby/vmqApk`
- `PHP 服务端` 不建议盲目换到某个激进 fork
- 更稳妥的组合是：
  - `szvone/vmqphp` 原版服务端，或保守尝试 `wujingquan/vmqphp`
  - 搭配 `zwc456baby/vmqApk` 监控端

也就是说，当前最值得换的是 `Apk fork`，不是 `PHP fork`。

## 我筛选的依据

我没有只看 fork 时间，而是结合了这些信号：

- 最近是否真的有独立提交
- 相比原版是否 `ahead`
- 改动是兼容性修复，还是只是 README / 资源替换
- 是否出现明显风险信号

## PHP 服务端候选

### 1. `hulisang/vmqphp`

仓库：

- <https://github.com/hulisang/vmqphp>

结果：

- 相对原版 `ahead 3 commits`
- 最近提交时间：`2025-07-03`
- README 明确写了：`ThinkPHP 5.1 -> ThinkPHP 8.1.2`

优点：

- 这是目前最明显在做现代化升级的 PHP fork
- 目标就是兼容 `PHP 8`
- 目录结构、依赖、路由、二维码库都升级了

问题：

- 改动面太大，不是“小修小补”，而是一次框架迁移
- 只有少量提交，但实际改动文件很多，回归风险很高
- 没看到足够的社区验证信号

结论：

- 如果你必须上 `PHP 8`，它是最值得关注的 fork
- 但它更像“实验性升级版”，不是可以无脑上线的稳定版

### 2. `kingfer30/vmqphp`

仓库：

- <https://github.com/kingfer30/vmqphp>

结果：

- 相对原版 `ahead 6 commits`
- 最近提交时间：`2025-02-02`

优点：

- 明确在做 `PHP 8` 兼容
- 改动范围比整仓重构小

风险：

- `config/database.php` 里出现了硬编码数据库密码和端口
- 这说明维护方式不干净，仓库本身不适合作为可信基础

结论：

- 直接排除，不建议使用

### 3. `wujingquan/vmqphp`

仓库：

- <https://github.com/wujingquan/vmqphp>

结果：

- 有独立提交
- 最近提交时间：`2024-05-31`
- 主要提交：
  - 升级 ThinkPHP 到 `5.1.42`
  - 增加是否启用版本更新检查
  - 使用国内静态资源加速

优点：

- 改动比较保守
- 升级方向相对稳
- 比“整仓迁移到 TP8”风险小很多

缺点：

- 提升幅度有限
- 没有解决“现代环境兼容”的核心问题，比如完整的 PHP 8 路线

结论：

- 如果你不追求大改，只想在原版基础上找一个保守小修版，它是目前最稳的 PHP fork 候选
- 但它并没有形成“明显碾压原版”的优势

## PHP 服务端最终判断

### 最稳妥

- `szvone/vmqphp` 原版
- 或 `wujingquan/vmqphp` 作为保守替代

### 最值得实验

- `hulisang/vmqphp`

### 明确排除

- `kingfer30/vmqphp`

## APK 监控端候选

### 1. `zwc456baby/vmqApk`

仓库：

- <https://github.com/zwc456baby/vmqApk>

结果：

- 相对原版 `ahead 35 commits`
- `191 stars`
- 最近提交时间：`2024-12-04`

关键提交：

- `修复识别问题`
- `增加 Android 15 说明`
- `兼容微信 8.0.50`
- `关闭连接池避免某些 VPN 导致连接假死`
- `升级到 api 28`

README 明确新增了这些能力：

- 开机自启
- post 失败后二次重试
- 重试时强制亮屏/前台唤起，降低后台网络被系统杀死的概率
- 更适合装在日用安卓设备，而不是专门找一台常亮挂机机
- Android 15 下新增 `RECEIVE_SENSITIVE_NOTIFICATIONS` 权限说明

本地对比看到的实际改动：

- 增加 `ForegroundServer`
- 增加 `LockShowActivity`
- 增加 `StartReceive`
- 增加前台服务、开机广播、网络状态、电池优化相关权限
- 增加网络安全配置

结论：

- 这是目前最值得用的 `vmqApk` fork
- 它不是“完全免挂”，但明显在朝“减少专用挂机设备依赖”优化
- 如果你的重点是降低挂机不稳定性，它是最贴近你诉求的分支

### 2. `HC-axcc/vmqApk`

仓库：

- <https://github.com/HC-axcc/vmqApk>

结果：

- 相对原版 `ahead 2 commits`
- 最近提交时间：`2026-01-23`

优点：

- 做了 AndroidX 迁移
- `compileSdkVersion 34`
- `targetSdkVersion 34`
- 增加了较新的通知与启动权限

问题：

- 改动虽然现代，但提交少
- 包名整体改成了 `com.axcc.vmq`
- 结构改动偏工程迁移，不像是围绕“到账通知稳定性”持续打磨
- 社区验证明显弱于 `zwc456baby`

结论：

- 这是一个“工程升级版”
- 适合作为后续二开参考
- 不适合作为当前第一优先生产选择

### 3. `gdlden/vmqApk`

仓库：

- <https://github.com/gdlden/vmqApk>

结果：

- 最近提交时间：`2025-02-23`
- 主要提交更像 CI/CD 和发版脚本

结论：

- 没看到比 `zwc456baby` 更强的实际业务修复
- 不作为首选

## APK 监控端最终判断

### 明确首选

- `zwc456baby/vmqApk`

### 次选参考

- `HC-axcc/vmqApk`

### 不优先

- `gdlden/vmqApk`

## 最终推荐组合

### 推荐组合 A

- 服务端：`szvone/vmqphp`
- 监控端：`zwc456baby/vmqApk`

适合：

- 先追求稳定可用
- 不想同时承受“服务端 fork 回归风险 + APK fork 回归风险”

### 推荐组合 B

- 服务端：`wujingquan/vmqphp`
- 监控端：`zwc456baby/vmqApk`

适合：

- 想要一个比原版 PHP 端稍微保守优化过的版本
- 但不想上 `ThinkPHP 8` 这种大迁移

### 实验组合

- 服务端：`hulisang/vmqphp`
- 监控端：`zwc456baby/vmqApk`

适合：

- 你明确要 `PHP 8`
- 你愿意自己回归测试
- 你接受它不是成熟稳定分支

## 我给你的最终建议

如果你现在马上要搭：

- 不要整套追 fork
- 优先把 `监控端` 换成 `zwc456baby/vmqApk`
- 服务端先用原版或 `wujingquan/vmqphp`

因为当前真正影响“漏单、后台假死、Android 新版本兼容”的主要瓶颈，在监控端，不在 PHP 面板端。

## 参考仓库

- 原版 PHP: <https://github.com/szvone/vmqphp>
- 原版 APK: <https://github.com/szvone/vmqApk>
- 推荐 APK fork: <https://github.com/zwc456baby/vmqApk>
- 次选 APK fork: <https://github.com/HC-axcc/vmqApk>
- 保守 PHP fork: <https://github.com/wujingquan/vmqphp>
- 实验 PHP fork: <https://github.com/hulisang/vmqphp>
