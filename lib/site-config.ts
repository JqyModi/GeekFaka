import { prisma } from "@/lib/prisma"

export const DEFAULT_SITE_TITLE = "AI数字资源站 - 提示词 / 工作流 / 数字权益自动发货"
export const DEFAULT_SITE_DESCRIPTION =
  "专注销售 AI 提示词、自动化工作流、数字模板与虚拟资源，支付后自动发货。"

const DEFAULT_SITE_KEYWORDS = [
  "AI提示词",
  "工作流模板",
  "数字商品",
  "自动发卡",
  "虚拟资源",
  "数字模板",
]

export async function getPublicSiteConfig() {
  const fallbackUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["site_title", "site_description", "site_keywords", "site_url"],
        },
      },
    })

    const byKey = Object.fromEntries(settings.map((item) => [item.key, item.value]))

    return {
      title: byKey.site_title || DEFAULT_SITE_TITLE,
      description: byKey.site_description || DEFAULT_SITE_DESCRIPTION,
      keywords: toKeywordArray(byKey.site_keywords),
      url: sanitizeSiteUrl(byKey.site_url) || fallbackUrl,
    }
  } catch (error) {
    return {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
      keywords: DEFAULT_SITE_KEYWORDS,
      url: fallbackUrl,
    }
  }
}

export function toKeywordArray(raw?: string | null) {
  if (!raw) return DEFAULT_SITE_KEYWORDS

  const keywords = raw
    .split(/[\n,，]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return keywords.length > 0 ? keywords : DEFAULT_SITE_KEYWORDS
}

export function stripMarkdown(markdown?: string | null) {
  if (!markdown) return ""

  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function truncateText(value: string, maxLength = 160) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

function sanitizeSiteUrl(value?: string | null) {
  if (!value) return null

  try {
    return new URL(value).toString().replace(/\/$/, "")
  } catch {
    return null
  }
}
