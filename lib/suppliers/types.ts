export interface SupplierConfig {
  id: string
  name: string
  type: string
  baseUrl: string
  apiKeyEncrypted?: string | null
  currency?: string | null
}

export interface SupplierHealth {
  healthy: boolean
  status: string
  raw?: unknown
}

export interface SupplierBalance {
  balance: number
  currency?: string
  raw?: unknown
}

export interface SupplierProductSnapshot {
  externalProductId: string
  name: string
  description?: string | null
  costPrice: number
  currency: string
  stock: number
  status: string
  raw: unknown
}

export interface SupplierPurchaseInput {
  externalProductId: string
  quantity: number
}

export interface SupplierPurchaseResult {
  externalOrderCode: string
  quantityFulfilled: number
  unitPrice?: number
  totalPrice?: number
  balanceAfter?: number
  codes: string[]
  raw: unknown
}

export interface SupplierOrderSnapshot {
  externalOrderCode: string
  status: string
  quantityFulfilled: number
  codes: string[]
  raw: unknown
}

export interface SupplierAdapter {
  health(): Promise<SupplierHealth>
  listProducts(): Promise<SupplierProductSnapshot[]>
  getProduct(externalProductId: string): Promise<SupplierProductSnapshot>
  purchase(input: SupplierPurchaseInput): Promise<SupplierPurchaseResult>
  getBalance(): Promise<SupplierBalance>
  getOrder(externalOrderCode: string): Promise<SupplierOrderSnapshot>
}
