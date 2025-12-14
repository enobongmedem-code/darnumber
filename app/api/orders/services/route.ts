import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { PROVIDERS } from "@/lib/constants/providers";
import {
  SMSManService,
  TextVerifiedService,
} from "@/lib/server/services/order.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("=== GET /api/orders/services START ===");
  try {
    console.log("1. Starting authentication check...");
    const authResult = await requireAuth();
    console.log("2. Authentication successful:", {
      userId: authResult?.id,
      email: authResult?.email,
    });

    console.log("3. Using hardcoded providers from constants...");

    // Hardcoded providers
    const providers = [
      {
        id: PROVIDERS.LION.id,
        name: "sms-man",
        displayName: PROVIDERS.LION.displayName,
        logo: PROVIDERS.LION.logo,
        cover: "All Countries",
      },
      {
        id: PROVIDERS.PANDA.id,
        name: "textverified",
        displayName: PROVIDERS.PANDA.displayName,
        logo: PROVIDERS.PANDA.logo,
        cover: "United States",
      },
    ];

    console.log("4. Providers:", providers);

    console.log("5. Fetching services from provider APIs...");

    // Fetch services from each provider's API
    const servicesMap = new Map<string, any>();

    // Fetch from SMS-Man
    let smsManServices: any[] = [];
    try {
      console.log("5a. Fetching SMS-Man services...");
      const smsManService = new SMSManService();
      smsManServices = await smsManService.getAvailableServices();
      console.log("5b. SMS-Man services count:", smsManServices.length);
    } catch (err) {
      console.error("5c. Error fetching SMS-Man services:", err);
      smsManServices = [];
    }

    // Fetch from TextVerified
    let tvServices: any[] = [];
    try {
      console.log("5d. Fetching TextVerified services...");
      const textVerifiedService = new TextVerifiedService();
      tvServices = await textVerifiedService.getAvailableServices();
      console.log("5e. TextVerified services count:", tvServices.length);
    } catch (err) {
      console.error("5f. Error fetching TextVerified services:", err);
      tvServices = [];
    }

    // Check if we have any services at all
    if (smsManServices.length === 0 && tvServices.length === 0) {
      console.error("6. No services available from any provider");
      return error(
        "No services available from providers. Please check API keys and try again.",
        503
      );
    }

    console.log(
      "6. Total services count:",
      smsManServices.length + tvServices.length
    );

    // Process SMS-Man services (return accurate provider data, unify icon/color)
    smsManServices.forEach((service: any) => {
      const key = `${service.code}-${service.country}`;

      if (!servicesMap.has(key)) {
        servicesMap.set(key, {
          code: service.code,
          name: service.name,
          country: service.country,
          price: service.price,
          ui: {
            logo: "📱",
            color: "bg-gray-200",
            displayName: service.name,
          },
          providers: [
            {
              id: PROVIDERS.LION.id,
              name: "sms-man",
              displayName: PROVIDERS.LION.displayName,
            },
          ],
        });
      } else {
        const existing = servicesMap.get(key);
        if (!existing.providers.find((p: any) => p.id === PROVIDERS.LION.id)) {
          existing.providers.push({
            id: PROVIDERS.LION.id,
            name: "sms-man",
            displayName: PROVIDERS.LION.displayName,
          });
        }
      }
    });

    // Process TextVerified services (return accurate provider data, unify icon/color)
    tvServices.forEach((service: any) => {
      const key = `${service.code}-${service.country}`;

      if (!servicesMap.has(key)) {
        servicesMap.set(key, {
          code: service.code,
          name: service.name,
          country: service.country,
          price: service.price,
          ui: {
            logo: "📱",
            color: "bg-gray-200",
            displayName: service.name,
          },
          providers: [
            {
              id: PROVIDERS.PANDA.id,
              name: "textverified",
              displayName: PROVIDERS.PANDA.displayName,
            },
          ],
        });
      } else {
        const existing = servicesMap.get(key);
        if (!existing.providers.find((p: any) => p.id === PROVIDERS.PANDA.id)) {
          existing.providers.push({
            id: PROVIDERS.PANDA.id,
            name: "textverified",
            displayName: PROVIDERS.PANDA.displayName,
          });
        }
      }
    });

    const result = {
      services: Array.from(servicesMap.values()),
      providers,
    };

    console.log("8. ✅ Returning services:", {
      servicesCount: result.services.length,
      providersCount: result.providers.length,
      sampleService: result.services[0] || null,
      sampleProvider: result.providers[0] || null,
    });

    console.log("=== GET /api/orders/services END (SUCCESS) ===");
    return json({ ok: true, data: result });
  } catch (e) {
    console.error("=== GET /api/orders/services ERROR ===");
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
