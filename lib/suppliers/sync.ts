import { prisma } from "@/lib/prisma"
import { calculateSalePrice } from "@/lib/suppliers/pricing"
import { getSupplierAdapter } from "@/lib/suppliers/registry"

export async function syncSupplierProducts(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  })

  if (!supplier) {
    throw new Error("Supplier not found")
  }

  const adapter = getSupplierAdapter(supplier)
  const [health, balance, snapshots] = await Promise.all([
    adapter.health(),
    adapter.getBalance().catch(() => null),
    adapter.listProducts(),
  ])
  const now = new Date()

  for (const snapshot of snapshots) {
    const supplierProduct = await prisma.supplierProduct.upsert({
      where: {
        supplierId_externalProductId: {
          supplierId: supplier.id,
          externalProductId: snapshot.externalProductId,
        },
      },
      create: {
        supplierId: supplier.id,
        externalProductId: snapshot.externalProductId,
        name: snapshot.name,
        description: snapshot.description,
        costPrice: snapshot.costPrice,
        currency: snapshot.currency,
        stock: snapshot.stock,
        status: snapshot.status,
        rawJson: JSON.stringify(snapshot.raw),
        lastSyncAt: now,
      },
      update: {
        name: snapshot.name,
        description: snapshot.description,
        costPrice: snapshot.costPrice,
        currency: snapshot.currency,
        stock: snapshot.stock,
        status: snapshot.status,
        rawJson: JSON.stringify(snapshot.raw),
        lastSyncAt: now,
      },
      include: {
        importedProduct: true,
      },
    })

    if (supplierProduct.importedProduct) {
      const imported = supplierProduct.importedProduct
      await prisma.product.update({
        where: { id: imported.id },
        data: {
          costPrice: snapshot.costPrice,
          syncedStock: snapshot.stock,
          price: imported.autoSyncPrice && imported.pricingMode === "MARKUP"
            ? calculateSalePrice(snapshot.costPrice, imported, supplier)
            : undefined,
          isActive: imported.autoSyncStock
            ? snapshot.status !== "ERROR"
            : undefined,
        },
      })
    }
  }

  await prisma.supplier.update({
    where: { id: supplier.id },
    data: {
      healthStatus: health.status,
      balance: balance?.balance,
      currency: balance?.currency || supplier.currency,
      lastSyncAt: now,
    },
  })

  return {
    supplierId: supplier.id,
    count: snapshots.length,
    healthStatus: health.status,
    balance: balance?.balance,
  }
}

