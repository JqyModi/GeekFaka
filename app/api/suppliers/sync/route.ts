import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncSupplierProducts } from "@/lib/suppliers/sync"

export const dynamic = "force-dynamic"

function isAuthorized(req: Request) {
  const token = process.env.SUPPLIER_SYNC_TOKEN
  if (!token) return false

  const auth = req.headers.get("authorization")
  const headerToken = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null
  const urlToken = new URL(req.url).searchParams.get("token")

  return headerToken === token || urlToken === token
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const supplierId = searchParams.get("supplierId")

  const suppliers = await prisma.supplier.findMany({
    where: {
      enabled: true,
      syncEnabled: true,
      ...(supplierId ? { id: supplierId } : {}),
    },
    select: { id: true },
  })

  const results = []
  for (const supplier of suppliers) {
    try {
      results.push({
        success: true,
        ...(await syncSupplierProducts(supplier.id)),
      })
    } catch (error: any) {
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: { healthStatus: "ERROR" },
      })
      results.push({
        success: false,
        supplierId: supplier.id,
        error: error?.message || "Supplier sync failed",
      })
    }
  }

  return NextResponse.json({
    success: results.every((result) => result.success),
    count: results.length,
    results,
  })
}
