import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendOrderEmail } from "@/lib/mail";

const log = logger.child({ module: "OrderFulfillment" });

export async function fulfillPaidOrder(orderNo: string, paymentMethod: string) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNo },
      include: { product: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "PAID") {
      return { status: "already_paid" as const };
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (order.createdAt < thirtyMinutesAgo) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "EXPIRED" },
      });
      return { status: "expired" as const };
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

  if (result.status === "fulfilled") {
    sendOrderEmail(orderNo).catch((error) => {
      log.error({ err: error, orderNo }, "Email background task failed");
    });
  }

  return result;
}
