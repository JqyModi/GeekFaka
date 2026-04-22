import { createHash } from "node:crypto";

export type VmqPayType = 1 | 2;

export interface VmqCreateOrderInput {
  payId: string;
  price: string;
  type: VmqPayType;
  param?: string;
  notifyUrl: string;
  returnUrl: string;
  isHtml?: 0 | 1;
}

export interface VmqCreateOrderResponse {
  code: number;
  msg: string;
  data?: {
    payId: string;
    orderId: string;
    payType: VmqPayType;
    price: string;
    reallyPrice: string;
    payUrl: string;
    isAuto: number;
    state: number;
    timeOut: string;
    date: number;
  };
}

export interface VmqCallbackPayload {
  payId: string;
  param: string;
  type: string;
  price: string;
  reallyPrice: string;
  sign: string;
}

function md5(input: string) {
  return createHash("md5").update(input).digest("hex");
}

export function formatVmqPrice(amount: number) {
  return amount.toFixed(2);
}

export function signVmqCreateOrder(params: {
  payId: string;
  param?: string;
  type: VmqPayType;
  price: string;
  key: string;
}) {
  return md5(
    `${params.payId}${params.param ?? ""}${params.type}${params.price}${params.key}`
  );
}

export function verifyVmqCallback(payload: VmqCallbackPayload, key: string) {
  const expected = md5(
    `${payload.payId}${payload.param ?? ""}${payload.type}${payload.price}${payload.reallyPrice}${key}`
  );

  return expected === payload.sign;
}

export async function createVmqOrder(
  baseUrl: string,
  key: string,
  input: VmqCreateOrderInput
) {
  const payload = new URLSearchParams({
    payId: input.payId,
    type: String(input.type),
    price: input.price,
    param: input.param ?? "",
    notifyUrl: input.notifyUrl,
    returnUrl: input.returnUrl,
    isHtml: String(input.isHtml ?? 0),
    sign: signVmqCreateOrder({
      payId: input.payId,
      param: input.param,
      type: input.type,
      price: input.price,
      key,
    }),
  });

  const response = await fetch(`${baseUrl}/createOrder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`VMQ createOrder failed with status ${response.status}`);
  }

  const json = (await response.json()) as VmqCreateOrderResponse;

  if (json.code !== 1 || !json.data) {
    throw new Error(json.msg || "VMQ createOrder failed");
  }

  return json.data;
}
