import { Navbar } from "@/components/navbar";
import { StoreFront } from "@/components/store-front";
import { prisma } from "@/lib/prisma";
import ReactMarkdown from "react-markdown";
import { Announcement } from "@/components/announcement";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  let categoriesData: any[] = [];
  let contactInfo: any = null;
  let announcement: any = null;
  let articles: any[] = [];

  try {
    categoriesData = await prisma.category.findMany({
      orderBy: { priority: "desc" },
      include: {
        products: {
          where: { isActive: true },
          include: {
            _count: {
              select: { licenses: { where: { status: "AVAILABLE" } } }
            }
          }
        }
      }
    });

    contactInfo = await prisma.systemSetting.findUnique({
      where: { key: "site_contact_info" },
    });

    announcement = await prisma.systemSetting.findUnique({
      where: { key: "site_announcement" },
    });

    articles = await prisma.article.findMany({
      where: { isVisible: true },
      select: { title: true, slug: true, excerpt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
  } catch (error) {
    console.warn("Failed to fetch homepage data (likely during build):", error);
  }

      const categories = categoriesData.map(cat => ({
      id: cat.id,
      name: cat.name,
      products: cat.products.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        price: p.price.toString(),
        stock: p._count.licenses
      }))
    })).filter((cat) => cat.products.length > 0);
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex flex-col">
      <Navbar />
      
      {/* Dynamic Announcement (Bar + Popup) */}
      <Announcement content={announcement?.value} />

      {/* Hero Section - Background Only */}
      <section className="relative overflow-hidden pt-10 pb-6">
        <div className="site-hero-glow absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />
      </section>

      {/* Product Section */}
      <section className="container mx-auto max-w-6xl px-4 pb-12 flex-1">
        <StoreFront categories={categories} />
      </section>
      
      {/* Info Section */}
      <section className="theme-soft-section py-12 text-center">
        <div className="container px-4">
           <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
            精选 AI 提示词、工作流模板、自动化脚本与数字权益。<br/>
            下单后自动交付，适合个人创作者、团队提效与内容生产场景。
          </p>
        </div>
      </section>

      {articles.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <BookOpen className="h-3.5 w-3.5" />
                SEO 内容中枢
              </div>
              <h2 className="text-2xl font-bold text-white">教程、攻略与常见问题</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                用购买教程、交付说明和实战案例承接搜索流量，缩短下单决策时间。
              </p>
            </div>
            <Link href="/pages" className="text-sm font-medium text-primary hover:text-primary/80">
              查看全部
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/pages/${article.slug}`}
                className="group rounded-2xl border border-border/70 bg-card/60 p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <h3 className="line-clamp-2 text-lg font-semibold text-white group-hover:text-primary">
                      {article.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {article.excerpt || "围绕选品、使用方法、购买说明与售后规则，持续补齐搜索与转化内容。"}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  更新于 {new Date(article.updatedAt).toLocaleDateString("zh-CN")}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="theme-footer border-t py-12 text-center text-sm text-muted-foreground">
        <div className="container mx-auto max-w-6xl px-4 space-y-8">
          <div className="space-y-4">
            <p>&copy; {new Date().getFullYear()} AI数字资源站. All rights reserved.</p>
            {contactInfo?.value && (
              <div className="theme-prose prose prose-sm dark:prose-invert mx-auto opacity-80">
                 <ReactMarkdown>{contactInfo.value}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}
