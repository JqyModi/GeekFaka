import { NextResponse } from "next/server";
import { verifyVmqCallback, type VmqCallbackPayload } from "./vmq";

export async function GET(req: Request) {
  const vmqKey = process.env.VMQ_KEY;
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!vmqKey || !appBaseUrl) {
    return NextResponse.redirect(`${appBaseUrl ?? ""}/pay/fail`);
  }

  const { searchParams } = new URL(req.url);
  const payload = Object.fromEntries(
    searchParams.entries()
  ) as unknown as VmqCallbackPayload;

  if (!verifyVmqCallback(payload, vmqKey)) {
    return NextResponse.redirect(`${appBaseUrl}/pay/fail?reason=bad-sign`);
  }

  const redirectUrl = new URL("/pay/success", appBaseUrl);
  redirectUrl.searchParams.set("orderNo", payload.payId);
  redirectUrl.searchParams.set("reallyPrice", payload.reallyPrice);

  return NextResponse.redirect(redirectUrl);
}
