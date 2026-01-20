import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from "libphonenumber-js";

/**
 * Format a phone number using the given ISO2 country code.
 * Returns both a nice international display and strict E.164 for copying.
 */
export function formatPhone(
  raw: string,
  countryIso2?: string,
): { display: string; e164: string } {
  try {
    const trimmed = String(raw || "").trim();
    const iso = (countryIso2 || "").toUpperCase();

    // If number already contains +, try parsing directly
    const withPlus = trimmed.startsWith("+") ? trimmed : undefined;

    let parsed = withPlus
      ? parsePhoneNumberFromString(trimmed)
      : iso
        ? parsePhoneNumberFromString(trimmed, iso as any)
        : undefined;

    if (parsed) {
      const display = parsed.formatInternational();
      const e164 = parsed.number; // already in +E.164
      return { display, e164 };
    }

    // Fallback: prefix with country calling code if we have ISO
    if (iso) {
      try {
        const calling = getCountryCallingCode(iso as any);
        const digits = trimmed.replace(/[^0-9]/g, "");
        const e164 = `+${calling}${digits}`;
        const display = `+${calling} ${digits}`;
        return { display, e164 };
      } catch {}
    }

    // Last resort: return the raw digits
    const digits = trimmed.replace(/\s+/g, "");
    const e164 = digits.startsWith("+") ? digits : `+${digits}`;
    return { display: digits, e164 };
  } catch {
    const safe = String(raw || "");
    const digits = safe.replace(/\s+/g, "");
    const e164 = digits.startsWith("+") ? digits : `+${digits}`;
    return { display: digits, e164 };
  }
}
