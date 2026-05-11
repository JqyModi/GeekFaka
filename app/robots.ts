import { MetadataRoute } from "next"

import { getPublicSiteConfig } from "@/lib/site-config"

export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getPublicSiteConfig()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/digital-products"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
