# The Ledger — Personal Finance

A personal finance tracker: transactions, categories, budgets, recurring entries, and trends. Built with React + Vite + Tailwind, backed by Supabase (free tier) for accounts and storage.

## One-time setup

1. **Create a free Supabase project** at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your project and run the contents of [`supabase/schema.sql`](./supabase/schema.sql) — this creates the `transactions`, `budgets`, and `recurring_rules` tables and locks each row to its owner.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.
4. Copy `.env.example` to `.env` and paste those two values in:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Install dependencies and run:
   ```
   npm install
   npm run dev
   ```

By default, Supabase requires email confirmation for new signups — check your inbox after signing up, or turn that off in **Authentication → Providers → Email** for local testing.

## What's inside

- Add/edit/delete transactions (income & expense), with categories and notes
- Monthly budgets per category, with over-budget warnings
- Recurring entries (rent, subscriptions, salary) that auto-log when due
- A 6-month income vs. expense trend chart
- CSV export and full JSON backup/restore
- Email + password auth via Supabase, with row-level security so each user only sees their own data

All amounts are shown in MAD.
