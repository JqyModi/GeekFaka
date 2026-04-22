import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  PaymentAdapter,
  PaymentCallbackData,
  PaymentIntent,
  PaymentStatus,
} from "../types";

const log = logger.child({ module: "AlipayProvider" });

type AlipayApiResponse = {
  code?: string;
  msg?: string;
  sub_code?: string;
  sub_msg?: string;
  qr_code?: string;
  trade_no?: string;
  trade_status?: string;
};

export class AlipayProvider implements PaymentAdapter {
  name = "alipay";

  private appId = "";
  private gateway = "https://openapi.alipay.com/gateway.do";
  private privateKey = "";
  private publicKey = "";
  private isEnabled = false;
  private siteUrl = "";

  private async loadConfig() {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "alipay_enabled",
            "alipay_app_id",
            "alipay_gateway",
            "alipay_private_key",
            "alipay_public_key",
            "site_url",
          ],
        },
      },
    });

    const config = settings.reduce((acc, current) => {
      acc[current.key] = current.value;
      return acc;
    }, {} as Record<string, string>);

    this.isEnabled = config.alipay_enabled === "true";
    this.appId = config.alipay_app_id || "";
    this.gateway = config.alipay_gateway || this.gateway;
    this.privateKey = config.alipay_private_key || "";
    this.publicKey = config.alipay_public_key || "";

    let siteUrl = config.site_url || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    if (siteUrl.endsWith("/")) {
      siteUrl = siteUrl.slice(0, -1);
    }
    this.siteUrl = siteUrl;
  }

  private formatPemKey(key: string, type: "PUBLIC" | "PRIVATE") {
    if (!key) return "";

    if (key.includes("BEGIN")) {
      return key;
    }

    const body = key.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n");
    if (!body) {
      return key;
    }

    return type === "PRIVATE"
      ? `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`
      : `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
  }

  private formatTimestamp(date: Date) {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}:${pick("second")}`;
  }

  private buildSignContent(params: Record<string, string>) {
    return Object.keys(params)
      .sort()
      .filter((key) => key !== "sign" && params[key] !== "" && params[key] !== undefined)
      .map((key) => `${key}=${params[key]}`)
      .join("&");
  }

  private sign(params: Record<string, string>) {
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(this.buildSignContent(params), "utf8");
    signer.end();
    return signer.sign(this.formatPemKey(this.privateKey, "PRIVATE"), "base64");
  }

  private verify(params: Record<string, string>, signature: string) {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(this.buildSignContent(params), "utf8");
    verifier.end();
    return verifier.verify(this.formatPemKey(this.publicKey, "PUBLIC"), signature, "base64");
  }

  private async request<T extends AlipayApiResponse>(
    method: string,
    bizContent: Record<string, unknown>
  ) {
    const params: Record<string, string> = {
      app_id: this.appId,
      method,
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: this.formatTimestamp(new Date()),
      version: "1.0",
      format: "JSON",
      biz_content: JSON.stringify(bizContent),
    };

    if (method === "alipay.trade.precreate") {
      params.notify_url = `${this.siteUrl}/api/payments/alipay/notify`;
    }

    params.sign = this.sign(params);

    const response = await fetch(this.gateway, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams(params).toString(),
      cache: "no-store",
    });

    const rawText = await response.text();
    let parsed: Record<string, T>;

    try {
      parsed = JSON.parse(rawText) as Record<string, T>;
    } catch (error) {
      log.error({ err: error, rawText }, "Failed to parse Alipay response");
      throw new Error("支付宝网关返回了无法解析的响应");
    }

    const responseKey = `${method.replace(/\./g, "_")}_response`;
    const payload = parsed[responseKey];

    if (!payload) {
      throw new Error("支付宝网关响应缺少业务字段");
    }

    if (payload.code !== "10000") {
      throw new Error(payload.sub_msg || payload.msg || "支付宝接口调用失败");
    }

    return payload;
  }

  async createPayment(orderNo: string, amount: number, description: string): Promise<PaymentIntent> {
    await this.loadConfig();

    if (!this.isEnabled) {
      throw new Error("支付宝当面付目前已停用，请在后台开启");
    }

    if (!this.appId || !this.privateKey || !this.publicKey) {
      throw new Error("支付宝参数未配置完整，请在后台设置 AppID 和密钥");
    }

    const payload = await this.request("alipay.trade.precreate", {
      out_trade_no: orderNo,
      total_amount: amount.toFixed(2),
      subject: description.slice(0, 256),
      timeout_express: "30m",
    });

    if (!payload.qr_code) {
      throw new Error("支付宝未返回二维码");
    }

    return {
      orderId: orderNo,
      amount,
      currency: "CNY",
      qrCode: payload.qr_code,
    };
  }

  async verifyCallback(data: Record<string, string>): Promise<PaymentCallbackData> {
    await this.loadConfig();

    if (!this.isEnabled) {
      throw new Error("Payment channel disabled");
    }

    const { sign, sign_type, ...params } = data;
    if (!sign || !sign_type) {
      throw new Error("Missing Alipay signature fields");
    }

    if (String(sign_type).toUpperCase() !== "RSA2") {
      throw new Error("Unsupported Alipay sign type");
    }

    if (!this.verify(params, String(sign))) {
      throw new Error("Invalid Alipay signature");
    }

    const tradeStatus = params.trade_status;
    const status =
      tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED"
        ? PaymentStatus.PAID
        : tradeStatus === "WAIT_BUYER_PAY"
          ? PaymentStatus.PENDING
          : PaymentStatus.FAILED;

    return {
      orderNo: params.out_trade_no,
      status,
      transactionId: params.trade_no,
      raw: data,
    };
  }

  async queryStatus(orderNo: string): Promise<PaymentStatus> {
    await this.loadConfig();

    if (!this.isEnabled) {
      throw new Error("Payment channel disabled");
    }

    const payload = await this.request("alipay.trade.query", {
      out_trade_no: orderNo,
    });

    switch (payload.trade_status) {
      case "TRADE_SUCCESS":
      case "TRADE_FINISHED":
        return PaymentStatus.PAID;
      case "WAIT_BUYER_PAY":
        return PaymentStatus.PENDING;
      case "TRADE_CLOSED":
        return PaymentStatus.EXPIRED;
      default:
        return PaymentStatus.FAILED;
    }
  }
}
