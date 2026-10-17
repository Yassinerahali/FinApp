// Supabase Edge Function: admin-users
// Account management for the Admin tab: send a password-reset email,
// disable / re-enable a user, or delete a user and all their data.
//
// Why this is an edge function: these actions need the service role key,
// which bypasses all row-level security. That key lives only here (it is
// provided to edge functions automatically) and is never sent to the
// browser. Every request is re-checked on the server: the caller must be
// signed in as the confirmed admin account below, and the admin account
// itself can never be targeted.
//
// Deploy via the Supabase Dashboard (Edge Functions -> Deploy a new
// function, name it exactly "admin-users") or the CLI:
//   supabase functions deploy admin-users
// Optional secret: SITE_URL (e.g. https://your-app.vercel.app) — where
// the password-reset link sends people. If unset, the project's "Site URL"
// setting (Authentication -> URL Configuration) is used.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are
// provided automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_URL = Deno.env.get("SITE_URL");

const ADMIN_EMAIL = "admin@choumchoum.com";
// "Disabled" = banned for ~100 years; enabling clears the ban.
const BAN_FOREVER = "876000h";
const ACTIONS = ["reset_password", "disable", "enable", "delete"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isAdmin(user) {
  return (
    Boolean(user?.email) &&
    user.email.toLowerCase() === ADMIN_EMAIL &&
    Boolean(user.email_confirmed_at)
  );
}

async function removeAvatars(admin, userId) {
  // Best effort: avatars live under "<user id>/" in the avatars bucket.
  try {
    const { data: files } = await admin.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      await admin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
    }
  } catch (_err) {
    // Not worth failing the deletion over a leftover image.
  }
}

async function handle(req) {
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new HttpError(401, "Missing authorization header.");

  // 1. Who is calling? Ask Supabase to validate their token.
  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await caller.auth.getUser();
  if (authError || !user) throw new HttpError(401, "Unauthorized.");
  if (!isAdmin(user)) throw new HttpError(403, "Admins only.");

  // 2. What do they want?
  let body;
  try {
    body = await req.json();
  } catch (_err) {
    throw new HttpError(400, "Invalid request body.");
  }
  const { action, userId } = body || {};
  if (!ACTIONS.includes(action)) throw new HttpError(400, "Unknown action.");
  if (typeof userId !== "string" || !UUID_RE.test(userId)) {
    throw new HttpError(400, "Invalid user id.");
  }

  // 3. Look the target up with the privileged client.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: found, error: findError } = await admin.auth.admin.getUserById(userId);
  const target = found?.user;
  if (findError || !target) throw new HttpError(404, "User not found.");

  // The admin account can never be disabled, deleted or reset from here.
  if (target.id === user.id || (target.email || "").toLowerCase() === ADMIN_EMAIL) {
    throw new HttpError(400, "The admin account can't be changed from here.");
  }

  console.log(JSON.stringify({ admin: user.email, action, target: target.id }));

  if (action === "disable" || action === "enable") {
    const { error } = await admin.auth.admin.updateUserById(target.id, {
      ban_duration: action === "disable" ? BAN_FOREVER : "none",
    });
    if (error) throw new HttpError(400, error.message);
    return { ok: true, action };
  }

  if (action === "reset_password") {
    if (!target.email) throw new HttpError(400, "This user has no email address.");
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await anon.auth.resetPasswordForEmail(
      target.email,
      SITE_URL ? { redirectTo: SITE_URL } : undefined
    );
    if (error) throw new HttpError(400, error.message);
    return { ok: true, action };
  }

  // action === "delete" — irreversible, so the caller must also send the
  // user's exact email as a typed confirmation, checked here, not just in
  // the UI.
  const confirmEmail = typeof body.confirmEmail === "string" ? body.confirmEmail.trim().toLowerCase() : "";
  if (!confirmEmail || confirmEmail !== (target.email || "").toLowerCase()) {
    throw new HttpError(400, "Confirmation email doesn't match.");
  }
  await removeAvatars(admin, target.id);
  // Rows in accounts, transactions, budgets, goals, loans etc. are removed
  // automatically (they reference auth.users with ON DELETE CASCADE).
  const { error: deleteError } = await admin.auth.admin.deleteUser(target.id);
  if (deleteError) throw new HttpError(400, deleteError.message);
  return { ok: true, action };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    return json(await handle(req));
  } catch (err) {
    return json({ error: err.message || "Something went wrong." }, err.status || 400);
  }
});
