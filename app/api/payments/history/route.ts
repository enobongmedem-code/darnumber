import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { PaymentService } from "@/lib/server/services/payment.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const sp = new URL(req.url).searchParams;
    const page = sp.get("page") ? Number(sp.get("page")) : 1;
    const limit = sp.get("limit") ? Number(sp.get("limit")) : 20;
    const svc = new PaymentService();
    const data = await svc.getPaymentHistory(session.user.id, page, limit);
    return json({ ok: true, data });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized")
      return error("Unauthorized", 401);
    return error("Unexpected error", 500);
  }
}
