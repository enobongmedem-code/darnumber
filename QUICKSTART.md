# 🚀 Quick Start Guide - Nigerian Payment Integration

## What Was Done

Your Next.js application has been successfully integrated with Express.js backend and Nigerian payment providers (Paystack, Flutterwave, and Etegram).

## ✅ Completed Changes

### Backend (`/backend`)

- ✅ Nigerian payment service created with all 3 providers
- ✅ Payment routes with webhook support
- ✅ Validation schemas added
- ✅ Dependencies installed (paystack-api, flutterwave-node-v3)

### Frontend (`/app`)

- ✅ Checkout page with provider selection
- ✅ Payment verification page
- ✅ Wallet page updated for NGN currency
- ✅ API client methods added
- ✅ Next.js configured to proxy to Express.js

## 🎯 Next Steps (Before Running)

### 1. Setup Environment Variables

**Backend** (`backend/.env`):

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` and add your payment provider keys:

```env
# Required: Get these from payment provider dashboards
PAYSTACK_SECRET_KEY=sk_test_your_key_here
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_key_here
FLUTTERWAVE_SECRET_HASH=your_hash_here
ETEGRAM_SECRET_KEY=sk_live_your_key_here
ETEGRAM_WEBHOOK_SECRET=whsec_your_secret_here

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/darnumber"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

**Frontend** (`.env.local`):

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 2. Install Dependencies

```bash
# Root (Next.js)
pnpm install

# Backend (Express.js) - Already done!
cd backend
# Dependencies already installed
```

### 3. Setup Database

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 4. Start Services

**Terminal 1 - Backend:**

```bash
cd backend
pnpm dev
```

Backend runs on: http://localhost:3000

**Terminal 2 - Frontend:**

```bash
# In root directory
pnpm dev
```

Frontend runs on: http://localhost:3001

## 🧪 Testing the Integration

1. Open http://localhost:3001
2. Create an account or login
3. Navigate to `/wallet`
4. Click "Continue to Checkout"
5. Select a payment provider
6. Enter amount (minimum ₦100)
7. Click "Proceed to Payment"
8. Use test cards (see below)

### Test Cards

**Paystack:**

- Success: `4084084084084081`
- CVV: `408`, PIN: `0000`

**Flutterwave:**

- Success: `5531886652142950`
- CVV: `564`, OTP: `12345`

**Etegram:**

- Check Etegram docs for test cards

## 📚 Documentation

- **Complete Setup Guide**: `NIGERIAN_PAYMENT_SETUP.md`
- **Integration Summary**: `INTEGRATION_SUMMARY.md`
- **API Endpoints**: See NIGERIAN_PAYMENT_SETUP.md

## 🔧 Troubleshooting

### Backend won't start

- Check PostgreSQL is running
- Check Redis is running
- Verify environment variables in `backend/.env`

### Payments not working

- Verify API keys are correct (test keys start with `sk_test_` or `FLWSECK_TEST`)
- Check backend logs for errors
- Ensure amount is >= ₦100

### Next.js can't connect to Express.js

- Ensure backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify Next.js rewrites in `next.config.ts`

## 🌐 Webhook Setup (Production Only)

For production, set up webhooks:

1. Use ngrok for local testing: `ngrok http 3000`
2. Add webhook URLs to provider dashboards:
   - Paystack: `https://your-domain.com/api/v1/payments/webhook/paystack`
   - Flutterwave: `https://your-domain.com/api/v1/payments/webhook/flutterwave`
   - Etegram: `https://your-domain.com/api/v1/payments/webhook/etegram`

## 📞 Getting Payment Provider Keys

### Paystack

1. Sign up: https://dashboard.paystack.com
2. Settings → API Keys & Webhooks
3. Copy Secret Key and Public Key

### Flutterwave

1. Sign up: https://dashboard.flutterwave.com
2. Settings → API
3. Copy Secret Key, Public Key, and generate Secret Hash

### Etegram

1. Sign up: https://etegram.com
2. Dashboard → Settings
3. Copy keys and webhook secret
4. Docs: https://etegram.readme.io/reference/webhook-copy-1

## 🎉 You're All Set!

Once you've:

1. ✅ Added environment variables
2. ✅ Started both servers
3. ✅ Got payment provider keys

You can start accepting payments from Nigerian users using Paystack, Flutterwave, or Etegram!

## 💡 Tips

- Start with **Paystack** - it's the easiest to set up
- Use **test mode** keys until you're ready for production
- Monitor backend logs during testing
- Check transaction history in `/wallet` page

## 🆘 Need Help?

- Check backend logs in terminal
- Review `NIGERIAN_PAYMENT_SETUP.md` for detailed docs
- Contact payment provider support for API issues
