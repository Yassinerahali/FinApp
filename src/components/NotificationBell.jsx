import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function NotificationBell({ notifications, onNavigate }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = notifications.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notificationsAria")}
        className="relative w-8 h-8 rounded-full border border-(--color-rule) flex items-center justify-center shrink-0 hover:border-(--color-brass) transition-colors"
      >
        <span aria-hidden="true" className="text-sm leading-none">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-(--color-debit) text-(--color-paper) text-[9px] font-mono flex items-center justify-center animate-pop-in">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 border border-(--color-rule) bg-(--color-paper) shadow-lg z-20 animate-scale-in">
          <div className="px-4 py-3 border-b border-(--color-rule)">
            <h3 className="font-serif text-sm font-semibold">{t("notificationsTitle")}</h3>
          </div>
          {count === 0 ? (
            <p className="px-4 py-6 text-sm text-(--color-ink-soft) text-center">
              {t("notificationsEmpty")}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n, index) => (
                <li
                  key={n.id}
                  className="stagger-row border-b border-(--color-rule) last:border-b-0"
                  style={{ "--i": Math.min(index, 10) }}
                >
                  <button
                    onClick={() => {
                      onNavigate(n.tab);
                      setOpen(false);
                    }}
                    className="w-full text-start px-4 py-3 flex items-start gap-2.5 hover:bg-(--color-paper-bar)/50 transition-colors"
                  >
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        n.severity === "debit" ? "bg-(--color-debit)" : "bg-(--color-brass)"
                      }`}
                    />
                    <span className="text-sm leading-snug">{t(n.key, n.params)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
