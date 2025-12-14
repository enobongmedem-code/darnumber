import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { OrderService } from "@/lib/server/services/order.service";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    await requireAuth();
    const service = new OrderService();
    const data = await service.getOrderStatus(params.orderId);
    if (!data) return error("Not found", 404);
    return json({ ok: true, data });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized")
      return error("Unauthorized", 401);
    return error("Unexpected error", 500);
  }
}
