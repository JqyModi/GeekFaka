# 外部渠道账号接入运行手册

目标：记录外部渠道账号的本机登录态保存方式、启动方式、验证方式和操作边界，方便后续继续运营时追溯。本文不记录密码、验证码、Cookie 原文或任何可导出的登录凭证。

## 专用浏览器 Profile

本项目使用一个独立 Chrome 用户数据目录承载外部渠道登录态：

```text
~/.codex/browser-profiles/minai-growth
```

该目录等价于一个独立浏览器资料，保存小红书、Pinterest 等平台的 Cookie、LocalStorage、登录会话和浏览器设置。不要提交该目录，也不要复制给第三方。

## 当前已接入渠道

| 渠道 | 登录入口 | 当前验证结果 | 备注 |
| --- | --- | --- | --- |
| 小红书 | `https://creator.xiaohongshu.com/` | 已进入创作服务平台 `/new/home` | 可见发布笔记、笔记管理、数据看板 |
| Pinterest | `https://www.pinterest.com/` | 已进入已登录首页 | 可见个人资料、主页、图板、创建入口 |
| YouTube Studio | `https://studio.youtube.com/` | 已进入频道后台 | 可见频道 `PoBo Modi`；Feature eligibility 中仍显示手机号和高级功能验证入口 |
| 知乎 | `https://www.zhihu.com/` | 已登录 | 已切换到绑定手机号的新账号，回答草稿可编辑，发布前需用户确认 |
| 微信公众号 | `https://mp.weixin.qq.com/` | 已登录并可读取后台 | 账号 `虾语AI`；B06 已正式发表，公开链接已记录 |

小红书账号当前公开信息只用于运营识别：账号名为 `AI叮当喵`。不要在文档中记录密码、手机号、邮箱或验证码。

## 常规启动命令

日常打开已登录的运营浏览器：

```bash
open -na "Google Chrome" --args \
  --user-data-dir="$HOME/.codex/browser-profiles/minai-growth" \
  --profile-directory="Default" \
  --new-window \
  "https://creator.xiaohongshu.com/" \
  "https://www.pinterest.com/"
```

如果需要让 Codex 通过 Chrome DevTools Protocol 检查页面状态，可加本地调试端口：

```bash
open -na "Google Chrome" --args \
  --user-data-dir="$HOME/.codex/browser-profiles/minai-growth" \
  --profile-directory="Default" \
  --remote-debugging-port=9223 \
  --no-first-run \
  --new-window \
  "https://creator.xiaohongshu.com/" \
  "https://www.pinterest.com/"
```

验证调试端口：

```bash
curl -s http://127.0.0.1:9223/json/version
curl -s http://127.0.0.1:9223/json
```

已验证过的登录态特征：

```text
小红书 URL: https://creator.xiaohongshu.com/new/home
小红书页面文本包含: 发布笔记 / 笔记管理 / 数据看板
Pinterest 页面文本包含: 你的个人资料 / 主页 / 你的图板 / 创建
YouTube Studio URL: https://studio.youtube.com/channel/UCfPC5YtizLgxXrDTnOQyPjQ
知乎 URL: https://www.zhihu.com/
微信公众号 URL: https://mp.weixin.qq.com/
微信公众号账号: 虾语AI
微信公众号 B06 公开链接: https://mp.weixin.qq.com/s/kXV5ysFbfhVTkrTxF4a_nA
```

## YouTube 验证与外链说明

YouTube Studio 的验证路径：

```text
YouTube Studio -> Settings -> Channel -> Feature eligibility
```

当前页面状态：

- `2. Intermediate features / 中间特征` 显示 `Verify phone number`，需要用户完成手机号验证码。
- `3. Advanced features / 高级功能` 显示 `Access features`，需要用户在完成手机号验证后选择视频验证、证件验证，或等待频道历史满足要求。
- 官方说明：长视频描述等可点击外链依赖 Advanced features。
- 官方说明：Shorts 描述和 Shorts 评论里的 URL 不可点击，即使完成验证也不能作为直接点击入口。

因此 YouTube 的转化路径应优先使用频道主页链接、长视频描述、Related video 或站外渠道承接，不把 Shorts 描述当作主要点击入口。

## 知乎账号限制

旧知乎账号点击“写回答”时弹出手机号绑定要求：绑定手机号后才能解锁提问、回答、评论等更多功能。Codex 不处理手机号和验证码。

用户已切换到绑定手机号的新知乎账号。当前已在问题 `普通人如何借助ChatGPT提升工作效率？` 下写入回答草稿，发布前仍需要用户确认。

## 微信公众号状态

微信公众号后台已在 `minai-growth` Profile 登录，账号名为 `虾语AI`。

当前 B06 文章状态：

- 标题：`普通人怎么用 ChatGPT 做一套可以卖的虚拟资料？`
- 草稿 ID：`appmsgid=100000128`
- 草稿保存记录：`2026-04-26 23:32 JC网页版 手动保存`
- 封面：已上传并绑定到草稿。
- 创作来源：已按平台提示标注为 `内容由AI生成`。
- 发表状态：已正式发表。
- 公开链接：`https://mp.weixin.qq.com/s/kXV5ysFbfhVTkrTxF4a_nA`
- `2026-04-29` 复查：用户重新扫码登录后，后台显示总用户 `76`，较昨日 `+13`；B06 近期发表数据为 `13` 阅读、`0` 分享/互动；昨日阅读人数 `4`、分享 `0`、新增关注 `0`。

Codex 不代办微信扫码、管理员确认、实名或安全验证。若后续再次触发验证，仍需用户处理。

## 关闭窗口后的登录态

正常关闭 Chrome 窗口后，登录态通常会保留在 `minai-growth` 目录里。下次用同一个 `--user-data-dir` 启动即可继续使用。

需要重新登录的情况：

- 平台 Cookie 或会话过期。
- 用户主动退出了平台账号。
- 平台触发风控、短信、扫码、Google 授权或验证码。
- `~/.codex/browser-profiles/minai-growth` 被删除、清理或损坏。
- 换机器或换系统用户运行。

## 操作边界

允许 Codex 执行：

- 打开已登录页面并读取可见页面状态。
- 准备标题、正文、标签、UTM 链接和图片素材。
- 在本地生成待发布素材包。
- 在获得明确确认后，填写发布表单或创建草稿。
- 按转化目标自行判断是否保存草稿或发布公开内容。

不允许 Codex 执行：

- 记录、导出或上传 Cookie、密码、验证码、手机号、邮箱等敏感凭证。
- 绕过验证码、风控、安全提示或平台限制。
- 自动批量私信、刷赞、刷评论、跨社区复制粘贴广告。
- 绑定支付、店铺、实名、小程序、抖店、微信小商店等商业资质。

## 发布执行规则

用户已授权 Codex 围绕累计销售额 `¥10,000` 自主拍板发布节奏。Codex 可以根据内容质量、平台风控和转化目标决定是否发布。

仍需要用户介入的情况：

- 登录、扫码、短信、验证码、手机号、实名、资质审核。
- 平台明确要求账号所有者确认安全动作。
- 需要绑定支付、店铺、小程序、抖店、微信小商店等商业资质。
