import { Mmostore247Adapter } from "@/lib/suppliers/providers/mmostore247"
import { decryptSupplierSecret } from "@/lib/suppliers/secret"
import type { SupplierAdapter, SupplierConfig } from "@/lib/suppliers/types"

export function getSupplierAdapter(supplier: SupplierConfig): SupplierAdapter {
  const config = {
    ...supplier,
    apiKeyEncrypted: decryptSupplierSecret(supplier.apiKeyEncrypted),
  }

  switch (supplier.type) {
    case "MMOSTORE247":
      return new Mmostore247Adapter(config)
    default:
      throw new Error(`Unsupported supplier type: ${supplier.type}`)
  }
}
