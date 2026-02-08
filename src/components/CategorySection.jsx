import { useState } from "react";
import { ChevronDown, ChevronUp, Send, Award, Loader2 } from "lucide-react";
import ProductCard from "./ProductCard";
import { useSearchResults } from "../context/SearchResultsContext";

const CategorySection = ({ category, bestPick, alternatives }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [preference, setPreference] = useState("");
  const { refineForCategory, refineLoadingCategory, lastSpec } = useSearchResults();
  const isRefining = refineLoadingCategory === category;

  const specItem = lastSpec?.items?.find(
    (i) => (i.query || "").toLowerCase() === (category || "").toLowerCase()
  ) || lastSpec?.items?.find((i) => i.query === category);
  const originalPreferences = specItem?.preferences || "";

  const handleRefine = () => {
    refineForCategory(category, preference || undefined);
  };

  const allProducts = bestPick
    ? [{ ...bestPick, isBestPick: true }, ...alternatives]
    : alternatives;

  return (
    <div className="soft-card p-6 animate-fade-in">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{category}</h3>
            <p className="text-sm text-muted-foreground">
              {allProducts.length} products from top brands
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isRefining}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-foreground disabled:opacity-60"
        >
          Refine
          {isRefining ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Product Cards - Full Width Grid */}
      <div className="grid grid-cols-3 gap-3">
        {allProducts.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            category={category}
            compact={true}
          />
        ))}
      </div>

      {/* Refinement Input - uses same API as chatbot (json spec: pincode, budget, etc.) */}
      {isExpanded && (
        <div className="mt-6 pt-4 border-t border-border animate-fade-in">
          <p className="text-xs text-muted-foreground mb-2">
            Refine results for this product using the same search as the chatbot (pincode, budget & currency from your plan).
            {originalPreferences && (
              <span className="block mt-1">
                Current preferences: &ldquo;{originalPreferences}&rdquo;
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRefine()}
              placeholder={originalPreferences || `e.g. under $100, waterproof, eco-friendly`}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground"
              disabled={isRefining}
            />
            <button
              onClick={handleRefine}
              disabled={isRefining}
              className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 min-w-[100px]"
            >
              {isRefining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {!isRefining && "Refine"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySection;
