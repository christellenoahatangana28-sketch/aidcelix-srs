# AIDCELIX

E-pharmacy stock checker and Gozem delivery for Cameroon. Next.js + Supabase.

Catalog, accounts, orders, payments, and delivery records live in Supabase. Customer-facing prices are **AIDCELIX prices only** (MEDindex base + 2%). Platform collections go to MoMo `674246887`.

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` (server/admin only, never `NEXT_PUBLIC_`)
- `AIDCELIX_MOMO_MSISDN`

In the Supabase dashboard, add `http://localhost:3000/auth/callback` to Auth redirect URLs.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Allow location when the browser asks. Search a medication (try `Paracetamol` or `Coartem`) to see the nearest pharmacies that have it.

## Stack

- Next.js App Router, Tailwind, Outfit
- Supabase Auth, Postgres + PostGIS, RLS
- Orange Money / MTN Money and Gozem adapters persist into `payments` and `deliveries`

## Flow

1. Allow GPS (or type an area if blocked)
2. Search a medication
3. Order from the nearest in-stock pharmacy
4. Register / login
5. Pay with MTN Money or Orange Money
6. Track Gozem status
