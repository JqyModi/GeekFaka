import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthenticated } from "@/lib/auth"
import { slugify } from "@/lib/slug"
import { calculateSalePrice } from "@/lib/suppliers/pricing"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const supplierProduct = await prisma.supplierProduct.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        importedProduct: true,
      },
    })

    if (!supplierProduct) {
      return NextResponse.json({ error: "Supplier product not found" }, { status: 404 })
    }

    if (supplierProduct.importedProduct) {
      return NextResponse.json(supplierProduct.importedProduct)
    }

    const category = body.categoryId
      ? await prisma.category.findUnique({ where: { id: body.categoryId } })
      : await prisma.category.findFirst({ orderBy: { createdAt: "asc" } })

    if (!category) {
      return NextResponse.json({ error: "Please create a category before importing products" }, { status: 400 })
    }

    const markupRate = Number(body.markupRate || supplierProduct.supplier.markupRate)
    const fixedFee = Number(body.fixedFee ?? supplierProduct.supplier.fixedFee)
    const price = calculateSalePrice(
      supplierProduct.costPrice,
      { markupRate, fixedFee, currency: supplierProduct.currency },
      supplierProduct.supplier
    )

    const product = await prisma.product.create({
      data: {
        name: body.name || supplierProduct.name,
        slug: slugify(body.slug || supplierProduct.name),
        description: body.description || supplierProduct.description,
        price,
        categoryId: category.id,
        deliveryFormat: body.deliveryFormat || "SINGLE",
        sourceType: "SUPPLIER",
        supplierId: supplierProduct.supplierId,
        supplierProductId: supplierProduct.id,
        supplierName: supplierProduct.supplier.name,
        supplierUrl: supplierProduct.supplier.baseUrl,
        costPrice: supplierProduct.costPrice,
        pricingMode: "MARKUP",
        markupRate,
        fixedFee,
        safetyStock: Number(body.safetyStock ?? supplierProduct.supplier.safetyStock),
        syncedStock: supplierProduct.stock,
        autoSyncStock: true,
        autoSyncPrice: Boolean(body.autoSyncPrice ?? true),
        isActive: true,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to import supplier product" },
      { status: 500 }
    )
  }
}
