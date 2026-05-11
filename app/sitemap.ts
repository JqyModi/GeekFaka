import { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { getPublicSiteConfig } from "@/lib/site-config"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getPublicSiteConfig()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${site.url}/pages`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  try {
    const [articles, products] = await Promise.all([
      prisma.article.findMany({
        where: { isVisible: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          slug: {
            not: null,
          },
        },
        select: { slug: true, updatedAt: true },
      }),
    ])

    const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${site.url}/pages/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }))

    const productRoutes: MetadataRoute.Sitemap = products
      .filter((product) => product.slug)
      .map((product) => ({
        url: `${site.url}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "daily",
        priority: 0.9,
      }))

    return [...staticRoutes, ...articleRoutes, ...productRoutes]
  } catch (error) {
    return staticRoutes
  }
}
