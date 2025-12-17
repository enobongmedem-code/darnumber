import { NextRequest } from "next/server";
import { json, error } from "@/lib/server/utils/response";
import { TextVerifiedService } from "@/lib/server/services/order.service";
import { ExchangeRateService } from "@/lib/server/services/exchange-rate.service";
import { PricingService } from "@/lib/server/services/pricing.service";

export const runtime = "nodejs";

/**
 * GET /api/providers/textverified/price
 * Fetches the price for a single TextVerified service with admin-configured profit markup applied, returned in NGN.
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

    // 2. Get exchange rate
    const usdToNgn = await ExchangeRateService.getUsdToNgnRate();

    // 3. Apply admin pricing rules (TextVerified is always US)
    const pricingResult = await PricingService.calculatePrice(
      baseUsdPrice,
      serviceName,
      "US"
    );

    const finalUsdPrice = pricingResult.finalPrice;
    const profitUsd = pricingResult.profit;

    // 4. Convert to NGN
    const finalNgnPrice = Math.round(finalUsdPrice * usdToNgn);

    console.log(
      `[TextVerified][Price] ${serviceName}: Base $${baseUsdPrice.toFixed(
        2
      )} + profit $${profitUsd.toFixed(2)} = $${finalUsdPrice.toFixed(
        2
      )} → ₦${finalNgnPrice.toLocaleString()}`,
      pricingResult.ruleApplied
        ? `(Rule: ${pricingResult.ruleApplied.profitType} ${
            pricingResult.ruleApplied.profitValue
          }${
            pricingResult.ruleApplied.profitType === "PERCENTAGE" ? "%" : " USD"
          })`
        : "(Default 20% markup)"
    );

    return json({
      ok: true,
      data: {
        serviceName,
        price: finalNgnPrice, // Return NGN price
        baseUsd: baseUsdPrice,
        profitUsd: profitUsd,
        finalUsd: finalUsdPrice,
        ruleApplied: pricingResult.ruleApplied,
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
