// Supabase Edge Function: send-push
// Two ways in:
// 1. A normal authenticated user calls { action: "test" } to send a push
//    to their own device(s) — used by the "Send test notification" button.
// 2. A scheduled job (cron) calls with no body, but an
//    "x-cron-secret" header matching the CRON_SECRET secret. This runs
//    with the service role key (bypasses RLS) to check every user's
//    budgets/recurring bills/loans for anything due soon, and sends a
//    push for each alert not already sent today (push_notification_log
//    is what prevents "due in 3 days" from re-sending 3 days running).
//
// Deploy via the Supabase Dashboard (Edge Functions -> Deploy a new
// function, name it exactly "send-push") or the CLI.
//
// Required secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// (a mailto: address or https URL — required by the push spec),
// CRON_SECRET (any random string you choose). SUPABASE_URL,
// SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by Supabase — nothing to set for those three.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const DUE_SOON_DAYS = 3;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendToSubscriptions(admin, subs, payload) {
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        // 404/410 means the browser dropped this subscription (uninstalled,
        // permission revoked, etc.) — clean it up so we stop trying.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
function isoFor(year, monthIndex, day) {
  const clampedDay = Math.min(day, daysInMonth(year, monthIndex));
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(clampedDay).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
function nextDueDate(dayOfMonth, todayISO) {
  const today = new Date(todayISO + "T00:00:00");
  let year = today.getFullYear();
  let month = today.getMonth();
  let candidateISO = isoFor(year, month, dayOfMonth);
  let candidate = new Date(candidateISO + "T00:00:00");
  if (candidate < today) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    candidateISO = isoFor(year, month, dayOfMonth);
  }
  return candidateISO;
}
function daysBetween(fromISO, toISO) {
  const from = new Date(fromISO + "T00:00:00");
  const to = new Date(toISO + "T00:00:00");
  return Math.round((to - from) / 86400000);
}
function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// Push notification text is English-only for now — unlike the in-app UI,
// the edge function has no reliable way to know a user's language
// preference (it's stored client-side only). Worth revisiting later.
async function computeAlertsForUser(admin, userId, today) {
  const monthStart = `${today.slice(0, 7)}-01`;
  const [budgetsRes, txRes, rulesRes, loansRes] = await Promise.all([
    admin.from("budgets").select("category, monthly_limit").eq("user_id", userId),
    admin.from("transactions").select("type, category, amount, date").eq("user_id", userId).gte("date", monthStart),
    admin.from("recurring_rules").select("id, type, amount, category, day_of_month, note").eq("user_id", userId),
    admin
      .from("loans")
      .select("id, type, counterparty_name, remaining_amount, due_date")
      .eq("user_id", userId)
      .gt("remaining_amount", 0),
  ]);

  const alerts = [];

  const spentByCategory = {};
  for (const tx of txRes.data || []) {
    if (tx.type !== "expense") continue;
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
  }
  for (const b of budgetsRes.data || []) {
    const spent = spentByCategory[b.category] || 0;
    if (b.monthly_limit > 0 && spent > b.monthly_limit) {
      alerts.push({
        id: `budget-${b.category}`,
        title: "Over budget",
        body: `${b.category} is ${(spent - b.monthly_limit).toFixed(2)} MAD over budget this month.`,
      });
    }
  }

  for (const r of rulesRes.data || []) {
    const due = nextDueDate(r.day_of_month, today);
    const daysUntil = daysBetween(today, due);
    if (daysUntil >= 0 && daysUntil <= DUE_SOON_DAYS) {
      const name = r.note || r.category;
      alerts.push({
        id: `recurring-${r.id}`,
        title: daysUntil === 0 ? "Due today" : "Due soon",
        body: daysUntil === 0 ? `${name} is due today.` : `${name} is due in ${plural(daysUntil, "day")}.`,
      });
    }
  }

  for (const l of loansRes.data || []) {
    if (!l.due_date) continue;
    const daysUntil = daysBetween(today, l.due_date);
    if (daysUntil < 0) {
      alerts.push({
        id: `loan-${l.id}`,
        title: "Payment overdue",
        body: `${l.counterparty_name}'s payment is ${plural(Math.abs(daysUntil), "day")} overdue.`,
      });
    } else if (daysUntil <= DUE_SOON_DAYS) {
      alerts.push({
        id: `loan-${l.id}`,
        title: daysUntil === 0 ? "Payment due today" : "Payment due soon",
        body:
          daysUntil === 0
            ? `${l.counterparty_name}'s payment is due today.`
            : `${l.counterparty_name}'s payment is due in ${plural(daysUntil, "day")}.`,
      });
    }
  }

  return alerts;
}

async function handleTest(admin, userId) {
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", userId);
  if (!subs || subs.length === 0) {
    throw new Error("No subscriptions found for this account — enable notifications first.");
  }
  await sendToSubscriptions(admin, subs, {
    title: "CHOUMCHOUM",
    body: "Test notification — if you see this, push is working.",
    url: "/",
  });
  return { sent: subs.length };
}

async function handleCheckDue(admin) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: subRows } = await admin.from("push_subscriptions").select("user_id");
  const userIds = [...new Set((subRows || []).map((r) => r.user_id))];

  let notificationsSent = 0;
  for (const userId of userIds) {
    const alerts = await computeAlertsForUser(admin, userId, today);
    if (alerts.length === 0) continue;

    const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", userId);
    if (!subs || subs.length === 0) continue;

    for (const alert of alerts) {
      // Claim today's slot for this alert first — if the insert is a
      // no-op (already logged), skip sending. Avoids a duplicate send if
      // this job somehow ran twice, and is one round trip instead of two.
      const { data: inserted } = await admin
        .from("push_notification_log")
        .upsert(
          { user_id: userId, alert_id: alert.id, sent_date: today },
          { onConflict: "user_id,alert_id,sent_date", ignoreDuplicates: true }
        )
        .select();
      if (!inserted || inserted.length === 0) continue;

      await sendToSubscriptions(admin, subs, { title: alert.title, body: alert.body, url: "/" });
      notificationsSent++;
    }
  }

  return { usersChecked: userIds.length, notificationsSent };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not configured on the server.");
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const cronSecretHeader = req.headers.get("x-cron-secret");
    if (CRON_SECRET && cronSecretHeader === CRON_SECRET) {
      const result = await handleCheckDue(admin);
      return json(result);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header.");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized.");

    const body = await req.json().catch(() => ({}));
    if (body.action === "test") {
      const result = await handleTest(admin, user.id);
      return json(result);
    }
    throw new Error("Unknown action.");
  } catch (err) {
    return json({ error: err.message || "Something went wrong." }, 400);
  }
});
