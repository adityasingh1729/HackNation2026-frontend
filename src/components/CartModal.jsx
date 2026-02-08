import { useState } from "react";
import {
  X,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  PackageX,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { useCart } from "../context/CartContext";
import { useProfile } from "../context/ProfileContext";
import { formatPrice } from "../lib/currency";
import { api } from "../lib/api";

const defaultProfile = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  token: "tok_sandbox_123",
};

const CartModal = ({ isOpen, onClose }) => {
  const {
    getCartProducts,
    getTotalPrice,
    getTotalSavings,
    getTotalItems,
    getCartForCheckout,
    removeFromCart,
  } = useCart();

  const [step, setStep] = useState("cart");
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [executeResult, setExecuteResult] = useState(null);

  const { profile: userProfile } = useProfile();
  const currency = userProfile?.currency || "USD";

  const cartProducts = getCartProducts();
  const subtotal = getTotalPrice();
  const savings = getTotalSavings();
  const totalItems = getTotalItems();
  const checkoutCart = getCartForCheckout();
  const canExecute = checkoutCart.items.length > 0;

  const handleClose = () => {
    setStep("cart");
    setExecuteResult(null);
    onClose();
  };

  const handleProceedToCheckout = () => {
    setStep("checkout");
  };

  const handleExecuteCheckout = async () => {
    if (!canExecute) return;
    setLoading(true);
    setExecuteResult(null);
    try {
      const res = await fetch(api.checkoutExecute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: checkoutCart,
          profile: {
            shippingAddress: {
              name: profile.name,
              line1: profile.line1,
              city: profile.city,
              state: profile.state,
              zip: profile.zip,
              country: profile.country,
            },
            contact: { email: profile.email, phone: profile.phone },
            payment: { type: "card", token: profile.token },
          },
          headless: true,
        }),
      });
      const data = await res.json();
      setExecuteResult(data);
      setStep("done");
    } catch (err) {
      setExecuteResult({
        error: "Request failed",
        message: err.message,
        results: [],
        summary: { total: 0, success: 0, failed: 0 },
      });
      setStep("done");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg glass-card overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 relative">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {step === "cart" && "Your Cart"}
                {step === "checkout" && "Checkout"}
                {step === "done" && "Checkout Results"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === "cart" &&
                  `${cartProducts.length} ${cartProducts.length === 1 ? "product" : "products"} selected`}
                {step === "checkout" && "Enter details and run executor"}
                {step === "done" && executeResult?.summary &&
                  `${executeResult.summary.success} succeeded, ${executeResult.summary.failed} failed`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Step: Cart */}
        {step === "cart" && (
          <>
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto flex-1">
              {cartProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <PackageX className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-foreground font-medium mb-1">Your cart is empty</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Add products from the search results by clicking "Add to Cart"
                  </p>
                </div>
              ) : (
                cartProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onRemove={() => removeFromCart(product.id)}
                  />
                ))
              )}
            </div>

            {cartProducts.length > 0 && (
              <div className="p-5 border-t border-border space-y-4 bg-muted/30 flex-shrink-0">
                {savings > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">
                      You're saving {formatPrice(savings, currency)}!
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
<span className="text-2xl font-bold text-foreground">
                {formatPrice(subtotal, currency)}
              </span>
                </div>
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full gradient-button py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
                >
                  Proceed to Checkout
                  <ChevronRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  We'll open each product link and run the buying flow (simulated).
                </p>
              </div>
            )}
          </>
        )}

        {/* Step: Checkout (profile + execute) */}
        {step === "checkout" && (
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <button
              onClick={() => setStep("cart")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to cart
            </button>
            <p className="text-sm text-muted-foreground">
              Profile is used to fill checkout forms when the executor runs. No real payment.
            </p>
            <div className="grid gap-3">
              {["name", "email", "phone", "line1", "city", "state", "zip", "country"].map(
                (key) => (
                  <label key={key} className="block">
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {key === "line1" ? "Address" : key}
                    </span>
                    <input
                      type={key === "email" ? "email" : "text"}
                      value={profile[key]}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      placeholder={key === "token" ? "tok_sandbox_123" : ""}
                    />
                  </label>
                )
              )}
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Payment token (sandbox)
                </span>
                <input
                  type="text"
                  value={profile.token}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, token: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </label>
            </div>
            <button
              onClick={handleExecuteCheckout}
              disabled={!canExecute || loading}
              className="w-full gradient-button py-3 rounded-xl flex items-center justify-center gap-2 font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running checkout at each link…
                </>
              ) : (
                <>
                  Execute checkout at {checkoutCart.items.length} link
                  {checkoutCart.items.length !== 1 ? "s" : ""}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step: Done (results) */}
        {step === "done" && executeResult && (
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <button
              onClick={() => setStep("cart")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to cart
            </button>
            {executeResult.error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {executeResult.error}: {executeResult.message}
              </div>
            )}
            {executeResult.summary && (
              <div className="flex gap-4 text-sm">
                <span>Total: {executeResult.summary.total}</span>
                <span className="text-green-600">
                  Success: {executeResult.summary.success}
                </span>
                <span className="text-red-600">Failed: {executeResult.summary.failed}</span>
              </div>
            )}
            {executeResult.results?.length > 0 && (
              <ul className="space-y-3">
                {executeResult.results.map((r, i) => (
                  <li
                    key={i}
                    className={`p-3 rounded-lg border text-sm ${
                      r.success
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {r.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary truncate block"
                      >
                        {r.url}
                      </a>
                      <span className="text-muted-foreground">Qty: {r.quantity}</span>
                    </div>
                    {r.error && (
                      <p className="text-destructive text-xs mt-1">{r.error}</p>
                    )}
                    {r.steps?.length > 0 && (
                      <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {r.steps.map((s, j) => (
                          <li key={j}>
                            {s.action} — {s.status}
                            {s.detail ? `: ${s.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
