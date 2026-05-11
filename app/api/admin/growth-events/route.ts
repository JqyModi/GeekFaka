import { NextResponse } from "next/server"

import { isAuthenticated } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const EVENT_LIMIT = 5000

function sourceKey(source?: string | null) {
  return source && source.trim() ? source : "(direct)"
}

function campaignKey(campaign?: string | null) {
  return campaign && campaign.trim() ? campaign : "(none)"
}

function contentKey(content?: string | null) {
  return content && content.trim() ? content : "(none)"
}

export async function GET(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  const url = new URL(req.url)
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 14), 1), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [events, paidOrders] = await Promise.all([
    prisma.growthEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: EVENT_LIMIT,
      select: {
        id: true,
        type: true,
        path: true,
        productSlug: true,
        utmSource: true,
        utmCampaign: true,
        utmContent: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: since },
      },
      select: {
        id: true,
        totalAmount: true,
        utmSource: true,
        utmCampaign: true,
        utmContent: true,
      },
    }),
  ])

  const summary = {
    events: events.length,
    pageViews: 0,
    productViews: 0,
    checkoutOpens: 0,
    checkoutSubmits: 0,
    orderCreates: 0,
    paidOrders: paidOrders.length,
    revenue: paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
  }

  const rows = new Map<string, {
    key: string
    source: string
    campaign: string
    content: string
    pageViews: number
    productViews: number
    checkoutOpens: number
    checkoutSubmits: number
    orderCreates: number
    paidOrders: number
    revenue: number
  }>()

  const ensureRow = (source?: string | null, campaign?: string | null, content?: string | null) => {
    const rowSource = sourceKey(source)
    const rowCampaign = campaignKey(campaign)
    const rowContent = contentKey(content)
    const key = `${rowSource}::${rowCampaign}::${rowContent}`
    const existing = rows.get(key)
    if (existing) return existing

    const row = {
      key,
      source: rowSource,
      campaign: rowCampaign,
      content: rowContent,
      pageViews: 0,
      productViews: 0,
      checkoutOpens: 0,
      checkoutSubmits: 0,
      orderCreates: 0,
      paidOrders: 0,
      revenue: 0,
    }
    rows.set(key, row)
    return row
  }

  for (const event of events) {
    const row = ensureRow(event.utmSource, event.utmCampaign, event.utmContent)
    if (event.type === "page_view") {
      summary.pageViews += 1
      row.pageViews += 1
    }
    if (event.type === "product_view") {
      summary.productViews += 1
      row.productViews += 1
    }
    if (event.type === "checkout_open") {
      summary.checkoutOpens += 1
      row.checkoutOpens += 1
    }
    if (event.type === "checkout_submit") {
      summary.checkoutSubmits += 1
      row.checkoutSubmits += 1
    }
    if (event.type === "order_created") {
      summary.orderCreates += 1
      row.orderCreates += 1
    }
  }

  for (const order of paidOrders) {
    const row = ensureRow(order.utmSource, order.utmCampaign, order.utmContent)
    row.paidOrders += 1
    row.revenue += Number(order.totalAmount || 0)
  }

  return NextResponse.json({
    days,
    summary,
    rows: [...rows.values()].sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue
      return (b.productViews + b.checkoutOpens) - (a.productViews + a.checkoutOpens)
    }),
    recentEvents: events.slice(0, 20),
  })
}
