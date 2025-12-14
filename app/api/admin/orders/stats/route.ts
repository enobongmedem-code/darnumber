import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { AdminService } from "@/lib/server/services/admin.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
      return error("Forbidden", 403);
    const sp = new URL(req.url).searchParams;
    const startDate = sp.get("startDate")
      ? new Date(sp.get("startDate")!)
      : undefined;
    const endDate = sp.get("endDate")
      ? new Date(sp.get("endDate")!)
      : undefined;
    const svc = new AdminService();
    const data = await svc.getOrderStats(startDate, endDate);
    return json({ ok: true, data });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized")
      return error("Unauthorized", 401);
    return error("Unexpected error", 500);
  }
}
