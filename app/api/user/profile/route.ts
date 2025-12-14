import { NextRequest } from "next/server";
import { json, error } from "@/lib/server/utils/response";
import { requireAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) return error("Not found", 404);
    return json({
      ok: true,
      user: { id: String(user.id), email: user.email, userName: user.userName },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized")
      return error("Unauthorized", 401);
    return error("Unexpected error", 500);
  }
}
