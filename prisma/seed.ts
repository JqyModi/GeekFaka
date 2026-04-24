import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

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
  const promptPack = await prisma.product.create({
    data: {
      name: 'Midjourney 海报提示词包',
      description: '适用于海报、电商主图与社媒封面，含多场景高转化提示词模板与使用说明。',
      price: 29.90,
      categoryId: category.id,
      licenses: {
        create: [
          { code: 'MJ-POSTER-PROMPT-001' },
          { code: 'MJ-POSTER-PROMPT-002' },
          { code: 'MJ-POSTER-PROMPT-003' },
        ]
      }
    }
  })

  // Create Product 2
  const workflowPack = await prisma.product.create({
    data: {
      name: 'ChatGPT 内容运营工作流',
      description: '覆盖选题、标题、长文、短视频脚本与复盘流程，适合个人创作者与小团队提效。',
      price: 49.00,
      categoryId: category.id,
      licenses: {
        create: [
          { code: 'GPT-CONTENT-WORKFLOW-001' },
          { code: 'GPT-CONTENT-WORKFLOW-002' },
        ]
      }
    }
  })

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
