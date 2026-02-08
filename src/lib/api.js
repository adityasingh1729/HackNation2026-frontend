/**
 * API base URL for the Agentic Commerce backend.
 * Deployed at: https://agentic-commerce-api-f1fx.onrender.com
 * Override with VITE_API_URL in .env for local or other deployments.
 */
export const API_BASE =
  import.meta.env.VITE_API_URL || "https://agentic-commerce-api-f1fx.onrender.com";

/**
 * Profile API (name, address, pincode, currency).
 * Default: http://localhost:3001 when running backend locally.
 * Set VITE_PROFILE_API_URL in .env when deploying profile API elsewhere.
 */
export const PROFILE_API_BASE =
  import.meta.env.VITE_PROFILE_API_URL || "http://localhost:3001";

export const api = {
  chat: `${API_BASE}/chat`,
  shop: `${API_BASE}/shop`,
  checkoutExecute: `${API_BASE}/checkout/execute`,
  profile: `${PROFILE_API_BASE}/profile`,
};
