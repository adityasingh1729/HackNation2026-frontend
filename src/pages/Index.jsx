import { useState } from "react";
import { ShoppingCart, Sparkles, Search, MessageCircle, Loader2 } from "lucide-react";
import Header from "../components/Header";
import ChatInput from "../components/ChatInput";
import CategorySection from "../components/CategorySection";
import CartModal from "../components/CartModal";
import ProfileModal from "../components/ProfileModal";
import NavigationArrows from "../components/NavigationArrows";
import { useCart } from "../context/CartContext";
import { useSearchResults, buildCategoryDataFromSearch } from "../context/SearchResultsContext";

const Index = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { getTotalItems } = useCart();
  const { searchResults, shopLoading } = useSearchResults();
  const totalItems = getTotalItems();

  const categoryData = searchResults?.final_results
    ? buildCategoryDataFromSearch(searchResults.final_results)
    : [];

  const hasResults = categoryData.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenProfile={() => setProfileOpen(true)} />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl" />
      </div>

      <main className={`pt-24 px-6 ${shopLoading || hasResults ? "pb-28" : "pb-80"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
              <Search className="w-4 h-4" />
              <span>
                {shopLoading
                  ? "Searching across retailers…"
                  : hasResults
                    ? "Search results from your shopping spec"
                    : "Chat with the AI agent, confirm your order, then see results here"}
              </span>
            </div>
            {hasResults && (
              <div className="flex items-center justify-end">
                <NavigationArrows
                  onPrevious={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  onNext={() => setCurrentPage(currentPage + 1)}
                  hasPrevious={currentPage > 1}
                />
              </div>
            )}
          </div>

          {shopLoading ? (
            <div className="soft-card p-12 text-center animate-fade-in">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Searching across retailers to find best fit
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                We're comparing prices and availability. Results will appear here shortly.
              </p>
            </div>
          ) : hasResults ? (
            <div className="space-y-6 mb-8">
              {categoryData.map((categoryItem, index) => (
                <div
                  key={categoryItem.category}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <CategorySection
                    category={categoryItem.category}
                    bestPick={categoryItem.bestPick}
                    alternatives={categoryItem.alternatives || []}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="soft-card p-12 text-center animate-fade-in">
              <div className="flex justify-center mb-4">
                <MessageCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No search results yet
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-2">
                Use the chat below to describe what you want to buy. Include items, budget,
                delivery pincode, and deadline. When you confirm, we’ll search the web and show
                real product picks here.
              </p>
              <p className="text-xs text-muted-foreground">
                Example: “I need hiking boots and a backpack, budget $200, deliver to 400001 by Feb 15”
              </p>
            </div>
          )}

          {hasResults && (
            <div className="soft-card p-8 text-center glow-ambient animate-fade-in">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
                <span className="text-sm font-medium text-muted-foreground">
                  AI-Powered Shopping
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {totalItems > 0
                  ? `You have ${totalItems} item${totalItems > 1 ? "s" : ""} selected`
                  : "Ready to shop these results?"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                {totalItems > 0
                  ? "Review your selections and proceed to checkout"
                  : "Select products above and proceed to checkout"}
              </p>
              <button
                onClick={() => setIsCartOpen(true)}
                className="gradient-button px-8 py-3.5 rounded-xl inline-flex items-center gap-3 font-semibold text-lg group relative"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 group-hover:animate-float" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-warm text-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                      {totalItems}
                    </span>
                  )}
                </div>
                {totalItems > 0 ? "View Cart" : "Generate Cart"}
              </button>
            </div>
          )}
        </div>
      </main>

      <ChatInput />
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};

export default Index;
