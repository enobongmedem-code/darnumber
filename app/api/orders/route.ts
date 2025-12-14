import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { OrderService } from "@/lib/server/services/order.service";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId: session.user.id } }),
    ]);
    return json({
      ok: true,
      data: {
        orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized")
      return error("Unauthorized", 401);
    return error("Unexpected error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { serviceCode, country, provider } = body || {};
    if (!serviceCode || !country)
      return error("serviceCode and country required", 400);
    const service = new OrderService();
    const result = await service.createOrder({
      userId: session.user.id,
      serviceCode,
      country,
      preferredProvider: provider,
    });
    return json({ ok: true, data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    const status = msg.includes("balance") ? 402 : 400;
    if (msg === "Unauthorized") return error("Unauthorized", 401);
    return error(msg, status);
  }
}
