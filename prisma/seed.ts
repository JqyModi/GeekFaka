import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.systemSetting.upsert({
    where: { key: 'site_url' },
    update: { value: 'https://faka.minai.eu.org' },
    create: {
      key: 'site_url',
      value: 'https://faka.minai.eu.org',
      description: '发卡站正式访问域名',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'site_title' },
    update: { value: 'AI数字资源站' },
    create: {
      key: 'site_title',
      value: 'AI数字资源站',
      description: '站点标题',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'site_description' },
    update: { value: '专注销售 AI 提示词、自动化工作流、数字模板与虚拟资源，支付后自动发货。' },
    create: {
      key: 'site_description',
      value: '专注销售 AI 提示词、自动化工作流、数字模板与虚拟资源，支付后自动发货。',
      description: '站点描述',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'site_keywords' },
    update: { value: 'AI提示词, 自动化工作流, 数字模板, 虚拟资源, 自动发货' },
    create: {
      key: 'site_keywords',
      value: 'AI提示词, 自动化工作流, 数字模板, 虚拟资源, 自动发货',
      description: '站点默认关键词',
    },
  })

  // Create Category
  const category = await prisma.category.upsert({
    where: { slug: 'ai-prompts' },
    update: {},
    create: {
      name: 'AI 提示词',
      slug: 'ai-prompts',
      priority: 10,
    },
  })

  // Create Product 1
  const promptPack = await prisma.product.upsert({
    where: { slug: 'midjourney-poster-prompts' },
    update: {
      name: 'Midjourney 海报提示词包',
      tagline: '电商主图、社媒封面、活动海报一包搞定',
      description: '适用于海报、电商主图与社媒封面，含多场景高转化提示词模板与使用说明。',
      price: 29.90,
      categoryId: category.id,
      seoTitle: 'Midjourney 海报提示词包 - 电商主图 / 社媒封面 / 活动海报',
      seoDescription: '覆盖电商主图、社媒封面、海报 KV 等高频场景，适合想快速稳定出图的创作者与独立卖家。',
      searchKeywords: 'midjourney prompt, 海报提示词, 电商主图提示词, 社媒封面 prompt',
      restockThreshold: 5,
      supplierName: '自有内容库',
      supplierNotes: '每次大版本迭代后补一批新场景模板',
    },
    create: {
      slug: 'midjourney-poster-prompts',
      name: 'Midjourney 海报提示词包',
      tagline: '电商主图、社媒封面、活动海报一包搞定',
      description: '适用于海报、电商主图与社媒封面，含多场景高转化提示词模板与使用说明。',
      price: 29.90,
      categoryId: category.id,
      seoTitle: 'Midjourney 海报提示词包 - 电商主图 / 社媒封面 / 活动海报',
      seoDescription: '覆盖电商主图、社媒封面、海报 KV 等高频场景，适合想快速稳定出图的创作者与独立卖家。',
      searchKeywords: 'midjourney prompt, 海报提示词, 电商主图提示词, 社媒封面 prompt',
      restockThreshold: 5,
      supplierName: '自有内容库',
      supplierNotes: '每次大版本迭代后补一批新场景模板',
      licenses: {
        create: [
          { code: '下载: https://faka.minai.eu.org/digital-products/ai-image-prompt-pack-v1-20260425.md' },
          { code: '下载: https://faka.minai.eu.org/digital-products/ai-image-prompt-pack-v1-20260425.md' },
          { code: '下载: https://faka.minai.eu.org/digital-products/ai-image-prompt-pack-v1-20260425.md' },
        ]
      }
    }
  })

  // Create Product 2
  const workflowPack = await prisma.product.upsert({
    where: { slug: 'chatgpt-content-ops-workflow' },
    update: {
      name: 'ChatGPT 内容运营工作流',
      tagline: '从选题到分发的内容运营 SOP，适合个人和小团队',
      description: '覆盖选题、标题、长文、短视频脚本与复盘流程，适合个人创作者与小团队提效。',
      price: 49.00,
      categoryId: category.id,
      seoTitle: 'ChatGPT 内容运营工作流 - 选题 / 脚本 / 分发 / 复盘',
      seoDescription: '把内容运营拆成可复制的执行 SOP，适合需要稳定产出的创作者、品牌团队和副业项目。',
      searchKeywords: 'chatgpt content workflow, 内容运营 SOP, 短视频脚本模板, 标题模板',
      restockThreshold: 3,
      supplierName: '自有工作流模板',
      supplierNotes: '每月同步一次平台算法和提示词用法更新',
    },
    create: {
      slug: 'chatgpt-content-ops-workflow',
      name: 'ChatGPT 内容运营工作流',
      tagline: '从选题到分发的内容运营 SOP，适合个人和小团队',
      description: '覆盖选题、标题、长文、短视频脚本与复盘流程，适合个人创作者与小团队提效。',
      price: 49.00,
      categoryId: category.id,
      seoTitle: 'ChatGPT 内容运营工作流 - 选题 / 脚本 / 分发 / 复盘',
      seoDescription: '把内容运营拆成可复制的执行 SOP，适合需要稳定产出的创作者、品牌团队和副业项目。',
      searchKeywords: 'chatgpt content workflow, 内容运营 SOP, 短视频脚本模板, 标题模板',
      restockThreshold: 3,
      supplierName: '自有工作流模板',
      supplierNotes: '每月同步一次平台算法和提示词用法更新',
      licenses: {
        create: [
          { code: '下载: https://faka.minai.eu.org/digital-products/content-ops-workflow-v1-20260425.md' },
          { code: '下载: https://faka.minai.eu.org/digital-products/content-ops-workflow-v1-20260425.md' },
        ]
      }
    }
  })

  const buyingGuide = await prisma.article.upsert({
    where: { slug: 'midjourney-prompt-buying-guide' },
    update: {
      title: 'Midjourney 提示词包购买与使用指南',
      excerpt: '说明适用人群、交付方式、如何把提示词批量改造成自己的电商主图和社媒封面。',
      seoTitle: 'Midjourney 提示词包购买与使用指南',
      seoDescription: '适合准备购买 Midjourney 提示词包的电商卖家与内容创作者，覆盖交付、使用和迭代方法。',
      focusKeyword: 'midjourney 提示词',
      content: `## 适合谁购买

- 想快速出电商主图或活动海报的独立卖家
- 需要社媒封面素材的创作者
- 想把 AI 出图流程标准化的工作室

## 交付方式

付款成功后自动发货，订单页和邮箱都会收到卡密内容。

## 使用建议

1. 先选定场景模板。
2. 替换主体、风格、尺寸和品牌词。
3. 每轮测试保留 3 到 5 个高转化版本。
`,
      isVisible: true,
    },
    create: {
      slug: 'midjourney-prompt-buying-guide',
      title: 'Midjourney 提示词包购买与使用指南',
      excerpt: '说明适用人群、交付方式、如何把提示词批量改造成自己的电商主图和社媒封面。',
      seoTitle: 'Midjourney 提示词包购买与使用指南',
      seoDescription: '适合准备购买 Midjourney 提示词包的电商卖家与内容创作者，覆盖交付、使用和迭代方法。',
      focusKeyword: 'midjourney 提示词',
      content: `## 适合谁购买

- 想快速出电商主图或活动海报的独立卖家
- 需要社媒封面素材的创作者
- 想把 AI 出图流程标准化的工作室

## 交付方式

付款成功后自动发货，订单页和邮箱都会收到卡密内容。

## 使用建议

1. 先选定场景模板。
2. 替换主体、风格、尺寸和品牌词。
3. 每轮测试保留 3 到 5 个高转化版本。
`,
      isVisible: true,
    },
  })

  const promptOpportunity = await prisma.productOpportunity.upsert({
    where: { slug: 'ai-photo-prompt-pack' },
    update: {
      title: 'AI 图片提示词包',
      stage: 'READY',
      status: 'ACTIVE',
      categoryLabel: 'AI 模板',
      audience: '电商卖家 / 内容创作者',
      demandScore: 7,
      marginScore: 9,
      competitionScore: 5,
      speedScore: 8,
      confidenceScore: 7,
      riskLevel: 'LOW',
      suggestedPrice: 29.9,
      monthlyRevenueGoal: 2000,
      targetDailySales: 3,
      sourceUrl: 'https://www.shopify.com/blog/digital-products',
      evidenceSummary: 'Shopify 官方将 prompt templates for AI models 列为可卖数字工具；Google Trends 中 chatgpt photo editing prompts 出现 Breakout。',
      sourcingPlan: '优先售卖自有模板，按场景持续迭代版本。',
      keywords: 'chatgpt photo editing prompts, ai image prompts, 海报提示词, 电商主图 prompt',
      distributionPlan: '商品详情页 + 购买指南文章 + 首页卡片 + 社媒案例展示',
      nextAction: '扩充 20 条电商主图与社媒封面场景模板，补齐详情页截图与案例。',
      complianceNotes: '只卖自有模板，不捆绑第三方账号、API key 或品牌授权内容。',
      productId: promptPack.id,
    },
    create: {
      slug: 'ai-photo-prompt-pack',
      title: 'AI 图片提示词包',
      stage: 'READY',
      status: 'ACTIVE',
      categoryLabel: 'AI 模板',
      audience: '电商卖家 / 内容创作者',
      demandScore: 7,
      marginScore: 9,
      competitionScore: 5,
      speedScore: 8,
      confidenceScore: 7,
      riskLevel: 'LOW',
      suggestedPrice: 29.9,
      monthlyRevenueGoal: 2000,
      targetDailySales: 3,
      sourceUrl: 'https://www.shopify.com/blog/digital-products',
      evidenceSummary: 'Shopify 官方将 prompt templates for AI models 列为可卖数字工具；Google Trends 中 chatgpt photo editing prompts 出现 Breakout。',
      sourcingPlan: '优先售卖自有模板，按场景持续迭代版本。',
      keywords: 'chatgpt photo editing prompts, ai image prompts, 海报提示词, 电商主图 prompt',
      distributionPlan: '商品详情页 + 购买指南文章 + 首页卡片 + 社媒案例展示',
      nextAction: '扩充 20 条电商主图与社媒封面场景模板，补齐详情页截图与案例。',
      complianceNotes: '只卖自有模板，不捆绑第三方账号、API key 或品牌授权内容。',
      productId: promptPack.id,
    },
  })

  const workflowOpportunity = await prisma.productOpportunity.upsert({
    where: { slug: 'social-content-workflow-kit' },
    update: {
      title: '内容运营工作流模板',
      stage: 'LISTED',
      status: 'ACTIVE',
      categoryLabel: '运营模板',
      audience: '创作者 / 小团队',
      demandScore: 6,
      marginScore: 9,
      competitionScore: 4,
      speedScore: 7,
      confidenceScore: 7,
      riskLevel: 'LOW',
      suggestedPrice: 49,
      monthlyRevenueGoal: 3000,
      targetDailySales: 2,
      sourceUrl: 'https://www.shopify.com/blog/digital-products',
      evidenceSummary: 'Shopify 官方把数字模板和工具列为核心数字商品；Google Trends 中 social media calendar template 稳定有需求。',
      sourcingPlan: '以可复制 SOP + 模板打包交付，每月补一次渠道更新。',
      keywords: 'content workflow, social media calendar template, 标题模板, 内容运营 SOP',
      distributionPlan: '商品详情页 + 使用指南 + 教程文章矩阵',
      nextAction: '补 3 篇长尾教程页，承接“内容日历模板”“小红书运营模板”等搜索词。',
      complianceNotes: '仅售卖自有模板与方法论，不承诺平台收益。',
      productId: workflowPack.id,
    },
    create: {
      slug: 'social-content-workflow-kit',
      title: '内容运营工作流模板',
      stage: 'LISTED',
      status: 'ACTIVE',
      categoryLabel: '运营模板',
      audience: '创作者 / 小团队',
      demandScore: 6,
      marginScore: 9,
      competitionScore: 4,
      speedScore: 7,
      confidenceScore: 7,
      riskLevel: 'LOW',
      suggestedPrice: 49,
      monthlyRevenueGoal: 3000,
      targetDailySales: 2,
      sourceUrl: 'https://www.shopify.com/blog/digital-products',
      evidenceSummary: 'Shopify 官方把数字模板和工具列为核心数字商品；Google Trends 中 social media calendar template 稳定有需求。',
      sourcingPlan: '以可复制 SOP + 模板打包交付，每月补一次渠道更新。',
      keywords: 'content workflow, social media calendar template, 标题模板, 内容运营 SOP',
      distributionPlan: '商品详情页 + 使用指南 + 教程文章矩阵',
      nextAction: '补 3 篇长尾教程页，承接“内容日历模板”“小红书运营模板”等搜索词。',
      complianceNotes: '仅售卖自有模板与方法论，不承诺平台收益。',
      productId: workflowPack.id,
    },
  })

  const existingGuideTask = await prisma.contentTask.findFirst({
    where: { title: '撰写 Midjourney 提示词购买指南' },
  })

  if (!existingGuideTask) {
    await prisma.contentTask.create({
      data: {
        title: '撰写 Midjourney 提示词购买指南',
        channel: 'ARTICLE',
        stage: 'READY',
        keyword: 'midjourney 提示词',
        draftTitle: 'Midjourney 提示词包购买与使用指南',
        draftSummary: '介绍适用场景、交付方式与常见问题。',
        opportunityId: promptOpportunity.id,
        articleId: buyingGuide.id,
      },
    })
  }

  const existingWorkflowTask = await prisma.contentTask.findFirst({
    where: { title: '生成内容运营工作流长尾教程页' },
  })

  if (!existingWorkflowTask) {
    await prisma.contentTask.create({
      data: {
        title: '生成内容运营工作流长尾教程页',
        channel: 'SEO_PAGE',
        stage: 'TODO',
        keyword: 'social media calendar template',
        draftTitle: '内容日历模板怎么选',
        draftSummary: '承接“内容日历模板”“社媒内容模板”等词。',
        opportunityId: workflowOpportunity.id,
      },
    })
  }

  const existingPinterestTask = await prisma.contentTask.findFirst({
    where: { title: '制作 Pinterest Pin 集群导流 AI 图片提示词包' },
  })

  if (!existingPinterestTask) {
    await prisma.contentTask.create({
      data: {
        title: '制作 Pinterest Pin 集群导流 AI 图片提示词包',
        channel: 'PINTEREST',
        stage: 'TODO',
        keyword: 'midjourney poster prompts',
        draftTitle: '5 poster prompts for ecommerce covers',
        draftSummary: '围绕电商主图、海报封面和头像修图做 10 张可持续分发的 Pin。',
        opportunityId: promptOpportunity.id,
        notes: '每个 Pin 直接链到 /products/midjourney-poster-prompts 或购买指南页。',
      },
    })
  }

  const existingYoutubeTask = await prisma.contentTask.findFirst({
    where: { title: '录制 YouTube Shorts 演示内容运营工作流' },
  })

  if (!existingYoutubeTask) {
    await prisma.contentTask.create({
      data: {
        title: '录制 YouTube Shorts 演示内容运营工作流',
        channel: 'YOUTUBE',
        stage: 'TODO',
        keyword: 'content workflow template',
        draftTitle: 'How I plan 30 days of content in 10 minutes',
        draftSummary: '用 30-45 秒展示工作流模板如何完成选题、排期和复盘。',
        opportunityId: workflowOpportunity.id,
        notes: '若频道满足条件，后续接入 YouTube Shopping 或描述区商品链接。',
      },
    })
  }

  const channelLaunchTasks = [
    {
      title: '小红书首批图文：AI 写真和商品图提示词种草',
      channel: 'REDNOTE',
      stage: 'READY',
      keyword: 'AI写真提示词, 商品图提示词, 小红书封面提示词',
      draftTitle: '我用 ChatGPT 生成了 20 套商品图/头像提示词',
      draftSummary: '首批 6 条图文：3 条展示 AI 写真/头像提示词，2 条展示商品主图提示词，1 条免费样例引导到完整包。',
      opportunityId: promptOpportunity.id,
      notes: '落地页：https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=rednote&utm_medium=social&utm_campaign=photo_prompts。半自动发布，账号登录后人工确认。',
    },
    {
      title: '知乎长文：普通人如何用 ChatGPT 做内容运营 SOP',
      channel: 'ZHIHU',
      stage: 'DRAFT',
      keyword: 'ChatGPT 内容运营, 内容运营 SOP, AI 副业工具',
      draftTitle: '普通人怎么用 ChatGPT 把选题、脚本、分发和复盘串起来？',
      draftSummary: '回答型长文，先给免费流程，再引导购买完整内容运营工作流模板。',
      opportunityId: workflowOpportunity.id,
      notes: '落地页：https://faka.minai.eu.org/products/chatgpt-content-ops-workflow-v1?utm_source=zhihu&utm_medium=community&utm_campaign=content_workflow。避免纯广告，优先回答真实问题。',
    },
    {
      title: 'Pinterest 首批 Pin：ChatGPT photo prompts',
      channel: 'PINTEREST',
      stage: 'READY',
      keyword: 'chatgpt photo prompts, ai image prompts, product photo prompts',
      draftTitle: '10 ChatGPT photo prompts for better product images',
      draftSummary: '制作 10 张竖版 Pin，每张展示一个场景：头像、商品图、海报、社媒封面、课程封面。',
      opportunityId: promptOpportunity.id,
      notes: '落地页：https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=pinterest&utm_medium=social&utm_campaign=prompt_pins。Pinterest API 接入前先生成素材和排期。',
    },
    {
      title: 'Reddit 社区验证：免费 prompt 样例换反馈',
      channel: 'REDDIT',
      stage: 'TODO',
      keyword: 'AI prompts, product photography prompts, prompt engineering',
      draftTitle: 'I made a small prompt pack for product images. Looking for feedback.',
      draftSummary: '只投放到允许自荐或反馈帖的社区，正文提供免费样例，不跨社区复制粘贴。',
      opportunityId: promptOpportunity.id,
      notes: '落地页：https://faka.minai.eu.org/pages/ai-image-prompt-pack-guide?utm_source=reddit&utm_medium=community&utm_campaign=prompt_help。发布前检查 subreddit rules。',
    },
    {
      title: 'YouTube Shorts 模板：30 秒展示提示词前后效果',
      channel: 'YOUTUBE',
      stage: 'DRAFT',
      keyword: 'ChatGPT photo prompts, AI product image prompts',
      draftTitle: 'One prompt turned a boring product photo into a poster',
      draftSummary: '短视频结构：问题 3 秒、提示词 8 秒、结果 12 秒、购买完整包 5 秒。',
      opportunityId: promptOpportunity.id,
      notes: '落地页：https://faka.minai.eu.org/products/ai-image-prompt-pack-v1?utm_source=youtube&utm_medium=shorts&utm_campaign=prompt_demo。需要频道 OAuth 后才能 API 上传。',
    },
  ]

  for (const task of channelLaunchTasks) {
    const existingTask = await prisma.contentTask.findFirst({
      where: { title: task.title },
    })

    if (!existingTask) {
      await prisma.contentTask.create({ data: task })
    }
  }

  console.log({ category, promptPack, workflowPack })
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
