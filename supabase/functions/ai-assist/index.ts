// Supabase Edge Function: ai-assist
// Proxies category-suggestion, spending-insight, and chat-assistant
// requests to Groq's free-tier API. The Groq API key lives only here
// (as a Supabase Edge Function secret) — it's never sent to or stored
// in the browser. Deploy via the Supabase Dashboard (Edge Functions ->
// Deploy a new function) or the CLI: supabase functions deploy ai-assist

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
// llama-3.3-70b-versatile was deprecated by Groq on 2026-08-16. This is
// their recommended replacement — check https://console.groq.com/docs/models
// if this ever needs to change again.
const MODEL = "openai/gpt-oss-120b";
const MAX_HISTORY_MESSAGES = 16;

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

async function callGroqMessages(messages, { jsonMode = false, maxTokens = 800 } = {}) {
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
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
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

async function callGroq(prompt, options) {
  return callGroqMessages([{ role: "user", content: prompt }], options);
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

function buildChatSystemPrompt(context, lang) {
  const languageName = { en: "English", fr: "French", ar: "Arabic" }[lang] || "English";

  return `You are the built-in financial assistant inside "CHOUMCHOUM", a personal ledger app. Respond in ${languageName}, in a warm but concise way — a few sentences, not an essay, unless the person clearly wants detail.

You are given below a JSON snapshot of the user's REAL current financial data (amounts in MAD). This is the only source of truth you have:
- Only answer questions about their finances using this data.
- If something isn't in the data (e.g. a specific month not included, or a category with no entries), say plainly that you don't have that information rather than guessing or estimating.
- Never invent numbers. If you're not sure, say so.
- Proactively mention anything urgent from "alerts" (over-budget categories, bills or loan payments due soon) when it's relevant to what the user is asking, or if they greet you / ask an open-ended question.
- You can help the user think through a new savings goal (name, target amount, optional target date). When — and only when — they've clearly settled on wanting to create one and you have at least a name and a target amount, end your reply with a fenced block on its own line, formatted EXACTLY like this, with no other text inside it:
\`\`\`action
{"type":"create_goal","name":"<name>","target_amount":<number>,"target_date":"<YYYY-MM-DD or null>"}
\`\`\`
  Only include this block when actually proposing to create the goal right now (the app will ask the user to confirm before creating it) — never for hypothetical discussion, and never more than one per reply.
- You cannot directly create transactions, change budgets, or modify anything else — only propose goals as described above. If asked to do something else you can't do, say so and suggest which tab of the app they'd use instead.

Data snapshot:
${JSON.stringify(context)}`;
}

function extractAction(text) {
  const match = text.match(/```action\s*([\s\S]*?)```/);
  if (!match) return { reply: text.trim(), action: null };

  const cleanedReply = text.replace(match[0], "").trim();
  try {
    const parsed = JSON.parse(match[1].trim());
    if (
      parsed &&
      parsed.type === "create_goal" &&
      typeof parsed.name === "string" &&
      parsed.name.trim() &&
      typeof parsed.target_amount === "number" &&
      parsed.target_amount > 0
    ) {
      return {
        reply: cleanedReply,
        action: {
          type: "create_goal",
          name: parsed.name.trim(),
          target_amount: parsed.target_amount,
          target_date: typeof parsed.target_date === "string" ? parsed.target_date : null,
        },
      };
    }
  } catch {
    // Malformed action block — fall through and just show the cleaned text.
  }
  return { reply: cleanedReply, action: null };
}

async function handleChat(body) {
  const { messages, context, lang } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array.");
  }
  if (!context) throw new Error("context is required.");

  const trimmedHistory = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? "").slice(0, 4000),
  }));

  const fullMessages = [
    { role: "system", content: buildChatSystemPrompt(context, lang) },
    ...trimmedHistory,
  ];

  const raw = await callGroqMessages(fullMessages, { maxTokens: 500 });
  return extractAction(raw);
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
    if (body.action === "chat") {
      const result = await handleChat(body);
      return json(result);
    }
    throw new Error("Unknown action.");
  } catch (err) {
    return json({ error: err.message || "Something went wrong." }, 400);
  }
});
