import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export async function GET(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const [articles, total] = await prisma.$transaction([
    prisma.article.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.article.count()
  ]);

  return NextResponse.json({
    items: articles,
    total
  });
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const { title, slug, excerpt, content, seoTitle, seoDescription, focusKeyword, isVisible } = body;

    if (!title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug: slugify(slug || title),
        excerpt,
        content,
        seoTitle,
        seoDescription,
        focusKeyword,
        isVisible: isVisible ?? true
      }
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
