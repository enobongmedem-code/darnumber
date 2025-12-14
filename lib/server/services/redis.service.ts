import Redis from "ioredis";

export class RedisService {
  private client: Redis;
  private isConnected = false;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      reconnectOnError: (err) => err.message.includes("READONLY"),
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      console.log("✅ Redis connected");
    });
    this.client.on("error", (error) => {
      this.isConnected = false;
      console.error("❌ Redis error:", error);
    });
  }

  async get(key: string) {
    try {
      return await this.client.get(key);
    } catch (e) {
      console.error(`Redis GET error for key ${key}:`, e);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number) {
    try {
      if (ttl) await this.client.setex(key, ttl, value);
      else await this.client.set(key, value);
    } catch (e) {
      console.error(`Redis SET error for key ${key}:`, e);
    }
  }

  async del(...keys: string[]) {
    try {
      return await this.client.del(...keys);
    } catch (e) {
      console.error("Redis DEL error:", e);
      return 0;
    }
  }

  async exists(key: string) {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (e) {
      console.error("Redis EXISTS error:", e);
      return false;
    }
  }

  async expire(key: string, seconds: number) {
    try {
      await this.client.expire(key, seconds);
    } catch (e) {
      console.error("Redis EXPIRE error:", e);
    }
  }

  async keys(pattern: string) {
    try {
      return await this.client.keys(pattern);
    } catch (e) {
      console.error("Redis KEYS error:", e);
      return [];
    }
  }

  async getOrderStatus(orderId: string) {
    const key = `order:status:${orderId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  async setOrderStatus(orderId: string, status: any, ttl = 300) {
    const key = `order:status:${orderId}`;
    await this.set(key, JSON.stringify(status), ttl);
  }
  async invalidateOrder(orderId: string) {
    const key = `order:status:${orderId}`;
    await this.del(key);
  }

  async invalidateUserBalance(userId: string) {
    const key = `user:balance:${userId}`;
    await this.del(key);
  }
}

let redisInstance: RedisService | null = null;
export function getRedisService() {
  if (!redisInstance) redisInstance = new RedisService();
  return redisInstance;
}
