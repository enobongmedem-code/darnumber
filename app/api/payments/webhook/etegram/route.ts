import { NextRequest } from "next/server";
import { json, error } from "@/lib/server/utils/response";
import { PaymentService } from "@/lib/server/services/payment.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log(
      "[Route][Webhook][Etegram] Incoming",
      "keys=",
      Object.keys(payload || {})
    );
    const svc = new PaymentService();
    const result = await svc.handleEtegramWebhook(payload);
    if (!result.ok) {
      console.log("[Route][Webhook][Etegram] Unsuccessful event");
      return error("Invalid or unsuccessful event", 400);
    }
    console.log("[Route][Webhook][Etegram] Processed successfully");
    return json({ ok: true });
  } catch {
    console.error("[Route][Webhook][Etegram] Invalid payload");
    return error("Invalid payload", 400);
  }
}
