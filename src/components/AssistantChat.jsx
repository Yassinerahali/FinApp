import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { chatWithAssistant } from "../lib/aiClient";
import { buildChatContext } from "../lib/chatContext";
import { formatAmount, formatDate } from "../lib/format";

export default function AssistantChat({
  transactions,
  budgets,
  goals,
  loans,
  accounts,
  rules,
  catLabel,
  onCreateGoal,
}) {
  const { t, lang, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t("assistantGreeting"), action: null }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text, action: null };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const context = buildChatContext({ transactions, budgets, goals, loans, accounts, rules, catLabel });
      const apiMessages = nextMessages.map((m) => ({ role: m.role, content: m.content }));
      const { reply, action } = await chatWithAssistant(apiMessages, context, lang);
      setMessages((prev) => [...prev, { role: "assistant", content: reply, action, actionStatus: "pending" }]);
    } catch (err) {
      setError(err.message || t("suggestError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGoal(messageIndex, action) {
    setMessages((prev) =>
      prev.map((m, i) => (i === messageIndex ? { ...m, actionStatus: "creating" } : m))
    );
    const { error: createError } = await onCreateGoal({
      name: action.name,
      target_amount: action.target_amount,
      target_date: action.target_date || null,
    });
    setMessages((prev) =>
      prev.map((m, i) =>
        i === messageIndex ? { ...m, actionStatus: createError ? "pending" : "created" } : m
      )
    );
    if (createError) {
      setError(createError.message || t("suggestError"));
    }
  }

  function handleDismissAction(messageIndex) {
    setMessages((prev) =>
      prev.map((m, i) => (i === messageIndex ? { ...m, actionStatus: "dismissed" } : m))
    );
  }

  return (
    <div ref={containerRef} className="fixed bottom-5 end-5 z-40">
      {open && (
        <div className="absolute bottom-14 end-0 w-[22rem] max-w-[90vw] h-[28rem] max-h-[75vh] border border-(--color-rule) bg-(--color-paper) shadow-lg flex flex-col animate-scale-in">
          <div className="px-4 py-3 border-b border-(--color-rule) flex items-center justify-between shrink-0">
            <h3 className="font-serif text-sm font-semibold">✨ {t("assistantTitle")}</h3>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("assistantCloseAria")}
              className="text-(--color-ink-soft) hover:text-(--color-ink) text-sm"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="animate-fade-in-up">
                <div
                  className={`text-sm leading-snug rounded px-3 py-2 max-w-[85%] ${
                    m.role === "user"
                      ? "bg-(--color-ink) text-(--color-paper) ms-auto"
                      : "bg-(--color-paper-bar)"
                  }`}
                >
                  {m.content}
                </div>
                {m.action && m.actionStatus !== "dismissed" && (
                  <div className="mt-2 border border-(--color-rule) bg-(--color-paper) p-3 max-w-[85%] animate-scale-in">
                    <p className="text-xs font-mono uppercase tracking-widest text-(--color-ink-soft) mb-1">
                      {t("assistantProposedGoal")}
                    </p>
                    <p className="text-sm font-semibold">{m.action.name}</p>
                    <p className="text-xs text-(--color-ink-soft) font-mono tabular">
                      {formatAmount(m.action.target_amount)}
                      {m.action.target_date ? ` · ${formatDate(m.action.target_date, locale)}` : ""}
                    </p>
                    {m.actionStatus === "created" ? (
                      <p className="mt-2 text-xs text-(--color-credit) font-medium">{t("assistantGoalCreated")}</p>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleDismissAction(i)}
                          disabled={m.actionStatus === "creating"}
                          className="flex-1 border border-(--color-rule) text-(--color-ink-soft) py-1.5 font-mono text-[10px] uppercase tracking-widest hover:border-(--color-ink) hover:text-(--color-ink) transition-colors disabled:opacity-60"
                        >
                          {t("dismiss")}
                        </button>
                        <button
                          onClick={() => handleCreateGoal(i, m.action)}
                          disabled={m.actionStatus === "creating"}
                          className="flex-1 bg-(--color-ink) text-(--color-paper) py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
                        >
                          {m.actionStatus === "creating" ? t("pleaseWait") : t("addGoal")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            {error && <p className="text-xs text-(--color-debit) font-medium">{error}</p>}
          </div>

          <form onSubmit={handleSend} className="border-t border-(--color-rule) p-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("assistantInputPlaceholder")}
              disabled={loading}
              className="flex-1 border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule) disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 bg-(--color-ink) text-(--color-paper) px-3 py-1.5 font-mono text-xs uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
            >
              {t("assistantSend")}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("assistantOpenAria")}
        className="w-14 h-14 rounded-full bg-(--color-ink) text-(--color-paper) shadow-lg flex items-center justify-center text-xl hover:bg-(--color-brass-dark) hover:-translate-y-0.5 hover:shadow-xl transition-all"
      >
        {open ? "✕" : "✨"}
      </button>
    </div>
  );
}
