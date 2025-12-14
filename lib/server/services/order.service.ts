import { prisma } from "@/lib/server/prisma";
import { RedisService } from "@/lib/server/services/redis.service";

const redis = new RedisService();

interface CreateOrderInput {
  userId: string;
  serviceCode: string;
  country: string;
  preferredProvider?: string;
}

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    const { userId, serviceCode, country, preferredProvider } = input;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, currency: true },
    });
    if (!user) throw new Error("User not found");

    const providers = await this.getAvailableProviders(
      serviceCode,
      country,
      preferredProvider
    );
    if (!providers.length)
      throw new Error("No providers available for this service");

    const pricing = await this.calculatePricing(
      providers[0].id,
      serviceCode,
      country
    );
    if (Number(user.balance) < Number(pricing.finalPrice))
      throw new Error("Insufficient balance");

    const order = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: pricing.finalPrice } },
      });
      await tx.transaction.create({
        data: {
          userId,
          transactionNumber: `TXN-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`,
          type: "ORDER_PAYMENT",
          amount: pricing.finalPrice,
          currency: user.currency,
          balanceBefore: user.balance,
          balanceAfter: Number(user.balance) - Number(pricing.finalPrice),
          status: "COMPLETED",
          description: `Order for ${serviceCode} - ${country}`,
        },
      });
      const newOrder = await tx.order.create({
        data: {
          userId,
          providerId: providers[0].id,
          serviceId: providers[0].services[0].id,
          orderNumber: `ORD-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`,
          serviceCode,
          country,
          baseCost: pricing.baseCost,
          profit: pricing.profit,
          finalPrice: pricing.finalPrice,
          currency: user.currency,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 20 * 60 * 1000),
        },
      });
      return newOrder;
    });

    try {
      // Decide provider adapter based on selected provider
      const selectedProvider = providers[0];
      const provName = (selectedProvider.name || "").toLowerCase();
      console.log("[OrderService] Selected provider:", selectedProvider);

      const useLion = provName.includes("lion") || provName.includes("sms-man");
      const usePanda =
        provName.includes("panda") || provName.includes("textverified");

      const providerService = useLion
        ? new SMSManService()
        : new TextVerifiedService();

      console.log(
        "[OrderService] Requesting number from",
        useLion ? "Lion (SMS-Man)" : "Panda (TextVerified)",
        { serviceCode, country }
      );

      const providerOrder = await providerService.requestNumber(
        serviceCode,
        country
      );
      await prisma.order.update({
        where: { id: order.id },
        data: {
          providerOrderId: providerOrder.id,
          phoneNumber: providerOrder.phoneNumber,
          status: "WAITING_SMS",
        },
      });
      await redis.setOrderStatus(
        order.id,
        { status: "WAITING_SMS", phoneNumber: providerOrder.phoneNumber },
        300
      );
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        phoneNumber: providerOrder.phoneNumber,
        status: "WAITING_SMS",
        expiresAt: order.expiresAt,
      };
    } catch (e) {
      console.error("[OrderService] Provider request failed:", e);
      await this.refundOrder(order.id);
      throw new Error("Failed to create order with provider");
    }
  }

  async getAvailableProviders(
    serviceCode: string,
    country: string,
    preferred?: string
  ) {
    const cacheKey = `providers:available:${serviceCode}:${country}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const providers = await prisma.provider.findMany({
      where: {
        isActive: true,
        healthStatus: "HEALTHY",
        ...(preferred && { name: preferred }),
        services: {
          some: { serviceCode, country, isActive: true, available: true },
        },
      },
      include: { services: { where: { serviceCode, country } } },
      orderBy: { priority: "desc" },
    });
    await redis.set(cacheKey, JSON.stringify(providers), 60);
    return providers;
  }

  async calculatePricing(
    providerId: string,
    serviceCode: string,
    country: string
  ) {
    const cacheKey = `pricing:${providerId}:${serviceCode}:${country}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const providerPrice = await prisma.providerPrice.findFirst({
      where: { providerId, serviceCode, country },
    });
    if (!providerPrice) throw new Error("Pricing not available");

    const pricingRule = await prisma.pricingRule.findFirst({
      where: {
        isActive: true,
        OR: [
          { serviceCode, country },
          { serviceCode, country: null },
          { serviceCode: null, country },
          { serviceCode: null, country: null },
        ],
      },
      orderBy: { priority: "desc" },
    });

    let profit = 0;
    if (pricingRule) {
      if (pricingRule.profitType === "PERCENTAGE") {
        profit =
          Number(providerPrice.baseCost) *
          (Number(pricingRule.profitValue) / 100);
      } else {
        profit = Number(pricingRule.profitValue);
      }
    }
    const finalPrice = Number(providerPrice.baseCost) + profit;
    const pricing = { baseCost: providerPrice.baseCost, profit, finalPrice };
    await redis.set(cacheKey, JSON.stringify(pricing), 300);
    return pricing;
  }

  async getOrderStatus(orderId: string) {
    console.log("[OrderService] getOrderStatus ->", { orderId });
    const cached = await redis.getOrderStatus(orderId);
    if (cached) {
      console.log("[OrderService] cache hit", cached);
      return cached;
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        phoneNumber: true,
        status: true,
        smsCode: true,
        smsText: true,
        expiresAt: true,
        createdAt: true,
        finalPrice: true,
        currency: true,
        serviceCode: true,
        country: true,
        provider: {
          select: { name: true, displayName: true },
        },
      },
    });
    if (!order) return null;
    const payload = {
      ...order,
      provider:
        order.provider?.displayName || order.provider?.name || undefined,
    } as any;
    delete (payload as any).provider?.displayName;
    delete (payload as any).provider?.name;
    await redis.setOrderStatus(orderId, payload, 300);
    console.log("[OrderService] getOrderStatus payload", payload);
    return payload;
  }

  async refundOrder(orderId: string) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });
      if (!order) return;
      await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED", cancelledAt: new Date() },
      });
      await tx.user.update({
        where: { id: order.userId },
        data: { balance: { increment: order.finalPrice } },
      });
      await tx.transaction.create({
        data: {
          userId: order.userId,
          transactionNumber: `REFUND-${Date.now()}`,
          type: "REFUND",
          amount: order.finalPrice,
          currency: order.currency,
          balanceBefore: order.user.balance,
          balanceAfter: Number(order.user.balance) + Number(order.finalPrice),
          orderId: order.id,
          status: "COMPLETED",
          description: `Refund for order ${order.orderNumber}`,
        },
      });
    });
    await redis.invalidateOrder(orderId);
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
    });
    if (!order) throw new Error("Order not found");
    if (order.status !== "PENDING" && order.status !== "WAITING_SMS")
      throw new Error("Order cannot be cancelled");
    await this.refundOrder(orderId);
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    return { ok: true };
  }
}

