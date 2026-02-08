import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../lib/api";

const SearchResultsContext = createContext(null);

export const useSearchResults = () => {
  const context = useContext(SearchResultsContext);
  if (!context) {
    throw new Error("useSearchResults must be used within SearchResultsProvider");
  }
  return context;
};

/** Map agent pick (best_pick, runner_up, budget_pick) to ProductCard shape */
function mapPickToProduct(pick, category, index) {
  if (!pick) return null;
  const priceStr = pick.price || "0";
  const price = parseFloat(priceStr.replace(/[^\d.]/g, "")) || 0;
  return {
    id: pick.link ? `search-${category}-${index}-${pick.link.slice(-8)}` : `search-${category}-${index}`,
    name: pick.title || "Product",
    brand: pick.source || "Unknown",
    price,
    originalPrice: null,
    image: pick.image_link || pick.thumbnail || "https://via.placeholder.com/300?text=Product",
    rating: 4,
    reviews: 0,
    delivery: pick.delivery || "Check retailer",
    reason: pick.reasoning || "",
    url: pick.link || "",
  };
}

/** Build categoryData from /shop final_results for Index page */
export function buildCategoryDataFromSearch(finalResults) {
  if (!finalResults || !finalResults.items) return [];
  const entries = Object.entries(finalResults.items);
  return entries.map(([category, data]) => {
    const rec = data.recommendations || {};
    const bestPick = mapPickToProduct(rec.best_pick, category, 0);
    const alternatives = [
      mapPickToProduct(rec.runner_up, category, 1),
      mapPickToProduct(rec.budget_pick, category, 2),
    ].filter(Boolean);
    return {
      category,
      bestPick: bestPick ? { ...bestPick, isBestPick: true } : null,
      alternatives,
    };
  }).filter((c) => c.bestPick || c.alternatives.length > 0);
}

export const SearchResultsProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState(null);

  const runShop = useCallback(async (shoppingSpec) => {
    if (!shoppingSpec?.items?.length) {
      setShopError("No items in shopping spec");
      return null;
    }
    setShopLoading(true);
    setShopError(null);
    try {
      const res = await fetch(api.shop, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shoppingSpec),
      });
      const data = await res.json();
      if (!res.ok) {
        setShopError(data.detail || data.message || "Shop request failed");
        return null;
      }
      setSearchResults(data);
      return data;
    } catch (err) {
      setShopError(err.message || "Shop unavailable");
      return null;
    } finally {
      setShopLoading(false);
    }
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults(null);
    setShopError(null);
  }, []);

  return (
    <SearchResultsContext.Provider
      value={{
        searchResults,
        setSearchResults,
        shopLoading,
        shopError,
        runShop,
        clearSearchResults,
      }}
    >
      {children}
    </SearchResultsContext.Provider>
  );
};

export default SearchResultsContext;
