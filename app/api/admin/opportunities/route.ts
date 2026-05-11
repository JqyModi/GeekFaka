import { NextResponse } from "next/server"

import { isAuthenticated } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export async function GET() {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  const items = await prisma.productOpportunity.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          contentTasks: true,
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

    const item = await prisma.productOpportunity.create({
      data: {
        title: body.title,
        slug: slugify(body.slug || body.title),
        stage: body.stage || "DISCOVERY",
        status: body.status || "ACTIVE",
        categoryLabel: body.categoryLabel || null,
        audience: body.audience || null,
        demandScore: Number(body.demandScore || 0),
        marginScore: Number(body.marginScore || 0),
        competitionScore: Number(body.competitionScore || 0),
        speedScore: Number(body.speedScore || 0),
        confidenceScore: Number(body.confidenceScore || 0),
        riskLevel: body.riskLevel || "LOW",
        suggestedPrice: body.suggestedPrice || null,
        monthlyRevenueGoal: body.monthlyRevenueGoal || null,
        targetDailySales: body.targetDailySales ? Number(body.targetDailySales) : null,
        sourceUrl: body.sourceUrl || null,
        evidenceSummary: body.evidenceSummary || null,
        sourcingPlan: body.sourcingPlan || null,
        keywords: body.keywords || null,
        distributionPlan: body.distributionPlan || null,
        nextAction: body.nextAction || null,
        complianceNotes: body.complianceNotes || null,
        productId: body.productId || null,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 })
  }
}
