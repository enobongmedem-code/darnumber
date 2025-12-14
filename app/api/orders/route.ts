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
  console.log("=== POST /api/orders START ===");
  try {
    console.log("1. Authenticating user...");
    const session = await requireAuth();
    console.log("2. ✅ User authenticated:", {
      userId: session.user.id,
      email: session.user.email,
    });

    console.log("3. Parsing request body...");
    const body = await req.json();
    const { serviceCode, country, provider } = body || {};

    console.log("4. Request data:", { serviceCode, country, provider, body });

    if (!serviceCode || !country) {
      console.log("5. ❌ Validation failed - Missing required fields");
      return error("serviceCode and country required", 400);
    }

    console.log("5. ✅ Validation passed, creating order...");
    const service = new OrderService();
    const result = await service.createOrder({
      userId: session.user.id,
      serviceCode,
      country,
      preferredProvider: provider,
    });

    console.log("6. ✅ Order created successfully:", result);
    console.log("=== POST /api/orders END (SUCCESS) ===");
    return json({ ok: true, data: result });
  } catch (e) {
    console.error("=== POST /api/orders ERROR ===");
    console.error("Error details:", {
      message: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
      error: e,
    });

    const msg = e instanceof Error ? e.message : "Unexpected error";
    const status = msg.includes("balance") ? 402 : 400;
    if (msg === "Unauthorized") {
      console.log("Returning 401 Unauthorized");
      return error("Unauthorized", 401);
    }
    console.log(`Returning ${status} error:`, msg);
    return error(msg, status);
  }
}
