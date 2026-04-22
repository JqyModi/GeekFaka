import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  PaymentAdapter,
  PaymentCallbackData,
  PaymentIntent,
  PaymentStatus,
} from "../types";

const log = logger.child({ module: "VmqProvider" });

type VmqPayType = 1 | 2;

type VmqCreateOrderResponse = {
  code?: number;
  msg?: string;
  data?: {
    payId?: string;
    orderId?: string;
    payType?: VmqPayType;
    price?: string;
    reallyPrice?: string;
    payUrl?: string;
    state?: number;
  };
};

type VmqQueryResponse = {
  code?: number;
  msg?: string;
  data?: {
    state?: number;
    payId?: string;
    orderId?: string;
  };
};

export class VmqProvider implements PaymentAdapter {
  name = "vmq";

  private baseUrl = "";
  private key = "";
  private isEnabled = false;
  private siteUrl = "";

  private async loadConfig() {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["vmq_enabled", "vmq_base_url", "vmq_key", "site_url"],
        },
      },
    });

    const config = settings.reduce((acc, current) => {
      acc[current.key] = current.value;
      return acc;
    }, {} as Record<string, string>);

    this.isEnabled = config.vmq_enabled === "true";
    this.baseUrl = (config.vmq_base_url || "").replace(/\/+$/, "");
    this.key = config.vmq_key || "";

    let siteUrl = config.site_url || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    if (siteUrl.endsWith("/")) {
      siteUrl = siteUrl.slice(0, -1);
    }
    this.siteUrl = siteUrl;
  }

  private md5(input: string) {
    return crypto.createHash("md5").update(input).digest("hex");
  }

  private normalizeChannel(channel?: string): { type: VmqPayType; channel: string } {
    switch (channel) {
      case "wxpay":
      case "wechat":
      case "vmq_wxpay":
        return { type: 1, channel: "wxpay" };
      case "alipay":
      case "alipay_f2f":
      case "vmq_alipay":
      default:
        return { type: 2, channel: "alipay" };
    }
  }

  private signCreate(params: { payId: string; param: string; type: VmqPayType; price: string }) {
    return this.md5(`${params.payId}${params.param}${params.type}${params.price}${this.key}`);
  }

  private signCallback(params: {
    payId: string;
    param: string;
    type: string;
    price: string;
    reallyPrice: string;
  }) {
    return this.md5(
      `${params.payId}${params.param}${params.type}${params.price}${params.reallyPrice}${this.key}`
    );
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "user-agent": "GeekFaka VMQ Adapter",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`V免签接口请求失败: HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async createPayment(
    orderNo: string,
    amount: number,
    description: string,
    options?: { channel?: string }
  ): Promise<PaymentIntent> {
    await this.loadConfig();

    if (!this.isEnabled) {
      throw new Error("V免签渠道目前已停用，请在后台开启");
    }

    if (!this.baseUrl || !this.key) {
      throw new Error("V免签参数未配置完整，请在后台设置服务地址和通信密钥");
    }

    const { type, channel } = this.normalizeChannel(options?.channel);
    const price = amount.toFixed(2);
    // Java 版 V免签回调时不会稳定地对 param 做 URL 编码，中文或空格会导致异步通知被上游拼成坏 URL。
    // 这里改成纯 ASCII 的订单号，避免真实支付后首次自动回调被 400 拒绝。
    const param = orderNo;
    const notifyUrl = `${this.siteUrl}/api/payments/vmq/notify`;
    const returnUrl = `${this.siteUrl}/orders/${orderNo}`;

    const body = new URLSearchParams({
      payId: orderNo,
      type: String(type),
      price,
      param,
      notifyUrl,
      returnUrl,
      isHtml: "0",
      sign: this.signCreate({ payId: orderNo, param, type, price }),
    });

    const payload = await this.requestJson<VmqCreateOrderResponse>("/createOrder", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (payload.code !== 1 || !payload.data) {
      throw new Error(payload.msg || "V免签创建订单失败");
    }

    if (!payload.data.orderId || !payload.data.payUrl) {
      throw new Error("V免签创建订单响应缺少 orderId 或 payUrl");
    }

    const displayAmount = Number(payload.data.reallyPrice || payload.data.price || price);
    const payUrl = `${this.baseUrl}/payPage/pay.html?orderId=${encodeURIComponent(payload.data.orderId)}`;

    log.info(
      { orderNo, vmqOrderId: payload.data.orderId, channel, amount, displayAmount },
      "V免签订单创建成功"
    );

    return {
      orderId: orderNo,
      amount,
      displayAmount,
      currency: "CNY",
      payUrl,
      qrCode: payload.data.payUrl,
      transactionId: payload.data.orderId,
      channel,
    };
  }

  async verifyCallback(data: Record<string, string>): Promise<PaymentCallbackData> {
    await this.loadConfig();

    if (!this.isEnabled) {
      throw new Error("Payment channel disabled");
    }

    const payId = String(data.payId || "");
    const param = String(data.param || "");
    const type = String(data.type || "");
    const price = String(data.price || "");
    const reallyPrice = String(data.reallyPrice || "");
    const sign = String(data.sign || "");

    if (!payId || !type || !price || !reallyPrice || !sign) {
      throw new Error("V免签回调字段不完整");
    }

    const expected = this.signCallback({ payId, param, type, price, reallyPrice });
    if (expected !== sign) {
      log.error({ expected, received: sign, payId }, "V免签回调签名验证失败");
      throw new Error("Invalid V免签 callback signature");
    }

    const order = await prisma.order.findUnique({
      where: { orderNo: payId },
      select: { paymentAmount: true, totalAmount: true },
    });

    if (!order) {
      throw new Error("V免签回调订单不存在");
    }

    const expectedAmount = Number(order.paymentAmount ?? order.totalAmount);
    const paidAmount = Number(reallyPrice);
    if (!Number.isFinite(paidAmount) || Math.abs(expectedAmount - paidAmount) >= 0.001) {
      log.error({ payId, expectedAmount, paidAmount }, "V免签回调金额不匹配");
      throw new Error("V免签回调金额不匹配");
    }

    return {
      orderNo: payId,
      status: PaymentStatus.PAID,
      transactionId: String(data.orderId || ""),
      raw: data,
    };
  }

  async queryStatus(orderNo: string): Promise<PaymentStatus> {
    await this.loadConfig();

    if (!this.isEnabled) {
      throw new Error("Payment channel disabled");
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
      select: { paymentTradeNo: true, status: true },
    });

    if (!order?.paymentTradeNo) {
      return order?.status === "PAID" ? PaymentStatus.PAID : PaymentStatus.PENDING;
    }

    const payload = await this.requestJson<VmqQueryResponse>(
      `/getOrder?orderId=${encodeURIComponent(order.paymentTradeNo)}`
    );

    if (payload.code !== 1 || !payload.data) {
      throw new Error(payload.msg || "V免签订单查询失败");
    }

    return payload.data.state === 1 ? PaymentStatus.PAID : PaymentStatus.PENDING;
  }
}
