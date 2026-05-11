import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import ReactMarkdown from "react-markdown";
import { Metadata } from "next";
import { getPublicSiteConfig, stripMarkdown, truncateText } from "@/lib/site-config";

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const [article, site] = await Promise.all([
    prisma.article.findUnique({
      where: { slug: params.slug }
    }),
    getPublicSiteConfig(),
  ])

  if (!article) return { title: "Not Found" };

  const description = article.seoDescription
    || article.excerpt
    || truncateText(stripMarkdown(article.content || site.description))
  const title = article.seoTitle || `${article.title} - ${site.title}`

  return {
    title,
    description,
    keywords: article.focusKeyword ? [article.focusKeyword] : undefined,
    alternates: {
      canonical: `/pages/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug }
  });

  if (!article || !article.isVisible) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="container mx-auto max-w-3xl px-4 py-12 flex-1">
        <article className="theme-prose prose prose-zinc dark:prose-invert max-w-none">
          <h1>{article.title}</h1>
          <div className="text-sm text-muted-foreground mb-8">
            更新于 {new Date(article.updatedAt).toLocaleDateString()}
          </div>
          {article.excerpt && (
            <p className="mb-8 text-lg leading-8 text-muted-foreground not-prose">
              {article.excerpt}
            </p>
          )}
          <ReactMarkdown>{article.content || ""}</ReactMarkdown>
        </article>
      </div>

      <footer className="theme-footer border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} AI数字资源站. All rights reserved.
      </footer>
    </main>
  );
}
