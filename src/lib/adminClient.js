import { supabase } from "./supabaseClient";

async function readError(error) {
  try {
    if (error.context?.json) {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch {
    // fall through to the generic message below
  }
  return error.message || "Something went wrong.";
}

/**
 * Runs an account action through the admin-users edge function (which
 * re-checks on the server that the caller is the admin).
 * action: "reset_password" | "disable" | "enable" | "delete"
 * For "delete", pass { confirmEmail } — the user's exact email.
 */
export async function adminUserAction(action, userId, extra = {}) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, userId, ...extra },
  });
  if (error) throw new Error(await readError(error));
  if (data?.error) throw new Error(data.error);
  return data;
}
