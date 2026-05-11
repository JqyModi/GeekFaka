import { NextResponse } from "next/server"

import { isAuthenticated } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  const items = await prisma.contentTask.findMany({
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
  })

  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const body = await req.json()

    if (!body.title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 })
    }

    const item = await prisma.contentTask.create({
      data: {
        title: body.title,
        channel: body.channel || "ARTICLE",
        stage: body.stage || "TODO",
        keyword: body.keyword || null,
        draftTitle: body.draftTitle || null,
        draftSummary: body.draftSummary || null,
        publishedUrl: body.publishedUrl || null,
        notes: body.notes || null,
        opportunityId: body.opportunityId || null,
        articleId: body.articleId || null,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create content task" }, { status: 500 })
  }
}
