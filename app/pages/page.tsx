import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { ChevronRight, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { stripMarkdown, truncateText } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function HelpCenterPage() {
  const articles = await prisma.article.findMany({
    where: { isVisible: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-16 flex-1">
        <div className="text-center mb-12 space-y-4">
          <div className="theme-icon-badge inline-flex p-4 rounded-[1.75rem] mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">使用指南</h1>
          <p className="text-muted-foreground text-lg">购买说明、交付方式、常见问题与售后规则都在这里</p>
        </div>

        <div className="grid gap-4">
          {articles.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground">
              暂无内容
            </div>
          ) : (
            articles.map((article) => (
              <Link key={article.slug} href={`/pages/${article.slug}`}>
                <Card className="theme-card hover:theme-card-hover transition-all group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription>
                        更新于 {new Date(article.updatedAt).toLocaleDateString()}
                      </CardDescription>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {article.excerpt || truncateText(stripMarkdown(article.content), 120)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>

      <footer className="theme-footer border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} AI数字资源站. All rights reserved.
      </footer>
    </main>
  );
}
