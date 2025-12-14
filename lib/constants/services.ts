// Popular service logos and metadata
export const SERVICE_LOGOS: Record<
  string,
  { name: string; logo: string; color: string }
> = {
  // Social Media
  wa: { name: "WhatsApp", logo: "💚", color: "bg-green-500" },
  tg: { name: "Telegram", logo: "✈️", color: "bg-blue-400" },
  fb: { name: "Facebook", logo: "📘", color: "bg-blue-600" },
  ig: { name: "Instagram", logo: "📸", color: "bg-pink-500" },
  tw: { name: "Twitter/X", logo: "🐦", color: "bg-sky-500" },
  sc: { name: "Snapchat", logo: "👻", color: "bg-yellow-400" },
  tiktok: { name: "TikTok", logo: "🎵", color: "bg-black" },
  discord: { name: "Discord", logo: "🎮", color: "bg-indigo-600" },

  // Tech & Services
  go: { name: "Google", logo: "🔍", color: "bg-blue-500" },
  microsoft: { name: "Microsoft", logo: "🪟", color: "bg-blue-600" },
  apple: { name: "Apple", logo: "🍎", color: "bg-gray-800" },
  amazon: { name: "Amazon", logo: "📦", color: "bg-orange-500" },
  uber: { name: "Uber", logo: "🚗", color: "bg-black" },
  netflix: { name: "Netflix", logo: "🎬", color: "bg-red-600" },
  spotify: { name: "Spotify", logo: "🎧", color: "bg-green-500" },

  // Financial
  paypal: { name: "PayPal", logo: "💳", color: "bg-blue-500" },
  binance: { name: "Binance", logo: "₿", color: "bg-yellow-500" },
  coinbase: { name: "Coinbase", logo: "🪙", color: "bg-blue-600" },

  // Others
  airbnb: { name: "Airbnb", logo: "🏠", color: "bg-pink-500" },
  linkedin: { name: "LinkedIn", logo: "💼", color: "bg-blue-700" },
  viber: { name: "Viber", logo: "📞", color: "bg-purple-500" },
  yahoo: { name: "Yahoo", logo: "📧", color: "bg-purple-600" },
  line: { name: "LINE", logo: "💬", color: "bg-green-500" },
  wechat: { name: "WeChat", logo: "💬", color: "bg-green-600" },

  // Default
  default: { name: "Service", logo: "📱", color: "bg-gray-500" },
};

export const getServiceLogo = (serviceCode: string) => {
  const code = serviceCode.toLowerCase();
  return SERVICE_LOGOS[code] || SERVICE_LOGOS["default"];
};
