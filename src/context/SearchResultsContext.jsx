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

/** Merge new single-category /shop response into existing full results */
function mergeCategoryIntoResults(prev, newData, category) {
  if (!prev || !newData) return prev;
  const next = {
    ...prev,
    raw_results: { ...(prev.raw_results || {}) },
    final_results: {
      ...(prev.final_results || {}),
      items: { ...(prev.final_results?.items || {}) },
    },
  };
  const newItems = newData.final_results?.items;
  const newRaw = newData.raw_results;
  if (newItems && typeof newItems === "object") {
    const key = Object.keys(newItems).find((k) => k === category) || Object.keys(newItems)[0];
    if (key) {
      next.final_results.items[key] = newItems[key];
    }
  }
  if (newRaw && typeof newRaw === "object") {
    const key = Object.keys(newRaw).find((k) => k === category) || Object.keys(newRaw)[0];
    if (key) {
      next.raw_results[key] = newRaw[key];
    }
  }
  return next;
}

export const SearchResultsProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState(null);
  const [lastSpec, setLastSpec] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [refineLoadingCategory, setRefineLoadingCategory] = useState(null);
  const [shopError, setShopError] = useState(null);

  const runShop = useCallback(async (shoppingSpec) => {
    if (!shoppingSpec?.items?.length) {
      setShopError("No items in shopping spec");
      return null;
    }
    setLastSpec(shoppingSpec);
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

  /**
   * Refine search for a single category/product using the same APIs as the chatbot.
   * Uses the last shopping spec (from chat) so pincode, budget, currency, deadline
   * and the product's query/preferences from the json spec are included.
   * Optional preferencesOverride refines the search (e.g. "under $50", "waterproof").
   */
  const refineForCategory = useCallback(
    async (category, preferencesOverride) => {
      if (!lastSpec) {
        setShopError("No shopping spec yet — confirm your plan in chat first.");
        return null;
      }
      const item =
        lastSpec.items.find((i) => (i.query || "").toLowerCase() === (category || "").toLowerCase()) ||
        lastSpec.items.find((i) => i.query === category) ||
        { query: category, preferences: "" };
      const refinedItem = {
        query: item.query || category,
        preferences:
          preferencesOverride !== undefined && preferencesOverride !== null
            ? String(preferencesOverride).trim()
            : (item.preferences || ""),
      };
      const oneItemSpec = {
        delivery_pincode: lastSpec.delivery_pincode,
        delivery_deadline_date: lastSpec.delivery_deadline_date,
        total_budget: lastSpec.total_budget,
        budget_currency: lastSpec.budget_currency || "USD",
        items: [refinedItem],
      };
      setRefineLoadingCategory(category);
      setShopError(null);
      try {
        const res = await fetch(api.shop, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(oneItemSpec),
        });
        const data = await res.json();
        if (!res.ok) {
          setShopError(data.detail || data.message || "Refine failed");
          return null;
        }
        setSearchResults((prev) => mergeCategoryIntoResults(prev, data, category));
        return data;
      } catch (err) {
        setShopError(err.message || "Refine unavailable");
        return null;
      } finally {
        setRefineLoadingCategory(null);
      }
    },
    [lastSpec]
  );

  const clearSearchResults = useCallback(() => {
    setSearchResults(null);
    setLastSpec(null);
    setShopError(null);
  }, []);

  return (
    <SearchResultsContext.Provider
      value={{
        searchResults,
        setSearchResults,
        lastSpec,
        shopLoading,
        shopError,
        refineLoadingCategory,
        runShop,
        refineForCategory,
        clearSearchResults,
      }}
    >
      {children}
    </SearchResultsContext.Provider>
  );
};

export default SearchResultsContext;
