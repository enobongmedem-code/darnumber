// Country configuration with flags and metadata
export const COUNTRIES = {
  US: { name: "United States", flag: "🇺🇸", code: "US" },
  GB: { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
  CA: { name: "Canada", flag: "🇨🇦", code: "CA" },
  AU: { name: "Australia", flag: "🇦🇺", code: "AU" },
  DE: { name: "Germany", flag: "🇩🇪", code: "DE" },
  FR: { name: "France", flag: "🇫🇷", code: "FR" },
  IN: { name: "India", flag: "🇮🇳", code: "IN" },
  BR: { name: "Brazil", flag: "🇧🇷", code: "BR" },
  NG: { name: "Nigeria", flag: "🇳🇬", code: "NG" },
  KE: { name: "Kenya", flag: "🇰🇪", code: "KE" },
  ZA: { name: "South Africa", flag: "🇿🇦", code: "ZA" },
  GH: { name: "Ghana", flag: "🇬🇭", code: "GH" },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export const getCountryList = () =>
  Object.entries(COUNTRIES).map(([code, data]) => ({
    code,
    ...data,
  }));
