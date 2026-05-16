import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { fulfillPaidOrder } from "@/lib/orders/fulfill-order";

// Manual Actions (e.g., Mark as Paid)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { action } = await req.json(); // "MARK_PAID"
    const { id } = params;

    const order = await prisma.order.findUnique({ 
      where: { id },
      include: { product: true }
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === "MARK_PAID") {
       if (order.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 400 });

       const result = await fulfillPaidOrder(order.orderNo, "manual");

       return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
