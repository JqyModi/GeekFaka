import { Mmostore247Adapter } from "@/lib/suppliers/providers/mmostore247"
import type { SupplierAdapter, SupplierConfig } from "@/lib/suppliers/types"

export function getSupplierAdapter(supplier: SupplierConfig): SupplierAdapter {
  switch (supplier.type) {
    case "MMOSTORE247":
      return new Mmostore247Adapter(supplier)
    default:
      throw new Error(`Unsupported supplier type: ${supplier.type}`)
  }
}
