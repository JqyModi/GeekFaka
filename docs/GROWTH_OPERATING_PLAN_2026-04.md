# 增长运营计划（2026-04-24）

目标：先跑到 `¥10,000`，优先选择 `高需求 / 低合规风险 / 高毛利 / 可自动交付` 的虚拟商品。

主域名：`minai.eu.org`

站点子域分工：

- 发卡站：`https://faka.minai.eu.org`
- V免签：`https://vmq.minai.eu.org`
- EPay：`https://epay.minai.eu.org`

部署事实：

- 本地修改代码
- 部署到 `GCP`
- 通过 `Cloudflare` 托管 `minai.eu.org` 及其子域名对外访问

## 经营边界

- 只做 `自有数字内容` 或 `明确授权的数字权益`。
- 不碰账号共享、品牌侵权、盗版软件、API Key 转售、灰黑产资源。
- 当前站点最适合的商品形态是：模板、提示词、工作流、资料包、教程包、授权下载内容。

## 当前需求信号

调研时间：`2026-04-24`

公开来源：

- Shopify 官方文章把 `Digital templates and tools`、`AI-enhanced digital products` 列为 2026 年最适合销售的数字商品，并明确举了 `Résumé templates for job-seekers` 与 `Prompt templates for AI models` 作为示例。
  来源：[Shopify - What Are Digital Products? Sell These 11 Products Online (2026)](https://www.shopify.com/blog/digital-products)
- Etsy 2026 春夏趋势报告明确建议卖家根据实时搜索数据调整库存、在标题/描述/标签里直接使用用户搜索短语，并围绕上升趋势创建互补商品。
  来源：[Etsy Seller Trend Report: Spring and Summer 2026](https://www.etsy.com/seller-handbook/article/1473931456647)

Google Trends 交叉验证：

- `resume template`
  趋势链接：[Google Trends](https://trends.google.com/trends/explore?date=today%2012-m&q=resume%20template)
  2026-04-05 到 2026-04-11 的兴趣值达到 `100`，相关词集中在 `Google Docs`、`Word`、`ATS`、`Canva`。
- `notion template`
  趋势链接：[Google Trends](https://trends.google.com/trends/explore?date=today%2012-m&q=notion%20template)
  相关词集中在 `budget`、`planner`、`study`、`dashboard`，说明可从垂直场景切入。
- `digital planner`
  趋势链接：[Google Trends](https://trends.google.com/trends/explore?date=today%2012-m&q=digital%20planner)
  `digital planner 2026` 与 `free digital planner 2026` 出现 breakout，季节性很强。
- `social media template`
  趋势链接：[Google Trends](https://trends.google.com/trends/explore?date=today%2012-m&q=social%20media%20template)
  核心词聚焦在 `social media calendar`、`content calendar template`。
- `chatgpt prompts`
  趋势链接：[Google Trends](https://trends.google.com/trends/explore?date=today%2012-m&q=chatgpt%20prompts)
  当前明显上升的是 `photo editing prompts`，说明“通用 prompts”太泛，必须切成具体结果导向场景。

## 第一批主推方向

### 1. ATS 简历模板包

- 理由：搜索需求稳定，决策链短，复购低但转化快。
- 推荐形态：`Google Docs + Word + Canva` 三版本打包。
- 定价建议：`¥19 - ¥39`
- 内容入口：`ATS 简历模板怎么过筛`、`Google Docs Resume Template`、`Canva Resume Template`

### 2. Notion 财务 / 创作者经营模板

- 理由：用户场景清晰，适合预算、收入跟踪、内容排期。
- 推荐形态：`预算管理 + 收入看板 + 内容看板` 组合包。
- 定价建议：`¥29 - ¥59`
- 内容入口：`Notion budget template`、`creator finance template`、`notion dashboard template`

### 3. 社媒内容日历模板

- 理由：需求稳定，和当前站点已有“内容运营工作流”天然互补。
- 推荐形态：`月计划 + 选题库 + 发布日历 + 复盘表`
- 定价建议：`¥29 - ¥69`
- 内容入口：`social media calendar template`、`content calendar template`

### 4. AI 图片提示词包

- 理由：当前上升最明显的不是“泛 prompts”，而是 `photo editing / poster / cover` 这类结果型关键词。
- 推荐形态：`海报 / 电商主图 / 社媒封面 / 头像修图` 分场景包。
- 定价建议：`¥19 - ¥49`
- 内容入口：`chatgpt photo editing prompts`、`midjourney poster prompts`

## 当前仓库内的落地动作

- 已把商品增加 `slug / SEO / 补货阈值 / 供货备注` 字段。
- 已新增 `/products/[slug]` 商品详情页，承接 SEO 流量。
- 已新增后台 `增长运营` 页面，管理：
  - 选品机会池
  - 内容任务
- 已补 `robots.ts` 与 `sitemap.ts`。
- 已把首页文章区打开，用来做内链和转化说明。
- `.env.production.example` 与种子配置已默认指向 `https://faka.minai.eu.org`。

## 推广渠道优先级

### 1. SEO / GEO（最高优先级）

- 原因：这是自有域名资产，流量沉淀在自己站上，不受单个平台算法完全控制。
- 依据：
  - Shopify 官方明确建议数字商品卖家先做自有商店和内容，再叠加社媒与平台渠道。
    来源：[Shopify - What Are Digital Products? Sell These 11 Products Online (2026)](https://www.shopify.com/blog/digital-products)
  - Google 官方在 2025 年 3 月和 2025 年 5 月说明 AI Overviews 与 AI Mode 会给复杂问题返回 AI 答案并链接到网页，购物体验也直接接入 Search。
    来源：[Google - Expanding AI Overviews and introducing AI Mode](https://blog.google/products/search/ai-mode-search/)
    来源：[Google - AI in Search: Going beyond information to intelligence](https://blog.google/products-and-platforms/products/search/google-search-ai-mode-update/)
- 执行：
  - 每个商品至少 1 个商品详情页 + 1 篇购买指南 + 2 篇长尾教程页
  - 内容里优先用真实问题、步骤、价格区间、适用人群、更新日期

### 2. Pinterest（高优先级）

- 原因：我们的商品是模板、提示词、视觉素材和工作流，非常适合图文搜索和长期分发。
- 依据：
  - Pinterest 官方 `Pinterest Predicts 2026` 营销材料强调 Product Pin 的 outbound clicks 和趋势内容转商品的能力。
    来源：[Pinterest Predicts 2026 Marketing Playbook](https://business.pinterest.com/en-gb/pdf/pinterest-predicts/2026-marketing-playbook)
- 执行：
  - 先做 `AI 图片提示词包` 与 `Notion/简历模板` 两类 Pin 集群
  - 单商品 10-20 张 Pin，分别打不同问题词和使用场景

### 3. YouTube Shorts / YouTube Shopping（中高优先级）

- 原因：模板和工作流天然适合“前后对比”和“30 秒演示”，而且 YouTube 已有官方购物挂载能力。
- 依据：
  - YouTube 官方帮助文档说明，符合资格的创作者可以把商品挂到频道商店、视频描述、Shorts、直播和商品架。
    来源：[YouTube Help - Get started with Shopping on YouTube](https://support.google.com/youtube/answer/12257682?hl=en)
    来源：[YouTube Help - Manage products from your store on YouTube](https://support.google.com/youtube/answer/12258288?hl=en)
- 执行：
  - 每个重点商品做 3-5 条 Shorts
  - 未满足购物资格前，先把流量导向站内商品页和购买指南

## 当前不作为第一优先级的渠道

- `Reddit`：适合做社区验证和问题帖引流，但不作为第一批主渠道。
- `小红书 / Rednote`：有潜力，但当前项目更需要先把可直接回站的全球流量链路跑顺。
- `纯付费投流`：在首批商品、转化页和自然内容没跑顺前不优先烧钱。

## 实际执行节奏

### 阶段 A：先拿第一笔收入

- 先主推 `AI 图片提示词包` 与 `内容运营工作流`
- 每个商品至少配：
  - 1 个商品详情页
  - 1 篇购买/使用指南
  - 1 组首页短卖点

### 阶段 B：扩 SKU

- 上 `ATS 简历模板包`
- 上 `Notion 财务模板`
- 给每个 SKU 建 2 到 3 个长尾内容页

### 阶段 C：补货与复盘

- 低于 `restockThreshold` 触发补货
- 每周复盘：
  - 哪个入口词带来成交
  - 哪篇文章带来加购
  - 哪个商品需要降价、重写卖点或下架

## 需要你配合的事项

- 如果要卖授权型数字权益，需要你确认供货授权链条。
- 如果要直接操作第三方平台账号，你需要把对应账号登录环境交给我；否则我先把站内、内容与素材准备好。
