import { useState } from "react";
import { Plus, Minus, Trash2, Star, ShoppingCart, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useProfile } from "../context/ProfileContext";
import { formatPrice } from "../lib/currency";

const ProductCard = ({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  category,
  delivery,
  onRemove,
  compact = false,
  isBestPick = false,
  reason = "Top-rated choice with excellent value and reliable performance",
  url,
}) => {
  const { getQuantity, setProductQuantity } = useCart();
  const { profile } = useProfile();
  const currency = profile?.currency || "USD";
  const [showReason, setShowReason] = useState(isBestPick); // Show by default for best picks
  const quantity = getQuantity(id);

  const product = { id, name, brand, price, originalPrice, image, rating, reviews, category, delivery, reason, url: url || "" };

  const handleIncrement = () => {
    setProductQuantity(product, quantity + 1);
  };

  const handleDecrement = () => {
    setProductQuantity(product, Math.max(0, quantity - 1));
  };

  const handleAddToCart = () => {
    setProductQuantity(product, 1);
  };

  if (compact) {
    return (
      <div 
        className={`
          soft-card p-3 group transition-all duration-300 relative h-full flex flex-col hover:shadow-lg
          ${quantity > 0 ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
        `}
      >
        {/* Best Pick Badge - Warm Yellow */}
        {isBestPick && (
          <div className="absolute -top-2 left-3 z-20 flex items-center gap-1 px-2 py-0.5 bg-warm text-foreground text-[10px] font-bold rounded-full shadow-md">
            <Sparkles className="w-2.5 h-2.5" />
            Best Pick
          </div>
        )}

        {/* Selected Indicator */}
        {quantity > 0 && (
          <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
            <Check className="w-2.5 h-2.5" />
          </div>
        )}

        {/* Product Image - Smaller aspect ratio */}
        <div className="relative aspect-[4/3] rounded-lg bg-muted overflow-hidden mb-2">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {originalPrice && (
            <div className="absolute top-1.5 left-1.5 bg-warm text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              -{Math.round((1 - price / originalPrice) * 100)}%
            </div>
          )}
        </div>

        <div className="space-y-1 flex-1 flex flex-col">
          {/* Brand Badge */}
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full w-fit">
            {brand}
          </span>
          
          {/* Product Title - 2 line truncation */}
          <h4 className="text-foreground font-medium text-xs line-clamp-2 leading-tight">
            {name}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${
                    i < Math.floor(rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({reviews.toLocaleString()})</span>
          </div>

          {/* Price - High Contrast */}
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-foreground">
              {formatPrice(price, currency)}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(originalPrice, currency)}
              </span>
            )}
          </div>

          {/* Delivery Info */}
          {delivery && (
            <p className="text-[10px] text-muted-foreground">
              {delivery}
            </p>
          )}

          {/* Reason - Always shown for best pick, collapsible for others */}
          {isBestPick ? (
            <p className="text-[10px] text-muted-foreground italic leading-relaxed border-l-2 border-primary pl-1.5 line-clamp-2">
              "{reason}"
            </p>
          ) : (
            <>
              <button
                onClick={() => setShowReason(!showReason)}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors w-fit"
              >
                Why this pick?
                {showReason ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
              
              {showReason && (
                <p className="text-[10px] text-muted-foreground italic leading-relaxed border-l-2 border-primary/30 pl-1.5 animate-fade-in line-clamp-2">
                  "{reason}"
                </p>
              )}
            </>
          )}

          {/* Spacer to push actions to bottom */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
            {quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs transition-all
                  ${isBestPick 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md' 
                    : 'bg-primary/10 hover:bg-primary/20 text-primary'
                  }
                `}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </button>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDecrement}
                    className="p-1.5 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Minus className="w-2.5 h-2.5 text-foreground" />
                  </button>
                  <span className="text-xs font-bold w-6 text-center text-foreground">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    className="p-1.5 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5 text-foreground" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {formatPrice(price * quantity, currency)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-4 flex gap-4 group animate-fade-in ${quantity > 0 ? 'ring-2 ring-primary/50' : ''}`}>
      <div className="relative w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {quantity > 0 && (
          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {brand}
        </span>
        <h4 className="text-foreground font-medium text-sm mb-1 line-clamp-2 mt-1">
          {name}
        </h4>

        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(price, currency)}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice, currency)}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground italic mt-2 leading-relaxed border-l-2 border-primary/30 pl-2">
          "{reason}"
        </p>
      </div>

      <div className="flex flex-col items-end justify-between">
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 bg-muted rounded-lg">
          <button
            onClick={handleDecrement}
            className="p-1.5 hover:bg-surface-elevated rounded-l-lg transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-medium w-6 text-center">{quantity}</span>
          <button
            onClick={handleIncrement}
            className="p-1.5 hover:bg-surface-elevated rounded-r-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
