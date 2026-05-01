# 外部渠道自动化作战手册

目标：围绕 `¥10,000` 销售额，优先用低成本内容渠道验证能成交的虚拟商品，不做刷屏、批量私信或绕过平台规则的自动化。

## 自动化边界

| 渠道 | 自动化等级 | 可自动化 | 不建议自动化 |
| --- | --- | --- | --- |
| 小红书 | 半自动 | 选题、标题、正文、封面文案、标签、排期、UTM 链接 | 批量登录、批量私信、无确认发帖 |
| 知乎 | 半自动 | 问题筛选、回答草稿、文章草稿、引用链接、发布清单 | 批量回答、重复引流、纯广告回答 |
| Pinterest | 可 API 化 | Pin 素材、标题、描述、Board 映射、排队发布 | 重复素材堆量、未审核 API 大规模发布 |
| Reddit | 低自动 | subreddit 筛选、规则检查清单、回复草稿、反馈收集 | 跨社区复制粘贴、自动评论、忽略版规 |
| YouTube Shorts | 可 API 化 | 脚本、分镜、字幕、描述、上传队列 | 搬运、低质 AI 堆量、未授权素材 |

## 当前主推顺序

1. `P0 小红书`：中文用户购买路径短，适合 AI 写真、商品图、小红书封面提示词。
2. `P0 Pinterest`：搜索型视觉流量，适合英文 prompt、商品图、海报、封面模板。
3. `P1 YouTube Shorts`：用前后对比建立信任，复用同一批 prompt demo。
4. `P1 知乎`：用长文回答承接高意图问题，销售内容运营工作流。
5. `P2 Reddit`：先做反馈验证，不作为强销售渠道。

## UTM 规则

所有外部链接必须带 UTM，便于后续用订单来源判断是否继续投放。

```text
https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=rednote&utm_medium=social&utm_campaign=photo_prompts
https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=pinterest&utm_medium=social&utm_campaign=prompt_pins
https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=youtube&utm_medium=shorts&utm_campaign=prompt_demo
https://faka.minai.eu.org/products/chatgpt-content-ops-workflow-v1?utm_source=zhihu&utm_medium=community&utm_campaign=content_workflow
https://faka.minai.eu.org/pages/ai-image-prompt-pack-guide?utm_source=reddit&utm_medium=community&utm_campaign=prompt_help
```

## 首批内容主题

| 渠道 | 首批内容 | 成交目标 |
| --- | --- | --- |
| 小红书 | `AI 写真提示词`、`商品图提示词`、`小红书封面提示词` | 免费样例引导购买完整包 |
| Pinterest | `ChatGPT photo prompts`、`product photo prompts`、`poster prompt ideas` | Pin 直接导商品页 |
| YouTube Shorts | `One prompt before/after`、`30-second product poster prompt` | 描述区导商品页 |
| 知乎 | `普通人如何用 ChatGPT 做内容运营 SOP` | 导内容运营工作流 |
| Reddit | `I made a small prompt pack, looking for feedback` | 收集反馈和英文转化词 |

## 执行原则

- 先验证成交，不追求全平台同时规模化。
- 每个渠道先跑 `7 天 / 10 条内容`，看点击和订单来源。
- 有订单的渠道加倍内容频率；无点击的渠道改标题和素材；有点击无订单的渠道改商品页。
- 所有素材优先复用同一批 prompt demo，降低制作成本。
