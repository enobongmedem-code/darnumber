import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        isActive: true,
        priority: true,
      },
    });
    return json({ ok: true, data: providers });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized")
      return error("Unauthorized", 401);
    return error("Unexpected error", 500);
  }
}
