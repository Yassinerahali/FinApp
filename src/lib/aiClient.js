import { supabase } from "./supabaseClient";

/**
 * Asks the ai-assist edge function to suggest a category id for each note.
 * Returns an array the same length as `notes`, with a category id or null
 * (null means the model didn't return a confident/valid match for that row —
 * callers should fall back to their own default in that case).
 */
export async function suggestCategories(notes, categories) {
  const { data, error } = await supabase.functions.invoke("ai-assist", {
    body: {
      action: "categorize",
      notes,
      categories: categories.map((c) => ({ id: c.id })),
    },
  });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data.result;
}

/** Asks the ai-assist edge function for a short written spending insight. */
export async function getSpendingInsight(summary, lang) {
  const { data, error } = await supabase.functions.invoke("ai-assist", {
    body: { action: "insights", summary, lang },
  });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  return data.result;
}

// supabase-js's FunctionsHttpError wraps the actual response; try to pull
// the real error message out of it instead of showing a generic one.
async function extractFunctionError(error) {
  try {
    if (error.context?.json) {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch {
    // fall through to generic message below
  }
  return error.message || "The AI assistant isn't available right now.";
}
