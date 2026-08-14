import { useAuth } from "./hooks/useAuth";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import SetupNotice from "./components/SetupNotice";
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
    return <AuthScreen signIn={signIn} signUp={signUp} />;
  }

  return <LedgerApp user={user} signOut={signOut} />;
}
