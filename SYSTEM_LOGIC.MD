# SMS Verification Service - MVP Architecture Guide

## Scalable for 2M+ Users

---

## 1. System Architecture

### High-Level Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Flutter   │────▶│   Next.js   │────▶│  Express.js │
│  Mobile App │     │   Web App   │     │     API     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────┐
                    │                         │                 │
              ┌─────▼─────┐         ┌────────▼────────┐  ┌────▼────┐
              │ PostgreSQL│         │      Redis      │  │   AWS   │
              │  Primary  │         │  Cache/Queue    │  │   S3    │
              └───────────┘         └─────────────────┘  └─────────┘
                    │
              ┌─────▼─────┐
              │ PostgreSQL│
              │  Replica  │
              └───────────┘
```

### Core Components

#### Frontend Layer

- **Next.js Web App** (Admin + User Portal)
  - Server-side rendering for SEO
  - Admin dashboard with real-time analytics
  - User management portal
- **Flutter Mobile App** (iOS & Android)
  - Native performance
  - Push notifications for SMS received
  - Biometric authentication

#### Backend Layer

- **Express.js API Gateway**
  - Rate limiting
  - Authentication/Authorization
  - Request validation
  - Load balancing

#### Data Layer

- **PostgreSQL** (Primary + Read Replicas)
  - User data, orders, transactions
  - Write operations on primary
  - Read operations distributed across replicas
- **Redis**
  - Session management
  - Rate limiting
  - Real-time order tracking
  - Bull queues for background jobs
  - Cache layer (pricing, services)

#### AWS Infrastructure

- **Elastic Beanstalk** - Backend hosting
- **Amplify** - Next.js hosting
- **RDS PostgreSQL** - Managed database
- **ElastiCache Redis** - Managed cache
- **CloudFront** - CDN
- **S3** - Static assets, logs
- **CloudWatch** - Monitoring
- **SES** - Email notifications

---

## 2. Project Structure

### Backend (Express.js)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── aws.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/
│   │   ├── orders/
│   │   ├── providers/
│   │   ├── admin/
│   │   ├── payments/
│   │   └── webhooks/
│   ├── services/
│   │   ├── smsMan.service.ts
│   │   ├── textVerified.service.ts
│   │   ├── pricing.service.ts
│   │   ├── notification.service.ts
│   │   └── queue.service.ts
│   ├── jobs/
│   │   ├── orderMonitor.job.ts
│   │   ├── providerSync.job.ts
│   │   └── cleanup.job.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── encryption.ts
│   │   └── helpers.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

### Frontend - Web (Next.js)

```
frontend-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── orders/
│   │   │   ├── wallet/
│   │   │   └── settings/
│   │   ├── (admin)/
│   │   │   ├── users/
│   │   │   ├── orders/
│   │   │   ├── pricing/
│   │   │   ├── providers/
│   │   │   └── analytics/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── charts/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── hooks/
└── package.json
```

### Mobile (Flutter)

```
mobile/
├── lib/
│   ├── core/
│   │   ├── api/
│   │   ├── models/
│   │   └── utils/
│   ├── features/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── orders/
│   │   ├── wallet/
│   │   └── settings/
│   ├── shared/
│   │   ├── widgets/
│   │   └── theme/
│   └── main.dart
└── pubspec.yaml
```

---

## 3. MVP Core Features (Phase 1)

### Week 1-2: Foundation

- ✅ Database setup & migration
- ✅ Authentication system (JWT)
- ✅ User registration/login
- ✅ Admin panel basic structure
- ✅ Provider integration (SMS-Man, TextVerified)

### Week 3-4: Core Functionality

- ✅ Service listing & pricing
- ✅ Order placement system
- ✅ SMS retrieval & delivery
- ✅ Wallet system (balance management)
- ✅ Transaction history

### Week 5-6: Admin Features

- ✅ User management (view, edit, ban)
- ✅ Order management & monitoring
- ✅ Pricing rules management
- ✅ Provider health monitoring
- ✅ Activity logs viewer

### Week 7-8: Polish & Launch

- ✅ Payment integration (Stripe/PayPal)
- ✅ Email notifications
- ✅ Mobile app basic version
- ✅ Testing & bug fixes
- ✅ Deployment to production

---

## 4. Scalability Architecture

### Database Optimization

#### Indexing Strategy

```sql
-- Critical indexes already in Prisma schema
-- Additional performance indexes:
CREATE INDEX CONCURRENTLY idx_orders_user_created
  ON orders(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_orders_status_expires
  ON orders(status, expires_at)
  WHERE status IN ('PENDING', 'WAITING_SMS');

CREATE INDEX CONCURRENTLY idx_transactions_user_type_created
  ON transactions(user_id, type, created_at DESC);
```

#### Connection Pooling

```typescript
// database.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["error", "warn"],
});

