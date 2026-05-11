import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  const products = await prisma.supplierProduct.findMany({
    where: { supplierId: params.id },
    include: {
      importedProduct: {
        select: {
          id: true,
          name: true,
          price: true,
          isActive: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { stock: "desc" },
      { updatedAt: "desc" },
    ],
  })

  return NextResponse.json({ products })
}
