import type { SupplierAdapter, SupplierProductSnapshot } from "@/lib/suppliers/types"

export async function getRealtimeSupplierProduct(
  adapter: SupplierAdapter,
  externalProductId: string,
  fallbackProduct?: SupplierProductSnapshot | null
): Promise<SupplierProductSnapshot> {
  const products = await adapter.listProducts()
  const listedProduct = products.find((product) => product.externalProductId === externalProductId)

  if (listedProduct) {
    return listedProduct
  }

  if (fallbackProduct && fallbackProduct.stock > 0) {
    return fallbackProduct
  }

  return adapter.getProduct(externalProductId)
}
