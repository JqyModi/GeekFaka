import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentAdapter } from "@/lib/payments/registry";
import { logger } from "@/lib/logger";
import { getSupplierAdapter } from "@/lib/suppliers/registry";
import { calculateSalePrice } from "@/lib/suppliers/pricing";
import { getSellableStock, getSupplierSellableStock } from "@/lib/suppliers/stock";

const log = logger.child({ module: 'OrderCreate' });

function cleanAttribution(value: unknown) {
  if (!value || typeof value !== "object") return {}

  const source = value as Record<string, unknown>
  const pick = (key: string, max = 500) => {
    const item = source[key]
    return typeof item === "string" && item.trim()
      ? item.trim().slice(0, max)
      : undefined
  }

  return {
    utmSource: pick("utmSource", 120),
    utmMedium: pick("utmMedium", 120),
    utmCampaign: pick("utmCampaign", 180),
    utmContent: pick("utmContent", 180),
    landingPath: pick("landingPath", 500),
    referrer: pick("referrer", 500),
  }
}

function cleanGrowthIdentity(value: unknown) {
  if (!value || typeof value !== "object") return {}

  const source = value as Record<string, unknown>
  const pick = (key: string, max = 120) => {
    const item = source[key]
    return typeof item === "string" && item.trim()
      ? item.trim().slice(0, max)
      : undefined
  }

  return {
    visitorId: pick("visitorId"),
    sessionId: pick("sessionId"),
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, quantity = 1, email, paymentMethod = "epay", couponCode, options, attribution } = body;
    const attributionData = cleanAttribution(attribution);
    const growthIdentity = cleanGrowthIdentity(attribution);

    log.info({ productId, quantity, email, paymentMethod, couponCode, attribution: attributionData }, "Order creation attempt");

    if (!productId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check Product & Stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: true,
        supplierProduct: true,
        _count: {
          select: { licenses: { where: { status: "AVAILABLE" } } }
        }
      }
    });

    if (!product) {
      log.warn({ productId }, "Product not found");
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const localSellableStock = getSellableStock(product);
    if (localSellableStock < quantity) {
      log.warn({ productId, requested: quantity, available: localSellableStock }, "Insufficient stock");
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    if (product.sourceType === "SUPPLIER") {
      if (!product.supplier || !product.supplierProduct || !product.supplier.enabled) {
        log.warn({ productId }, "Supplier product is not purchasable");
        return NextResponse.json({ error: "商品货源暂不可用" }, { status: 400 });
      }

      const adapter = getSupplierAdapter(product.supplier);
      const upstreamProduct = await adapter.getProduct(product.supplierProduct.externalProductId);
      const upstreamSellableStock = getSupplierSellableStock(upstreamProduct.stock, product.safetyStock);

      const supplierUpdate: any = {
        costPrice: upstreamProduct.costPrice,
        syncedStock: upstreamProduct.stock,
      };

      if (product.autoSyncPrice && product.pricingMode === "MARKUP") {
        const latestPrice = calculateSalePrice(upstreamProduct.costPrice, product, product.supplier);
        supplierUpdate.price = latestPrice;

        if (latestPrice !== Number(product.price)) {
          await prisma.product.update({
            where: { id: product.id },
            data: supplierUpdate,
          });
          return NextResponse.json({ error: "商品价格已更新，请刷新页面后重试" }, { status: 409 });
        }
      } else if (Number(product.costPrice || 0) !== upstreamProduct.costPrice || product.syncedStock !== upstreamProduct.stock) {
        await prisma.product.update({
          where: { id: product.id },
          data: supplierUpdate,
        });
      }

      if (upstreamSellableStock < quantity) {
        log.warn({ productId, requested: quantity, available: upstreamSellableStock }, "Insufficient supplier stock");
        return NextResponse.json({ error: "上游库存不足，请刷新页面后重试" }, { status: 400 });
      }
    }

    // 2. Handle Coupon
    let discountAmount = 0;
    let validCouponId = undefined;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() }
      });

      if (!coupon || coupon.isUsed) {
        return NextResponse.json({ error: "优惠码无效或已被使用" }, { status: 400 });
      }

      // Check product binding
      if (coupon.productId && coupon.productId !== productId) {
        return NextResponse.json({ error: "该优惠码不适用于此商品" }, { status: 400 });
      }
      
      const subtotal = Number(product.price) * quantity;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = subtotal * (Number(coupon.discountValue) / 100);
      } else {
        discountAmount = Number(coupon.discountValue);
      }
      
      validCouponId = coupon.id;
    }

    // 3. Calculate Amount
    const price = Number(product.price);
    const totalAmount = Math.max(0, (price * quantity) - discountAmount);

    // 4. Create Order
    // Generate a simple order number
    const orderNo = `HT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.$transaction(async (tx) => {
      if (validCouponId) {
        await tx.coupon.update({
          where: { id: validCouponId },
          data: { isUsed: true, usedAt: new Date() }
        });
      }

      return await tx.order.create({
        data: {
          orderNo,
          email,
          productId,
          quantity,
          totalAmount,
          paymentMethod,
          status: "PENDING",
          couponId: validCouponId,
          ...attributionData,
        }
      });
    });
    
    log.info({ orderNo, totalAmount }, "Order created in DB");

    try {
      await prisma.growthEvent.create({
        data: {
          type: "order_created",
          path: attributionData.landingPath || "/",
          productId,
          productSlug: product.slug || null,
          utmSource: attributionData.utmSource,
          utmMedium: attributionData.utmMedium,
          utmCampaign: attributionData.utmCampaign,
          utmContent: attributionData.utmContent,
          referrer: attributionData.referrer,
          visitorId: growthIdentity.visitorId,
          sessionId: growthIdentity.sessionId,
          metadata: JSON.stringify({
            orderNo,
            quantity,
            totalAmount,
            paymentMethod,
          }),
        },
      });
    } catch (eventError) {
      log.warn({ err: eventError, orderNo }, "Failed to record growth order event");
    }

    // 5. Initiate Payment
    try {
      const adapter = getPaymentAdapter(paymentMethod);
      const paymentIntent = await adapter.createPayment(
        orderNo, 
        totalAmount, 
        `${product.name} x${quantity}`,
        options
      );

      await prisma.order.update({
        where: { orderNo },
        data: {
          paymentTradeNo: paymentIntent.transactionId,
          paymentChannel: paymentIntent.channel || options?.channel,
          paymentAmount: paymentIntent.displayAmount ?? paymentIntent.amount,
        },
      });
      
      log.info({ orderNo, payUrl: paymentIntent.payUrl }, "Payment initiated");

      return NextResponse.json({ 
        success: true, 
        orderNo, 
        payUrl: paymentIntent.payUrl,
        qrCode: paymentIntent.qrCode,
        payAmount: paymentIntent.displayAmount ?? paymentIntent.amount,
      });

    } catch (payError: any) {
      log.error({ err: payError, orderNo }, "Payment initiation failed");
      return NextResponse.json({ error: "Payment initialization failed: " + payError.message }, { status: 500 });
    }

  } catch (error) {
    log.error({ err: error }, "Order create error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
