import { createVmqOrder, formatVmqPrice } from "./vmq";

export interface CreateVmqPaymentArgs {
  orderNo: string;
  amount: number;
  title?: string;
  payType: 1 | 2;
}

export async function createVmqPayment(args: CreateVmqPaymentArgs) {
  const vmqBaseUrl = process.env.VMQ_BASE_URL;
  const vmqKey = process.env.VMQ_KEY;
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!vmqBaseUrl || !vmqKey || !appBaseUrl) {
    throw new Error("Missing VMQ_BASE_URL / VMQ_KEY / APP_BASE_URL");
  }

  const price = formatVmqPrice(args.amount);
  const notifyUrl = `${appBaseUrl}/api/payments/vmq/notify`;
  const returnUrl = `${appBaseUrl}/api/payments/vmq/return`;

  const vmqOrder = await createVmqOrder(vmqBaseUrl, vmqKey, {
    payId: args.orderNo,
    param: args.orderNo,
    type: args.payType,
    price,
    notifyUrl,
    returnUrl,
    isHtml: 0,
  });

  return {
    orderNo: args.orderNo,
    payUrl: vmqOrder.payUrl,
    reallyPrice: vmqOrder.reallyPrice,
    vmqOrderId: vmqOrder.orderId,
    payType: vmqOrder.payType,
  };
}
