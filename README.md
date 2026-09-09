# AIDCELIX

E-pharmacy stock checker and Gozem delivery for Africa. Next.js + Supabase.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Allow location when the browser asks — GPS starts automatically. Search a medication (try `Paracetamol` or `Coartem`) to see the nearest pharmacies that have it.

Phase 1 uses mock MEDindex Pro, Gozem, Orange Money, and MTN Money. Customer-facing prices are **AIDCELIX prices only** (MEDindex base + 2%). Platform collections go to MoMo `674246887`.

## Stack

- Next.js App Router, Tailwind, Outfit (MediStock-like dark emerald UI)
- Mock catalog + GPS (PostGIS schema ready in `supabase/migrations`)
- Supabase Auth/data: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

## Demo flow

1. Allow GPS (or type an area if blocked)
2. Search a medication
3. Order from the nearest in-stock pharmacy
4. Register / login
5. Pay with mock MTN Money or Orange Money
6. Track Gozem status (use “Simulate next Gozem status”)
