import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts any date (string, date obj) to unix timestamp.
 * // ! we should deprecate this, this is not safe
 *
 * @param raw
 * @returns
 */
export const coerceAnyDate = (raw: unknown): number | undefined => {
  if (typeof raw === "number") return raw > 0 ? raw : undefined;
  if (typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;

  // numeric string (ms epoch)
  if (/^\d{6,}$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  // ISO/date-like string
  const ms = Date.parse(s);
  return Number.isFinite(ms) && ms > 0 ? ms : undefined;
};

/**
 * Return a formatted date string from another timestamp string without the time.
 * @param dateString Timestamp/date in string form.
 */
export const formatDateWithoutTime = (dateString?: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
