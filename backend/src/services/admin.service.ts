// ============================================
// ADMIN SERVICE - Backend
// ============================================

import { prisma } from "../config/database";
import { RedisService } from "./redis.service";

const redis = new RedisService();

export class AdminService {
  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getUsers(filters: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

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
          _count: {
            select: {
              orders: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        activityLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) throw new Error("User not found");

    // Get statistics
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
    data: {
      status?: string;
      balance?: number;
      role?: string;
    }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // Log activity
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

      // Update balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });

      // Create transaction record
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

      // Log activity
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

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

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
          user: {
            select: {
              id: true,
              email: true,
              userName: true,
            },
          },
          provider: {
            select: {
              name: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalOrders, ordersByStatus, ordersByProvider, revenue, profit] =
      await Promise.all([
        prisma.order.count({ where }),

        prisma.order.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),

        prisma.order.groupBy({
          by: ["providerId"],
          where,
          _count: true,
        }),

        prisma.order.aggregate({
          where: { ...where, status: "COMPLETED" },
          _sum: { finalPrice: true },
        }),

        prisma.order.aggregate({
          where: { ...where, status: "COMPLETED" },
          _sum: { profit: true },
        }),
      ]);

    return {
      totalOrders,
      ordersByStatus,
      ordersByProvider,
      totalRevenue: revenue._sum.finalPrice || 0,
      totalProfit: profit._sum.profit || 0,
    };
  }

  // ============================================
  // PRICING MANAGEMENT
  // ============================================

  async getPricingRules() {
    return await prisma.pricingRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async createPricingRule(data: {
    serviceCode?: string;
    country?: string;
    profitType: string;
    profitValue: number;
    priority?: number;
  }) {
    const rule = await prisma.pricingRule.create({
      data: {
        serviceCode: data.serviceCode || null,
        country: data.country || null,
        profitType: data.profitType as any,
        profitValue: data.profitValue,
        priority: data.priority || 0,
        isActive: true,
      },
    });

    // Invalidate pricing cache
    await this.invalidatePricingCache();

    return rule;
  }

  async updatePricingRule(ruleId: string, data: any) {
    const rule = await prisma.pricingRule.update({
      where: { id: ruleId },
      data,
    });

    // Invalidate pricing cache
    await this.invalidatePricingCache();

    return rule;
  }

  async deletePricingRule(ruleId: string) {
    await prisma.pricingRule.delete({
      where: { id: ruleId },
    });

    // Invalidate pricing cache
    await this.invalidatePricingCache();
  }

  private async invalidatePricingCache() {
    // Delete all pricing cache keys
    const keys = await redis.keys("pricing:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // ============================================
  // PROVIDER MANAGEMENT
  // ============================================

  async getProviders() {
    return await prisma.provider.findMany({
      include: {
        _count: {
          select: {
            services: true,
            orders: true,
          },
        },
      },
    });
  }

  async updateProvider(
    providerId: string,
    data: {
      isActive?: boolean;
      priority?: number;
      apiKey?: string;
      rateLimit?: number;
    }
  ) {
    return await prisma.provider.update({
      where: { id: providerId },
      data,
    });
  }

  async syncProviderServices(providerId: string) {
    // This would fetch services from the provider API
    // and update the database
    // Implementation depends on provider API

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) throw new Error("Provider not found");

    // TODO: Implement provider-specific service sync

    return { success: true };
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getDashboardAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalUsers,
      newUsers,
      totalOrders,
      completedOrders,
      totalRevenue,
      totalProfit,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      prisma.order.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
      }),

      prisma.order.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        _sum: { finalPrice: true },
      }),

      prisma.order.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        _sum: { profit: true },
      }),

      prisma.user.count({
        where: {
          lastLoginAt: { gte: startDate },
        },
      }),
    ]);

    // Get daily stats for chart
    const dailyStats = await this.getDailyStats(startDate);

    return {
      overview: {
        totalUsers,
        newUsers,
        totalOrders,
        completedOrders,
        totalRevenue: totalRevenue._sum.finalPrice || 0,
        totalProfit: totalProfit._sum.profit || 0,
        activeUsers,
        conversionRate:
          totalOrders > 0
            ? ((completedOrders / totalOrders) * 100).toFixed(2)
            : "0",
      },
      dailyStats,
    };
  }

  private async getDailyStats(startDate: Date) {
    // Get orders grouped by day
    const orders = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
        SUM(CASE WHEN status = 'COMPLETED' THEN final_price ELSE 0 END) as revenue,
        SUM(CASE WHEN status = 'COMPLETED' THEN profit ELSE 0 END) as profit
      FROM orders
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return orders;
  }

  // ============================================
  // ACTIVITY LOGS
  // ============================================

  async getActivityLogs(filters: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 100,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              userName: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // SYSTEM LOGS
  // ============================================

  async getSystemLogs(filters: {
    level?: string;
    service?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      level,
      service,
      startDate,
      endDate,
      page = 1,
      limit = 100,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (level) where.level = level;
    if (service) where.service = service;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.systemLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Helper methods
  private async getUserTotalSpent(userId: string): Promise<number> {
    const result = await prisma.order.aggregate({
      where: {
        userId,
        status: "COMPLETED",
      },
      _sum: {
        finalPrice: true,
      },
    });

    return Number(result._sum.finalPrice || 0);
  }
}
