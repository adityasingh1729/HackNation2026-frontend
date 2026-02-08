import { Send, Mic, Bot, User, MapPin, Calendar, Wallet, Package, ChevronUp, ChevronDown, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import AIWaveform from "./AIWaveform";
import { useSearchResults } from "../context/SearchResultsContext";
import { useProfile } from "../context/ProfileContext";
import { formatPrice } from "../lib/currency";
import { api } from "../lib/api";

const CHAT_SESSION_KEY = "agentic_chat_session_id";

function getStoredSessionId() {
  try {
    return sessionStorage.getItem(CHAT_SESSION_KEY) || null;
  } catch {
    return null;
  }
}

const ChatInput = () => {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(getStoredSessionId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jsonOutput, setJsonOutput] = useState(null);
  const messagesEndRef = useRef(null);
  const { runShop, shopLoading, shopError, searchResults } = useSearchResults();
  const { profile, mergeSpecWithProfile } = useProfile();
  const hasResults = searchResults?.final_results != null;
  const canMinimize = Boolean(jsonOutput && (shopLoading || hasResults));
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (canMinimize) setExpanded(false);
  }, [canMinimize]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || loading) return;

    setMessage("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      // Backend expects only session_id and message (conversation state is server-side)
      const body = {
        session_id: sessionId || "",
        message: text,
      };
      const res = await fetch(api.chat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.detail;
        const msg =
          (typeof detail === "object" && (detail?.message || detail?.error)) ||
          data.message ||
          data.error ||
          "Request failed";
        setError(msg);
        setLoading(false);
        return;
      }

      const newSessionId = data.session_id;
      setSessionId(newSessionId);
      try {
        sessionStorage.setItem(CHAT_SESSION_KEY, newSessionId);
      } catch {}
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      if (data.json_output) {
        setJsonOutput(data.json_output);
        runShop(mergeSpecWithProfile(data.json_output));
      }
    } catch (err) {
      setError(err.message || "Chatbot unavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showFullChat = !canMinimize || expanded;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
      <div className="max-w-4xl mx-auto">
        {/* Minimized bar: after confirmation, collapse so results area is visible */}
        {canMinimize && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="glass-card w-full py-3 px-4 flex items-center justify-center gap-2 text-sm text-foreground hover:bg-muted/50 transition-colors rounded-xl mb-2"
          >
            <MessageCircle className="w-4 h-4 text-primary" />
            {shopLoading ? (
              <>
                <span className="animate-pulse">Searching across retailers to find best fit…</span>
              </>
            ) : (
              <span>Results ready above • Tap to open chat</span>
            )}
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Full chat thread */}
        {showFullChat && (
          <>
        {(messages.length > 0 || error) && (
          <div className="glass-card p-3 mb-2 max-h-[240px] overflow-y-auto scrollbar-thin space-y-3">
            {canMinimize && (
              <div className="flex justify-end mb-1">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ChevronDown className="w-3 h-3" /> Minimize
                </button>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {(loading || shopLoading) && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="rounded-xl px-3 py-2 text-sm bg-muted text-muted-foreground">
                  {loading ? "Thinking…" : "Searching across retailers to find best fit…"}
                </div>
              </div>
            )}
            {shopError && (
              <div className="rounded-xl px-3 py-2 text-sm bg-destructive/10 text-destructive">
                Search: {shopError}
              </div>
            )}
            {error && (
              <div className="rounded-xl px-3 py-2 text-sm bg-destructive/10 text-destructive">
                {error}
              </div>
            )}
            {jsonOutput && (
              <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="font-semibold text-primary text-sm mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Your shopping plan
                </div>
                <div className="grid gap-2 text-sm">
                  {(jsonOutput.delivery_pincode || jsonOutput.delivery_deadline_date) && (
                    <div className="flex flex-wrap items-center gap-2 text-foreground">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      {jsonOutput.delivery_pincode && (
                        <span>Pincode: <strong>{jsonOutput.delivery_pincode}</strong></span>
                      )}
                      {jsonOutput.delivery_deadline_date && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>By <strong>{jsonOutput.delivery_deadline_date}</strong></span>
                        </>
                      )}
                    </div>
                  )}
                  {(jsonOutput.total_budget != null || jsonOutput.budget_currency) && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Wallet className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span>
                        Budget: <strong>{jsonOutput.total_budget != null ? formatPrice(jsonOutput.total_budget, jsonOutput.budget_currency || profile?.currency || "USD") : (profile?.currency || jsonOutput.budget_currency || "USD")}</strong>
                      </span>
                    </div>
                  )}
                  {jsonOutput.items?.length > 0 && (
                    <div className="pt-1">
                      <span className="text-muted-foreground text-xs font-medium">Items</span>
                      <ul className="mt-1 space-y-1">
                        {jsonOutput.items.map((item, idx) => (
                          <li key={idx} className="flex flex-wrap gap-1.5 text-foreground">
                            <span className="font-medium">{item.query}</span>
                            {item.preferences && (
                              <span className="text-muted-foreground text-xs">({item.preferences})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input bar */}
            <div className="glass-card p-2 flex items-center gap-3">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-3 rounded-lg transition-all duration-300 ${
              isListening
                ? "bg-primary/20 text-primary electric-glow"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {isListening ? <AIWaveform /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI agent anything..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm py-2"
            disabled={loading}
          />

          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="gradient-button p-3 rounded-lg disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
              AI Agent v2.0 • Chat calls the shopping assistant API
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
