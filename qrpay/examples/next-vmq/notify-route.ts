import { NextResponse } from "next/server";
import { verifyVmqCallback, type VmqCallbackPayload } from "./vmq";

// 按你的主项目实际路径替换
// import { fulfillPaidOrder } from "@/lib/orders/fulfill-order";

async function parsePayload(req: Request): Promise<VmqCallbackPayload> {
  if (req.method === "GET") {
    const { searchParams } = new URL(req.url);
    return Object.fromEntries(searchParams.entries()) as unknown as VmqCallbackPayload;
  }

  const formData = await req.formData();
  const payload: Record<string, string> = {};
  formData.forEach((value, key) => {
    payload[key] = String(value);
  });
  return payload as unknown as VmqCallbackPayload;
}

export async function GET(req: Request) {
  return processNotify(req);
}

export async function POST(req: Request) {
  return processNotify(req);
}

async function processNotify(req: Request) {
  try {
    const vmqKey = process.env.VMQ_KEY;
    if (!vmqKey) {
      return new NextResponse("fail", { status: 500 });
    }

    const payload = await parsePayload(req);

    if (!verifyVmqCallback(payload, vmqKey)) {
      return new NextResponse("fail", { status: 400 });
    }

    const orderNo = payload.payId;

    // 这里换成你的真实发货逻辑，且必须幂等
    // await fulfillPaidOrder(orderNo, "vmq");
    console.log("VMQ paid callback verified:", {
      orderNo,
      reallyPrice: payload.reallyPrice,
      type: payload.type,
    });

    return new NextResponse("success");
  } catch (error) {
    console.error("VMQ notify error:", error);
    return new NextResponse("fail", { status: 400 });
  }
}
