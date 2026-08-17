import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { useLanguage } from "./lib/i18n/LanguageContext";
import SetupNotice from "./components/SetupNotice";
import LandingPage from "./components/LandingPage";
import AuthScreen from "./components/AuthScreen";
import UpdatePasswordScreen from "./components/UpdatePasswordScreen";
import LedgerApp from "./LedgerApp";

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  return <AuthGate />;
}

function AuthGate() {
  const { t } = useLanguage();
  const {
    user,
    loading,
    recoveryMode,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
  } = useAuth();
  const [view, setView] = useState("landing"); // "landing" | "signin" | "signup"

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-fade-in">
        <p className="font-serif text-lg font-semibold tracking-tight text-(--color-ink-soft)">
          {t("appName")}
        </p>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-(--color-brass) animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  // A password-recovery link creates a temporary session, so this must be
  // checked before the normal !user branch — otherwise a recovering user
  // would land straight in the ledger instead of setting a new password.
  if (recoveryMode) {
    return <UpdatePasswordScreen updatePassword={updatePassword} />;
  }

  if (!user) {
    if (view === "landing") {
      return (
        <LandingPage
          onGetStarted={() => setView("signup")}
          onSignIn={() => setView("signin")}
        />
      );
    }
    return (
      <AuthScreen
        signIn={signIn}
        signUp={signUp}
        resetPassword={resetPassword}
        uploadAvatar={uploadAvatar}
        initialMode={view}
        onBack={() => setView("landing")}
      />
    );
  }

  return (
    <LedgerApp
      user={user}
      signOut={signOut}
      updateProfile={updateProfile}
      uploadAvatar={uploadAvatar}
    />
  );
}
