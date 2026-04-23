import { Navbar } from "@/components/navbar";
import { StoreFront } from "@/components/store-front";
import { prisma } from "@/lib/prisma";
import ReactMarkdown from "react-markdown";
import { Announcement } from "@/components/announcement";

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
      select: { title: true, slug: true },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.warn("Failed to fetch homepage data (likely during build):", error);
  }

      const categories = categoriesData.map(cat => ({
      id: cat.id,
      name: cat.name,
      products: cat.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        stock: p._count.licenses
      }))
    }));
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
