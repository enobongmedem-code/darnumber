# Nigerian Payment Integration Guide

This guide explains how to set up and use Nigerian payment providers (Paystack, Flutterwave, and Etegram) in the DarNumber application.

## 🎯 Overview

The application now supports three major Nigerian payment providers:

- **Paystack** - Cards, Bank Transfer, USSD
- **Flutterwave** - Cards, Bank, Mobile Money
- **Etegram** - Fast & Secure Payments

## 📋 Prerequisites

1. Node.js 18+ and pnpm installed
2. PostgreSQL database
3. Redis server
4. Accounts with payment providers

## 🔑 Getting Payment Provider Keys

### Paystack

1. Sign up at [https://dashboard.paystack.com](https://dashboard.paystack.com)
2. Navigate to Settings → API Keys & Webhooks
3. Copy your **Secret Key** and **Public Key**
4. Set up webhook URL: `https://yourdomain.com/api/v1/payments/webhook/paystack`

### Flutterwave

1. Sign up at [https://dashboard.flutterwave.com](https://dashboard.flutterwave.com)
2. Go to Settings → API
3. Copy your **Secret Key** and **Public Key**
4. Generate a **Secret Hash** for webhook verification
5. Set up webhook URL: `https://yourdomain.com/api/v1/payments/webhook/flutterwave`

### Etegram

1. Sign up at [https://etegram.com](https://etegram.com)
2. Visit Dashboard → Settings → API & Keys
3. Copy your **Project ID**
4. Copy your **Public Key** (choose either test or live key)
5. Set up webhook URL in both test and live modes: `https://yourdomain.com/api/v1/payments/webhook/etegram`
6. API Documentation: [https://etegram.readme.io/reference/webhook-copy-1](https://etegram.readme.io/reference/webhook-copy-1)

**Note:** Etegram uses Project ID and Public Key (not Secret Key). The webhook is automatically configured through your dashboard.

## ⚙️ Configuration

### Backend Configuration

1. **Copy environment file:**

   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Add payment provider keys to `backend/.env`:**

   ```env
   # Paystack
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # Flutterwave
   FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   FLUTTERWAVE_SECRET_HASH=your-secret-hash

   # Etegram
   ETEGRAM_PROJECT_ID=66cc9f4ad602e72ea995b728
   ETEGRAM_PUBLIC_KEY=etg_pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Frontend Configuration

1. **Copy environment file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Add configuration to `.env.local`:**

   ```env
   # Backend API
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

   # Payment Provider Public Keys
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_ETEGRAM_PROJECT_ID=66cc9f4ad602e72ea995b728
   NEXT_PUBLIC_ETEGRAM_PUBLIC_KEY=etg_pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the backend (Express.js):**

   ```bash
   cd backend
   pnpm dev
   ```

   Backend runs on: `http://localhost:3000`

2. **Start the frontend (Next.js):**
   ```bash
   # In root directory
   pnpm dev
   ```
   Frontend runs on: `http://localhost:3001`

### Production Mode

1. **Build backend:**

   ```bash
   cd backend
   pnpm build
   pnpm start
   ```

2. **Build frontend:**
   ```bash
   pnpm build
   pnpm start
   ```

## 💳 How It Works

### User Flow

1. User navigates to `/wallet` page
2. Clicks "Continue to Checkout"
3. Redirected to `/wallet/checkout`
4. Selects payment provider (Paystack, Flutterwave, or Etegram)
5. Enters amount (minimum ₦100)
6. Clicks "Proceed to Payment"
7. Redirected to payment provider's secure page
8. Completes payment
9. Redirected back to `/wallet/verify`
10. Payment verified and wallet credited

### Backend Flow

```
POST /api/v1/payments/initialize
  ↓
Create pending transaction
  ↓
Return authorization URL
  ↓
User completes payment
  ↓
Provider sends webhook
  ↓
POST /api/v1/payments/webhook/{provider}
  ↓
Verify signature
  ↓
Update transaction status
  ↓
Credit user wallet
  ↓
Send notification
```

## 🔒 Security Features

- **Webhook Signature Verification**: All webhooks are verified using HMAC signatures
- **HTTPS Required**: Production webhooks must use HTTPS
- **Environment Variables**: Sensitive keys stored in environment variables
- **Rate Limiting**: API endpoints protected with rate limiting
- **Transaction Idempotency**: Duplicate payments prevented with unique references

## 📡 API Endpoints

### Get Available Providers

```http
GET /api/v1/payments/providers
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "name": "Paystack",
      "value": "paystack",
      "description": "Pay with Paystack - Cards, Bank Transfer, USSD",
      "logo": "/providers/paystack.png"
    },
    ...
  ]
}
```

### Initialize Payment

```http
POST /api/v1/payments/initialize
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 5000,
  "provider": "paystack"
}

Response:
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "reference": "PAY-1234567890-abc123",
    "transactionId": "txn_1234567890"
  }
}
```

### Verify Payment

```http
GET /api/v1/payments/verify/{reference}?provider=paystack
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "success": true,
    "status": "success",
    "amount": 5000,
    "reference": "PAY-1234567890-abc123"
  }
}
```

## 🔔 Webhook Setup

### Local Development (using ngrok)

1. **Install ngrok:**

   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok tunnel:**

   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Configure webhooks:**
   - Paystack: `https://abc123.ngrok.io/api/v1/payments/webhook/paystack`
   - Flutterwave: `https://abc123.ngrok.io/api/v1/payments/webhook/flutterwave`
   - Etegram: `https://abc123.ngrok.io/api/v1/payments/webhook/etegram`

### Production

1. Use your production domain with HTTPS
2. Example: `https://api.yourdomain.com/api/v1/payments/webhook/{provider}`

## 🧪 Testing

### Test Mode

All providers support test mode:

- Use test API keys (prefixed with `sk_test_` or `FLWSECK_TEST`)
- Use test cards provided by each provider
- No real money is charged

### Test Cards

**Paystack:**

- Success: `4084084084084081`
- Decline: `5060666666666666666`

**Flutterwave:**

- Success: `5531886652142950`
- Decline: `5061020000000000094`

**Etegram:**

- Refer to Etegram documentation for test cards

## 🛠️ Troubleshooting

### Payment not reflecting after completion

1. Check backend logs for webhook errors
2. Verify webhook signature configuration
3. Ensure webhook URL is accessible
4. Check transaction status in database

### "Invalid payment provider" error

1. Verify provider name is correct: `paystack`, `flutterwave`, or `etegram`
2. Ensure provider API keys are configured
3. Check if provider is enabled in backend

### Webhook signature verification failed

1. Verify webhook secret matches provider dashboard
2. Check that payload is not modified
3. Ensure Content-Type is `application/json`

## 📝 Currency

All transactions use **Nigerian Naira (NGN)** as the default currency for Nigerian payment providers.

- Minimum deposit: ₦100
- Minimum withdrawal: ₦1,000

## 🔄 Migration from Stripe

If you were previously using Stripe:

1. Nigerian payment providers are now the primary option
2. Stripe integration remains available for backwards compatibility
3. Update your wallet UI to use the new checkout flow
4. Old Stripe webhooks will continue to work at `/api/v1/payments/webhook/stripe`

## 📞 Support

For payment provider specific issues:

- **Paystack**: support@paystack.com
- **Flutterwave**: support@flutterwave.com
- **Etegram**: support@etegram.com

For application issues:

- Check backend logs in `backend/logs/`
- Review error responses from API
- Contact your system administrator

## 📚 Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api)
- [Flutterwave API Documentation](https://developer.flutterwave.com/docs)
- [Etegram API Documentation](https://etegram.readme.io/reference/webhook-copy-1)
