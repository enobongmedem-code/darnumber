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
    const svc = new AdminService();
    const data = await svc.getUsers({
      search: sp.get("search") || undefined,
      status: sp.get("status") || undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    });
    return json({ ok: true, data });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized")
      return error("Unauthorized", 401);
    return error("Unexpected error", 500);
  }
}
