// ============================================
// ORDER SERVICE - Core Business Logic
// ============================================

import { prisma } from "../config/database";
import { RedisService } from "./redis.service";
import { SMSManService } from "./smsMan.service";
import { TextVerifiedService } from "./textVerified.service";
import { orderMonitorQueue } from "./queue.service";

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

    // 1. Get user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, currency: true },
    });

    if (!user) throw new Error("User not found");

    // 2. Get available providers
    const providers = await this.getAvailableProviders(
      serviceCode,
      country,
      preferredProvider
    );

    if (!providers.length) {
      throw new Error("No providers available for this service");
    }

    // 3. Calculate pricing
    const pricing = await this.calculatePricing(
      providers[0].id,
      serviceCode,
      country
    );

    // 4. Check balance
    if (user.balance < pricing.finalPrice) {
      throw new Error("Insufficient balance");
    }

    // 5. Create order and deduct balance in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: pricing.finalPrice } },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          transactionNumber: `TXN-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          type: "ORDER_PAYMENT",
          amount: pricing.finalPrice,
          currency: user.currency,
          balanceBefore: user.balance,
          balanceAfter: user.balance - Number(pricing.finalPrice),
          status: "COMPLETED",
          description: `Order for ${serviceCode} - ${country}`,
        },
      });

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          providerId: providers[0].id,
          serviceId: providers[0].services[0].id,
          orderNumber: `ORD-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          serviceCode,
          country,
          baseCost: pricing.baseCost,
          profit: pricing.profit,
          finalPrice: pricing.finalPrice,
          currency: user.currency,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
        },
      });

      return newOrder;
    });

    // 6. Request number from provider
    try {
      const providerService = this.getProviderService(providers[0].name);
      const providerOrder = await providerService.requestNumber(
        serviceCode,
        country
      );

      // Update order with provider details
      await prisma.order.update({
        where: { id: order.id },
        data: {
          providerOrderId: providerOrder.id,
          phoneNumber: providerOrder.phoneNumber,
          status: "WAITING_SMS",
        },
      });

      // Add to monitoring queue
      await orderMonitorQueue.add(
        { orderId: order.id },
        { delay: 10000 } // Check after 10 seconds
      );

      // Cache order status
      await redis.set(
        `order:status:${order.id}`,
        JSON.stringify({
          status: "WAITING_SMS",
          phoneNumber: providerOrder.phoneNumber,
        }),
        300 // 5 minutes
      );

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        phoneNumber: providerOrder.phoneNumber,
        status: "WAITING_SMS",
        expiresAt: order.expiresAt,
      };
    } catch (error) {
      // Refund user on provider error
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
          some: {
            serviceCode,
            country,
            isActive: true,
            available: true,
          },
        },
      },
      include: {
        services: {
          where: { serviceCode, country },
        },
      },
      orderBy: { priority: "desc" },
    });

    // Cache for 1 minute
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

    // Get provider's base cost
    const providerPrice = await prisma.providerPrice.findFirst({
      where: { providerId, serviceCode, country },
    });

    if (!providerPrice) {
      throw new Error("Pricing not available");
    }

    // Get applicable pricing rule (most specific first)
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

    const pricing = {
      baseCost: providerPrice.baseCost,
      profit,
      finalPrice,
    };

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(pricing), 300);

    return pricing;
  }

  async getOrderStatus(orderId: string) {
    // Try cache first
    const cached = await redis.get(`order:status:${orderId}`);
    if (cached) return JSON.parse(cached);

    // Fetch from database
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

    if (order) {
      await redis.set(`order:status:${orderId}`, JSON.stringify(order), 300);
    }

    return order;
  }

  async refundOrder(orderId: string) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) return;

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED", cancelledAt: new Date() },
      });

      // Refund balance
      await tx.user.update({
        where: { id: order.userId },
        data: { balance: { increment: order.finalPrice } },
      });

      // Create refund transaction
      await tx.transaction.create({
        data: {
          userId: order.userId,
          transactionNumber: `REFUND-${Date.now()}`,
          type: "REFUND",
          amount: order.finalPrice,
          currency: order.currency,
          balanceBefore: order.user.balance,
          balanceAfter: order.user.balance + Number(order.finalPrice),
          orderId: order.id,
          status: "COMPLETED",
          description: `Refund for order ${order.orderNumber}`,
        },
      });
    });

    // Invalidate cache
    await redis.del(`order:status:${orderId}`);
  }

  private getProviderService(providerName: string) {
    switch (providerName) {
      case "sms-man":
        return new SMSManService();
      case "textverified":
        return new TextVerifiedService();
      default:
        throw new Error("Unknown provider");
    }
  }
}

// ============================================
// SMS-MAN PROVIDER SERVICE
// ============================================

export class SMSManService {
  private apiUrl = "https://api.sms-man.com/control";
  private apiKey = process.env.SMSMAN_API_KEY!;

  async requestNumber(serviceCode: string, country: string) {
    try {
      const response = await fetch(
        `${this.apiUrl}/get-number?token=${
          this.apiKey
        }&country_id=${this.getCountryId(
          country
        )}&application_id=${this.getServiceId(serviceCode)}`
      );

      const data = await response.json();

      if (data.error_code) {
        throw new Error(data.error);
      }

      return {
        id: data.request_id,
        phoneNumber: data.number,
      };
    } catch (error) {
      throw new Error(`SMS-Man API error: ${error.message}`);
    }
  }

  async getSMS(requestId: string) {
    try {
      const response = await fetch(
        `${this.apiUrl}/get-sms?token=${this.apiKey}&request_id=${requestId}`
      );

      const data = await response.json();

      if (data.sms_code) {
        return {
          received: true,
          code: data.sms_code,
          text: data.sms_text,
        };
      }

      return { received: false };
    } catch (error) {
      return { received: false };
    }
  }

  async closeRequest(requestId: string) {
    await fetch(
      `${this.apiUrl}/set-status?token=${this.apiKey}&request_id=${requestId}&status=close`
    );
  }

  private getCountryId(country: string): string {
    const countryMap: Record<string, string> = {
      US: "1",
      UK: "2",
      RU: "3",
      // Add more mappings
    };
    return countryMap[country] || "1";
  }

  private getServiceId(serviceCode: string): string {
    const serviceMap: Record<string, string> = {
      google: "go",
      facebook: "fb",
      whatsapp: "wa",
      // Add more mappings
    };
    return serviceMap[serviceCode] || serviceCode;
  }
}
