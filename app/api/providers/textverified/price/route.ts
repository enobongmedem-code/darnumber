import { NextRequest } from "next/server";
import { json, error } from "@/lib/server/utils/response";
import { TextVerifiedService } from "@/lib/server/services/order.service";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

/**
 * GET /api/providers/textverified/price
 * Fetches the price for a single TextVerified service with profit markup applied, returned in NGN.
 * @param {NextRequest} req - serviceName: string
 */
export async function GET(req: NextRequest) {
  const serviceName = req.nextUrl.searchParams.get("serviceName");

  if (!serviceName) {
    return error("serviceName is required", 400);
  }

  try {
    const textVerifiedService = new TextVerifiedService();

    // 1. Get base USD price from TextVerified
    const baseUsdPrice = await textVerifiedService.fetchAndCacheServicePrice(
      serviceName
    );

    if (baseUsdPrice === null) {
      return error("Price not found for this service", 404);
    }

    // 2. Fetch active pricing rule to apply profit markup
    const pricingRule = await prisma.pricingRule.findFirst({
      where: {
        isActive: true,
        OR: [
          { serviceCode: serviceName, country: "US" },
          { serviceCode: serviceName, country: null },
          { serviceCode: null, country: "US" },
          { serviceCode: null, country: null },
        ],
      },
      orderBy: { priority: "desc" },
    });

    let profit = 0;
    if (pricingRule) {
      if (pricingRule.profitType === "PERCENTAGE") {
        profit = baseUsdPrice * (Number(pricingRule.profitValue) / 100);
      } else {
        // Fixed profit in NGN - convert to USD equivalent for calculation
        profit = Number(pricingRule.profitValue) / 1600; // Rough USD equivalent
      }
    }

    const finalUsdPrice = baseUsdPrice + profit;

    // 3. Convert to NGN using live exchange rate
    let usdToNgn = 1600; // Fallback rate
    try {
      const rateRes = await fetch(
        "https://openexchangerates.org/api/latest.json?app_id=5e1de33c06ec43ad8047ef4b9fc163c4",
        { next: { revalidate: 3600 } } // Cache for 1 hour
      );
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        usdToNgn = rateData?.rates?.NGN || 1600;
      }
    } catch (e) {
      console.warn(
        "[TextVerified][Price] Failed to fetch exchange rate, using fallback"
      );
    }

    const finalNgnPrice = Math.round(finalUsdPrice * usdToNgn);

    console.log(
      `[TextVerified][Price] ${serviceName}: Base $${baseUsdPrice.toFixed(
        2
      )} + Profit $${profit.toFixed(2)} = $${finalUsdPrice.toFixed(
        2
      )} → ₦${finalNgnPrice.toLocaleString()}`
    );

    return json({
      ok: true,
      data: {
        serviceName,
        price: finalNgnPrice, // Return NGN price
        baseUsd: baseUsdPrice,
        profitUsd: profit,
        finalUsd: finalUsdPrice,
      },
    });
  } catch (e) {
    const err = e as Error;
    console.error(
      `[API][TextVerified][Price] Failed to fetch price for ${serviceName}:`,
      err
    );
    return error(err.message, 500);
  }
}
