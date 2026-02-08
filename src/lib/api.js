/**
 * API base URL for the Agentic Commerce backend (deployed main.py).
 * Override with VITE_API_URL in .env for local or other deployments.
 */
export const API_BASE =
  import.meta.env.VITE_API_URL || "https://agentic-commerce-api-f1fx.onrender.com";

export const api = {
  chat: `${API_BASE}/chat`,
  shop: `${API_BASE}/shop`,
  checkoutExecute: `${API_BASE}/checkout/execute`,
};
