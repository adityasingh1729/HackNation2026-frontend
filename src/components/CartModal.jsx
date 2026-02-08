import { useState, useEffect } from "react";
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
  CreditCard,
  MapPin,
  GitBranch,
  ExternalLink,
  ShoppingBag,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { useCart } from "../context/CartContext";
import { useProfile } from "../context/ProfileContext";
import { formatPrice } from "../lib/currency";
import { api } from "../lib/api";

const defaultCheckoutProfile = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
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
    clearCart,
  } = useCart();

  const [step, setStep] = useState("cart");
  const [profile, setProfile] = useState(defaultCheckoutProfile);
  const [loading, setLoading] = useState(false);
  const [simulationStep, setSimulationStep] = useState("");
  const [simulationIndex, setSimulationIndex] = useState(-1);
  const [backendStepsDone, setBackendStepsDone] = useState({});
  const [executeResult, setExecuteResult] = useState(null);
  const [lastCheckoutItems, setLastCheckoutItems] = useState([]);

  const { profile: userProfile } = useProfile();
  const currency = userProfile?.currency || "USD";

  // Pre-fill checkout form from profile when entering checkout step
  useEffect(() => {
    if (step === "checkout" && userProfile) {
      setProfile({
        name: userProfile.name ?? "",
        email: userProfile.email ?? "",
        phone: userProfile.phone ?? "",
        line1: userProfile.address ?? "",
        city: userProfile.city ?? "",
        state: userProfile.state ?? "",
        pincode: userProfile.pincode ?? "",
        country: userProfile.country ?? "",
        token: "tok_sandbox_123",
      });
    }
  }, [step, userProfile]);

  const cartProducts = getCartProducts();
  const subtotal = getTotalPrice();
  const savings = getTotalSavings();
  const totalItems = getTotalItems();
  const checkoutCart = getCartForCheckout();
  const canExecute = checkoutCart.items.length > 0;

  const handleClose = () => {
    setStep("cart");
    setExecuteResult(null);
    setLastCheckoutItems([]);
    onClose();
  };

  const handleProceedToCheckout = () => {
    setStep("review");
  };

  const handleContinueToPayment = () => {
    setStep("checkout");
  };

  const runClientSimulation = () => {
    const items = checkoutCart.items;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      for (let i = 0; i < items.length; i++) {
        setSimulationIndex(i);
        setSimulationStep(`Simulating at ${items[i].brand || "retailer"}…`);
        await delay(1200);
      }
      setSimulationIndex(-1);
      setSimulationStep("Checkout complete.");
      await delay(500);
      setLastCheckoutItems([...items]);
      setExecuteResult({
        results: items.map((item) => ({
          url: item.url,
          quantity: item.quantity,
          success: true,
          steps: [
            { action: "Open link", status: "ok" },
            { action: "Add to cart", status: "ok" },
            { action: "Checkout (sandbox)", status: "ok" },
          ],
        })),
        summary: { total: items.length, success: items.length, failed: 0 },
      });
      clearCart();
      setStep("done");
      setLoading(false);
      setSimulationStep("");
    })();
  };

  const runBackendStreamingCheckout = async () => {
    const payload = {
      cart: checkoutCart,
      profile: {
        shippingAddress: {
          name: profile.name,
          line1: profile.line1,
          city: profile.city,
          state: profile.state,
          zip: profile.pincode,
          country: profile.country,
        },
        contact: { email: profile.email, phone: profile.phone },
        payment: { type: "card", token: profile.token },
      },
      headless: true,
    };
    const url = `${api.checkoutExecute}?stream=1`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok || !res.body) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        let event = "";
        let dataStr = "";
        for (const line of part.split("\n")) {
          if (line.startsWith("event: ")) event = line.slice(7).trim();
          if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
        }
        if (!event || !dataStr) continue;
        try {
          const data = JSON.parse(dataStr);
          if (event === "retailer_start") {
            setSimulationIndex(data.index);
            setSimulationStep(`Simulating at ${data.brand}…`);
            setBackendStepsDone((prev) => ({ ...prev, [data.index]: 0 }));
          } else if (event === "step") {
            setBackendStepsDone((prev) => ({
              ...prev,
              [data.itemIndex]: (data.stepIndex || 0) + 1,
            }));
          } else if (event === "retailer_done") {
            setBackendStepsDone((prev) => ({ ...prev, [data.index]: 3 }));
          } else if (event === "done") {
            setLastCheckoutItems([...checkoutCart.items]);
            setExecuteResult({
              results: data.results || [],
              summary: data.summary || { total: 0, success: 0, failed: 0 },
            });
            clearCart();
            setStep("done");
            setLoading(false);
            setSimulationIndex(-1);
            setSimulationStep("");
            setBackendStepsDone({});
            return true;
          }
        } catch (_) {}
      }
    }
    return null;
  };

  const handleExecuteCheckout = async () => {
    if (!canExecute) return;
    setLoading(true);
    setExecuteResult(null);
    setSimulationStep("");
    setSimulationIndex(-1);
    setBackendStepsDone({});
    try {
      const streamed = await runBackendStreamingCheckout();
      if (!streamed) {
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
                zip: profile.pincode,
                country: profile.country,
              },
              contact: { email: profile.email, phone: profile.phone },
              payment: { type: "card", token: profile.token },
            },
            headless: true,
          }),
        });
        const data = await res.json();
        if (res.ok && data.results?.length > 0) {
          setLastCheckoutItems([...checkoutCart.items]);
          setExecuteResult(data);
          clearCart();
          setStep("done");
        } else {
          runClientSimulation();
          return;
        }
      }
    } catch (_) {
      runClientSimulation();
      return;
    }
    setLoading(false);
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
                {step === "review" && "Review order"}
                {step === "checkout" && "Checkout"}
                {step === "done" && "Checkout Results"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === "cart" &&
                  `${cartProducts.length} ${cartProducts.length === 1 ? "product" : "products"} selected`}
                {step === "review" && "Items and retailers we'll use"}
                {step === "checkout" && "Enter details and run sandbox"}
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

        {/* Step: Review – items and retailers before payment/simulate */}
        {step === "review" && (
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <button
              onClick={() => setStep("cart")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to cart
            </button>
            <p className="text-sm text-muted-foreground">
              We'll purchase these items from the retailers below. Then you'll enter payment details (sandbox) and we'll simulate checkout at each link.
            </p>
            <ul className="space-y-3">
              {checkoutCart.items.map((item, i) => (
                <li
                  key={item.url || item.itemId || i}
                  className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1"
                >
                  <span className="font-medium text-foreground">{item.name || item.title}</span>
                  <span className="text-xs text-primary">
                    Retailer: {item.brand || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate block"
                    >
                      {item.url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={handleContinueToPayment}
              className="w-full gradient-button py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
            >
              Continue to payment & simulate
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Checkout – Enter once + Fan-out plan (Safe Demo) */}
        {step === "checkout" && (
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <button
              onClick={() => setStep("review")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to review
            </button>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">
                Safe demo — no real purchases. Sandbox + form-fill replay only.
              </span>
            </div>

            {/* Enter once: payment + address */}
            <div className="rounded-xl border-2 border-primary/30 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Payment & address — entered once
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Used for every retailer below (autofill preview)
                  </p>
                </div>
                <BadgeCheck className="w-5 h-5 text-primary ml-auto flex-shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5" /> Payment (sandbox)
                </div>
                {[
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "line1", label: "Address" },
                  { key: "pincode", label: "Pincode" },
                  { key: "city", label: "City" },
                  { key: "state", label: "State" },
                  { key: "country", label: "Country" },
                  { key: "phone", label: "Phone" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">{label}</span>
                    <input
                      type={key === "email" ? "email" : "text"}
                      value={profile[key]}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                      placeholder={key === "token" ? "tok_sandbox_123" : ""}
                    />
                  </div>
                ))}
                <div className="col-span-2 flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Payment token (sandbox)</span>
                  <input
                    type="text"
                    value={profile.token}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, token: e.target.value }))
                    }
                    className="px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Agent fans out: per-retailer steps (simulated) */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Agent fans out — checkout steps per retailer (simulated)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Same address + payment applied at each retailer. Step-by-step autofill preview.
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {checkoutCart.items.map((item, i) => {
                  const isCurrent = loading && simulationIndex === i;
                  const isDone = loading && simulationIndex > i;
                  const stepsDone = backendStepsDone[i] ?? 0;
                  const stepLabels = [
                    { icon: ExternalLink, label: "Open link" },
                    { icon: ShoppingBag, label: "Add to cart" },
                    { icon: ShieldCheck, label: "Checkout (sandbox)" },
                  ];
                  return (
                    <div
                      key={item.url || item.itemId || i}
                      className={`rounded-lg border p-3 space-y-2 transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary/10"
                          : isDone
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          {item.brand || "Retailer"}
                          {isCurrent && (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          )}
                          {isDone && (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.name || item.title} × {item.quantity}
                        </span>
                      </div>
                      <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {stepLabels.map(({ icon: Icon, label }, stepIdx) => {
                          const done = stepsDone > stepIdx;
                          const inProgress = isCurrent && stepsDone === stepIdx;
                          return (
                            <li
                              key={stepIdx}
                              className={`flex items-center gap-1 text-xs ${
                                done
                                  ? "text-green-600"
                                  : inProgress
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                              ) : inProgress ? (
                                <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                              ) : (
                                <Icon className="w-3 h-3 flex-shrink-0 opacity-50" />
                              )}
                              {label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleExecuteCheckout}
              disabled={!canExecute || loading}
              className="w-full gradient-button py-3 rounded-xl flex items-center justify-center gap-2 font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {simulationStep || "Running simulated checkout…"}
                </>
              ) : (
                <>
                  Run simulated checkout at {checkoutCart.items.length} retailer
                  {checkoutCart.items.length !== 1 ? "s" : ""}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step: Done – Show "entered once" + "fanned out" results */}
        {step === "done" && executeResult && (
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <button
              onClick={handleClose}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Done — close
            </button>
            {executeResult.error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {executeResult.error}: {executeResult.message}
              </div>
            )}

            {/* Summary: entered once + fanned out */}
            <div className="rounded-xl border-2 border-green-500/30 bg-green-500/5 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Checkout orchestration complete (simulated)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  Payment + address entered once
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <GitBranch className="w-4 h-4 text-primary flex-shrink-0" />
                  Agent fanned out to {executeResult.summary?.total ?? 0} retailer
                  {(executeResult.summary?.total ?? 0) !== 1 ? "s" : ""}
                </div>
              </div>
              {executeResult.summary && (
                <div className="flex gap-4 text-xs pt-1 border-t border-green-500/20">
                  <span className="text-muted-foreground">
                    Total: {executeResult.summary.total}
                  </span>
                  <span className="text-green-600 font-medium">
                    Success: {executeResult.summary.success}
                  </span>
                  {executeResult.summary.failed > 0 && (
                    <span className="text-red-600 font-medium">
                      Failed: {executeResult.summary.failed}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Per-retailer results with step-by-step */}
            {executeResult.results?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Per-retailer steps (simulated)
                </h4>
                <ul className="space-y-3">
                  {executeResult.results.map((r, i) => {
                    const item = lastCheckoutItems[i];
                    const retailerName = item?.brand || "Retailer";
                    return (
                      <li
                        key={i}
                        className={`rounded-xl border p-3 ${
                          r.success
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-destructive/30 bg-destructive/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {r.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {retailerName}
                          </span>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate flex-1 min-w-0"
                          >
                            {r.url}
                          </a>
                          <span className="text-xs text-muted-foreground">
                            Qty {r.quantity}
                          </span>
                        </div>
                        {r.error && (
                          <p className="text-destructive text-xs mb-2">{r.error}</p>
                        )}
                        {r.steps?.length > 0 && (
                          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {r.steps.map((s, j) => (
                              <li key={j} className="flex items-center gap-1">
                                {s.status === "ok" || r.success ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                                )}
                                {s.action}
                                {s.detail ? `: ${s.detail}` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
