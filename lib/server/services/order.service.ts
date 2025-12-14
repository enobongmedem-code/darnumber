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
      const providerService = new SMSManService();
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
    const cached = await redis.getOrderStatus(orderId);
    if (cached) return cached;
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
      },
    });
    if (order) await redis.setOrderStatus(orderId, order, 300);
    return order;
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
    const url = `${this.apiUrl}/get-number?token=${
      this.apiKey
    }&country_id=${this.getCountryId(
      country
    )}&application_id=${this.getServiceId(serviceCode)}`;
    const res = await fetch(url);
    const data = await res.json();
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
