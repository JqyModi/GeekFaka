import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { ArrowRight, BadgeCheck, BookOpen, Package, ShoppingCart, Truck } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getPublicSiteConfig, stripMarkdown, toKeywordArray, truncateText } from "@/lib/site-config"

interface ProductPageProps {
  params: {
    slug: string
  }
}

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      category: true,
      _count: {
        select: {
          licenses: {
            where: { status: "AVAILABLE" },
          },
        },
      },
    },
  })
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const [product, site] = await Promise.all([
    getProduct(params.slug),
    getPublicSiteConfig(),
  ])

  if (!product) {
    return {
      title: "商品不存在",
    }
  }

  const description = product.seoDescription
    || truncateText(stripMarkdown(product.description || product.tagline || site.description))
  const title = product.seoTitle || `${product.name} - ${site.title}`
  const keywords = toKeywordArray(product.searchKeywords).concat(product.category.name)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${site.url}/products/${product.slug}`,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const [product, site] = await Promise.all([
    getProduct(params.slug),
    getPublicSiteConfig(),
  ])

  if (!product) {
    notFound()
  }

  const stock = product._count.licenses
  const keywords = toKeywordArray(product.searchKeywords)
  const description = product.seoDescription
    || truncateText(stripMarkdown(product.description || product.tagline || site.description))

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      price: Number(product.price).toFixed(2),
      priceCurrency: "CNY",
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}/products/${product.slug}`,
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="site-hero-glow absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[100px]" />
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1.3fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.category.name}</Badge>
              <Badge variant="outline">{stock > 0 ? `库存 ${stock}` : "暂时缺货"}</Badge>
              <Badge variant="outline">{product.deliveryFormat}</Badge>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
                {product.name}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {product.tagline || "适合即买即用的数字资源场景，支持自动发货与售后追踪。"}
              </p>
            </div>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.slice(0, 8).map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            <div className="theme-prose prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{product.description || "暂无详细描述。"}</ReactMarkdown>
            </div>
          </div>

          <aside className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="space-y-6">
              <div>
                <div className="text-sm text-muted-foreground">当前售价</div>
                <div className="mt-2 flex items-end gap-1 text-primary">
                  <span className="text-lg font-medium">¥</span>
                  <span className="text-5xl font-black tracking-tight">{Number(product.price).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    自动交付
                  </span>
                  <span>支付成功后发货</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    补货阈值
                  </span>
                  <span>{product.restockThreshold} 件</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    发货格式
                  </span>
                  <span>{product.deliveryFormat}</span>
                </div>
              </div>

              {stock > 0 ? (
                <Button asChild className="theme-cta-button w-full font-semibold" size="lg">
                  <Link href={`/?buy=${product.slug}`}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    立即购买
                  </Link>
                </Button>
              ) : (
                <Button className="theme-cta-button w-full font-semibold" size="lg" disabled>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  等待补货
                </Button>
              )}

              <Button asChild variant="outline" className="theme-outline-button w-full">
                <Link href="/pages">
                  <BookOpen className="mr-2 h-4 w-4" />
                  查看购买指南
                </Link>
              </Button>

              <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
                返回首页继续选购
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </main>
  )
}
