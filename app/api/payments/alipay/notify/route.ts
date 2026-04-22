import { NextResponse } from "next/server";
import { getPaymentAdapter } from "@/lib/payments/registry";
import { logger } from "@/lib/logger";
import { fulfillPaidOrder } from "@/lib/orders/fulfill-order";

const log = logger.child({ module: "AlipayNotify" });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = Object.fromEntries(searchParams.entries());
  return processNotification(data);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const data = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
  );
  return processNotification(data);
}

async function processNotification(data: Record<string, string>) {
  log.info({ data }, "Received Alipay callback");

  try {
    const adapter = getPaymentAdapter("alipay");
    const callbackData = await adapter.verifyCallback(data, {});

    if (callbackData.status === "PAID") {
      await fulfillPaidOrder(callbackData.orderNo, "alipay");
    }

    return new NextResponse("success");
  } catch (error) {
    log.error({ err: error, data }, "Alipay notification processing failed");
    return new NextResponse("fail", { status: 400 });
  }
}
