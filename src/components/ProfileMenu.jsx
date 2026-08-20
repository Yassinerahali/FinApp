import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { displayName, initials, avatarUrl } from "../lib/profile";
import { usePushSubscription } from "../hooks/usePushSubscription";
import { sendTestPush } from "../lib/push";

export default function ProfileMenu({ user, updateProfile, uploadAvatar, signOut }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(user.user_metadata?.first_name || "");
  const [lastName, setLastName] = useState(user.user_metadata?.last_name || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const push = usePushSubscription(user.id);
  const [pushError, setPushError] = useState("");
  const [testStatus, setTestStatus] = useState("");

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    const { error: updateError } = await updateProfile({ firstName, lastName });
    setSaving(false);
    if (updateError) {
      setError(updateError.message || t("somethingWentWrong"));
      return;
    }
    setSaved(true);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    const { error: uploadError } = await uploadAvatar(file, user.id);
    setUploading(false);
    if (uploadError) {
      setError(uploadError.message || t("somethingWentWrong"));
    }
  }

  async function handleTogglePush() {
    setPushError("");
    setTestStatus("");
    const { error: toggleError } = push.subscribed ? await push.unsubscribe() : await push.subscribe();
    if (toggleError) {
      setPushError(toggleError.message || t("somethingWentWrong"));
    }
  }

  async function handleSendTest() {
    setPushError("");
    setTestStatus(t("pleaseWait"));
    try {
      await sendTestPush();
      setTestStatus(t("testNotificationSent"));
    } catch (err) {
      setTestStatus("");
      setPushError(err.message || t("somethingWentWrong"));
    }
  }

  const photo = avatarUrl(user);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("profileMenuAria")}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 max-w-[10rem]"
      >
        <span className="w-8 h-8 rounded-full border border-(--color-rule) overflow-hidden flex items-center justify-center shrink-0">
          {photo ? (
            <img src={photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[10px] text-(--color-ink-soft)">{initials(user)}</span>
          )}
        </span>
        <span className="hidden sm:inline font-mono text-[11px] text-(--color-ink-soft) truncate">
          {displayName(user)}
        </span>
      </button>

      {open && (
        <div
          className="absolute end-0 mt-2 w-72 border border-(--color-rule) bg-(--color-paper) shadow-lg z-20 p-5 animate-scale-in"
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full border border-(--color-rule) overflow-hidden flex items-center justify-center shrink-0 hover:border-(--color-brass) transition-colors relative"
            >
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-mono text-xs text-(--color-ink-soft)">{initials(user)}</span>
              )}
              {uploading && (
                <span className="absolute inset-0 bg-(--color-ink)/40 flex items-center justify-center text-[9px] text-(--color-paper) font-mono">
                  …
                </span>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName(user)}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-[10px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-brass-dark)"
              >
                {t("changePhoto")}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-(--color-ink-soft) mb-1">
                  {t("firstName")}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setSaved(false);
                  }}
                  className="w-full border-b border-(--color-ink) bg-transparent py-1 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-(--color-ink-soft) mb-1">
                  {t("lastName")}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setSaved(false);
                  }}
                  className="w-full border-b border-(--color-ink) bg-transparent py-1 text-sm outline-none"
                />
              </div>
            </div>

            <p className="font-mono text-[11px] text-(--color-ink-soft) truncate" dir="ltr">
              {user.email}
            </p>

            {error && <p className="text-xs text-(--color-debit)">{error}</p>}
            {saved && <p className="text-xs text-(--color-credit)">{t("profileSaved")}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-(--color-ink) text-(--color-paper) py-2 font-mono text-xs uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors disabled:opacity-60"
            >
              {saving ? t("pleaseWait") : t("saveProfile")}
            </button>
          </form>

          {push.supported && (
            <div className="mt-4 pt-4 border-t border-(--color-rule)">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">{t("pushNotifications")}</p>
                  <p className="text-[11px] text-(--color-ink-soft)">
                    {push.subscribed ? t("pushEnabled") : t("pushDisabled")}
                  </p>
                </div>
                <button
                  onClick={handleTogglePush}
                  disabled={push.loading}
                  className={`shrink-0 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border transition-colors disabled:opacity-60 ${
                    push.subscribed
                      ? "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-debit) hover:text-(--color-debit)"
                      : "bg-(--color-ink) border-(--color-ink) text-(--color-paper) hover:bg-(--color-brass-dark)"
                  }`}
                >
                  {push.loading ? t("pleaseWait") : push.subscribed ? t("disable") : t("enable")}
                </button>
              </div>
              {push.subscribed && (
                <button
                  onClick={handleSendTest}
                  className="mt-2 font-mono text-[10px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-brass-dark) underline decoration-(--color-rule) underline-offset-4"
                >
                  {t("sendTestNotification")}
                </button>
              )}
              {pushError && <p className="mt-2 text-xs text-(--color-debit)">{pushError}</p>}
              {testStatus && !pushError && (
                <p className="mt-2 text-xs text-(--color-credit)">{testStatus}</p>
              )}
            </div>
          )}

          <button
            onClick={signOut}
            className="mt-3 w-full border border-(--color-rule) text-(--color-ink-soft) py-2 font-mono text-xs uppercase tracking-widest hover:border-(--color-debit) hover:text-(--color-debit) transition-colors"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
