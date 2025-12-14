# SMS Providers Setup Guide

This guide explains how to configure SMS providers (Lion and Panda) for the DarNumber application.

## Overview

DarNumber supports two SMS providers:

- **Lion (SMS-Man)** - Global coverage, supports multiple countries
- **Panda (TextVerified)** - USA-only numbers, premium quality

## Provider Configuration

### 1. SMS-Man (Lion) Setup

SMS-Man provides virtual phone numbers from multiple countries.

#### Getting Your API Key

1. Visit [https://sms-man.com](https://sms-man.com)
2. Create an account or log in
3. Go to your profile page: [https://sms-man.com/profile](https://sms-man.com/profile)
4. Copy your API token

#### Add to Environment Variables

Open your `.env` file and add:

```env
SMSMAN_API_KEY=your_api_token_here
```

#### API Endpoints Used

- **Countries**: `https://api.sms-man.com/control/countries?token={token}`
- **Services**: `https://api.sms-man.com/control/applications?token={token}`
- **Prices**: `https://api.sms-man.com/control/get-prices?token={token}`
- **Get Number**: `https://api.sms-man.com/control/get-number?token={token}&country_id={id}&application_id={id}`
- **Get SMS**: `https://api.sms-man.com/control/get-sms?token={token}&request_id={id}`

#### Supported Countries

SMS-Man supports 60+ countries including:

- 🇺🇸 USA
- 🇬🇧 UK
- 🇨🇦 Canada
- 🇩🇪 Germany
- 🇫🇷 France
- 🇮🇳 India
- 🇧🇷 Brazil
- 🇳🇬 Nigeria
- And many more...

---

### 2. TextVerified (Panda) Setup

TextVerified provides premium USA phone numbers.

#### Getting Your API Key

1. Visit [https://textverified.com](https://textverified.com)
2. Create an account or log in
3. Go to your API settings
4. Copy your API key

#### Add to Environment Variables

Open your `.env` file and add:

```env
TEXTVERIFIED_API_KEY=your_api_key_here
```

#### API Endpoints Used

- **Targets**: `https://api.textverified.com/v2/targets`
- **Create Verification**: `https://api.textverified.com/v2/verification/create`
- **Check SMS**: `https://api.textverified.com/v2/verification/{id}`

#### Supported Countries

TextVerified only supports:

- 🇺🇸 USA

---

## Testing Without API Keys

If you don't have API keys yet, the application will use mock data with these services:

### SMS-Man Mock Services

- Google (US, GB, CA)
- Facebook (US, GB)
- WhatsApp (US, GB)
- Telegram (US, GB)
- Instagram (US)
- Twitter (US)
- TikTok (US)

### TextVerified Mock Services

- Google (US)
- Facebook (US)
- WhatsApp (US)
- Telegram (US)
- Instagram (US)
- Twitter (US)
- TikTok (US)

---

## Pricing

### Currency Conversion

The application automatically converts provider prices to Nigerian Naira (NGN):

- **SMS-Man**: Prices in RUB → NGN (₦800 per RUB)
- **TextVerified**: Prices in USD → NGN (₦800 per USD)

You can adjust these conversion rates in:

- `lib/server/services/order.service.ts` - `SMSManService.getAvailableServices()`
- `lib/server/services/order.service.ts` - `TextVerifiedService.getAvailableServices()`

---

## Restart Application

After adding API keys, restart your development server:

```bash
# Kill existing server
lsof -ti:3000 | xargs kill -9

# Start fresh
pnpm dev
```

---

## Troubleshooting

### Issue: "No API key, returning mock data"

**Solution**: Add the API key to your `.env` file and restart the server.

### Issue: "API error: wrong_token"

**Solution**: Verify your API token is correct:

1. Check for extra spaces or quotes
2. Ensure you copied the entire token
3. Verify the token is still active on the provider's website

### Issue: "No services available"

**Possible causes**:

1. API provider is down
2. API key is invalid
3. Network connectivity issues
4. Rate limit exceeded

**Solution**: Check the terminal logs for detailed error messages.

---

## API Documentation

### SMS-Man API v2.0

- Full docs: [https://sms-man.com/api](https://sms-man.com/api)
- Compatible API: [https://sms-man.com/api/compatible](https://sms-man.com/api/compatible)

### TextVerified API

- Full docs: [https://textverified.com/docs](https://textverified.com/docs)

---

## Support

For issues with:

- **SMS-Man**: Contact [support@sms-man.com](mailto:support@sms-man.com)
- **TextVerified**: Contact [support@textverified.com](mailto:support@textverified.com)
- **DarNumber**: Open an issue on GitHub
