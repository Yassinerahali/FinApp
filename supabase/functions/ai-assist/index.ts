// Supabase Edge Function: ai-assist
// Proxies category-suggestion and spending-insight requests to Groq's
// free-tier API. The Groq API key lives only here (as a Supabase Edge
// Function secret) — it's never sent to or stored in the browser.
// Deploy via the Supabase Dashboard (Edge Functions -> Deploy a new
// function) or the CLI: supabase functions deploy ai-assist

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const MODEL = "llama-3.3-70b-versatile";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGroq(prompt, { jsonMode = false } = {}) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured on the server.");
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error("Couldn't parse a JSON response from the model.");
  }
}

async function handleCategorize(body) {
  const { notes, categories } = body;
  if (!Array.isArray(notes) || notes.length === 0) {
    throw new Error("notes must be a non-empty array.");
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error("categories must be a non-empty array.");
  }

  const categoryList = categories.map((c) => c.id).join(", ");
  const numbered = notes.map((n, i) => `${i + 1}. ${n && n.trim() ? n.trim() : "(no description)"}`).join("\n");

  const prompt = `You are categorizing personal finance transactions.
Available category ids (pick only from this exact list): ${categoryList}

For each numbered transaction description below, pick the single best matching category id.
Respond with ONLY valid JSON in this exact shape, nothing else:
{"categories": ["id-for-1", "id-for-2", ...]}
The array must have exactly ${notes.length} items, in the same order as the descriptions.

Descriptions:
${numbered}`;

  const raw = await callGroq(prompt, { jsonMode: true });
  const parsed = extractJson(raw);
  const result = Array.isArray(parsed.categories) ? parsed.categories : [];

  const validIds = new Set(categories.map((c) => c.id));
  const safe = notes.map((_, i) => (validIds.has(result[i]) ? result[i] : null));
  return safe;
}

async function handleInsights(body) {
  const { summary, lang } = body;
  if (!summary) throw new Error("summary is required.");

  const languageName = { en: "English", fr: "French", ar: "Arabic" }[lang] || "English";

  const prompt = `You are a friendly, concise personal finance assistant. Respond in ${languageName}.
Based on this spending data, write 2-3 short sentences highlighting the single most notable pattern
(a trend, the biggest category, or an unusual change). Be specific with the actual numbers given.
Don't just restate every number — pick out what's actually worth noticing. No greeting, no preamble,
just the observation directly.

Data (amounts in MAD): ${JSON.stringify(summary)}`;

  const text = await callGroq(prompt);
  return text.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header.");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized.");

    const body = await req.json();

    if (body.action === "categorize") {
      const result = await handleCategorize(body);
      return json({ result });
    }
    if (body.action === "insights") {
      const result = await handleInsights(body);
      return json({ result });
    }
    throw new Error("Unknown action.");
  } catch (err) {
    return json({ error: err.message || "Something went wrong." }, 400);
  }
});
