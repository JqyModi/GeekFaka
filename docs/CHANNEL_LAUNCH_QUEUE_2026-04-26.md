# 外部渠道滚动发布队列

目标：用低成本外部内容持续验证能否带来真实成交。主目标仍是累计销售额 `¥10,000`，每批只看三个指标：曝光、有效点击、订单来源。

## 节奏原则

- 不按固定 `D1/D2` 等待 24 小时，按“内容质量 + 平台风控 + 数据反馈”滚动推进。
- 小红书新账号阶段建议每天 `1-2` 条，不做短时间密集发布，优先保证完读、收藏和评论。
- Pinterest 是搜索型长尾渠道，可每天 `2-5` 个 Pin，但每个 Pin 需要不同标题、图面和关键词。
- 知乎适合长文承接高意图搜索，不追求高频，优先每 `2-3` 天一篇高质量回答。
- 微信公众号适合信任承接和中国区支付心智，优先每周 `1-2` 篇长文，不做硬广开头。
- YouTube Shorts 可并行准备脚本和视频，账号登录后再发；不搬运、不堆低质 AI 视频。
- Reddit 先做社区规则检查和反馈帖，不作为强销售入口，避免账号低信任直接引流。

## 滚动队列

| 批次 | 渠道 | 素材 | 链接 | 状态 |
| --- | --- | --- | --- | --- |
| B01 | 小红书 | 我用 ChatGPT 做了 20 套商品图提示词 | `https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=rednote&utm_medium=social&utm_campaign=photo_prompts&utm_content=post_01` | PUBLISHED |
| B01 | Pinterest | 10 ChatGPT photo prompts for better product images | `https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=pinterest&utm_medium=social&utm_campaign=prompt_pins&utm_content=pin_01` | PUBLISHED |
| B02 | 小红书 | 不会写 AI 作图提示词？先把这 5 个变量填好 | `https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=rednote&utm_medium=social&utm_campaign=photo_prompts&utm_content=post_02` | DRAFT_SAVED |
| B02 | Pinterest | AI product photo prompt template | `https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=pinterest&utm_medium=social&utm_campaign=prompt_pins&utm_content=pin_02` | PUBLISH_BLOCKED_UI_NOOP |
| B03 | YouTube Shorts | One prompt turned a boring product idea into a poster | `https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=youtube&utm_medium=shorts&utm_campaign=prompt_demo&utm_content=short_01` | PRIVATE_SAVED |
| B03 | 知乎 | 普通人如何借助 ChatGPT 提升工作效率？ | `https://faka.minai.eu.org/products/chatgpt-content-ops-workflow-v1?utm_source=zhihu&utm_medium=community&utm_campaign=content_workflow&utm_content=answer_01` | PUBLISHED_LOW_TRACTION |
| B04 | Reddit | I made a small prompt pack, looking for feedback | `https://faka.minai.eu.org/pages/ai-image-prompt-pack-guide?utm_source=reddit&utm_medium=community&utm_campaign=prompt_help&utm_content=feedback_01` | NEED_RULE_CHECK |
| B05 | Pinterest | ChatGPT prompts for social media covers | `https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=pinterest&utm_medium=social&utm_campaign=prompt_pins&utm_content=pin_03` | READY |
| B05 | 小红书 | 商品图提示词模板：主体、场景、风格、比例怎么写 | `https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=rednote&utm_medium=social&utm_campaign=photo_prompts&utm_content=post_03` | READY |
| B06 | 微信公众号 | 普通人怎么用 ChatGPT 做一套可以卖的虚拟资料？ | `https://faka.minai.eu.org/products/chatgpt-content-ops-workflow-v1?utm_source=wechat&utm_medium=article&utm_campaign=virtual_product_workflow&utm_content=article_01` | PUBLISHED_LOW_TRACTION |
| B07 | 微信公众号 | 别再问 ChatGPT 怎么赚钱了 | `https://faka.minai.eu.org/products/chatgpt-content-ops-workflow-v1?utm_source=wechat&utm_medium=image_post&utm_campaign=virtual_product_workflow&utm_content=post_02` | PARKED |
| B08 | 微信公众号 | 这 5 句话，帮你少吃很多哑巴亏 | 暂不放裸商品链接，优先关注/回复 `省心` | HOLD_QUALITY_REWORK |
| B09 | 小红书 | 这5句AI提示词，关键时候真能少吃亏 | 不放外链，优先评论 `省心` | PUBLISHED_LOW_TRACTION_REWORK |
| B10 | 小红书 | 别人借钱时，照着这9句话回 | 不放外链，优先评论 `借钱`，承接 30 句完整版 | PUBLISHED |

