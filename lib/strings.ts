/** Lowercase safely (handles undefined/null). */
export const safeLower = (v?: string | null) => (v ?? "").toLowerCase();

/** Capitalize only the first letter. */
export const ucfirst = (v?: string | null) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : "");

/** Capitalize the first letter of every word (Unicode-aware). */
export const capWords = (v?: string | null) =>
  v ? v.replace(/\b\p{L}/gu, (ch) => ch.toUpperCase()) : "";
