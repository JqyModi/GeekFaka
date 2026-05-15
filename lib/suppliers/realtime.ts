import type { SupplierAdapter, SupplierProductSnapshot } from "@/lib/suppliers/types"

export async function getRealtimeSupplierProduct(
  adapter: SupplierAdapter,
  externalProductId: string
): Promise<SupplierProductSnapshot> {
  const products = await adapter.listProducts()
  const listedProduct = products.find((product) => product.externalProductId === externalProductId)

  if (listedProduct) {
    return listedProduct
  }

  return adapter.getProduct(externalProductId)
}