## 执行规则

- 每条内容只发一次，不跨平台复制粘贴同一段广告文案。
- 小红书、知乎、微信公众号由 Codex 按转化目标自行判断是否发布；遇到验证码、手机号、安全确认、资质确认时交给用户处理。
- Pinterest 和 YouTube 可在账号/API 授权后接入排队发布。
- Reddit 只发允许反馈或资源分享的社区，先拿反馈，不硬卖。
- 每轮发布后查看后台订单来源；出现订单的 `utm_source + utm_campaign` 优先加量。

## 并行渠道策略

| 渠道 | 当前动作 | 发布条件 |
| --- | --- | --- |
| 小红书 | B01 当前 `8` 浏览、`0` 互动；先重写 B05 钩子和封面，不加量硬推同款 | Codex 自行判断发布时间；与上一条至少间隔数小时 |
| Pinterest | B02 发布 UI 阻塞，后续改重开浏览器或新建 B05 Pin | Codex 自行判断是否继续重试或换新 Pin |
| 知乎 | B03 已可见，`1` 赞同；该问题浏览量低 | 继续找更高浏览/高关注问题，加 1-2 篇回答 |
| 微信公众号 | B06 已正式发表，`13` 阅读、`0` 分享/互动；B07 暂缓；B08/B09 反馈证明泛 AI 提示词不够强 | 改做“明确人群 + 高频痛点 + 数字化资产 + 立刻可用结果”的可收藏内容 |
| YouTube Shorts | 准备 30 秒脚本和字幕素材 | 需要账号登录和视频素材生成后再发布 |
| Reddit | 先筛 subreddit 规则，不直接营销 | 只在允许 feedback/resource 的社区发软反馈帖 |
| 站内 SEO | 同步优化商品详情页和教程页 | 不需要等外部渠道，可持续推进 |

## 判断标准

| 结果 | 处理 |
| --- | --- |
| 有订单 | 同主题加 5 条内容，保留同一商品方向 |
| 有点击无订单 | 优先改商品详情页首屏、样例和信任说明 |
| 无点击 | 改标题、封面和渠道关键词 |
| 有收藏/评论无购买 | 增加免费样例，引导完整包 |

## 执行记录