// Connection pool settings in DATABASE_URL:
// postgresql://user:pass@host:5432/db?
//   connection_limit=20&
//   pool_timeout=10&
//   connect_timeout=10
```

#### Read/Write Splitting

```typescript
// For read operations, use read replica
const readPrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_URL },
  },
});

// Usage:
const orders = await readPrisma.order.findMany(); // Read replica
await prisma.order.create({ data }); // Primary
```

### Redis Caching Strategy

#### Cache Keys Structure

```
service:prices:{provider}:{service}:{country}  TTL: 5min
provider:health:{provider}                     TTL: 1min
user:balance:{userId}                          TTL: 30sec
order:status:{orderId}                         TTL: 5min
rate:limit:{userId}:{action}                   TTL: 1hour
```

#### Implementation

```typescript
// redis.service.ts
import Redis from "ioredis";

export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async getPricing(provider: string, service: string, country: string) {
    const key = `service:prices:${provider}:${service}:${country}`;
    const cached = await this.client.get(key);

    if (cached) return JSON.parse(cached);

    // Fetch from database
    const pricing = await fetchPricingFromDB(provider, service, country);

    // Cache for 5 minutes
    await this.client.setex(key, 300, JSON.stringify(pricing));

    return pricing;
  }

  async invalidatePricing(provider: string, service: string, country: string) {
    const key = `service:prices:${provider}:${service}:${country}`;
    await this.client.del(key);
  }
}
```

### Queue System (Bull)

```typescript
// queue.service.ts
import Queue from "bull";

export const orderMonitorQueue = new Queue("order-monitor", {
  redis: process.env.REDIS_URL,
});

export const providerSyncQueue = new Queue("provider-sync", {
  redis: process.env.REDIS_URL,
});

// Process orders waiting for SMS
orderMonitorQueue.process(10, async (job) => {
  const { orderId } = job.data;

  // Check SMS status from provider
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.status !== "WAITING_SMS") return;

  const smsStatus = await checkSMSStatus(order);

  if (smsStatus.received) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        smsCode: smsStatus.code,
        smsText: smsStatus.text,
        completedAt: new Date(),
      },
    });

    // Send notification
    await sendSMSNotification(order.userId, smsStatus);
  }

  // Re-queue if not expired
  if (new Date() < order.expiresAt) {
    await orderMonitorQueue.add(
      { orderId },
      { delay: 10000 } // Check again in 10 seconds
    );
  }
});
```

### Rate Limiting

```typescript
// rateLimit.middleware.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL);

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rate:api:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later.",
});

export const orderLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rate:order:",
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 orders per minute
  keyGenerator: (req) => req.user.id,
});
```

### Horizontal Scaling

#### Load Balancer Configuration

```yaml
# AWS Elastic Beanstalk config
option_settings:
  aws:elasticbeanstalk:environment:
    LoadBalancerType: application

  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10

  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 70
    LowerThreshold: 20
