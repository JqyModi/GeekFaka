import { prisma } from "@/lib/prisma"

const SUPPLIER_PURCHASE_DRY_RUN_KEY = "supplier_purchase_dry_run"

export async function isSupplierPurchaseDryRunEnabled() {
  if (process.env.SUPPLIER_PURCHASE_DRY_RUN === "true") {
    return true
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: SUPPLIER_PURCHASE_DRY_RUN_KEY },
  })

  return setting?.value === "true"
}
