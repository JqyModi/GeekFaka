import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const body = await req.json()
    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: typeof body.name === "string" ? body.name.trim() : undefined,
        type: body.type,
        baseUrl: body.baseUrl,
        apiKeyEncrypted: typeof body.apiKey !== "undefined" ? body.apiKey : body.apiKeyEncrypted,
        enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
        syncEnabled: typeof body.syncEnabled === "boolean" ? body.syncEnabled : undefined,
        markupRate: typeof body.markupRate === "undefined" ? undefined : Number(body.markupRate),
        fixedFee: typeof body.fixedFee === "undefined" ? undefined : Number(body.fixedFee),
        safetyStock: typeof body.safetyStock === "undefined" ? undefined : Number(body.safetyStock),
        currency: body.currency,
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    await prisma.supplier.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
  }
}
