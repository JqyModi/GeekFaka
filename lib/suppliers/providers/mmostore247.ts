import type {
  SupplierAdapter,
  SupplierBalance,
  SupplierConfig,
  SupplierHealth,
  SupplierOrderSnapshot,
  SupplierProductSnapshot,
  SupplierPurchaseInput,
  SupplierPurchaseResult,
} from "@/lib/suppliers/types"
import { isSupplierPurchaseDryRunEnabled } from "@/lib/suppliers/settings"

type JsonRecord = Record<string, any>

export class Mmostore247Adapter implements SupplierAdapter {
  private readonly baseUrl: string
  private readonly apiKey?: string | null
  private readonly currency: string

  constructor(private readonly supplier: SupplierConfig) {
    this.baseUrl = (supplier.baseUrl || "https://mmostore247.com/api/seller").replace(/\/+$/, "")
    this.apiKey = supplier.apiKeyEncrypted
    this.currency = supplier.currency || "USD"
  }

  async health(): Promise<SupplierHealth> {
    try {
      const raw = await this.request("/health", { auth: false })
      return {
        healthy: Boolean(raw?.success),
        status: raw?.success ? "HEALTHY" : "ERROR",
        raw,
      }
    } catch (error) {
      return {
        healthy: false,
        status: "ERROR",
        raw: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async listProducts(): Promise<SupplierProductSnapshot[]> {
    const raw = await this.request("/products", { currency: true })
    const products = Array.isArray(raw?.products) ? raw.products : []
    return products.map((product: JsonRecord) => this.normalizeProduct(product, raw?.currency))
  }

  async getProduct(externalProductId: string): Promise<SupplierProductSnapshot> {
    const raw = await this.request(`/product/${encodeURIComponent(externalProductId)}`, { currency: true })
    return this.normalizeProduct(raw?.product || raw?.data || raw, raw?.currency)
  }

  async purchase(input: SupplierPurchaseInput): Promise<SupplierPurchaseResult> {
    if (await isSupplierPurchaseDryRunEnabled()) {
      const codes = Array.from({ length: input.quantity }, (_, index) => {
        const sequence = String(index + 1).padStart(2, "0")
        return `dryrun-${input.externalProductId}-${Date.now()}-${sequence}`
      })
      const raw = {
        success: true,
        status: "fulfilled",
        order_code: `DRYRUN-${Date.now()}`,
        quantity: input.quantity,
        deliveredAccounts: codes,
        product: { _id: input.externalProductId },
      }

      return {
        externalOrderCode: raw.order_code,
        quantityFulfilled: input.quantity,
        codes,
        raw,
      }
    }

    const raw = await this.request("/purchase", {
      method: "POST",
      currency: true,
      body: JSON.stringify({
        product_id: input.externalProductId,
        quantity: input.quantity,
      }),
    })

    const codes = this.normalizeCodes(raw?.deliveredAccounts || raw?.accounts)
    return {
      externalOrderCode: String(raw?.order_code || raw?.orderCode || ""),
      quantityFulfilled: Number(raw?.quantity ?? codes.length),
      unitPrice: this.optionalNumber(raw?.unitPrice ?? raw?.unit_price),
      totalPrice: this.optionalNumber(raw?.totalPrice ?? raw?.total_amount),
      balanceAfter: this.optionalNumber(raw?.balanceAfter ?? raw?.balance_after),
      codes,
      raw,
    }
  }

  async getBalance(): Promise<SupplierBalance> {
    const raw = await this.request("/balance", { currency: true })
    return {
      balance: Number(raw?.balance || 0),
      currency: raw?.currency || this.currency,
      raw,
    }
  }

  async getOrder(externalOrderCode: string): Promise<SupplierOrderSnapshot> {
    const raw = await this.request(`/order/${encodeURIComponent(externalOrderCode)}`, { currency: true })
    const codes = this.normalizeCodes(raw?.deliveredAccounts || raw?.accounts)
    return {
      externalOrderCode: String(raw?.order_code || raw?.orderCode || externalOrderCode),
      status: String(raw?.status || (codes.length > 0 ? "FULFILLED" : "PENDING")).toUpperCase(),
      quantityFulfilled: Number(raw?.quantity ?? codes.length),
      codes,
      raw,
    }
  }

  private async request(
    path: string,
    options: {
      method?: string
      body?: BodyInit
      auth?: boolean
      currency?: boolean
    } = {}
  ) {
    const url = new URL(`${this.baseUrl}${path}`)
    if (options.currency) {
      url.searchParams.set("currency", this.currency)
    }

    const headers: HeadersInit = {
      Accept: "application/json",
    }

    if (options.body) {
      headers["Content-Type"] = "application/json"
    }

    if (options.auth !== false && this.apiKey) {
      headers["X-API-Key"] = this.apiKey
    }

    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body,
      cache: "no-store",
    })

    const raw = await this.parseJson(response)
    if (!response.ok || raw?.success === false) {
      const message = raw?.message || raw?.error || raw?.error_code || `Supplier request failed: ${response.status}`
      throw new Error(message)
    }

    return raw
  }

  private async parseJson(response: Response) {
    const text = await response.text()
    if (!text) return {}

    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Supplier returned non-JSON response: ${text.slice(0, 120)}`)
    }
  }

  private normalizeProduct(product: JsonRecord, fallbackCurrency?: string): SupplierProductSnapshot {
    const stats = product?.stats || {}
    const stock = Number(stats.available ?? product?.available ?? product?.stock ?? 0)
    const costPrice = Number(product?.pricing ?? product?.price ?? product?.unitPrice ?? 0)
    const externalProductId = String(product?._id || product?.id || product?.product_id || "")

    if (!externalProductId) {
      throw new Error("Supplier product is missing an external product id")
    }

    return {
      externalProductId,
      name: String(product?.product_name_zh || product?.product_name || product?.name || externalProductId),
      description: product?.description ? String(product.description) : null,
      costPrice: Number.isFinite(costPrice) ? costPrice : 0,
      currency: String(product?.currency || fallbackCurrency || this.currency),
      stock: Number.isFinite(stock) ? stock : 0,
      status: stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
      raw: product,
    }
  }

  private normalizeCodes(value: unknown) {
    if (!Array.isArray(value)) return []
    return value.map((item) => String(item)).filter(Boolean)
  }

  private optionalNumber(value: unknown) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
}
