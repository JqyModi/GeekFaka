import { NextResponse } from "next/server"

import { isAuthenticated } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const body = await req.json()

    const item = await prisma.contentTask.update({
      where: { id: params.id },
      data: {
        title: body.title,
        channel: body.channel,
        stage: body.stage,
        keyword: body.keyword,
        draftTitle: body.draftTitle,
        draftSummary: body.draftSummary,
        publishedUrl: body.publishedUrl,
        notes: body.notes,
        opportunityId: typeof body.opportunityId === "undefined" ? undefined : body.opportunityId || null,
        articleId: typeof body.articleId === "undefined" ? undefined : body.articleId || null,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update content task" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    await prisma.contentTask.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete content task" }, { status: 500 })
  }
}
