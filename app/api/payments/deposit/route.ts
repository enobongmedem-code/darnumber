import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { PaymentService } from "@/lib/server/services/payment.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { amount, currency } = body || {};
    if (!amount || amount <= 0) return error("amount required", 400);
    const svc = new PaymentService();
    const data = await svc.createPaymentIntent({
      userId: session.user.id,
      amount,
      currency,
    });
    return json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    const status = msg.includes("Stripe") ? 400 : 500;
    if (msg === "Unauthorized") return error("Unauthorized", 401);
    return error(msg, status);
  }
}
