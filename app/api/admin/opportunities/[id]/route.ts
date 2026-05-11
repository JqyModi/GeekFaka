import { NextResponse } from "next/server"

import { isAuthenticated } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const body = await req.json()

    const item = await prisma.productOpportunity.update({
      where: { id: params.id },
      data: {
        title: body.title,
        slug: typeof body.slug === "string" ? (body.slug.trim() ? slugify(body.slug) : undefined) : undefined,
        stage: body.stage,
        status: body.status,
        categoryLabel: body.categoryLabel,
        audience: body.audience,
        demandScore: typeof body.demandScore === "undefined" ? undefined : Number(body.demandScore),
        marginScore: typeof body.marginScore === "undefined" ? undefined : Number(body.marginScore),
        competitionScore: typeof body.competitionScore === "undefined" ? undefined : Number(body.competitionScore),
        speedScore: typeof body.speedScore === "undefined" ? undefined : Number(body.speedScore),
        confidenceScore: typeof body.confidenceScore === "undefined" ? undefined : Number(body.confidenceScore),
        riskLevel: body.riskLevel,
        suggestedPrice: body.suggestedPrice,
        monthlyRevenueGoal: body.monthlyRevenueGoal,
        targetDailySales: typeof body.targetDailySales === "undefined" ? undefined : Number(body.targetDailySales),
        sourceUrl: body.sourceUrl,
        evidenceSummary: body.evidenceSummary,
        sourcingPlan: body.sourcingPlan,
        keywords: body.keywords,
        distributionPlan: body.distributionPlan,
        nextAction: body.nextAction,
        complianceNotes: body.complianceNotes,
        productId: typeof body.productId === "undefined" ? undefined : body.productId || null,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    await prisma.productOpportunity.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 })
  }
}
