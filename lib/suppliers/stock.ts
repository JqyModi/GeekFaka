type ProductStockInput = {
  sourceType?: string | null
  syncedStock?: number | null
  safetyStock?: number | null
  _count?: {
    licenses?: number
  } | null
}

export function getSellableStock(product: ProductStockInput) {
  if (product.sourceType === "SUPPLIER") {
    return Math.max(0, Number(product.syncedStock || 0) - Number(product.safetyStock || 0))
  }

  return Math.max(0, Number(product._count?.licenses || 0))
}

export function getSupplierSellableStock(stock: number, safetyStock: number) {
  return Math.max(0, Number(stock || 0) - Number(safetyStock || 0))
}
