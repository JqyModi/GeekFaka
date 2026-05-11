import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { syncSupplierProducts } from "@/lib/suppliers/sync"

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
  })

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
  }

  try {
    const result = await syncSupplierProducts(supplier.id)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { healthStatus: "ERROR" },
    })

    return NextResponse.json(
      { error: error?.message || "Supplier sync failed" },
      { status: 500 }
    )
  }
}
