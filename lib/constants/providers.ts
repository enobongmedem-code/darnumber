// Provider configuration
export const PROVIDERS = {
  LION: {
    id: "lion",
    name: "Lion",
    displayName: "Lion SMS",
    apiUrl: "https://sms-man.com/api",
    countries: [
      "US",
      "GB",
      "CA",
      "AU",
      "DE",
      "FR",
      "IN",
      "BR",
      "NG",
      "KE",
      "ZA",
      "GH",
    ], // All countries
    logo: "🦁",
    color: "bg-amber-500",
    description: "Global coverage with fast delivery",
  },
  PANDA: {
    id: "panda",
    name: "Panda",
    displayName: "Panda Verify",
    apiUrl: "https://www.textverified.com/docs/api/v2",
    countries: ["US"], // USA only
    logo: "🐼",
    color: "bg-green-500",
    description: "Premium USA numbers only",
  },
} as const;

export type ProviderId = keyof typeof PROVIDERS;
