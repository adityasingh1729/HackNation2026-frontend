/**
 * Currency symbol for display. Uses profile currency (default USD).
 */
const SYMBOLS = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

export function getCurrencySymbol(currencyCode) {
  if (!currencyCode) return "$";
  const code = String(currencyCode).toUpperCase();
  return SYMBOLS[code] ?? code + " ";
}

/**
 * Format a number as price with the given currency symbol.
 */
export function formatPrice(amount, currencyCode) {
  const symbol = getCurrencySymbol(currencyCode);
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  return `${symbol}${value.toFixed(2)}`;
}
