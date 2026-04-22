import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentAdapter } from "@/lib/payments/registry";
import { PaymentStatus } from "@/lib/payments/types";
import { fulfillPaidOrder } from "@/lib/orders/fulfill-order";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "OrderCheck" });

export async function POST(
  _req: Request,
  { params }: { params: { orderNo: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNo: params.orderNo },
      select: { orderNo: true, status: true, paymentMethod: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ status: "PAID" });
    }

    if (!order.paymentMethod) {
      return NextResponse.json({ status: order.status });
    }

    const adapter = getPaymentAdapter(order.paymentMethod);
    if (!adapter.queryStatus) {
      return NextResponse.json({ status: order.status });
    }

    const upstreamStatus = await adapter.queryStatus(order.orderNo);

    if (upstreamStatus === PaymentStatus.PAID) {
      await fulfillPaidOrder(order.orderNo, order.paymentMethod);
    } else if (upstreamStatus === PaymentStatus.EXPIRED) {
      await prisma.order.update({
        where: { orderNo: order.orderNo },
        data: { status: "EXPIRED" },
      });
    }

    const latestOrder = await prisma.order.findUnique({
      where: { orderNo: order.orderNo },
      select: { status: true },
    });

    return NextResponse.json({ status: latestOrder?.status || order.status });
  } catch (error) {
    log.error({ err: error, orderNo: params.orderNo }, "Manual payment check failed");
    return NextResponse.json({ error: "查询支付状态失败" }, { status: 500 });
  }
}
