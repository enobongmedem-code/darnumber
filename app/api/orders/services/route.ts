import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { prisma } from "@/lib/server/prisma";
import { getServiceLogo } from "@/lib/constants/services";
import { PROVIDERS } from "@/lib/constants/providers";

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

    console.log(
      "3. Fetching all active services with providers and pricing..."
    );

    // Get all active providers
    const providers = await prisma.provider.findMany({
      where: {
        isActive: true,
        healthStatus: "HEALTHY",
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        priority: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    console.log("4. Found providers:", providers);

    // Get all active services with pricing
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        available: true,
        provider: {
          isActive: true,
          healthStatus: "HEALTHY",
        },
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    console.log("5. Found services count:", services.length);

    // Get pricing for all services
    const providerPrices = await prisma.providerPrice.findMany({
      where: {
        providerId: {
          in: providers.map((p) => p.id),
        },
      },
    });

    console.log("6. Found pricing entries:", providerPrices.length);

    // Get pricing rules for profit calculation
    const pricingRules = await prisma.pricingRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    console.log("7. Found pricing rules:", pricingRules.length);

    // Helper function to calculate final price
    const calculatePrice = (
      serviceCode: string,
      country: string,
      baseCost: number
    ) => {
      const rule = pricingRules.find(
        (r) =>
          (r.serviceCode === serviceCode && r.country === country) ||
          (r.serviceCode === serviceCode && !r.country) ||
          (!r.serviceCode && r.country === country) ||
          (!r.serviceCode && !r.country)
      );

      let profit = 0;
      if (rule) {
        if (rule.profitType === "PERCENTAGE") {
          profit = baseCost * (Number(rule.profitValue) / 100);
        } else {
          profit = Number(rule.profitValue);
        }
      }
      return baseCost + profit;
    };

    // Group services by serviceCode and country
    const servicesMap = new Map<string, any>();

    for (const service of services) {
      const key = `${service.serviceCode}-${service.country}`;

      if (!servicesMap.has(key)) {
        // Find pricing
        const pricing = providerPrices.find(
          (p) =>
            p.providerId === service.providerId &&
            p.serviceCode === service.serviceCode &&
            p.country === service.country
        );

        if (pricing) {
          const finalPrice = calculatePrice(
            service.serviceCode,
            service.country,
            Number(pricing.baseCost)
          );

          const uiLogo = getServiceLogo(service.serviceCode);
          servicesMap.set(key, {
            code: service.serviceCode,
            name: service.serviceName,
            country: service.country,
            price: finalPrice,
            ui: {
              logo: uiLogo.logo,
              color: uiLogo.color,
              displayName: uiLogo.name,
            },
            providers: [
              {
                id: service.provider.id,
                name: service.provider.name,
                displayName: service.provider.displayName,
              },
            ],
          });
        }
      } else {
        // Add provider to existing service
        const existing = servicesMap.get(key);
        if (
          !existing.providers.find((p: any) => p.id === service.provider.id)
        ) {
          existing.providers.push({
            id: service.provider.id,
            name: service.provider.name,
            displayName: service.provider.displayName,
          });
        }
      }
    }

    const result = {
      services: Array.from(servicesMap.values()),
      providers: providers.map((p) => {
        // Try to enrich provider with logo and coverage info from constants
        const provName = (p.name || p.displayName || "").toLowerCase();
        const isLion =
          provName.includes("lion") || provName.includes("sms-man");
        const isPanda =
          provName.includes("panda") || provName.includes("textverified");
        const logo = isLion
          ? PROVIDERS.LION.logo
          : isPanda
          ? PROVIDERS.PANDA.logo
          : "☎️";
        const cover = isLion
          ? "All Countries"
          : isPanda
          ? "United States"
          : "Varies";
        return {
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          logo,
          cover,
        };
      }),
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
