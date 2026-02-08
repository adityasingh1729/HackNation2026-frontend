import { useState } from "react";
import { ChevronDown, ChevronUp, Send, Award } from "lucide-react";
import ProductCard from "./ProductCard";

const CategorySection = ({ category, bestPick, alternatives }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [preference, setPreference] = useState("");

  // Combine best pick with alternatives for rendering
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-foreground"
        >
          Refine
          {isExpanded ? (
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

      {/* Refinement Input - Below Cards */}
      {isExpanded && (
        <div className="mt-6 pt-4 border-t border-border animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              placeholder={`Specify preferences for ${category.toLowerCase()}...`}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            E.g., "under $300", "extra warm", "eco-friendly materials"
          </p>
        </div>
      )}
    </div>
  );
};

export default CategorySection;
