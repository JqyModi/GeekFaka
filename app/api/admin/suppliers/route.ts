import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"

export async function GET() {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: {
          products: true,
          importedProducts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ suppliers })
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const body = await req.json()
    const supplier = await prisma.supplier.create({
      data: {
        name: String(body.name || "").trim(),
        type: body.type || "MMOSTORE247",
        baseUrl: body.baseUrl || "https://mmostore247.com/api/seller",
        apiKeyEncrypted: body.apiKey || body.apiKeyEncrypted || null,
        enabled: Boolean(body.enabled ?? true),
        syncEnabled: Boolean(body.syncEnabled ?? true),
        markupRate: Number(body.markupRate || 1.3),
        fixedFee: Number(body.fixedFee || 0),
        safetyStock: Number(body.safetyStock || 1),
        currency: body.currency || "USD",
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
  }
}