// Minimal provider for demo; extend with TextVerifiedService as needed
export class SMSManService {
  private apiUrl = "https://api.sms-man.com/control";
  private apiKey = process.env.SMSMAN_API_KEY || "";

  async requestNumber(serviceCode: string, country: string) {
    console.log("[SMSManService] requestNumber", { serviceCode, country });
    const url = `${this.apiUrl}/get-number?token=${
      this.apiKey
    }&country_id=${this.getCountryId(
      country
    )}&application_id=${this.getServiceId(serviceCode)}`;
    console.log("[SMSManService] GET", url);
    const res = await fetch(url);
    const data = await res.json();
    console.log("[SMSManService] Response", data);
    if (data.error_code) throw new Error(data.error);
    return { id: data.request_id, phoneNumber: data.number };
  }

  private getCountryId(country: string) {
    const map: Record<string, string> = { US: "1", UK: "2", RU: "3" };
    return map[country] || "1";
  }
  private getServiceId(serviceCode: string) {
    const map: Record<string, string> = {
      google: "go",
      facebook: "fb",
      whatsapp: "wa",
    };
    return map[serviceCode] || serviceCode;
  }
}

// Minimal TextVerified provider adapter with detailed logging
export class TextVerifiedService {
  private apiUrl = "https://api.textverified.com/v2";
  private apiKey = process.env.TEXTVERIFIED_API_KEY || "";

  async requestNumber(serviceCode: string, country: string) {
    console.log("[TextVerifiedService] requestNumber", {
      serviceCode,
      country,
    });
    if (!this.apiKey) {
      console.warn("[TextVerifiedService] Missing TEXTVERIFIED_API_KEY");
      throw new Error("TextVerified API key not configured");
    }
    // Placeholder: real implementation would create a verification task and fetch a number
    // Here we log intent and throw to avoid undefined behavior without proper setup
    console.log(
      "[TextVerifiedService] Would create task via API",
      this.apiUrl,
      {
        headers: "Authorization: Bearer <API_KEY>",
        serviceCode,
        country,
      }
    );
    throw new Error("TextVerified integration not implemented yet");
  }
}