```

---

## 5. Security Best Practices

### Authentication

```typescript
// auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });

  // Store refresh token in database
  await prisma.session.create({
    data: {
      userId,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
}
```

### Data Encryption

```typescript
// encryption.service.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

### Request Validation

```typescript
// validation.middleware.ts
import { z } from "zod";

export const createOrderSchema = z.object({
  providerId: z.string().cuid(),
  serviceCode: z.string().min(1).max(50),
  country: z.string().length(2),
});

export function validateRequest(schema: z.ZodSchema) {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  };
}
```

---

## 6. Monitoring & Observability

### Logging Setup

```typescript
// logger.ts
import winston from "winston";
import CloudWatchTransport from "winston-cloudwatch";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new CloudWatchTransport({
      logGroupName: "/aws/elasticbeanstalk/sms-service",
      logStreamName: `api-${new Date().toISOString().split("T")[0]}`,
      awsRegion: "us-east-1",
    }),
  ],
});
```

### Metrics Collection

```typescript
// metrics.service.ts
import { CloudWatch } from "aws-sdk";

const cloudwatch = new CloudWatch({ region: "us-east-1" });

export async function trackMetric(
  metricName: string,
  value: number,
  unit: string = "Count"
) {
  await cloudwatch
    .putMetricData({
      Namespace: "SMSService",
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
        },
      ],
    })
    .promise();
}

// Usage:
await trackMetric("OrdersCreated", 1);
await trackMetric("OrderCompletionTime", duration, "Milliseconds");
```

---

## 7. Deployment Checklist

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
DATABASE_READ_URL="postgresql://user:pass@replica:5432/db"

# Redis
REDIS_URL="redis://cache.example.com:6379"

# Auth
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-key"
ENCRYPTION_KEY="32-byte-hex-key"

# Providers
SMSMAN_API_KEY="your-api-key"
TEXTVERIFIED_API_KEY="your-api-key"

# AWS
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"

# App
NODE_ENV="production"
PORT="3000"
```

### Pre-Launch Tests

- [ ] Load testing (k6 or Artillery)
- [ ] Security audit (OWASP checks)
- [ ] Database backup configured
- [ ] Monitoring dashboards setup
- [ ] Error alerting configured
- [ ] Rate limiting tested
- [ ] Provider failover tested
- [ ] Payment integration tested

### Launch Steps

1. Database migration
2. Redis cache warmup
3. Deploy backend to Elastic Beanstalk
4. Deploy frontend to Amplify
5. Configure CloudFront CDN
6. Setup health checks
7. Enable auto-scaling
8. Monitor for 24 hours

---

## 8. Cost Optimization (2M Users)

### Estimated AWS Costs

- **RDS PostgreSQL** (db.r6g.xlarge): ~$400/mo
- **ElastiCache Redis** (cache.r6g.large): ~$200/mo
- **Elastic Beanstalk** (2-10 instances): ~$300-1500/mo
- **Amplify Hosting**: ~$50/mo
- **CloudFront CDN**: ~$100/mo
- **S3 Storage**: ~$25/mo
- **Data Transfer**: ~$200/mo
- **CloudWatch**: ~$50/mo

**Total: ~$1,325 - $2,525/month** at scale

### Optimization Tips

- Use reserved instances (30-70% savings)
- Implement aggressive caching
- Optimize database queries
- Use CloudFront for static assets
- Compress API responses
- Clean up old logs regularly

---

## 9. Next Steps After MVP

### Phase 2 Features

- Mobile app advanced features
- Multiple payment gateways
- API for third-party integrations
- Referral program automation
- Advanced analytics dashboard
- Webhook system for real-time updates

### Phase 3 Scale

- Multi-region deployment
- More SMS providers
- Bulk order discounts
- Team/reseller accounts
- Custom branding options
- White-label solution

---

## Quick Start Commands

```bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend setup
cd frontend-web
npm install
npm run dev

# Mobile setup
cd mobile
flutter pub get
flutter run
```

This architecture is designed to handle 2M+ users with:

- **Horizontal scaling** via load balancers
- **Database read replicas** for performance
- **Redis caching** to reduce DB load
- **Queue systems** for background processing
- **Comprehensive monitoring** for reliability
