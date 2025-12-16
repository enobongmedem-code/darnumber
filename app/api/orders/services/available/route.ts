import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { OrderService } from "@/lib/server/services/order.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("=== GET /api/orders/services/available START ===");
  try {
    console.log("1. Starting authentication check...");
    const authResult = await requireAuth();
    console.log("2. Authentication successful:", {
      userId: authResult?.user?.id,
      email: authResult?.user?.email,
    });

    console.log("3. Parsing request URL:", req.url);
    const { searchParams } = new URL(req.url);

    const serviceCode = searchParams.get("serviceCode") || "";
    const country = searchParams.get("country") || "";

    console.log("4. Extracted parameters:", {
      serviceCode,
      country,
      hasServiceCode: !!serviceCode,
      hasCountry: !!country,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    if (!serviceCode || !country) {
      console.log("5. ❌ VALIDATION FAILED - Missing required parameters");
      return error("serviceCode and country required", 400);
    }

    console.log("5. ✅ Validation passed, creating OrderService...");
    const service = new OrderService();

    console.log("6. Fetching available providers...");
    const providers = await service.getAvailableProviders(serviceCode, country);

    console.log("7. ✅ Successfully retrieved providers:", {
      count: providers?.length || 0,
      providers: providers,
    });

    console.log("=== GET /api/orders/services/available END (SUCCESS) ===");
    return json({ ok: true, data: providers });
  } catch (e) {
    console.error("=== GET /api/orders/services/available ERROR ===");
    console.error("Error details:", {
      message: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : undefined,
      error: e,
    });

    if (e instanceof Error && e.message === "Unauthorized") {
      console.log("Returning 401 Unauthorized");
      return error("Unauthorized", 401);
    }

    console.log("Returning 500 Unexpected error");
    return error("Unexpected error", 500);
  }
}
