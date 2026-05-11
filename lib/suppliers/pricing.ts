import { Prisma } from "@prisma/client"

type PricingConfig = {
  markupRate?: Prisma.Decimal | number | string | null
  fixedFee?: Prisma.Decimal | number | string | null
}

function toNumber(value: Prisma.Decimal | number | string | null | undefined, fallback: number) {
  if (value === null || typeof value === "undefined") return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function calculateSalePrice(
  costPrice: Prisma.Decimal | number | string,
  productConfig?: PricingConfig | null,
  supplierConfig?: PricingConfig | null
) {
  const cost = toNumber(costPrice, 0)
  const markupRate = toNumber(productConfig?.markupRate, toNumber(supplierConfig?.markupRate, 1))
  const fixedFee = toNumber(productConfig?.fixedFee, toNumber(supplierConfig?.fixedFee, 0))

  return Math.max(0, Math.round((cost * markupRate + fixedFee) * 100) / 100)
}

export function getEffectivePricingConfig(
  productConfig?: PricingConfig | null,
  supplierConfig?: PricingConfig | null
) {
  return {
    markupRate: toNumber(productConfig?.markupRate, toNumber(supplierConfig?.markupRate, 1)),
    fixedFee: toNumber(productConfig?.fixedFee, toNumber(supplierConfig?.fixedFee, 0)),
  }
}
