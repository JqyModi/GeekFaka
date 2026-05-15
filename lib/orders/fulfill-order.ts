import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendOrderEmail } from "@/lib/mail";
import { getSupplierAdapter } from "@/lib/suppliers/registry";
import { getSupplierSellableStock } from "@/lib/suppliers/stock";
import { getRealtimeSupplierProduct } from "@/lib/suppliers/realtime";
import type { Prisma } from "@prisma/client";

const log = logger.child({ module: "OrderFulfillment" });

type SupplierFulfillmentOrder = Prisma.OrderGetPayload<{
  include: {
    product: {
      include: {
        supplier: true
        supplierProduct: true
      }
    }
  }
}>

export async function fulfillPaidOrder(orderNo: string, paymentMethod: string) {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      product: {
        include: {
          supplier: true,
          supplierProduct: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "PAID") {
    return { status: "already_paid" as const };
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (order.createdAt < thirtyMinutesAgo) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "EXPIRED" },
    });
    return { status: "expired" as const };
  }

  const result = order.product.sourceType === "SUPPLIER"
    ? await fulfillSupplierOrder(order, paymentMethod)
    : await fulfillLocalLicenseOrder(order.orderNo, paymentMethod);

  if (result.status === "fulfilled") {
    sendOrderEmail(orderNo).catch((error) => {
      log.error({ err: error, orderNo }, "Email background task failed");
    });
  }

  return result;
}

async function fulfillLocalLicenseOrder(orderNo: string, paymentMethod: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNo },
      include: { product: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const licenses = await tx.license.findMany({
      where: {
        productId: order.productId,
        status: "AVAILABLE",
      },
      orderBy: { createdAt: "asc" },
      take: order.quantity,
    });

    if (licenses.length < order.quantity) {
      throw new Error("Insufficient stock for paid order");
    }

    await tx.license.updateMany({
      where: { id: { in: licenses.map((license) => license.id) } },
      data: { status: "SOLD", orderId: order.id },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentMethod,
        paidAt: new Date(),
      },
    });

    return { status: "fulfilled" as const };
  });
}

async function fulfillSupplierOrder(
  order: SupplierFulfillmentOrder,
  paymentMethod: string
) {
  const { product } = order;
  if (!product.supplier || !product.supplierProduct || !product.supplier.enabled) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    throw new Error("Supplier product is not available");
  }

  const supplier = product.supplier;
  const supplierProduct = product.supplierProduct;
  const adapter = getSupplierAdapter(supplier);
  const upstreamProduct = await getRealtimeSupplierProduct(adapter, supplierProduct.externalProductId);
  const sellableStock = getSupplierSellableStock(upstreamProduct.stock, product.safetyStock);

  await prisma.product.update({
    where: { id: product.id },
    data: {
      costPrice: upstreamProduct.costPrice,
      syncedStock: upstreamProduct.stock,
    },
  });

  if (sellableStock < order.quantity) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    throw new Error("Insufficient supplier stock for paid order");
  }

  const purchase = await adapter.purchase({
    externalProductId: supplierProduct.externalProductId,
    quantity: order.quantity,
  });

  if (purchase.codes.length === 0) {
    await prisma.supplierOrder.create({
      data: {
        orderId: order.id,
        supplierId: supplier.id,
        supplierProductId: supplierProduct.id,
        externalOrderCode: purchase.externalOrderCode || null,
        quantityRequested: order.quantity,
        quantityFulfilled: purchase.quantityFulfilled,
        costPrice: purchase.unitPrice || upstreamProduct.costPrice,
        status: "FAILED",
        rawResponse: JSON.stringify(purchase.raw),
      },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    throw new Error("Supplier purchase did not return deliverable codes");
  }

  await prisma.$transaction(async (tx) => {
    await tx.supplierOrder.create({
      data: {
        orderId: order.id,
        supplierId: supplier.id,
        supplierProductId: supplierProduct.id,
        externalOrderCode: purchase.externalOrderCode || null,
        quantityRequested: order.quantity,
        quantityFulfilled: purchase.quantityFulfilled,
        costPrice: purchase.unitPrice || upstreamProduct.costPrice,
        status: purchase.quantityFulfilled >= order.quantity ? "FULFILLED" : "PARTIAL",
        rawResponse: JSON.stringify(purchase.raw),
      },
    });

    await tx.license.createMany({
      data: purchase.codes.map((code) => ({
        code,
        productId: product.id,
        status: "SOLD",
        orderId: order.id,
      })),
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentMethod,
        paidAt: new Date(),
      },
    });
  });

  return { status: "fulfilled" as const };
}
