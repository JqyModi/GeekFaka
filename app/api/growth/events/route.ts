import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

const EVENT_TYPES = new Set([
  "page_view",
  "product_view",
  "product_link_click",
  "checkout_open",
  "checkout_submit",
  "order_created",
])

function pickString(value: unknown, max = 500) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null
}

function hashIp(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || ""

  if (!ip) return null

  const salt = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "growth-event-salt"
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const type = pickString(body.type, 80)

    if (!type || !EVENT_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }

    const attribution = body.attribution && typeof body.attribution === "object"
      ? body.attribution as Record<string, unknown>
      : {}
    const metadata = body.metadata && typeof body.metadata === "object"
      ? body.metadata as Record<string, unknown>
      : {}
    const path = pickString(body.path, 500) || pickString(attribution.landingPath, 500) || "/"
    const productSlug = pickString(body.productSlug, 180)
      || (path.match(/\/products\/([^/?#]+)/)?.[1] ?? null)

    await prisma.growthEvent.create({
      data: {
        type,
        path,
        productSlug,
        productId: pickString(body.productId, 180) || pickString(metadata.productId, 180),
        utmSource: pickString(attribution.utmSource, 120),
        utmMedium: pickString(attribution.utmMedium, 120),
        utmCampaign: pickString(attribution.utmCampaign, 180),
        utmContent: pickString(attribution.utmContent, 180),
        referrer: pickString(attribution.referrer, 500) || pickString(body.referrer, 500),
        sessionId: pickString(body.sessionId, 120) || pickString(attribution.sessionId, 120),
        visitorId: pickString(body.visitorId, 120) || pickString(attribution.visitorId, 120),
        userAgent: pickString(req.headers.get("user-agent"), 500),
        ipHash: hashIp(req),
        metadata: Object.keys(metadata).length ? JSON.stringify(metadata).slice(0, 2000) : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 })
  }
}