| 时间 | 渠道 | 结果 |
| --- | --- | --- |
| 2026-05-01 18:55 | 封面复盘 | 用户反馈当前封面存在明显版式问题：上方文字拥挤、中部大面积空白、底部信息散落。已参考高表现封面重做 B10 满版信息图封面 `marketing-assets/b10-borrow-money-boundary-talk/xhs-cover-b10-infographic.png`。后续封面规则调整为：顶部标题居中，主体双列信息块填满画面，配边框/小图标/侧边短句，优先让封面本身成为可收藏资料。 |
| 2026-05-01 18:35 | 小红书 | B10 已发布成功，发布页返回 `publish/success`。素材：`marketing-assets/b10-borrow-money-boundary-talk/`；标题 `别人借钱时，照着这9句话回`；图片为强钩子封面 + 9 句话收藏卡 + 3 个拒绝原则卡；正文不放外链，CTA 为评论 `借钱`。已同步补齐承接素材 `public/digital-products/freebies/borrow-money-boundary-lines-preview.md`，包含 30 句完整版。 |
| 2026-05-01 01:20 | 内容策略 | 用户反馈小红书 B09 仅 1 个播放，判断核心问题是推文质量不足，不能勾起收藏、分享、评论欲望。已暂停继续发布同类泛 AI 提示词内容，新增爆款拆解文档 `docs/VIRAL_CONTENT_PLAYBOOK_WECHAT_2026-05-01.md`；B08 改为 `HOLD_QUALITY_REWORK`，B09 改为 `PUBLISHED_LOW_TRACTION_REWORK`。下一步改做“明确人群 + 高频痛点 + 数字化资产 + 立刻可用结果”的可收藏内容。 |
| 2026-05-01 00:35 | 小红书 | B09 已发布。素材：`marketing-assets/b09-xhs-practical-ai-prompts/`；标题 `这5句AI提示词，关键时候真能少吃亏`；正文不放外链，CTA 为评论 `省心`。发布后页面跳转 `published=true`。后续观察曝光、观看、收藏、评论、主页访客和粉丝变化。 |
| 2026-05-01 00:35 | 微信公众号 | B08 已进入公众号编辑器并填入标题 `这 5 句话，帮你少吃很多哑巴亏`、作者 `虾语AI`、正文和贴图；当前停在发布前确认，状态 `DRAFT_FILLED_PENDING_PUBLISH`。 |
| 2026-05-01 00:20 | 跨平台 | 用户明确授权：专用渠道账号在子代理审核通过后可直接发布。策略调整为：不只处理公众号，但不跨平台复制同一内容。B08 先发公众号；同主题改写为小红书收藏型 B09；知乎另找高意图问题写回答；Pinterest/YouTube 暂不硬同步中文情绪主题。 |
| 2026-05-01 00:20 | 小红书 | 新增 B09 素材包 `marketing-assets/b09-xhs-practical-ai-prompts/`，把 B08 主题改造成小红书图文：标题 `这5句AI提示词，关键时候真能少吃亏`，封面 `xhs-cover-b09.png`，清单图 `xhs-card-b09-01.png`，CTA 为评论 `省心`，不放外链。状态 `READY_FOR_REVIEW`。 |
| 2026-04-29 15:50 | 微信公众号 | 内容审核子代理对 B08 给出 `REVISE`：方向正确，但标题和正文仍偏 AI/赚钱，收藏价值不够硬。已采纳修改：标题改为 `这 5 句话，帮你少吃很多哑巴亏`，正文改成 5 个可复制提示词，删除文末裸商品链接，CTA 改为关注/回复 `省心`。状态改为 `READY_AFTER_REVIEW`。 |
| 2026-04-29 15:35 | 微信公众号 | 用户明确纠正：目标不是把“别人愿意收藏的资料”当选题，而是每次选题都要基于平台热门内容、用户喜好、人性钩子和数据反馈，制作更容易收藏/转发的作品。已将 B07 降级为 `PARKED`，新增 B08。依据：当前公众号历史内容里借钱/关系/生活类内容阅读更高，B06 纯 AI 长文仅 `13` 阅读；B08 用借钱拒绝、客服投诉、工作汇报、简历、标题 5 个场景做“普通人马上能用”的贴图流。 |
| 2026-04-29 15:05 | 微信公众号 | 根据 B06 低互动数据和用户反馈，新增 B07 贴图流素材包 `marketing-assets/b07-wechat-image-post/`：封面 `wechat-cover-b07.png`，配图 `wechat-card-b07-01.png`、`wechat-card-b07-02.png`，正文 `article-02.md`。策略从长文卖货改为涨粉优先：情绪钩子 + 可收藏清单 + 关注/回复关键词 CTA，弱化商品链接。 |
| 2026-04-29 14:30 | 站内漏斗 | 已部署 `GrowthEvent` 站内埋点到 GCP：商品页访问、购买弹窗打开、提交支付、订单创建都会记录；线上验证 `https://faka.minai.eu.org/api/growth/events` 返回 `200`，MySQL `GrowthEvent` 表已写入 smoke 事件。后续渠道判断不再只依赖 Nginx 日志和订单表。 |
| 2026-04-29 10:55 | 微信公众号 | 用户扫码重新登录后已读取后台：账号 `虾语AI`，总用户 `76`，较昨日 `+13`；B06 公开链接 `https://mp.weixin.qq.com/s/kXV5ysFbfhVTkrTxF4a_nA`，近期发表数据显示 `13` 阅读、`0` 互动；昨日阅读人数 `4`、分享 `0`、新增关注 `0`。判断为低牵引但有存量触达，后续优先优化 CTA/承接，不直接加量同款。 |
| 2026-04-29 10:30 | 复盘 | 生产库订单总数 `63`，已支付 `17`，已支付金额 `¥0.44`，均判断为测试链路订单；UTM 订单 `0`。Nginx 主落地页 UTM 访问：Pinterest `2`，知乎 `5`，无转化。已在生产库下架 `0.01` 测试商品和乱码旧商品，仅保留两个正式商品。 |
| 2026-04-29 10:20 | 小红书 | B01 后台数据：`8` 浏览、`0` 赞藏评转；判断为低牵引，不继续直接加量同款文案。 |
| 2026-04-29 10:20 | 知乎 | B03 回答已可见，显示 `1` 赞同，问题约 `50` 浏览；状态改为 `PUBLISHED_LOW_TRACTION`。 |
| 2026-04-29 10:20 | 微信公众号 | 当前打开 `mp.weixin.qq.com` 根入口回到扫码登录页，无法读取 B06 最新阅读/正式发表状态；状态改为 `NEED_RELOGIN_VERIFY_STATS`。 |
| 2026-04-26 23:46 | 微信公众号 | 用户完成管理员/运营者扫码后，B06 已提交发表；公众号首页 `近期发表` 显示 `今天 23:46 等候发表`，状态改为 `SUBMITTED_WAITING_PUBLISH`。后台临时链接：`http://mp.weixin.qq.com/s?__biz=MzU4MTU2NzQ2OQ==&tempkey=MTM3MV85MzZaclhETDNGSTk3QW85bFZ2cmFfRkpINmhCSkVvSEliT3UwT3FpdXN0QTFqRFF2ejl6SXpfUm9NeGNRblo3S1JsNVlDbVhSR2NjT2xIQ3pENmVhbVRoT2lmR2x3RmZELVR4VFJTcllOaThsZm5XbEVDV0tvNUF0NFRXMVRIUnpBVmJCTGlzcDNVZUtUbHF5TnhLVVVtMmFLOURxbUw0X0t5TVd3fn4%3D&chksm=fd44d707ca335e11dd15fd4cee21497f8f4f3a33722c70752d34b2bb3facbac8669e99be5b00#rd`。 |
| 2026-04-26 23:36 | 微信公众号 | B06 已在账号 `虾语AI` 中导入文章、绑定封面、保存草稿并标注创作来源 `内容由AI生成`；点击发表后卡在 `微信验证：扫码后，请联系管理员进行验证`，状态 `PUBLISH_BLOCKED_WECHAT_ADMIN_VERIFY`。草稿 `appmsgid=100000128`。 |
| 2026-04-26 23:32 | 微信公众号 | B06 带封面草稿已手动保存，历史记录显示 `04-26 23:32 JC网页版 手动保存`。 |
| 2026-04-26 18:10 | 微信公众号 | 新增微信公众号渠道，B06 首篇长文草稿已生成到 `marketing-assets/b06-wechat/article-01.md`，状态 `COPY_READY`。 |
| 2026-04-26 17:55 | YouTube | 用户完成 Intermediate features 手机验证后，重新上传带静音音轨版本 `short-01-with-silence.mp4` 成功，生成 Shorts 链接 `https://youtube.com/shorts/BTLqxKFipRw`，检查通过并保存为 Private。 |
| 2026-04-26 17:50 | Pinterest | B02 Pin 继续尝试发布，发布按钮可用但点击无响应；已尝试 DOM click、坐标 click、Enter 触发、重新选中草稿，页面仍停留在创建页，标记为 `PUBLISH_BLOCKED_UI_NOOP`。 |
| 2026-04-26 17:45 | 知乎 | 基于转化目标自行拍板发布 B03 知乎回答；提交后页面显示 `编辑回答` 和 `发布中...`，新页面可见 `编辑回答` 但回答列表暂不可见，判断为知乎处理/审核中，标记 `SUBMITTED_PENDING_VISIBILITY`。 |
| 2026-04-26 17:30 | 知乎 | 用户切换到已绑定手机号的新账号后，已在问题 `普通人如何借助ChatGPT提升工作效率？` 下重建回答草稿；正文和 UTM 链接已写入，`发布回答` 按钮可用，未点击发布。 |
| 2026-04-26 17:30 | YouTube | 已重新检查 Studio 设置页：`Settings -> Channel -> Feature eligibility` 中 Intermediate features 显示 `Verify phone number`，Advanced features 显示 `Access features`；若要长视频外链可点击，需要用户完成手机号验证和高级功能验证。Shorts 描述/评论 URL 即使验证后仍不可点击。 |
| 2026-04-26 12:05 | 知乎 | 已确认登录。问题回答入口要求绑定手机号；已改走知乎专栏文章草稿，标题和正文已写入并显示 `刚刚 · 草稿`，但发布按钮因手机号绑定弹窗仍禁用。 |
| 2026-04-26 12:00 | YouTube | 已打开 `Settings -> Channel -> Feature eligibility`，页面显示 Intermediate/Advanced features 均为 `Eligible`。官方文档说明 Shorts 描述和评论中的 URL 不可点击，因此 Shorts 转化应改用频道主页链接、长视频描述或其他可点击入口。 |
| 2026-04-26 11:46 | 素材 | B05 小红书图文 3 和 Pinterest Pin 3 素材已生成到 `marketing-assets/b05/`，小红书状态改为 `READY`。 |
| 2026-04-26 11:46 | Pinterest | B02 Pin 已重新创建为草稿，图片、标题、链接和图板 `AI Prompt Pack` 已就位，发布按钮可用；描述输入控件自动填充不稳定，发布前可手动补描述或直接用标题+链接测试。 |
| 2026-04-26 11:44 | YouTube | B03 Shorts 已上传到 Studio 并填好标题、描述、非儿童和 Private；平台持续停在 `Creating link / Processing will begin shortly`，`Save` 禁用。已生成带静音 AAC 音轨的备用文件 `marketing-assets/b03-youtube-short-01/short-01-with-silence.mp4`，后续可重试。 |
| 2026-04-26 11:35 | 账号 | 已打开 YouTube Studio 和知乎登录页，等待用户在 `minai-growth` Chrome 资料内登录。 |
| 2026-04-26 11:34 | Pinterest | B02 Pin 连续创建时两次被 Pinterest 重定向回主页，先标记为 `NEED_RETRY`，避免强行重复操作触发风控。 |
| 2026-04-26 11:30 | 小红书 | B02 图文已保存草稿箱，标题为 `不会写 AI 作图提示词？先把这 5 个变量填好`。 |
| 2026-04-26 11:28 | YouTube | B03 Shorts 原创竖版视频已生成：`marketing-assets/b03-youtube-short-01/short-01.mp4`，封面 `short-01-cover.png`。 |
| 2026-04-26 11:20 | 素材 | B02 小红书封面和 Pinterest Pin 已生成到 `marketing-assets/b02/`，可进入草稿填充。 |
| 2026-04-26 11:05 | 运营 | 队列口径从 `D1/D2` 改为滚动批次 `Bxx`，不再按 24 小时固定等待。 |
| 2026-04-26 09:02 | Pinterest | 已发布 Pin。个人资料页显示公开图板 `AI Prompt Pack`，图板链接 `https://www.pinterest.com/jqytieniu/ai-prompt-pack/`，状态为 `1 张 Pin 图，刚刚`。 |
| 2026-04-26 08:55 | Pinterest | 已创建公开图板 `AI Prompt Pack`，当前 Pin 草稿已选择该图板，发布按钮可用；尚未点击发布。 |
| 2026-04-26 08:50 | 小红书 | 已发布图文笔记，发布后页面跳转到 `published=true`，草稿箱变为 `0`。 |
| 2026-04-26 08:43 | 小红书 | 图文笔记已保存到草稿箱，标题为 `20套商品图提示词，适合不会拍图的卖家`，草稿箱显示 `图文笔记(1)`。 |
| 2026-04-26 08:40 | Pinterest | Pin 创建页已上传图片并填写标题、描述和 UTM 链接，平台显示 `更改已保存`；由于账号暂无图板，发布前需要先选择或创建图板。 |
