import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import SetupNotice from "./components/SetupNotice";
import LandingPage from "./components/LandingPage";
import AuthScreen from "./components/AuthScreen";
import LedgerApp from "./LedgerApp";

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  return <AuthGate />;
}

function AuthGate() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [view, setView] = useState("landing"); // "landing" | "signin" | "signup"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-(--color-ink-soft)">
          Loading…
        </p>
      </div>
    );
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
        initialMode={view}
        onBack={() => setView("landing")}
      />
    );
  }

  return <LedgerApp user={user} signOut={signOut} />;
}
