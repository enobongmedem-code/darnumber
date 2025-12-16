import { prisma } from "@/lib/server/prisma";
import { RedisService } from "@/lib/server/services/redis.service";

const redis = new RedisService();

export class AdminService {
  async getUsers(filters: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search)
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    if (status) where.status = status;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          userName: true,
          phone: true,
          balance: true,
          currency: true,
          status: true,
          role: true,
          country: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true, transactions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: { take: 10, orderBy: { createdAt: "desc" } },
        transactions: { take: 10, orderBy: { createdAt: "desc" } },
        activityLogs: { take: 20, orderBy: { createdAt: "desc" } },
      },
    });
    if (!user) throw new Error("User not found");
    const stats = await prisma.order.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });
    return {
      user,
      stats: {
        totalOrders: user.orders.length,
        ordersByStatus: stats,
        totalSpent: await this.getUserTotalSpent(userId),
      },
    };
  }

  async updateUser(
    userId: string,
    data: { status?: string; balance?: number; role?: string }
  ) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status as any;
    if (typeof data.balance === "number") updateData.balance = data.balance;
    if (data.role) updateData.role = data.role as any;
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    await prisma.activityLog.create({
      data: {
        userId,
        action: "USER_UPDATED",
        resource: "user",
        resourceId: userId,
        metadata: { changes: data },
      },
    });
    return user;
  }

  async adjustBalance(
    userId: string,
    amount: number,
    reason: string,
    adminId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true, currency: true },
      });
      if (!user) throw new Error("User not found");
      const newBalance = Number(user.balance) + amount;
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });
      await tx.transaction.create({
        data: {
          userId,
          transactionNumber: `ADMIN-${Date.now()}`,
          type: "ADMIN_ADJUSTMENT",
          amount: Math.abs(amount),
          currency: user.currency,
          balanceBefore: user.balance,
          balanceAfter: newBalance,
          status: "COMPLETED",
          description: reason,
          adminNotes: `Adjusted by admin: ${adminId}`,
        },
      });
      await tx.activityLog.create({
        data: {
          userId,
          action: "BALANCE_ADJUSTED",
          resource: "transaction",
          metadata: {
            amount,
            reason,
            adminId,
            oldBalance: user.balance,
            newBalance,
          },
        },
      });
      return { newBalance };
    });
  }

  async getOrders(filters: {
    status?: string;
    providerId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      providerId,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (providerId) where.providerId = providerId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true, userName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);
    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getOrderStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    const [
      totalOrders,
      ordersByStatus,
      ordersByProvider,
      revenue,
      completedOrders,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ["status"], where, _count: true }),
      prisma.order.groupBy({ by: ["providerId"], where, _count: true }),
      prisma.order.aggregate({
        where: { ...where, status: "COMPLETED" },
        _sum: { finalPrice: true },
      }),
      prisma.order.findMany({
        where: { ...where, status: "COMPLETED" },
        select: { finalPrice: true, cost: true },
      }),
    ]);

    // Calculate total profit as sum of (finalPrice - cost) for completed orders
    const totalProfit = completedOrders.reduce((sum, order) => {
      const price = Number(order.finalPrice || 0);
      const cost = Number(order.cost || 0);
      return sum + (price - cost);
    }, 0);

    return {
      totalOrders,
      ordersByStatus,
      ordersByProvider,
      totalRevenue: revenue._sum.finalPrice || 0,
      totalProfit,
    };
  }

  async getDashboardAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const [
      totalUsers,
      newUsers,
      totalOrders,
      completedOrders,
      totalRevenue,
      recentCompletedOrders,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
      }),
      prisma.order.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        _sum: { finalPrice: true },
      }),
      prisma.order.findMany({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        select: { finalPrice: true, cost: true },
      }),
      prisma.user.count({ where: { lastLoginAt: { gte: startDate } } }),
    ]);

    // Calculate total profit as sum of (finalPrice - cost) for completed orders
    const totalProfit = recentCompletedOrders.reduce((sum, order) => {
      const price = Number(order.finalPrice || 0);
      const cost = Number(order.cost || 0);
      return sum + (price - cost);
    }, 0);

    return {
      overview: {
        totalUsers,
        newUsers,
        totalOrders,
        completedOrders,
        totalRevenue: totalRevenue._sum.finalPrice || 0,
        totalProfit,
        activeUsers,
        conversionRate:
          totalOrders > 0
            ? ((completedOrders / totalOrders) * 100).toFixed(2)
            : "0",
      },
      dailyStats: [],
    };
  }

  private async getUserTotalSpent(userId: string) {
    const result = await prisma.order.aggregate({
      where: { userId, status: "COMPLETED" },
      _sum: { finalPrice: true },
    });
    return Number(result._sum.finalPrice || 0);
  }

  // Providers
  async getProviders() {
    const providers = await prisma.provider.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        displayName: true,
        apiUrl: true,
        isActive: true,
        priority: true,
        healthStatus: true,
        lastHealthCheck: true,
        rateLimit: true,
        config: true,
        _count: {
          select: { services: true, providerPrices: true },
        },
      },
    });
    return providers;
  }

  async updateProvider(providerId: string, data: any) {
    const updateData: any = {};
    if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;
    if (typeof data.priority === "number") updateData.priority = data.priority;
    if (data.healthStatus) updateData.healthStatus = data.healthStatus as any;
    if (typeof data.rateLimit === "number")
      updateData.rateLimit = data.rateLimit;
    if (typeof data.displayName === "string")
      updateData.displayName = data.displayName;
    if (typeof data.apiUrl === "string") updateData.apiUrl = data.apiUrl;
    if (data.config) updateData.config = data.config;
    // Avoid updating apiKey casually unless explicitly provided
    if (typeof data.apiKey === "string") updateData.apiKey = data.apiKey;
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: updateData,
    });
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        service: "admin",
        message: "Provider updated",
        metadata: { providerId, changes: updateData },
      },
    });
    return provider;
  }

  // Pricing Rules
  async getPricingRules() {
    return await prisma.pricingRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async createPricingRule(data: any) {
    const payload: any = {};
    if (typeof data.serviceCode === "string" || data.serviceCode === null)
      payload.serviceCode = data.serviceCode ?? null;
    if (typeof data.country === "string" || data.country === null)
      payload.country = data.country ?? null;
    if (data.profitType) payload.profitType = data.profitType as any;
    if (typeof data.profitValue !== "undefined")
      payload.profitValue = data.profitValue;
    if (typeof data.priority === "number") payload.priority = data.priority;
    if (typeof data.isActive === "boolean") payload.isActive = data.isActive;
    const rule = await prisma.pricingRule.create({ data: payload });
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        service: "admin",
        message: "Pricing rule created",
        metadata: { ruleId: rule.id, payload },
      },
    });
    return rule;
  }

  async updatePricingRule(ruleId: string, data: any) {
    const payload: any = {};
    if ("serviceCode" in data) payload.serviceCode = data.serviceCode ?? null;
    if ("country" in data) payload.country = data.country ?? null;
    if (data.profitType) payload.profitType = data.profitType as any;
    if (typeof data.profitValue !== "undefined")
      payload.profitValue = data.profitValue;
    if (typeof data.priority === "number") payload.priority = data.priority;
    if (typeof data.isActive === "boolean") payload.isActive = data.isActive;
    const rule = await prisma.pricingRule.update({
      where: { id: ruleId },
      data: payload,
    });
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        service: "admin",
        message: "Pricing rule updated",
        metadata: { ruleId, changes: payload },
      },
    });
    return rule;
  }

  async deletePricingRule(ruleId: string) {
    await prisma.pricingRule.delete({ where: { id: ruleId } });
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        service: "admin",
        message: "Pricing rule deleted",
        metadata: { ruleId },
      },
    });
  }
}
